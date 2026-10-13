"""Cached real FX observations. USD-base rates; never substitute fabricated fallback."""
import json, time, threading
from pathlib import Path
from urllib.request import urlopen,Request
from urllib.parse import urlencode
from concurrent.futures import ThreadPoolExecutor
import os
CACHE_PATH=Path(os.getenv('GMI_FX_CACHE','/data/gmi_fx.json' if os.getenv('GMI_PUBLIC_MODE')=='1' else '/tmp/gmi_fx.json'))
LOCK=threading.RLock()
POOL=ThreadPoolExecutor(max_workers=1)
MEM={}
try:MEM=json.loads(CACHE_PATH.read_text())
except Exception:pass
IN_PROGRESS=False

def _update():
 global IN_PROGRESS
 try:
  url='https://api.frankfurter.dev/v2/rates?'+urlencode({'base':'USD','quotes':'KRW,CNY'})
  with urlopen(Request(url,headers={'Accept':'application/json','User-Agent':'GMI Macro Currency Viewer/8'}),timeout=9) as f:rows=json.load(f)
  rates={r['quote'].upper():{'rate':float(r['rate']),'date':str(r['date'])} for r in rows if r.get('quote','').upper() in ('KRW','CNY') and float(r.get('rate',0))>0}
  if rates:
   with LOCK:
    MEM.update({'updated':time.time(),'rates':rates});CACHE_PATH.parent.mkdir(parents=True,exist_ok=True)
    CACHE_PATH.write_text(json.dumps(MEM))
 finally:
  with LOCK:IN_PROGRESS=False

def get():
 global IN_PROGRESS
 with LOCK:
  if time.time()-MEM.get('updated',0)>21600 and not IN_PROGRESS:
   IN_PROGRESS=True;POOL.submit(_update)
  return {'base':'USD','rates':{'USD':{'rate':1.0,'date':None},**MEM.get('rates',{})},'updating':IN_PROGRESS,'source':'Frankfurter / published currency observations','updated_at':MEM.get('updated')}
