"""On-demand country intelligence with bounded asynchronous daily caching.
Factual guardrail: headlines alone do not verify meetings or imply forecasts.
"""
import json, re, os, time, threading, datetime, sqlite3
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
import auto_intel

COUNTRIES=auto_intel.COUNTRIES

from pathlib import Path
_OFFICIAL_SNAPSHOTS=json.loads((Path(__file__).resolve().parent/'verified-officials.json').read_text(encoding='utf-8'))

def officials(iso):
    row=_OFFICIAL_SNAPSHOTS.get(iso)
    if not row: return {'country':iso,'people':[],'verified_as_of':None,'source':'Wikidata lookup'}
    return {'country':iso,'people':row['people'],'verified_as_of':row['verified_as_of'], 'source':'Dated official government publications'}

_LOCK=threading.Lock(); _POOL=ThreadPoolExecutor(max_workers=5, thread_name_prefix='country-data'); _BACKGROUND=ThreadPoolExecutor(max_workers=3,thread_name_prefix='country-refresh')
_JOBS=set(); _MEM={}; _CATEGORIES=['economy','politics','defense','diplomacy']
TTL_BRIEF=6*3600; TTL_LEADER=24*3600

def _con():
 c=sqlite3.connect(str(auto_intel.DB_PATH),timeout=10)
 c.execute('PRAGMA busy_timeout=10000')
 c.execute('CREATE TABLE IF NOT EXISTS research_cache(key TEXT PRIMARY KEY, body TEXT NOT NULL, updated REAL NOT NULL)')
 return c

def _get(key):
 with _LOCK:
  if key in _MEM:return _MEM[key]
 try:
  with _con() as c:
   r=c.execute('SELECT body,updated FROM research_cache WHERE key=?',(key,)).fetchone()
   if r:
    data=(float(r[1]),json.loads(r[0]));
    with _LOCK:_MEM[key]=data
    return data
 except (sqlite3.Error,ValueError,TypeError):pass
 return None

def _put(key,value):
 stamp=time.time()
 with _LOCK:_MEM[key]=(stamp,value)
 try:
  with _con() as c:c.execute('INSERT OR REPLACE INTO research_cache VALUES(?,?,?)',(key,json.dumps(value,ensure_ascii=False),stamp))
 except (sqlite3.Error,ValueError):pass

def _fetch_text(url, maxbytes=800000, accept='application/json'):
 req=Request(url,headers={'User-Agent':'GMI-CountryResearch/3.0 (public-sourced metadata; contact via host)','Accept':accept})
 with urlopen(req,timeout=12) as r:return r.read(maxbytes).decode('utf-8','replace')

def _collect_topic(iso,topic,lang="ko"):
 c=COUNTRIES[iso];n=c['english'];
 terms={
  'economy':'(economy OR inflation OR GDP OR "central bank" OR interest rates)',
  'politics':'(election OR parliament OR government OR president OR "prime minister" OR legislation)',
  'defense':'(defense OR defence OR military OR national security OR security agreement)',
  'diplomacy':'("foreign minister" OR "state visit" OR summit OR "bilateral talks" OR "president meets")'
 }
 # Request articles published in the chosen language where available;
 # this is NOT guaranteed machine translation and article publishers retain their names.
 lang=lang if lang in ('ko','en','zh') else 'ko'
 context={'ko':{'economy':'경제 물가 성장 금융','politics':'정치 정부 선거 의회','defense':'국방 안보 군사','diplomacy':'외교 정상회담 방문'},
          'en':{'economy':'economy inflation GDP','politics':'politics government election','defense':'defense security military','diplomacy':'diplomacy summit foreign minister'},
          'zh':{'economy':'经济 通胀 增长','politics':'政治 政府 选举','defense':'国防 安全 军事','diplomacy':'外交 峰会 外长'}}
 params={'ko':('ko','KR','KR:ko'),'en':('en-US','US','US:en'),'zh':('zh-CN','CN','CN:zh-Hans')}
 hl,gl,ceid=params[lang]
 localized=c.get('name',n) if lang=='ko' else n
 query=f'"{localized}" ({" OR ".join(context[lang][topic].split())}) when:7d'
 url='https://news.google.com/rss/search?'+urlencode({'q':query,'hl':hl,'gl':gl,'ceid':ceid})
 try:
  raw=_fetch_text(url,accept='application/rss+xml,application/xml')
  articles=auto_intel.parse_feed(raw,'Google News RSS','aggregator')
 except Exception:return []
 seen=set();picked=[]
 for a in articles:
  if not a.get('title') or not a.get('url'):continue
  # Visible publication timestamps; actual meeting and publication date are different.
  title=a['title'].split(' - ')[0].strip()
  # RSS locale is a preference, not a translation guarantee. Filter by actual script.
  if lang=='ko' and not re.search(r'[가-힣]',title): continue
  if lang=='zh' and len(re.findall(r'[\u3400-\u9fff]',title)) < 3: continue
  if lang=='en' and (re.search(r'[가-힣]',title) or len(re.findall(r'[\u3400-\u9fff]',title))>8): continue
  key=re.sub(r'\W+','',title.lower())[:65]
  if key in seen:continue
  seen.add(key)
  a['title']=title[:250];a['category']=topic;a['summary'] = ''
  a['impact']='';a['partner_countries']=[]
  picked.append(a)
  if len(picked)>=2:break
 return picked

def _ai_enrich(items):
 api_key=os.getenv('OPENAI_API_KEY','').strip()
 if not api_key or not items:return items
 # One API request for 8 headlines; strict no fabricated article content/meeting details.
 schema={'type':'object','properties':{'results':{'type':'array','items':{'type':'object','properties':{
  'index':{'type':'integer'},'title_ko':{'type':'string'},'title_en':{'type':'string'},'title_zh':{'type':'string'},'summary_ko':{'type':'string'},'summary_en':{'type':'string'},'summary_zh':{'type':'string'},
  'impact_ko':{'type':'string'},'impact_en':{'type':'string'},'impact_zh':{'type':'string'},
  'affected_countries':{'type':'array','items':{'type':'string'}}},
  'required':['index','title_ko','title_en','title_zh','summary_ko','summary_en','summary_zh','impact_ko','impact_en','impact_zh','affected_countries'],
  'additionalProperties':False}}},'required':['results'],'additionalProperties':False}
 payload={'model':os.getenv('GMI_AI_MODEL','gpt-4o-mini'),'input':[
  {'role':'developer','content':'Summarize ONLY the supplied news HEADLINE and snippet. No article full text is available. Do not claim to have read the full article. If a precise detail is missing do not invent it. Conditional spillover hypotheses must be labeled possible, not facts. Do not give investments advice. Translate the precise original headline into all three languages (Korean, English, Simplified Chinese) as title_ko/title_en/title_zh, preserving proper names and uncertainty. Output summaries in all three languages Korean, English, Simplified Chinese. Empty impact string if no well-supported plausible spillover. Indices must correspond to inputs. Keep summaries <180 chars each and impacts <160.'},
  {'role':'user','content':json.dumps([{'index':i,'title':x['title'],'snippet':x.get('snippet',''),'category':x['category'],'date':x['date']} for i,x in enumerate(items)],ensure_ascii=False)}],
  'text':{'format':{'type':'json_schema','name':'daily_brief','strict':True,'schema':schema}},'max_output_tokens':2800}
 try:
  request=Request('https://api.openai.com/v1/responses',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+api_key,'Content-Type':'application/json'},method='POST')
  with urlopen(request,timeout=29) as f:data=json.load(f)
  content=''.join(y.get('text','') for x in data.get('output',[]) for y in x.get('content',[]) if y.get('type')=='output_text')
  result=json.loads(content)
  for item in result.get('results',[]):
   idx=item.get('index')
   if type(idx) is not int or not 0<=idx<len(items):continue
   for field in ['title_ko','title_en','title_zh','summary_ko','summary_en','summary_zh','impact_ko','impact_en','impact_zh']:
    items[idx][field]=str(item.get(field,'') or '')[:420]
   items[idx]['partner_countries']=[str(x)[:3] for x in item.get('affected_countries',[]) if str(x)[:3] in COUNTRIES]
 except Exception:pass
 return items

def _refresh_brief(iso,lang='ko'):
 key='brief:'+iso+':'+lang
 try:
  futures=[_POOL.submit(_collect_topic,iso,cat,lang) for cat in _CATEGORIES]
  items=[];cats={}
  for cat,f in zip(_CATEGORIES,futures):
   try:cats[cat]=f.result(timeout=17)
   except Exception:cats[cat]=[]
   items.extend(cats[cat])
  items=_ai_enrich(items)
  cats={k:[x for x in items if x['category']==k] for k in _CATEGORIES}
  _put(key,{'country':iso,'categories':cats,'updated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'basis':'headlines and RSS snippets only','ai_enriched':bool(any(x.get('summary_ko') for x in items))})
 finally:
  with _LOCK:_JOBS.discard(key)

def brief(iso,lang='ko'):
 lang=lang if lang in ('ko','en','zh') else 'ko'
 key='brief:'+iso+':'+lang;cached=_get(key)
 if (not cached or time.time()-cached[0]>TTL_BRIEF):
  with _LOCK:
   if key not in _JOBS:
    _JOBS.add(key)
    _BACKGROUND.submit(_refresh_brief,iso,lang)
 with _LOCK:refreshing=key in _JOBS
 if cached:return {**cached[1],'loading':refreshing,'stale':(time.time()-cached[0]>TTL_BRIEF)}
 return {'country':iso,'categories':{k:[] for k in _CATEGORIES},'loading':refreshing,'updated_at':None,'basis':'headlines and RSS snippets only'}

# Major-country fallback uses explicit Wikidata entity IDs, never hard-coded leader names.
COUNTRY_QIDS={'USA':'Q30','CHN':'Q148','JPN':'Q17','KOR':'Q884','PRK':'Q423','GBR':'Q145','DEU':'Q183',
 'FRA':'Q142','IND':'Q668','RUS':'Q159','UKR':'Q212','CAN':'Q16','AUS':'Q408','BRA':'Q155',
 'ITA':'Q38','ESP':'Q29','MEX':'Q96','IRN':'Q794','ISR':'Q801','SAU':'Q851','TWN':'Q865',
 'SGP':'Q334','VNM':'Q881','MMR':'Q836','TUR':'Q43','IDN':'Q252','PHL':'Q928',
 'PAK':'Q843','ZAF':'Q258','EGY':'Q79','NGA':'Q1033','POL':'Q36','NLD':'Q55'}

def _wikidata_entities(qids,props='claims|labels'):
 url='https://www.wikidata.org/w/api.php?'+urlencode({'action':'wbgetentities','ids':'|'.join(qids),'props':props,'format':'json'})
 return json.loads(_fetch_text(url)).get('entities',{})

def _api_leader_fallback(iso):
 q=COUNTRY_QIDS.get(iso)
 if not q:
  try:
   name=COUNTRIES[iso]['english']
   url='https://www.wikidata.org/w/api.php?'+urlencode({'action':'wbsearchentities','search':name,'language':'en','type':'item','format':'json','limit':8})
   hits=json.loads(_fetch_text(url)).get('search',[])
   ids=[x.get('id') for x in hits if re.fullmatch(r'Q[0-9]+',x.get('id',''))]
   entities=_wikidata_entities(ids,'claims') if ids else {}
   for candidate,entity in entities.items():
    for claim in entity.get('claims',{}).get('P298',[]):
     if claim.get('mainsnak',{}).get('datavalue',{}).get('value','')==iso:
      q=candidate;break
    if q:break
  except Exception:pass
 if not q:return []
 base=_wikidata_entities([q],'claims').get(q,{}).get('claims',{})
 selected=[]
 for prop,office in [('P35','head_of_state'),('P6','head_of_government')]:
  statements=base.get(prop,[])
  if not statements:continue
  candidates=[x for x in statements if x.get('rank')!='deprecated' and not x.get('qualifiers',{}).get('P582')]
  candidates=sorted(candidates,key=lambda x:x.get('rank')!='preferred')
  for st in candidates[:1]:
   try:person=st['mainsnak']['datavalue']['value']['id']
   except (TypeError,KeyError):continue
   dates=st.get('qualifiers',{}).get('P580',[])
   since=(dates[0].get('datavalue',{}).get('value',{}).get('time','').lstrip('+')[:10] if dates else '')
   selected.append((office,person,since))
 if not selected:return []
 details=_wikidata_entities([x[1] for x in selected],'claims|labels')
 result=[]
 for office,pid,since in selected:
  e=details.get(pid,{})
  labels=e.get('labels',{});name=next((labels[lang]['value'] for lang in ['ko','en','zh'] if lang in labels),pid)
  photo=''
  try:photo=e['claims']['P18'][0]['mainsnak']['datavalue']['value']
  except (TypeError,KeyError,IndexError):pass
  photo='https://commons.wikimedia.org/wiki/Special:FilePath/'+quote(photo.replace(' ','_')) if photo else ''
  result.append({'office':office,'name':name,'image':photo,'term_start':since,
                 'elected_on':None,'source':'https://www.wikidata.org/wiki/'+pid})
 return result

def _refresh_leader(iso):
 key='leader:'+iso
 try:
  # For commonly researched countries, the entity API is usually faster than SPARQL.
  if iso in COUNTRY_QIDS:
   try:
    people=_api_leader_fallback(iso)
    if people:
     _put(key,{'country':iso,'people':people,'source':'Wikidata API',
               'fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
     return
   except Exception:pass
  # Query official Wikidata country claims; absence is reported as unavailable.
  query='''SELECT ?office ?person ?personLabel ?image ?start ?election WHERE {
   ?country wdt:P298 "'''+iso+'''".
   VALUES (?prop ?office) {(wdt:P35 "head_of_state") (wdt:P6 "head_of_government")}
   ?country ?prop ?person.
   OPTIONAL { ?person wdt:P18 ?image. }
   OPTIONAL { ?country p:P35|p:P6 ?statement. ?statement ?claim ?person. VALUES ?claim {ps:P35 ps:P6} OPTIONAL {?statement pq:P580 ?start.} }
   SERVICE wikibase:label { bd:serviceParam wikibase:language "en,zh,ko". }
  } LIMIT 12'''
  url='https://query.wikidata.org/sparql?'+urlencode({'query':query,'format':'json'})
  raw=_fetch_text(url,accept='application/sparql-results+json'); obj=json.loads(raw)
  matches=[];seen=set()
  for b in obj.get('results',{}).get('bindings',[]):
   office=b.get('office',{}).get('value','')
   name=b.get('personLabel',{}).get('value','')
   if not name or (office,name) in seen:continue
   seen.add((office,name));image=b.get('image',{}).get('value','')
   if image.startswith('http://commons.wikimedia.org/'):image='https://'+image[7:]
   if image and not image.startswith(('https://commons.wikimedia.org/','https://upload.wikimedia.org/')):image=''
   matches.append({'office':office,'name':name,'image':image,
                   'term_start':b.get('start',{}).get('value','')[:10],
                   'elected_on':None, # Wikidata P580 is office start, NOT an election date.
                   'source':'https://www.wikidata.org/wiki/'+b.get('person',{}).get('value','').split('/')[-1]})
  if not matches:
   try:matches=_api_leader_fallback(iso)
   except Exception:pass
  _put(key,{'country':iso,'people':matches,'source':'Wikidata','fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
 except Exception:
  # If SPARQL is unavailable, try the Wikidata API for major countries.
  try:
   recovered=_api_leader_fallback(iso)
   if recovered:_put(key,{'country':iso,'people':recovered,'source':'Wikidata API','fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
   else:_put(key,{'country':iso,'people':[],'error':'Wikidata unavailable','source':'Wikidata'})
  except Exception:
   _put(key,{'country':iso,'people':[],'error':'Wikidata unavailable','source':'Wikidata'})
 finally:
  with _LOCK:_JOBS.discard(key)

def leader(iso):
 key='leader:'+iso;cached=_get(key)
 # Provide a clearly dated official-source snapshot immediately while the Wikidata
 # verification request executes asynchronously. Never treat snapshot as live.
 seed=_OFFICIAL_SNAPSHOTS.get(iso)

 if (not cached or time.time()-cached[0]>(900 if (cached[1].get('error') or not cached[1].get('people')) else TTL_LEADER)):
  with _LOCK:
   if key not in _JOBS:
    _JOBS.add(key)
    _BACKGROUND.submit(_refresh_leader,iso)
 with _LOCK:loading=key in _JOBS
 # A dated government-confirmed roster takes precedence over an older/incomplete
 # Wikidata statement. A matching Wikidata image can enrich it, without replacing its dates.
 if seed:
  person=next((p for p in seed['people'] if p['office']=='head_of_state'),None) or next((p for p in seed['people'] if p['office']=='head_of_government'),None)
  if person:
   enriched=dict(person)
   known_qid=person.get('wikidata','')
   if cached and cached[1].get('people'):
    for candidate in cached[1]['people']:
     if known_qid and candidate.get('source','').endswith('/'+known_qid):
      enriched['image']=candidate.get('image','') or person.get('image','')
      break
   return {'country':iso,'people':[enriched],
           'source':'Dated government official publication',
           'verified_as_of':seed['verified_as_of'],'loading':loading}
 if cached and cached[1].get('people'):return {**cached[1],'loading':loading}
 if cached:return {**cached[1],'loading':loading}
 return {'country':iso,'people':[],'loading':loading,'source':'Wikidata'}

ROLES={
 'head_of_state':r'\b(president|head of state|king|queen|emperor|supreme leader|chairman)\b',
 'foreign_minister':r'\b(foreign minister|foreign secretary|secretary of state|minister of foreign affairs)\b',
 'commerce_minister':r'\b(commerce minister|trade minister|minister of commerce|trade secretary)\b',
 'defense_minister':r'\b(defen[cs]e minister|secretary of defense|secretary of defence|defen[cs]e secretary)\b'
}

def _extract_diplomacy_ai(iso,events):
 """Optional headline-only structure extractor. Strict extraction; never official verification."""
 key=os.getenv('OPENAI_API_KEY','')
 if not key:return events
 schema={'type':'object','properties':{'records':{'type':'array','items':{'type':'object','properties':{
  'index':{'type':'integer'},'role':{'type':'string','enum':['head_of_state','foreign_minister','commerce_minister','defense_minister']},
  'person':{'type':'string'},'counterpart':{'type':'string'},'destination':{'type':'string'},
  'meeting_date':{'type':'string'},'visit_date':{'type':'string'},
  'summary_ko':{'type':'string'},'summary_en':{'type':'string'},'summary_zh':{'type':'string'},
  'schedule_status':{'type':'string','enum':['unknown','planned_reported','occurred_reported']}
  },'required':['index','role','person','counterpart','destination','meeting_date','visit_date','summary_ko','summary_en','summary_zh','schedule_status'],
  'additionalProperties':False}}},'required':['records'],'additionalProperties':False}
 prompt='Extract facts stated EXPLICITLY in these news HEADLINES only. Do not assume meeting date equals news publication date. ISO dates only if day month and year appear in headline, otherwise empty string. Person and counterpart only if literally named in headline. Record planned visits as REPORTED not officially confirmed. Translate a neutral 1-sentence HEADLINE-ONLY summary into Korean English and Simplified Chinese. Do not invent details.'
 data={'model':os.getenv('GMI_AI_MODEL','gpt-4o-mini'),'input':[{'role':'developer','content':prompt},
  {'role':'user','content':json.dumps([{'index':i,'title':v['reported_title'],'published':v['reported_at']} for i,v in enumerate(events[:16])],ensure_ascii=False)}],
  'text':{'format':{'type':'json_schema','name':'diplomatic_reports','strict':True,'schema':schema}},'max_output_tokens':3300}
 try:
  req=Request('https://api.openai.com/v1/responses',data=json.dumps(data).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST')
  with urlopen(req,timeout=30) as r:response=json.load(r)
  content=''.join(p.get('text','') for x in response.get('output',[]) for p in x.get('content',[]) if p.get('type')=='output_text')
  enriched=json.loads(content)
  for row in enriched.get('records',[]):
   i=row.get('index')
   if type(i) is not int or i<0 or i>=len(events):continue
   dest=events[i]
   for field in ['person','counterpart','destination','summary_ko','summary_en','summary_zh']:
    if row.get(field):dest[field]=str(row[field])[:220]
   for field in ['meeting_date','visit_date']:
    value=str(row.get(field,'') or '')
    if re.fullmatch(r'20\d\d-\d\d-\d\d',value):dest[field]=value
   if row.get('schedule_status') in ['planned_reported','occurred_reported']:
    dest['schedule_status']=row['schedule_status']
 except Exception:pass
 return events

def _refresh_diplomacy(iso,rows):
 key='diplomacy:'+iso
 try:_put(key,{'country':iso,'events':_extract_diplomacy_ai(iso,rows),'updated_at':time.time()})
 finally:
  with _LOCK:_JOBS.discard(key)


def diplomacy(iso):
 rows=auto_intel.list_events(350,iso)
 out=[]
 for x in rows:
  if x.get('kind')!='diplomacy' and not re.search(r'minister|president|summit|visit|meeting',x.get('title',''),re.I):continue
  title=x.get('title','')
  role=next((key for key,pat in ROLES.items() if re.search(pat,title,re.I)),None)
  if not role:continue
  out.append({'role':role,'person':next((m.group(0) for pat in [r'Xi Jinping',r'Donald Trump',r'Vladimir Putin',r'Emmanuel Macron',r'Narendra Modi',r'Volodymyr Zelenskyy',r'Keir Starmer',r'Lee Jae-myung'] if (m:=re.search(pat,title,re.I))),''), 'reported_title':title,'reported_at':x.get('date',''),
              'meeting_date':None,'visit_date':None,'counterpart':'','destination':'',
              'verification':'reported_unverified', 'source':x.get('url',''),
              'publisher':x.get('source',''),'countries':x.get('countries',[])})
  if len(out)>=40:break
 key='diplomacy:'+iso;data=_get(key)
 if not os.getenv('OPENAI_API_KEY'):
  return {'country':iso,'events':out,'loading':False,'method':'headlines without AI',
          'note':'Published date is not an event date. Future visits require official confirmation.'}
 if data and time.time()-data[0]<12*3600:return {**data[1],'loading':False}
 with _LOCK:
  if key not in _JOBS:
   _JOBS.add(key)
   _BACKGROUND.submit(_refresh_diplomacy,iso,out[:16])
 return {'country':iso,'events':out,'loading':True,'method':'AI headline extraction pending',
         'note':'News reporting is not official confirmation.'}
