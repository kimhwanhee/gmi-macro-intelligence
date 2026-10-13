"""Reliable World Bank proxy: persistent stale-while-revalidate cache, partial-failure isolation.
No values are invented. Cache serves the latest successful fetch, annotated with timestamp.
"""
import json, time, threading, sqlite3, os, datetime
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DB=Path(os.getenv('GMI_DB_PATH','/tmp/gmi_macro.sqlite3'))
INDICATORS=('NY.GDP.MKTP.KD.ZG','FP.CPI.TOTL.ZG','SL.UEM.TOTL.ZS','NE.TRD.GNFS.ZS','BN.CAB.XOKA.CD','BN.FIN.TOTL.CD')
_LOCK=threading.RLock()
POOL=ThreadPoolExecutor(max_workers=5, thread_name_prefix='macro')
TTL=12*3600
CACHE={}

def db():
 DB.parent.mkdir(parents=True, exist_ok=True)
 connection=sqlite3.connect(str(DB),timeout=3)
 connection.execute('CREATE TABLE IF NOT EXISTS macro_cache(cache_key TEXT PRIMARY KEY, updated_at REAL NOT NULL, body TEXT NOT NULL)')
 return connection

def read(key):
 with _LOCK:
  if key in CACHE:return CACHE[key]
 try:
  with db() as conn:
   row=conn.execute('SELECT updated_at, body FROM macro_cache WHERE cache_key=?',(key,)).fetchone()
  if row:
   result=(float(row[0]),json.loads(row[1]))
   with _LOCK:CACHE[key]=result
   return result
 except (sqlite3.Error,ValueError,TypeError,OSError):pass
 return None

def write(key,body):
 stamped=time.time()
 with _LOCK:CACHE[key]=(stamped,body)
 try:
  with db() as conn:
   conn.execute('INSERT OR REPLACE INTO macro_cache VALUES (?,?,?)',(key,stamped,json.dumps(body)))
 except (sqlite3.Error,OSError):pass

def fetch_rows(countries,indicators,timeout=7):
 """One batched WDI query for a country set and indicator set."""
 cs=';'.join(countries);codes=';'.join(indicators)
 params={'format':'json','source':'2','date':'2012:2026','per_page':'2000'}
 url=f'https://api.worldbank.org/v2/country/{cs}/indicator/{codes}?{urlencode(params)}'
 req=Request(url,headers={'User-Agent':'GMI-MacroResearch/6.0 (research dashboard)','Accept':'application/json'})
 with urlopen(req,timeout=timeout) as response: raw=json.load(response)
 if not isinstance(raw,list) or len(raw)<2 or not isinstance(raw[1],list):
  raise ValueError('World Bank returned an invalid or error response')
 result={c:{i:[] for i in indicators} for c in countries}
 for row in raw[1]:
  if not isinstance(row,dict):continue
  country=row.get('countryiso3code') or ''
  indicator=row.get('indicator',{}).get('id','')
  if country not in result or indicator not in result[country] or row.get('value') is None:continue
  try:val=float(row['value'])
  except (TypeError,ValueError):continue
  result[country][indicator].append({'date':str(row.get('date','')),'value':val})
 for c in countries:
  for i in indicators:result[c][i].sort(key=lambda x:x['date'],reverse=True)
 return result

def single_country(iso,force=False):
 if not isinstance(iso,str) or len(iso)!=3:raise ValueError('invalid iso3')
 key='country:'+iso
 cached=read(key)
 if cached and not force and time.time()-cached[0]<TTL:
  return {'country':iso,'indicators':cached[1], 'source':'World Bank WDI','cached_at':cached[0], 'stale':False}
 # First call gathers 6 indicators together; if this endpoint is unavailable,
 # isolate errors: one failed indicator should not break the other 5.
 try:
  result=fetch_rows([iso],INDICATORS)[iso]
  if any(result.values()):
   write(key,result)
   return {'country':iso,'indicators':result,'source':'World Bank WDI','cached_at':time.time(),'stale':False}
 except Exception:pass
 result={i:[] for i in INDICATORS};successful=0
 futures={POOL.submit(fetch_rows,[iso],[i],5):i for i in INDICATORS}
 for future in as_completed(futures):
  ind=futures[future]
  try:
   result[ind]=future.result()[iso][ind]
   if result[ind]:successful+=1
  except Exception:pass
 if successful:
  # Preserve previously successful series where the source temporarily failed.
  if cached:
   for i,rows in cached[1].items():
    if i in result and not result[i]:result[i]=rows
  write(key,result)
  return {'country':iso,'indicators':result,'source':'World Bank WDI','cached_at':time.time(),'stale':False,'partial':successful<len(INDICATORS)}
 if cached:
  return {'country':iso,'indicators':cached[1],'source':'World Bank WDI','cached_at':cached[0],'stale':True,'error':'source_temporarily_unavailable'}
 return {'country':iso,'indicators':result,'source':'World Bank WDI','stale':False,'error':'source_temporarily_unavailable','retryable':True}

def compare(countries,indicator,force=False):
 if not countries or len(countries)>4 or indicator not in INDICATORS or any(len(c)!=3 for c in countries):
  raise ValueError('invalid compare query')
 key='compare:'+indicator+':'+','.join(countries)
 cached=read(key)
 if cached and not force and time.time()-cached[0]<TTL:
  return {'indicators':cached[1],'countries':countries,'indicator':indicator,'cached_at':cached[0], 'stale':False}
 # One batched network request for 4 countries, 1 indicator.
 try:
  rows=fetch_rows(countries,[indicator],8)
  output={c:rows[c][indicator] for c in countries}
  if any(output.values()):
   write(key,output)
   return {'indicators':output,'countries':countries,'indicator':indicator,'cached_at':time.time(),'stale':False}
 except Exception:pass
 if cached:return {'indicators':cached[1],'countries':countries,'indicator':indicator,'cached_at':cached[0],'stale':True,'error':'source_temporarily_unavailable'}
 # Look for cached per-country bundles before declaring outage.
 values={c:((read('country:'+c)or(0,{}))[1].get(indicator,[])) for c in countries}
 if any(values.values()):return {'indicators':values,'countries':countries,'indicator':indicator,'stale':True,'error':'source_temporarily_unavailable'}
 return {'indicators':values,'countries':countries,'indicator':indicator,'error':'source_temporarily_unavailable','retryable':True}
