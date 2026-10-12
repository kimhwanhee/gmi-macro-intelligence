"""GMI zero-dependency local HTTP server + transparent external-data proxies.
Usage: python server.py [port]    (default: 8765)
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, urlencode, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json, os, sys, time, re, threading
import auto_intel

ROOT=Path(__file__).resolve().parent
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

    def do_POST(self):
        u=urlparse(self.path)
        if u.path=='/api/intel/refresh':
            if auto_intel.RUNNING:return self.send_json({'started':False,'message':'이미 자동 수집 중입니다.'},202)
            threading.Thread(target=auto_intel.collect_once,daemon=True).start()
            return self.send_json({'started':True,'message':'뉴스 수집을 시작했습니다.'},202)
        return self.send_json({'error':'Unsupported action'},404)

    def do_GET(self):
        u=urlparse(self.path)
        if u.path=='/api/intel/status':
            return self.send_json(auto_intel.status())
        if u.path=='/api/intel/events':
            params=parse_qs(u.query)
            c=params.get('country',[''])[0].upper()
            if c and c not in CATALOG:return self.send_json({'error':'Invalid country'},400)
            try: limit=int(params.get('limit',['350'])[0])
            except (ValueError,TypeError): limit=350
            return self.send_json({'events':auto_intel.list_events(limit,c or None),'status':auto_intel.status()})
        if u.path=='/api/health':
            return self.send_json({'status':'ok','data_sources':{'macro':'World Bank','news':'GDELT DOC 2.0'},'note':'External APIs require Internet access.'})
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
        return super().do_GET()

if __name__=='__main__':
    port=int(sys.argv[1]) if len(sys.argv)>1 else 8765
    auto_intel.start()
    print(f'GMI server running at http://localhost:{port}')
    print('Auto intelligence: collecting every %d minutes. AI=%s' % (auto_intel.INTERVAL//60,auto_intel.AI_ON))
    print('Ctrl+C to stop. Internet needed for news collection; OPENAI_API_KEY optional for AI classification.')
    try: ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
    except KeyboardInterrupt: print('\nServer stopped.')
