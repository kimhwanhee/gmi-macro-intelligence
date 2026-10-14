"""Public-data company snapshot service (no FMP key required).

This intentionally does NOT claim a current or exhaustive country market-cap ranking:
Wikidata P2226 statements are volunteered, incomplete and may be historical.
Currency units are NEVER silently compared or converted.
Revenue CAGR and simplified FY ROE are shown only when compatible dated
Wikidata P2139/P2295/P2137 statements are present.

Backwards compatible: GET /api/top-companies?country=ISO3[&refresh=1].
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from pathlib import Path
import json, math, os, re, time, logging, threading
import research_api

ROOT=Path(__file__).resolve().parent
COUNTRIES={x['iso']:x for x in json.loads((ROOT/'country-catalog.json').read_text(encoding='utf8'))}
LOGGER=logging.getLogger('gmi.public_companies')
LOCK=threading.RLock()
POOL=ThreadPoolExecutor(max_workers=2,thread_name_prefix='public-equity')
JOBS=set();LAST_FORCE={}
SUCCESS_TTL=24*3600
ERROR_TTL=20*60
FORCE_COOLDOWN=120
SOURCES={'market_cap':'https://www.wikidata.org/wiki/Property:P2226',
 'revenue':'https://www.wikidata.org/wiki/Property:P2139',
 'net_profit':'https://www.wikidata.org/wiki/Property:P2295',
 'equity':'https://www.wikidata.org/wiki/Property:P2137',
 'access':'https://www.wikidata.org/wiki/Wikidata:Data_access'}

# Wikidata currency entities. Only identical currency entities may be ranked
# against one another. No claim that all securities/countries are covered.
CURRENCIES={'Q4917':'USD','Q4916':'EUR','Q8146':'JPY','Q39099':'CNY',
 'Q1104069':'CAD','Q259502':'AUD','Q25344':'CHF','Q41044':'RUB',
 'Q25224':'CNY','Q109000':'KRW','Q178023':'GBP','Q25235':'SGD',
 'Q200377':'HKD'}

class PublicDataError(Exception):
    def __init__(self, kind):self.kind=kind;super().__init__(kind)

def number(v):
    try:
        if v is None or isinstance(v,bool):return None
        x=float(v)
        return x if math.isfinite(x) else None
    except (ValueError,TypeError):return None

def year_of(v):
    s=str(v or '')
    m=re.match(r'^(20\d\d)',s)
    return int(m.group(1)) if m else None

def entity(uri):
    value=str(uri or '').rsplit('/',1)[-1]
    return value if re.fullmatch(r'Q\d+',value) else ''

def cell(row,key):return row.get(key,{}).get('value','')

def wikidata(query):
    # No secret is sent and no external source may supply its own URL.
    url='https://query.wikidata.org/sparql?'+urlencode({'query':query,'format':'json'})
    # Wikimedia requests an identifiable User-Agent, with project URL/contact.
    ua='GMI-OpenCountryResearch/11 (https://humorous-vibrancy-production-727e.up.railway.app; public-data-research)'
    req=Request(url,headers={'User-Agent':ua,'Accept':'application/sparql-results+json'})
    try:
        with urlopen(req,timeout=21) as r:
            payload=r.read(3_000_000)
    except HTTPError as ex:
        raise PublicDataError('source_rate_limited' if ex.code==429 else 'source_unavailable') from None
    except (TimeoutError,URLError,OSError):raise PublicDataError('source_unavailable') from None
    try:return json.loads(payload).get('results',{}).get('bindings',[])
    except (ValueError,TypeError,AttributeError):raise PublicDataError('invalid_source_data') from None

def country_query(iso):
    # Filtered by ISO code (P298) and Wikidata country (P17).
    # P17 is the item's stated country, NOT a guaranteed legal HQ or exchange.
    assert iso in COUNTRIES
    return '''PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX wikibase: <http://wikiba.se/ontology#>
SELECT ?company ?companyLabel ?sectorLabel ?symbol ?cap ?unit ?asof WHERE {
 ?nation wdt:P298 "'''+iso+'''" .
 ?company wdt:P17 ?nation; p:P2226 ?record .
 ?record psv:P2226 ?amountNode .
 ?amountNode wikibase:quantityAmount ?cap; wikibase:quantityUnit ?unit .
 OPTIONAL { ?record pq:P585 ?asof . }
 OPTIONAL { ?company wdt:P452 ?sector . }
 OPTIONAL { ?company wdt:P249 ?symbol . }
 SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en,zh" . }
} ORDER BY DESC(?asof) LIMIT 350'''

def parse_capitalization(rows, current_year=None):
    """Safely deduplicate dated observations; never compare mixed units."""
    current_year=current_year or datetime.now(timezone.utc).year
    per_company={}
    for row in rows:
        q=entity(cell(row,'company'));value=number(cell(row,'cap'))
        yr=year_of(cell(row,'asof'));unit=entity(cell(row,'unit'))
        if not q or value is None or value<=0 or not yr or yr>current_year+1:
            continue
        if yr<current_year-10:continue
        if not unit:continue
        record={'qid':q,'name':cell(row,'companyLabel') or q,
                'sector':cell(row,'sectorLabel') if not cell(row,'sectorLabel').startswith('http') else '',
                'symbol':cell(row,'symbol'),'market_cap':value,
                'market_cap_currency':CURRENCIES.get(unit,unit),
                '_unit':unit,'market_cap_asof':str(cell(row,'asof'))[:10]}
        prior=per_company.get(q)
        if not prior or (record['market_cap_asof'],bool(record['symbol']))>(prior['market_cap_asof'],bool(prior['symbol'])):
            per_company[q]=record
    # Even the most recent Wikidata observation is not market-wide completeness.
    records=list(per_company.values())
    groups={}
    for record in records:groups.setdefault(record['_unit'],[]).append(record)
    if not groups:return [],0,False
    # Do not compare currencies across groups. Select the group with the most
    # RECENT dated observations, then by number of entries.
    def score(item):
        unit,group=item
        fresh=sum(year_of(v['market_cap_asof'])>=current_year-2 for v in group)
        return (fresh,len(group))
    unit,group=max(groups.items(),key=score)
    group.sort(key=lambda r:r['market_cap'],reverse=True)
    for i,r in enumerate(group[:3]):
        r['rank']=i+1
        r['data_url']='https://www.wikidata.org/wiki/'+r['qid']
    return group[:3],len(records),len(groups)>1

def financials_query(qids):
    ids=' '.join('wd:'+v for v in qids if re.fullmatch(r'Q\d+',v))
    if not ids:return ''
    return '''PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX psv: <http://www.wikidata.org/prop/statement/value/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>
PREFIX wikibase: <http://wikiba.se/ontology#>
SELECT ?company ?field ?value ?unit ?at WHERE {
 VALUES ?company {'''+ids+'''}
 { ?company p:P2139 ?record . ?record psv:P2139 ?node . BIND("revenue" AS ?field) }
 UNION { ?company p:P2295 ?record . ?record psv:P2295 ?node . BIND("income" AS ?field) }
 UNION { ?company p:P2137 ?record . ?record psv:P2137 ?node . BIND("equity" AS ?field) }
 ?node wikibase:quantityAmount ?value; wikibase:quantityUnit ?unit .
 OPTIONAL { ?record pq:P585 ?at . }
} LIMIT 500'''

def enrich(rows,financial_rows):
    """Derive annual CAGR and simple ROE only for compatible dated amounts."""
    data={}
    for item in financial_rows:
        q=entity(cell(item,'company'));field=cell(item,'field')
        val=number(cell(item,'value'));yr=year_of(cell(item,'at'))
        unit=entity(cell(item,'unit'))
        if not q or field not in ('revenue','income','equity') or not yr or val is None or not unit:continue
        data.setdefault(q,{}).setdefault(field,{})[(yr,unit)]=val
    for row in rows:
        fields=data.get(row['qid'],{})
        rev=fields.get('revenue',{});years=sorted({y for y,c in rev if rev[(y,c)]>0},reverse=True)
        cagr=None;start=None;end=None
        for y in years:
            for yr,unit in list(rev):
                if yr==y and (y-5,unit) in rev and rev[(y-5,unit)]>0:
                    cagr=(rev[(y,unit)]/rev[(y-5,unit)])**(1/5)*100-100
                    start=y-5;end=y;break
            if cagr is not None:break
        row['revenue_cagr_5y']=round(cagr,2) if cagr is not None else None
        row['growth_from']=start;row['growth_to']=end
        row['revenue_annual']=[]
        income=fields.get('income',{});equity=fields.get('equity',{})
        roe=None;roe_year=None
        for y,u in sorted(income,reverse=True):
            if (y,u) in equity and equity[(y,u)]>0:
                # Period-end rather than average equity: mark it clearly.
                roe=income[(y,u)]/equity[(y,u)]*100;roe_year=y;break
        row['roe_ttm']=round(roe,2) if roe is not None else None
        row['roe_basis']='FY end equity' if roe is not None else None
        row['roe_year']=roe_year
        row.pop('_unit',None)
    return rows

def retrieve_country(iso):
    records=wikidata(country_query(iso))
    results,total,multiple=parse_capitalization(records)
    if results:
        try:results=enrich(results,wikidata(financials_query([x['qid'] for x in results])))
        except PublicDataError:
            for r in results:
                r.update({'revenue_cagr_5y':None,'roe_ttm':None,'growth_from':None,'growth_to':None,'roe_basis':None,'revenue_annual':[]})
        else:pass
    freshness=datetime.now(timezone.utc).year-2
    outdated=any((year_of(x['market_cap_asof']) or 0)<freshness for x in results)
    return {'country':iso,'status':('partial_coverage' if results else 'no_coverage'),
            'companies':results,'covered_companies':total,'mixed_currencies_omitted':multiple,
            'ranking_verified':False,'dated_or_historical':outdated,
            'ranking_basis':'Wikidata public historical market-cap entries for companies by headquarters country. Not an exhaustive or current top-three ranking.',
            'updated_at':datetime.now(timezone.utc).isoformat(),
            'provider':'Wikidata (public, CC0)', 'sources':SOURCES}

def refresh(iso):
    try:
        data=retrieve_country(iso)
        research_api._put('public_country_companies:'+iso,data)
    except Exception as ex:
        code=ex.kind if isinstance(ex,PublicDataError) else 'source_unavailable'
        LOGGER.warning('Public company lookup for %s failed: %s',iso,code)
        previous=research_api._get('public_country_companies:'+iso)
        if not previous or not previous[1].get('companies'):
            research_api._put('public_country_companies:'+iso,
                {'country':iso,'status':code,'companies':[],'provider':'Wikidata (public, CC0)'})
    finally:
        with LOCK:JOBS.discard(iso)

def get(iso,force=False):
    if iso not in COUNTRIES:return {'country':iso,'status':'invalid_country','companies':[]}
    now=time.time();key='public_country_companies:'+iso
    cached=research_api._get(key)
    should=not cached or now-cached[0]>(SUCCESS_TTL if cached[1].get('companies') else ERROR_TTL)
    with LOCK:
        if force and now-LAST_FORCE.get(iso,0)>=FORCE_COOLDOWN:
            LAST_FORCE[iso]=now;should=True
        if should and iso not in JOBS:
            JOBS.add(iso);POOL.submit(refresh,iso)
        pending=iso in JOBS
    if cached:
        result={**cached[1],'loading':pending,'stale':now-cached[0]>SUCCESS_TTL}
        return result
    return {'country':iso,'status':'loading','companies':[],'loading':True,
            'provider':'Wikidata (public, CC0)'}
