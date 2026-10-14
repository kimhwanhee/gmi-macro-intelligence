"""GMI zero-dependency local HTTP server + transparent external-data proxies.
Usage: python server.py [port]    (default: 8765)
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, urlencode, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json, os, sys, time, re, threading, secrets
import auto_intel
import research_api
import leadership_data
import macro_data
import political_data
import fx_data
import foreign_minister_data

ROOT=Path(__file__).resolve().parent
PUBLIC_MODE = os.getenv('GMI_PUBLIC_MODE', '0').strip() == '1'
ADMIN_TOKEN = os.getenv('GMI_ADMIN_TOKEN','').strip()
# Public deployments must never serve arbitrary project files (including source, env, database).
PUBLIC_ASSETS = {'/','/index.html','/styles.css','/app.js','/country-catalog.js','/enhancements.js','/refinements.js','/v5-repair.js','/v5-repair.css','/v6-fix.js','/v6-fix.css','/v7-politics.js','/v7-politics.css','/v8-intelligence.js','/v8-intelligence.css','/v9-interactions.js','/v9-interactions.css'}
CACHE={}

# ISO 3166-1 country/territory directory, plus Kosovo.
CATALOG = {r['iso']:r for r in json.loads((ROOT/'country-catalog.json').read_text(encoding='utf8'))}
ENGLISH = {iso:r['english'] for iso,r in CATALOG.items()}

TOPICS={
 'economy':'(economy OR inflation OR "central bank" OR GDP)',
 'diplomacy':'(diplomacy OR "foreign minister" OR summit OR "state visit")',
 'defense':'(defense OR military OR "national security")',
 'trade':'(tariff OR "trade agreement" OR "export controls")'
}

def retrieve(url,cache_key,ttl):
    cached=CACHE.get(cache_key)
    if cached and time.monotonic()-cached[0]<ttl:
        return cached[1]
    req=Request(url,headers={'User-Agent':'GMIResearchMVP/1.0 (local application; educational use)','Accept':'application/json'})
    with urlopen(req,timeout=13) as resp:
        data=json.loads(resp.read(2_000_000).decode('utf-8','replace'))
    CACHE[cache_key]=(time.monotonic(),data)
    return data

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)

    def send_json(self,data,status=200):
        raw=json.dumps(data,ensure_ascii=False).encode('utf8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.end_headers()
        self.wfile.write(raw)

    def _allowed_asset(self, path):
        return path in PUBLIC_ASSETS

    def _admin_allowed(self):
        if not PUBLIC_MODE and not ADMIN_TOKEN:
            return True # Preserve local prototype workflow.
        received = self.headers.get('X-GMI-Admin-Token','')
        return bool(ADMIN_TOKEN and received and secrets.compare_digest(received,ADMIN_TOKEN))

    def do_HEAD(self):
        path=urlparse(self.path).path
        if self._allowed_asset(path):return super().do_HEAD()
        self.send_error(404, 'Not found')

    def list_directory(self, path):
        self.send_error(403, 'Forbidden')
        return None

    def do_POST(self):
        u=urlparse(self.path)
        if u.path=='/api/intel/refresh':
            if not self._admin_allowed():
                return self.send_json({'error':'관리자만 수동 수집을 실행할 수 있습니다. 자동 수집은 예약대로 실행됩니다.'},403)
            if auto_intel.RUNNING:return self.send_json({'started':False,'message':'이미 자동 수집 중입니다.'},202)
            threading.Thread(target=auto_intel.collect_once,daemon=True).start()
            return self.send_json({'started':True,'message':'뉴스 수집을 시작했습니다.'},202)
        return self.send_json({'error':'Unsupported action'},404)

    def do_GET(self):
        u=urlparse(self.path)
        if u.path=='/api/fx':
            return self.send_json(fx_data.get())
        if u.path=='/api/intel/status':
            return self.send_json({**auto_intel.status(), 'public_mode': PUBLIC_MODE})
        if u.path=='/api/intel/events':
            params=parse_qs(u.query)
            c=params.get('country',[''])[0].upper()
            if c and c not in CATALOG:return self.send_json({'error':'Invalid country'},400)
            try: limit=int(params.get('limit',['350'])[0])
            except (ValueError,TypeError): limit=350
            return self.send_json({'events':auto_intel.list_events(limit,c or None),'status':{**auto_intel.status(),'public_mode':PUBLIC_MODE}})
        if u.path=='/api/officials':
            c=parse_qs(u.query).get('country',[''])[0].upper()
            if c not in CATALOG:return self.send_json({'error':'Invalid country'},400)
            return self.send_json(research_api.officials(c))
        if u.path=='/api/politics':
            c=parse_qs(u.query).get('country',[''])[0].upper()
            if c not in CATALOG:return self.send_json({'error':'Invalid country'},400)
            return self.send_json(political_data.get(c))
        if u.path=='/api/foreign-minister':
            c=parse_qs(u.query).get('country',[''])[0].upper()
            if c not in CATALOG:return self.send_json({'error':'Invalid country'},400)
            return self.send_json(foreign_minister_data.get(c))
        if u.path=='/api/leadership':
            c=parse_qs(u.query).get('country',[''])[0].upper()
            if c not in CATALOG:return self.send_json({'error':'Invalid country'},400)
            return self.send_json(leadership_data.leadership(c))
        if u.path=='/api/macro-bundle':
            c=parse_qs(u.query).get('country',[''])[0].upper()
            if c not in CATALOG:return self.send_json({'error':'Invalid country'},400)
            force=parse_qs(u.query).get('refresh',['0'])[0]=='1'
            return self.send_json(macro_data.single_country(c,force=force))
        if u.path=='/api/macro-compare':
            q=parse_qs(u.query)
            cs=[x.upper() for x in q.get('countries',[''])[0].split(',') if x]
            indicator=q.get('indicator',[''])[0]
            if not cs or len(cs)>4 or len(cs)!=len(set(cs)) or any(c not in CATALOG for c in cs) or indicator not in macro_data.INDICATORS:
                return self.send_json({'error':'Invalid compare parameters'},400)
            return self.send_json(macro_data.compare(cs,indicator,force=q.get('refresh',['0'])[0]=='1'))
        if u.path in ('/api/leader','/api/brief','/api/diplomacy'):
            c=parse_qs(u.query).get('country',[''])[0].upper()
            if c not in CATALOG:return self.send_json({'error':'Invalid country'},400)
            if u.path=='/api/leader':return self.send_json(research_api.leader(c))
            if u.path=='/api/brief':return self.send_json(research_api.brief(c,parse_qs(u.query).get('lang',['ko'])[0]))
            return self.send_json(research_api.diplomacy(c))
        if u.path=='/api/health':
            return self.send_json({'status':'ok','public_mode':PUBLIC_MODE,'data_sources':{'macro':'World Bank','news':'GDELT DOC 2.0'},'note':'External APIs require Internet access.'})
        if u.path=='/api/worldbank':
            q=parse_qs(u.query)
            country=q.get('country',[''])[0].upper().strip()
            indicator=q.get('indicator',[''])[0].strip()
            if not re.fullmatch(r'[A-Z]{2,3}',country) or not re.fullmatch(r'[A-Z0-9.]{4,40}',indicator):
                return self.send_json({'error':'Invalid country or indicator'},400)
            url='https://api.worldbank.org/v2/country/'+country+'/indicator/'+indicator+'?'+urlencode({'format':'json','per_page':14})
            try:
                data=retrieve(url,('macro',country,indicator),60*60*6)
                return self.send_json(data)
            except Exception as ex:
                return self.send_json({'error':'World Bank unavailable','detail':str(ex)[:200]},502)
        if u.path=='/api/news':
            q=parse_qs(u.query)
            country=q.get('country',['USA'])[0].upper()
            category=q.get('category',['economy'])[0].lower()
            if country not in ENGLISH or category not in TOPICS:
                return self.send_json({'error':'Unsupported country/category'},400)
            phrase=ENGLISH[country]
            # Using DOC's article search; external news is NOT ground-truth geopolitical event classification.
            query=f'{TOPICS[category]} "{phrase}"'
            url='https://api.gdeltproject.org/api/v2/doc/doc?'+urlencode({
                'query':query,'mode':'artlist','format':'json','maxrecords':'22','timespan':'1week','sort':'datedesc'
            })
            try:
                feed=retrieve(url,('news',country,category),60*15)
                articles=[]
                for row in feed.get('articles',[]):
                    raw_date=str(row.get('seendate',''))
                    date=(raw_date[:4]+'-'+raw_date[4:6]+'-'+raw_date[6:8]) if len(raw_date)>=8 else raw_date
                    link=row.get('url','')
                    if not link.startswith('https://') and not link.startswith('http://'): continue
                    articles.append({
                        'title':str(row.get('title',''))[:350], 'url':link,
                        'date':date,'source':str(row.get('domain',''))[:120],
                        'domain':str(row.get('domain',''))[:120],
                        'language':str(row.get('language',''))[:50]
                    })
                return self.send_json({'articles':articles,'source':'GDELT DOC 2.0','queried_country':country,'category':category})
            except Exception as ex:
                return self.send_json({'articles':[],'error':'GDELT temporarily unavailable','detail':str(ex)[:180]},502)
        if self._allowed_asset(u.path):
            return super().do_GET()
        return self.send_json({'error':'Not found'},404)

if __name__=='__main__':
    port=int(os.environ.get('PORT', sys.argv[1] if len(sys.argv)>1 else '8765'))
    address='0.0.0.0' if PUBLIC_MODE else '127.0.0.1'
    auto_intel.start()
    print(f'GMI server listening on {address}:{port} (public_mode={PUBLIC_MODE})')
    print('Auto intelligence: collecting every %d minutes. AI=%s' % (auto_intel.INTERVAL//60,auto_intel.AI_ON))
    print('Ctrl+C to stop. Internet needed for news collection; OPENAI_API_KEY optional for AI classification.')
    try: ThreadingHTTPServer((address,port),Handler).serve_forever()
    except KeyboardInterrupt: print('\nServer stopped.')
