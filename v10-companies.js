/* GMI v10: company fundamentals replace stock index/TradingView panels entirely. */
'use strict';
const V10WORDS={
 ko:{heading:'시가총액 상위 3개 상장기업',sub:'해당 국가에 본사를 둔 상장기업을 시가총액 기준으로 비교합니다.',rank:'시총 순위',sector:'섹터',cap:'시가총액',growth:'5년 매출 CAGR',roe:'ROE · 최근 12개월',period:'매출 기준 기간',refresh:'정보 새로고침',loading:'기업 재무정보를 가져오는 중…',slow:'재무제표 연결에 시간이 걸리고 있습니다.',configure:'기업 데이터를 연결하려면 Railway Variables에 FMP_API_KEY를 설정하세요.',missing:'해당 국가의 확인 가능한 상장기업 데이터가 없습니다.',unavailable:'지금은 기업 데이터를 가져올 수 없습니다.',incomplete:'제공처 검색 범위가 제한되어 시가총액 상위 3개사를 확정할 수 없습니다.',nofield:'미제공',note:'시가총액은 데이터 제공처의 원본 금액입니다. 통화·상장 주식 종류 및 업데이트 시점을 확인하세요. 5년 성장률은 매출액 CAGR이며 주가 수익률이 아닙니다. ROE는 TTM 기준입니다.',scope:'기업 본사 소재국 기준 · ETF·펀드 제외',updated:'갱신',source:'데이터: Financial Modeling Prep',finance:'금융',technology:'정보기술',communication:'통신·미디어',consumer:'소비재',industrial:'산업재',energy:'에너지',materials:'소재',health:'헬스케어',utility:'유틸리티',property:'부동산'},
 en:{heading:'Top 3 public companies by market cap',sub:'Listed companies headquartered in this country, ranked by market cap.',rank:'Market cap rank',sector:'Sector',cap:'Market cap',growth:'5-year revenue CAGR',roe:'ROE · trailing 12 months',period:'Revenue period',refresh:'Refresh',loading:'Loading company financial data…',slow:'Waiting for the financial statements provider.',configure:'Set FMP_API_KEY in Railway Variables to retrieve company fundamentals.',missing:'No verifiable listed-company data available for this country.',unavailable:'Company data is currently unavailable.',incomplete:'The provider search is incomplete, so a verified top-three ranking is unavailable.',nofield:'Not available',note:'Market cap is the provider-reported raw amount; verify currency, share class and update date. Five-year growth is revenue CAGR, not share-price performance. ROE is TTM.',scope:'Headquarters country · excludes ETFs and funds',updated:'Updated',source:'Data: Financial Modeling Prep',finance:'Financials',technology:'Technology',communication:'Communication',consumer:'Consumer',industrial:'Industrials',energy:'Energy',materials:'Materials',health:'Health Care',utility:'Utilities',property:'Real Estate'},
 zh:{heading:'市值前三大上市公司',sub:'按市值比较总部位于该国家的上市公司。',rank:'市值排名',sector:'行业',cap:'市值',growth:'近五年营收复合增长率',roe:'净资产收益率 · 过去12个月',period:'营收统计期间',refresh:'刷新数据',loading:'正在获取公司财务数据…',slow:'正在等待财务数据服务响应。',configure:'请在 Railway Variables 中设置 FMP_API_KEY 以获取公司基本面数据。',missing:'暂无可核实的该国上市公司数据。',unavailable:'目前无法获取公司数据。',incomplete:'数据提供商的搜索范围不足，无法确认市值前三名。',nofield:'未提供',note:'市值为数据提供商报告的原始金额；请核对币种、股份类别及更新日期。五年增长率指营收复合年增长率，而非股价涨幅。ROE 为过去12个月数据。',scope:'公司总部所在国家 · 不包括 ETF 和基金',updated:'更新',source:'数据：Financial Modeling Prep',finance:'金融',technology:'信息技术',communication:'通信与媒体',consumer:'消费',industrial:'工业',energy:'能源',materials:'原材料',health:'医疗保健',utility:'公用事业',property:'房地产'}
};
const V10=k=>V10WORDS[gmiLang]?.[k]||V10WORDS.ko[k]||k;
const V10CACHE=new Map(),V10RETRIES=new Map();
const v10Sector=str=>{const a=String(str||'').toLowerCase();let k='';
 if(/financ|bank|insurance/.test(a))k='finance';else if(/tech|software|semiconductor/.test(a))k='technology';
 else if(/communicat|telecom|media/.test(a))k='communication';else if(/consumer|retail|staple/.test(a))k='consumer';
 else if(/industr|manufact|transport/.test(a))k='industrial';else if(/energy|oil|gas/.test(a))k='energy';
 else if(/material|chemical|mining/.test(a))k='materials';else if(/health|pharma|biotech/.test(a))k='health';
 else if(/utilit/.test(a))k='utility';else if(/real estate|property/.test(a))k='property';
 return k?V10(k):str||V10('nofield')};
function v10Cap(n,ccy){if(n==null||!Number.isFinite(+n))return V10('nofield');
 const value=Number(n),abs=Math.abs(value),suffix=abs>=1e12?'T':abs>=1e9?'B':abs>=1e6?'M':'';
 const base=suffix==='T'?1e12:suffix==='B'?1e9:suffix==='M'?1e6:1;
 const t=(value/base).toLocaleString(({ko:'ko-KR',en:'en-US',zh:'zh-CN'})[gmiLang],{maximumFractionDigits:2});
 return t+suffix+(ccy?' '+esc(ccy):'');}
function v10Pct(value){if(value===null||value===undefined||!Number.isFinite(+value))return V10('nofield');let v=Number(value);return (v>0?'+':'')+v.toFixed(2)+'%'}
marketTab=function(c){return `<section class="v10-companies" data-company-country="${esc(c.iso)}"><div class="v10-title"><div class="v10-kicker">EQUITY FUNDAMENTALS</div><h3>${esc(c.flag)} ${esc(V10('heading'))}</h3><p>${esc(V10('sub'))}</p></div><div id="v10-company-list" class="v10-company-list" aria-live="polite"><div class="v10-state"><span class="loading-spinner"></span> ${esc(V10('loading'))}</div></div><div class="v10-company-foot">${esc(V10('scope'))} · ${esc(V10('note'))}</div></section>`};
function v10Active(iso){return state?.selected?.kind==='country'&&state.selected.c?.iso===iso&&state.tab==='market'}
function v10Render(iso,data){if(!v10Active(iso))return;
 const root=document.querySelector('#v10-company-list');if(!root)return;
 if(data.status==='ok'&&data.companies?.length){
  root.innerHTML=data.companies.map(row=>`<article class="v10-company"><div class="v10-company-top"><span class="v10-number">0${row.rank}</span><div class="v10-company-name"><strong>${esc(row.name)}</strong><small>${esc(row.symbol)} · ${esc(v10Sector(row.sector))}</small></div><span class="v10-cap">${v10Cap(row.market_cap,row.market_cap_currency)}</span></div><div class="v10-stats"><div><span>${V10('growth')}</span><strong>${v10Pct(row.revenue_cagr_5y)}</strong><small>${row.growth_from&&row.growth_to?`${row.growth_from}–${row.growth_to}`:V10('nofield')}</small></div><div><span>${V10('roe')}</span><strong>${v10Pct(row.roe_ttm)}</strong><small>TTM</small></div></div></article>`).join('')+`<div class="v10-meta">${esc(V10('source'))} · ${esc(V10('updated'))} ${esc((data.updated_at||'').replace('T',' ').slice(0,16))}${data.stale?' · CACHE':''}</div>`;
 } else {
  const key=data.status==='configuration_required'?'configure':data.status==='incomplete_universe'?'incomplete':data.status==='no_coverage'?'missing':data.status==='loading'?'loading':data.loading?'loading':'unavailable';
  root.innerHTML=`<div class="v10-state">${key==='loading'?'<span class="loading-spinner"></span> ':''}${esc(V10(key))}${key!=='loading'&&key!=='configure'?`<button class="v10-retry" data-v10-refresh>${esc(V10('refresh'))} ↻</button>`:''}</div>`;
 }
}
async function v10Fetch(c,forced=false){if(!v10Active(c.iso))return;
 if(!forced&&V10CACHE.has(c.iso))v10Render(c.iso,V10CACHE.get(c.iso));
 try{const resp=await fetch(`/api/top-companies?country=${encodeURIComponent(c.iso)}`,{signal:AbortSignal.timeout(10000)});
  if(!resp.ok)throw Error(resp.status);const payload=await resp.json();
  if(payload.status==='ok')V10CACHE.set(c.iso,payload);
  v10Render(c.iso,payload);
  if((payload.loading||payload.status==='loading')&&v10Active(c.iso)){
   const times=V10RETRIES.get(c.iso)||0;
   if(times<10){V10RETRIES.set(c.iso,times+1);setTimeout(()=>{if(v10Active(c.iso))v10Fetch(c)},3000)}
  }else V10RETRIES.delete(c.iso);
 }catch{if(!V10CACHE.has(c.iso))v10Render(c.iso,{status:'provider_unavailable'});}
}
mountTradingView=function(c){if(c)void v10Fetch(c)};
const v10OldLanguage=setGMILang;
setGMILang=function(lang){v10OldLanguage(lang);if(state.selected?.kind==='country'&&state.tab==='market')renderDrawer()};
document.addEventListener('click',e=>{if(!e.target.closest('[data-v10-refresh]'))return;
 const c=state.selected?.c;if(!c)return;V10RETRIES.delete(c.iso);V10CACHE.delete(c.iso);v10Render(c.iso,{status:'loading'});void v10Fetch(c,true);
});
