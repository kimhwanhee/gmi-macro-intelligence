"""Automatic diplomatic/defence/trade news ingest for local GMI.
No third-party packages. Runs while the local server process is running.
News-derived classifications are NOT independent confirmation of events.
"""
import datetime as dt
import email.utils
import hashlib
import html
import json
import os
import re
import sqlite3
import threading
import time
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'gmi_intelligence.sqlite3'
CATALOG = json.loads((ROOT/'country-catalog.json').read_text(encoding='utf-8'))
COUNTRIES = {c['iso']:c for c in CATALOG}
LOCK = threading.RLock()
STOP = threading.Event()
RUNNING = False
INTERVAL = max(900, int(os.getenv('GMI_REFRESH_MINUTES','60'))*60)
USER_AGENT = 'GMI-GlobalMacroIntelligence/2.0 (local personal research; metadata only)'
AI_MODEL = os.getenv('GMI_AI_MODEL','gpt-4o-mini')
AI_ON = bool(os.getenv('OPENAI_API_KEY'))

# Avoid using source reputation alone as evidence that an announced visit is confirmed.
FEEDS = [
 ('UK Foreign Office releases','https://www.gov.uk/government/organisations/foreign-commonwealth-development-office.atom','official'),
 ('UK Defence Ministry releases','https://www.gov.uk/government/organisations/ministry-of-defence.atom','official'),
 ('Diplomacy and visits','https://news.google.com/rss/search?'+urlencode({'q':'"foreign minister" summit OR "state visit" when:2d','hl':'en-US','gl':'US','ceid':'US:en'}),'aggregator'),
 ('Bilateral relations','https://news.google.com/rss/search?'+urlencode({'q':'"bilateral talks" OR "diplomatic relations" when:2d','hl':'en-US','gl':'US','ceid':'US:en'}),'aggregator'),
 ('Defence and security','https://news.google.com/rss/search?'+urlencode({'q':'"defense minister" OR "military exercise" OR "defence agreement" when:2d','hl':'en-US','gl':'US','ceid':'US:en'}),'aggregator'),
 ('Sanctions and trade','https://news.google.com/rss/search?'+urlencode({'q':'"export controls" OR "economic sanctions" OR "trade agreement" when:2d','hl':'en-US','gl':'US','ceid':'US:en'}),'aggregator'),
]
GDELT_QUERIES = {
 'diplomacy':'("foreign minister" OR "state visit" OR "bilateral talks")',
 'defense':'("defense minister" OR "military exercise" OR "security agreement")',
 'trade':'("export controls" OR "trade agreement" OR "tariff measures")',
}

# Ambiguous short names excluded. A conservative detector returns ONLY explicit long country mentions.
ALIASES = {
 'USA':['United States','United States of America','U.S.','USA','US government','Washington administration','American government'],
 'CHN':['China','Chinese government','Beijing government','People’s Republic of China'],
 'RUS':['Russia','Russian government'],
 'KOR':['South Korea','Republic of Korea','South Korean'],
 'PRK':['North Korea','DPRK','North Korean'],
 'JPN':['Japan','Japanese government'],
 'GBR':['United Kingdom','Britain','British government','UK government'],
 'DEU':['Germany','German government'],
 'FRA':['France','French government'],
 'IND':['India','Indian government'],
 'IRN':['Iran','Iranian government'],
 'ISR':['Israel','Israeli government'],
 'UKR':['Ukraine','Ukrainian government'],
 'TWN':['Taiwan','Taiwanese government'],
 'TUR':['Turkey','Türkiye','Turkish government'],
 'SAU':['Saudi Arabia','Saudi government'],
 'ARE':['United Arab Emirates','Emirati government'],
 'PSE':['Palestine','Palestinian government'],
 'VNM':['Vietnam','Vietnamese government'],
 'MMR':['Myanmar','Burmese government'],
 'IDN':['Indonesia','Indonesian government'],
 'PAK':['Pakistan','Pakistani government'],
 'AUS':['Australia','Australian government'],
 'CAN':['Canada','Canadian government'],
 'MEX':['Mexico','Mexican government'],
 'BRA':['Brazil','Brazilian government'],
 'ZAF':['South Africa','South African government'],
 'EGY':['Egypt','Egyptian government'],
 'PHL':['Philippines','Philippine government'],
}
# Fill the remaining country/territory entries with their UN/ISO English country names.
for code,c in COUNTRIES.items():
    name=c.get('english','').strip()
    if code in ALIASES or not name or len(name)<5 or name.lower() in {'georgia','guinea','chad','oman','mali','niger'}: continue
    ALIASES[code]=[name]

KEYWORDS={
 'diplomacy':r'\b(diplomat\w*|foreign minister|foreign secretary|summit|state visit|bilateral|embass\w*|ambassador|president met|prime minister met|joint statement|peace talk|official visit|international visit)\b',
 'defense':r'\b(defen[cs]e|militar\w*|armed forces|security pact|security agreement|missile|troops|naval|air force|exercise|ceasefire|weapons|warship|fighter jet)\b',
 'trade':r'\b(tariff\w*|trade agreement|export control|sanction\w*|trade minister|commerce minister|trade dispute|export ban|import restriction)\b',
}
TYPE_MAP={'diplomacy':'diplomacy','defense':'tension','trade':'trade'}


def db():
    con=sqlite3.connect(str(DB_PATH),timeout=20)
    con.row_factory=sqlite3.Row
    con.execute('PRAGMA busy_timeout=15000')
    con.execute('PRAGMA journal_mode=WAL')
    return con


def init_db():
    with db() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS intel_events (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT NOT NULL, source TEXT,
          kind TEXT NOT NULL, event_type TEXT NOT NULL, countries TEXT NOT NULL,
          date TEXT, detected_at TEXT NOT NULL, classification TEXT,
          evidence TEXT NOT NULL, summary TEXT, confidence TEXT,
          UNIQUE(url)
        );
        CREATE INDEX IF NOT EXISTS idx_events_detected ON intel_events(detected_at DESC);
        CREATE TABLE IF NOT EXISTS intel_meta (key TEXT PRIMARY KEY, value TEXT);
        ''')


def set_meta(key,val):
    with db() as c: c.execute('INSERT INTO intel_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',(key,str(val)))


def get_meta():
    with db() as c: return {r['key']:r['value'] for r in c.execute('SELECT * FROM intel_meta')}


def fetch(url):
    if urlparse(url).scheme!='https': raise ValueError('HTTPS required')
    req=Request(url,headers={'User-Agent':USER_AGENT,'Accept':'application/xml,application/rss+xml,application/atom+xml,application/json'})
    with urlopen(req,timeout=13) as response:
        return response.read(1_600_000)


def strip_markup(text):
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',text or ''))).strip()[:900]


def parse_date(value):
    try:
        d=email.utils.parsedate_to_datetime(value)
        if d: return d.astimezone(dt.timezone.utc).strftime('%Y-%m-%d')
    except (TypeError,ValueError,OverflowError): pass
    if value and re.match(r'^\d{4}-\d\d-\d\d',value):return value[:10]
    return ''


def parse_feed(raw,feed_name,source_kind):
    root=ET.fromstring(raw)
    articles=[]
    # Handles RSS <item> and Atom <entry> without depending on XML namespaces.
    for node in root.iter():
        if node.tag.split('}')[-1] not in {'item','entry'}:continue
        fields={};link=''
        for child in node:
            tag=child.tag.split('}')[-1]
            if tag=='link' and child.attrib.get('href'):link=child.attrib['href']
            elif tag=='link' and child.text and not link:link=child.text
            elif tag in {'title','description','summary','pubDate','published','updated'}:fields[tag]=child.text or ''
        if not link.startswith(('https://','http://')):continue
        title=strip_markup(fields.get('title',''))[:300]
        if not title:continue
        date=next((parse_date(fields[k]) for k in ('pubDate','published','updated') if fields.get(k)), '')
        articles.append({'title':title,'snippet':strip_markup(fields.get('description') or fields.get('summary'))[:500],
                         'url':link,'source':feed_name,'source_kind':source_kind,'date':date})
    return articles


def country_mentions(text):
    found=[]
    if re.search(r'\bUS\b',text):found.append('USA')
    if re.search(r'\bUK\b',text):found.append('GBR')
    for code,terms in ALIASES.items():
        for term in terms:
            if re.search(r'(?<![\w])'+re.escape(term)+r'(?![\w])',text,re.I):
                found.append(code);break
    return list(dict.fromkeys(found))[:8]


def classify_rules(article):
    # Do not claim that a headline proves either an actual event or its future date.
    text=article['title']+' '+article.get('snippet','')
    counts={key:len(re.findall(expr,text,re.I)) for key,expr in KEYWORDS.items()}
    if max(counts.values())==0:return None
    topic=max(counts,key=counts.get)
    codes=country_mentions(text)
    if article.get('source_kind')=='official' and article.get('source','').startswith('UK ') and 'GBR' not in codes: codes.insert(0,'GBR')
    if not codes:return None
    return {'kind':topic,'countries':codes,'classification':'키워드 자동 분류','confidence':'미검증 보도',
            'summary':'기사 제목·요약에 근거한 자동 수집 기록입니다. 사실관계와 방문 일정은 원문 및 정부 공식 발표에서 확인해야 합니다.'}


def classify_ai(article,base):
    """Model classification is optional; result is validated and remains unverified.
    API key must reside in server environment, never browser JS.
    """
    key=os.getenv('OPENAI_API_KEY')
    if not key:return base
    from urllib.request import Request,urlopen
    schema={'type':'object','properties':{'relevant':{'type':'boolean'},'kind':{'type':'string','enum':['diplomacy','defense','trade']},
            'countries':{'type':'array','items':{'type':'string'}},'summary':{'type':'string'}},
            'required':['relevant','kind','countries','summary'],'additionalProperties':False}
    prompt=("Classify ONE reported geopolitical news headline using only supplied headline and snippet. "
            "Never invent dates, leaders, countries or official confirmations. "
            "If it does not clearly relate to foreign diplomacy, defence/security, or trade sanctions, set relevant=false. "
            "Return ISO3 country codes only when explicitly supported by text. "
            "Treat all article assertions as unverified reports. Give a cautious 1-sentence Korean summary.\n"+
            json.dumps({'title':article['title'],'snippet':article.get('snippet',''),'source':article['source']},ensure_ascii=False))
    request={'model':AI_MODEL,'input':[{'role':'developer','content':'You are a cautious event classifier. News title is not proof of fact.'},
                                          {'role':'user','content':prompt}],
             'text':{'format':{'type':'json_schema','name':'classified_intel','strict':True,'schema':schema}},'max_output_tokens':230}
    try:
        raw=json.loads(urlopen(Request('https://api.openai.com/v1/responses',data=json.dumps(request).encode('utf-8'),
                        headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST'),timeout=20).read())
        reply=''.join(part.get('text','') for output in raw.get('output',[]) if output.get('type')=='message'
                      for part in output.get('content',[]) if part.get('type')=='output_text')
        result=json.loads(reply)
        if not result.get('relevant'):return None
        # Enforce explicit named-country evidence even when model suggests otherwise.
        grounded=country_mentions(article['title']+' '+article.get('snippet',''))
        if article.get('source_kind')=='official' and article.get('source','').startswith('UK '):grounded.insert(0,'GBR')
        codes=[x for x in result['countries'] if x in COUNTRIES and x in grounded]
        if not codes:return base
        return {'kind':result['kind'],'countries':codes[:8],'summary':result['summary'][:400],
                'classification':'AI 자동 분류 · 원문 미검증','confidence':'미검증 보도'}
    except Exception:
        # An AI outage should never stop collection; do not present rules as AI.
        return base


def stable_id(article):
    # Source URL is kept separately. Normalize article titles for elementary near-duplicate consolidation.
    words=' '.join(re.findall(r'[a-z0-9]+',unicodedata.normalize('NFKD',article['title']).lower()))
    return 'auto_'+hashlib.sha256((words+'|'+article.get('date','')).encode()).hexdigest()[:18]


def process_articles(articles):
    stored=0;analyzed=0;ai_calls=0
    ai_max=max(0,min(30,int(os.getenv('GMI_AI_MAX_PER_RUN','12'))))
    with LOCK:
        with db() as con:
            for article in articles:
                base=classify_rules(article)
                if base is None:continue
                eid=stable_id(article)
                if con.execute('SELECT 1 FROM intel_events WHERE id=? OR url=?',(eid,article['url'])).fetchone():continue
                use_ai=AI_ON and ai_calls<ai_max
                if use_ai:ai_calls+=1
                info=classify_ai(article,base) if use_ai else base
                if info is None:continue
                analyzed+=1
                con.execute('INSERT OR IGNORE INTO intel_events(id,title,url,source,kind,event_type,countries,date,detected_at,classification,evidence,summary,confidence) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
                       (eid,article['title'][:300],article['url'][:1200],article['source'][:120],info['kind'],
                        TYPE_MAP[info['kind']],json.dumps(info['countries']),article['date'],
                        dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),info['classification'],
                        '정부 공식 발표 원문' if article['source_kind']=='official' else '뉴스 보도 / 뉴스 집계',
                        info['summary'][:500],info['confidence']))
                stored+=1
            # Small-scale retention policy; retained items remain available for 180 days.
            since=(dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=180)).isoformat()
            con.execute('DELETE FROM intel_events WHERE detected_at < ?',(since,))
    return stored,analyzed


def collect_once():
    global RUNNING
    with LOCK:
        if RUNNING:return {'already_running':True}
        RUNNING=True
    set_meta('last_attempt',dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'))
    items=[];fail=[];ok=[]
    try:
        for name,url,kind in FEEDS:
            try:
                rows=parse_feed(fetch(url),name,kind)
                items.extend(rows[:40]);ok.append(f'{name}: {len(rows)}')
            except Exception as e:fail.append(name+': '+str(e)[:120])
        for topic,query in GDELT_QUERIES.items():
            try:
                u='https://api.gdeltproject.org/api/v2/doc/doc?'+urlencode({'query':query,'mode':'artlist','format':'json','maxrecords':'40','timespan':'2days','sort':'datedesc'})
                data=json.loads(fetch(u));rows=[]
                for a in data.get('articles',[]):
                    link=a.get('url','');title=strip_markup(a.get('title',''))
                    if not link.startswith(('http://','https://')) or not title:continue
                    seen=str(a.get('seendate',''))
                    date=seen[:4]+'-'+seen[4:6]+'-'+seen[6:8] if len(seen)>=8 else ''
                    rows.append({'title':title,'snippet':'','url':link,'date':date,'source':str(a.get('domain','GDELT'))[:120],
                                 'source_kind':'aggregator'})
                items.extend(rows);ok.append(f'GDELT {topic}: {len(rows)}')
            except Exception as e:fail.append('GDELT '+topic+': '+str(e)[:120])
        # Prefer source links. Duplicate URL/title group is removed in SQLite.
        stored,_=process_articles(items)
        set_meta('last_success',dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds') if ok else get_meta().get('last_success',''))
        set_meta('last_count',stored)
        set_meta('last_scanned',len(items))
        set_meta('feed_ok',json.dumps(ok,ensure_ascii=False))
        set_meta('feed_errors',json.dumps(fail,ensure_ascii=False))
        return {'collected':stored,'scanned':len(items),'sources_ok':ok,'errors':fail}
    finally:
        with LOCK:RUNNING=False


def list_events(limit=250,country=None):
    with db() as con:
        rows=con.execute('SELECT * FROM intel_events ORDER BY detected_at DESC LIMIT ?',(min(max(limit,1),1000),)).fetchall()
    result=[]
    for row in rows:
        e=dict(row);e['countries']=json.loads(e['countries'])
        if country and country not in e['countries']:continue
        result.append(e)
    return result


def status():
    m=get_meta()
    with db() as c:count=c.execute('SELECT COUNT(*) FROM intel_events').fetchone()[0]
    def parsed(k):
        try:return json.loads(m.get(k,'[]'))
        except:return []
    return {'enabled':True,'running':RUNNING,'interval_minutes':INTERVAL//60,'saved_count':count,
            'last_attempt':m.get('last_attempt'), 'last_success':m.get('last_success'),
            'last_count':int(m.get('last_count','0')), 'last_scanned':int(m.get('last_scanned','0')),
            'sources_ok':parsed('feed_ok'),'errors':parsed('feed_errors'),
            'mode':'AI (OpenAI API)' if AI_ON else '규칙 기반 자동 분류 (AI 키 미설정)',
            'notice':'자동 수집 기사는 사실 확인·공식 방문 일정 확정이 아닙니다. 서버가 켜져 있을 때만 갱신됩니다.'}


def loop():
    while not STOP.is_set():
        try: collect_once()
        except Exception as e:set_meta('feed_errors',json.dumps(['Automatic update failed: '+str(e)[:160]]))
        STOP.wait(INTERVAL)


def start():
    init_db()
    threading.Thread(target=loop,name='gmi-intel-collector',daemon=True).start()
