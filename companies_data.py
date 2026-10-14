"""Country-headquartered public company profiles backed by FMP.

The global screener is NOT delivered sorted; sort the full accessible country result
locally. Never infer an exhaustive top-three if the API pages are truncated.
Five-year growth = fiscal-year revenue CAGR using two FY observations 5 years apart.
ROE = provider-reported returnOnEquityTTM (fraction of equity).
No ticker or financial value is seeded or fabricated.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import logging
from pathlib import Path
import json, math, os, threading, time, re
import research_api

ROOT=Path(__file__).resolve().parent
COUNTRIES={x['iso']:x for x in json.loads((ROOT/'country-catalog.json').read_text(encoding='utf8'))}
SOURCES={'company_screener':'https://site.financialmodelingprep.com/developer/docs/stable/search-company-screener',
         'income_statements':'https://site.financialmodelingprep.com/developer/docs/stable/income-statement',
         'return_on_equity':'https://site.financialmodelingprep.com/developer/docs/stable/key-metrics-ttm'}
POOL=ThreadPoolExecutor(max_workers=3,thread_name_prefix='gmi-companies')
JOBS=set()
LOCK=threading.RLock()
TTL=12*3600
MAX_PAGES=8
PAGE_SIZE=1000
LAST_FORCE={}
FORCE_COOLDOWN=120  # Prevent anonymous clients from exhausting paid API quotas.
LOGGER=logging.getLogger("gmi.companies")

class ProviderError(Exception):
    def __init__(self, kind, http_status=None):
        super().__init__(kind)
        self.kind=kind
        self.http_status=http_status



def numeric(x):
    try:
        if x is None or isinstance(x,bool):return None
        n=float(x)
        return n if math.isfinite(n) else None
    except (ValueError,TypeError):return None


def request(endpoint,key,params):
    url='https://financialmodelingprep.com/stable/'+endpoint+'?'+urlencode({**params,'apikey':key})
    req=Request(url,headers={'User-Agent':'GMI-GlobalMacroIntelligence/1.0','Accept':'application/json'})
    try:
        with urlopen(req,timeout=14) as r:
            raw=r.read(6_000_000)
    except HTTPError as exc:
        category=('provider_auth_rejected' if exc.code == 401 else
                  'provider_access_denied' if exc.code in (402,403) else
                  'provider_rate_limited' if exc.code == 429 else
                  'provider_bad_request' if exc.code == 400 else
                  'provider_unavailable')
        # Never log response bodies or URLs: they can contain the API key.
        raise ProviderError(category, exc.code) from None
    except (URLError,TimeoutError,OSError):
        raise ProviderError('provider_connection_failed') from None
    try:data=json.loads(raw.decode('utf-8','replace'))
    except (ValueError,UnicodeError):raise ProviderError('provider_invalid_response') from None
    if isinstance(data,dict) and any(k in data for k in ('Error Message','error','Error Message:','message')):
        raise ProviderError('provider_rejected_request')
    if not isinstance(data,list):
        raise ProviderError('provider_invalid_response')
    return data


def revenue_growth(annual):
    years={}
    for row in annual:
        if not isinstance(row,dict):continue
        if row.get('period') not in (None,'FY','annual'):continue
        yr=str(row.get('fiscalYear') or str(row.get('date') or '')[:4])
        rev=numeric(row.get('revenue'))
        if re.fullmatch(r'20\d{2}',yr) and rev is not None and rev>0:
            years[int(yr)]=rev
    if not years:return {'cagr':None,'from_year':None,'to_year':None,'annual_revenue':[]}
    end=max(years)
    start=end-5
    cagr=((years[end]/years[start])**(1/5)-1)*100 if start in years else None
    return {'cagr':round(cagr,3) if cagr is not None else None,
            'from_year':start if cagr is not None else None,
            'to_year':end,'annual_revenue':[{'year':year,'revenue':years[year]} for year in sorted(years) if year>=end-5]}


def financials(row,key):
    sym=str(row.get('symbol','')).strip()
    if not re.fullmatch(r'[A-Za-z0-9._^:-]{1,35}',sym):return {'error':'invalid_symbol'}
    out={}
    try:
        income=request('income-statement',key,{'symbol':sym,'period':'annual','limit':10})
        out.update(revenue_growth(income))
    except Exception:
        out.update({'cagr':None,'from_year':None,'to_year':None,'annual_revenue':[]})
    try:
        ratios=request('key-metrics-ttm',key,{'symbol':sym})
        roe=numeric(ratios[0].get('returnOnEquityTTM')) if ratios and isinstance(ratios[0],dict) else None
        out['roe_ttm']=round(100*roe,3) if roe is not None else None
    except Exception:out['roe_ttm']=None
    return out


def fetch_country(iso,key):
    c=COUNTRIES[iso]
    all_rows=[]
    complete=False
    seen=set()
    for page in range(MAX_PAGES):
        result=request('company-screener',key,{'country':c['iso2'],'isEtf':'false','isFund':'false',
            'isActivelyTrading':'true','includeAllShareClasses':'false','limit':PAGE_SIZE,'page':page})
        for row in result:
            if not isinstance(row,dict) or row.get('isEtf') is True or row.get('isFund') is True:continue
            cap=numeric(row.get('marketCap'))
            sym=str(row.get('symbol') or '')
            if cap is None or cap<=0 or not sym or sym in seen:continue
            code=str(row.get('country') or '').upper()
            if code and code!=c['iso2'].upper():continue
            seen.add(sym);all_rows.append(row)
        if len(result)<PAGE_SIZE:
            complete=True
            break
    if not complete:
        return {'country':iso,'status':'incomplete_universe','companies':[],
                'message':'Provider coverage/page limit prevents a verified top-three ranking.',
                'updated_at':datetime.now(timezone.utc).isoformat(),'provider':'Financial Modeling Prep'}
    all_rows.sort(key=lambda r:numeric(r.get('marketCap')) or 0,reverse=True)
    top=all_rows[:3]
    results=[None]*len(top)
    with ThreadPoolExecutor(max_workers=3) as local:
        jobs={local.submit(financials,row,key):i for i,row in enumerate(top)}
        for fut in as_completed(jobs):
            i=jobs[fut]
            try:results[i]=fut.result()
            except Exception:results[i]={}
    companies=[]
    for i,row in enumerate(top):
        extra=results[i] or {}
        companies.append({'rank':i+1,'symbol':str(row.get('symbol') or ''),
                          'name':str(row.get('companyName') or row.get('symbol') or ''),
                          'sector':str(row.get('sector') or ''),
                          'industry':str(row.get('industry') or ''),
                          'market_cap':numeric(row.get('marketCap')),
                          'market_cap_currency':str(row.get('currency') or ''),
                          'market_cap_basis':'FMP screener reported marketCap',
                          'revenue_cagr_5y':extra.get('cagr'),
                          'growth_from':extra.get('from_year'),
                          'growth_to':extra.get('to_year'),
                          'revenue_annual':extra.get('annual_revenue',[]),
                          'roe_ttm':extra.get('roe_ttm')})
    return {'country':iso,'status':'ok' if companies else 'no_coverage',
            'companies':companies,'covered_symbols':len(all_rows),
            'ranking_basis':'Country of company headquarters; active listed equities, excluding ETFs/funds; ranking by screener market cap; not country exchange listing.',
            'updated_at':datetime.now(timezone.utc).isoformat(),
            'provider':'Financial Modeling Prep', 'sources':SOURCES}


def refresh(iso,key):
    try:
        value=fetch_country(iso,key)
        # Preserve historical successful data if a provider returns a temporary error.
        research_api._put('country_companies:'+iso,value)
    except Exception as exc:
        kind=exc.kind if isinstance(exc,ProviderError) else 'provider_unavailable'
        status=exc.http_status if isinstance(exc,ProviderError) else None
        LOGGER.warning('FMP company request for ISO %s failed: %s (HTTP %s)',iso,kind,status or 'n/a')
        old=research_api._get('country_companies:'+iso)
        if not old or old[1].get('status')!='ok':
            research_api._put('country_companies:'+iso,{'country':iso,'status':kind,'companies':[],
                'upstream_http_status':status,'updated_at':datetime.now(timezone.utc).isoformat(),
                'provider':'Financial Modeling Prep'})
    finally:
        with LOCK:JOBS.discard(iso)


def get(iso,force=False):
    if iso not in COUNTRIES:return {'status':'invalid_country','companies':[]}
    key=os.getenv('FMP_API_KEY','').strip()
    cached=research_api._get('country_companies:'+iso)
    if not key:
        return {'country':iso,'status':'configuration_required','companies':[],
                'message':'Set FMP_API_KEY on the server to retrieve licensed company fundamentals.',
                'sources':SOURCES}
    now=time.time()
    should_refresh=not cached or now-cached[0]>(TTL if cached[1].get('status')=='ok' else 90)
    with LOCK:
        if force and now-LAST_FORCE.get(iso,0)>=FORCE_COOLDOWN:
            LAST_FORCE[iso]=now
            should_refresh=True
        if should_refresh and iso not in JOBS:
            JOBS.add(iso)
            POOL.submit(refresh,iso,key)
        loading=iso in JOBS
    if cached:
        result={**cached[1], 'loading':loading, 'stale':(now-cached[0]>TTL)}
        if loading and result.get('status')!='ok':
            result['status']='loading'
        return result
    return {'country':iso,'status':'loading','loading':True,'companies':[], 'sources':SOURCES}
