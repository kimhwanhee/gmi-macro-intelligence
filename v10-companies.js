/* GMI v11: no FMP subscription and no TradingView; public Wikidata records.
   Historical/sampled corporate data must NEVER be represented as current market ranks. */
'use strict';
const V11WORDS={
 ko:{heading:'국가별 주요 상장기업 · 공개 데이터',sub:'공개된 시가총액 기록이 있는 기업을 살펴봅니다. 현재 국가 시총 순위로 확정된 목록은 아닙니다.',cap:'공개 시총 기록',sector:'산업·섹터',growth:'5년 매출 CAGR',roe:'연간 ROE 추정',noData:'확인할 수 있는 시총 자료가 없습니다. 다른 국가 또는 공식 거래소 자료를 참고하세요.',loading:'공개 기업 자료를 조회하는 중…',unavailable:'공개 데이터 서버 응답이 지연되고 있습니다.',rate:'공개 데이터 서비스의 요청 한도에 도달했습니다.',more:'다시 조회',scope:'Wikidata에 등록된 국가 기준 · 공개 시총 기록 보유 기업만 대상 · 상장 여부 및 전체 순위 별도 검증 필요',source:'출처: Wikidata (CC0)',asof:'시총 기록일',note:'Wikidata는 실시간 시총 순위를 제공하지 않습니다. 업로드된 과거 시총 값은 현재 가치와 다를 수 있습니다. 성장률은 연간 매출 CAGR이고 ROE는 연말 자기자본 기준 근사치이며, 자료 부족 시 미제공입니다.',limited:'서로 다른 통화 기록은 환산 근거가 없어 비교에서 제외했습니다.',old:'과거 시점의 시총 기록 포함',loaded:'자료 기준',missing:'미제공',finance:'금융',technology:'정보기술',communication:'통신·미디어',consumer:'소비재',industrial:'산업재',energy:'에너지',materials:'소재',health:'헬스케어',utility:'유틸리티',property:'부동산',record:'기록',open:'자료 보기'},
 en:{heading:'Listed companies · public-source data',sub:'Explore companies with published market-cap observations; this is NOT a verified current nationwide top-three ranking.',cap:'Reported market cap',sector:'Sector',growth:'5-year revenue CAGR',roe:'Estimated annual ROE',noData:'No comparable dated market-cap records were found. Consult the relevant exchange for complete market coverage.',loading:'Retrieving public company records…',unavailable:'The public data service is currently unavailable.',rate:'The public source rate limit was reached.',more:'Try again',scope:'Wikidata country field · companies with reported market caps · listing status and overall rankings not verified',source:'Source: Wikidata (CC0)',asof:'Market-cap observation',note:'Wikidata is not a live market-cap ranking service. Historical observations may be outdated. Growth is annual revenue CAGR; ROE is an estimate using period-end equity. Missing observations are not estimated.',limited:'Records denominated in other currencies were excluded rather than compared without an exchange rate.',old:'Includes historical market-cap records',loaded:'Reference',missing:'Not provided',finance:'Financials',technology:'Technology',communication:'Communication',consumer:'Consumer',industrial:'Industrials',energy:'Energy',materials:'Materials',health:'Health care',utility:'Utilities',property:'Real estate',record:'Record',open:'View source'},
 zh:{heading:'上市公司 · 公开数据',sub:'展示存在公开市值记录的公司，不代表已核实的全国实时市值前三名。',cap:'公开市值记录',sector:'行业',growth:'五年营收复合增长率',roe:'年度 ROE 估算',noData:'没有找到可比较的市值记录。可查询相关证券交易所的官方数据。',loading:'正在检索公开企业资料…',unavailable:'公共数据服务暂时不可用。',rate:'公共数据接口达到请求限制。',more:'重试',scope:'按 Wikidata 国家字段 · 仅有市值记录的公司 · 上市身份及完整排名未核实',source:'来源：Wikidata（CC0）',asof:'市值记录日期',note:'Wikidata 并非实时市值排名数据源。历史市值可能已过时。营收增长为五年 CAGR；ROE 按年末净资产估算。缺失值不会编造。',limited:'因缺少统一汇率，未比较其他币种的市值记录。',old:'包含历史市值记录',loaded:'数据日期',missing:'未提供',finance:'金融',technology:'信息技术',communication:'通信与媒体',consumer:'消费品',industrial:'工业',energy:'能源',materials:'材料',health:'医疗保健',utility:'公用事业',property:'房地产',record:'记录',open:'查看来源'}
};
const V11=k=>V11WORDS[gmiLang]?.[k]||V11WORDS.ko[k]||k;
const V11CACHE=new Map(), V11TRIES=new Map();
const v11Sector=(value)=>{let text=String(value||'').toLowerCase(),key='';
 if(/financ|bank|insurance/.test(text))key='finance';else if(/tech|software|semiconductor/.test(text))key='technology';
 else if(/telecom|communicat|media/.test(text))key='communication';else if(/consumer|retail/.test(text))key='consumer';
 else if(/manufact|industr|transport/.test(text))key='industrial';else if(/energy|oil|gas/.test(text))key='energy';
 else if(/material|chemical|mining/.test(text))key='materials';else if(/health|pharma|biotech/.test(text))key='health';
 else if(/utilit/.test(text))key='utility';else if(/real estate|property/.test(text))key='property';
 return key?V11(key):value||V11('missing');};
const v11Money=(n,ccy)=>{if(n===null||n===undefined||!Number.isFinite(+n))return V11('missing');const num=+n,abs=Math.abs(num);
 let d=1,s='';if(abs>=1e12){d=1e12;s='T'}else if(abs>=1e9){d=1e9;s='B'}else if(abs>=1e6){d=1e6;s='M'};
 return (num/d).toLocaleString(({ko:'ko-KR',en:'en-US',zh:'zh-CN'})[gmiLang],{maximumFractionDigits:2})+s+' '+(ccy||'');};
const v11Pct=v=>v===null||v===undefined||!Number.isFinite(+v)?V11('missing'):(v>0?'+':'')+Number(v).toFixed(2)+'%';
marketTab=function(c){return `<section class="v10-companies"><div class="v10-title"><div class="v10-kicker">EQUITY · PUBLIC DATA</div><h3>${esc(c.flag)} ${esc(V11('heading'))}</h3><p>${esc(V11('sub'))}</p></div><div id="v10-company-list" class="v10-company-list" aria-live="polite"><div class="v10-state"><span class="loading-spinner"></span> ${V11('loading')}</div></div><div class="v10-company-foot">${esc(V11('scope'))}<p>${esc(V11('note'))}</p></div></section>`};
function v11Active(iso){return state?.selected?.kind==='country'&&state.selected.c?.iso===iso&&state.tab==='market'}
function v11Render(iso,data){if(!v11Active(iso))return;const root=document.querySelector('#v10-company-list');if(!root)return;
 const companies=data?.companies||[];
 if(companies.length){root.innerHTML=companies.slice(0,3).map((p,i)=>{
 const url=/^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/.test(p.data_url||'')?p.data_url:'';
 const label=(i+1).toString().padStart(2,'0');
 return `<article class="v10-company"><div class="v10-company-top"><span class="v10-number">${label}</span><div class="v10-company-name"><strong>${esc(p.name||'')}</strong><small>${esc([p.symbol||'',v11Sector(p.sector)].filter(Boolean).join(' · '))}</small></div><span class="v10-cap">${v11Money(p.market_cap,p.market_cap_currency)}</span></div><div class="v11-observation">${esc(V11('asof'))}: ${esc(p.market_cap_asof||'—')} ${url?`· <a href="${url}" target="_blank" rel="noopener noreferrer">${esc(V11('open'))} ↗</a>`:''}</div><div class="v10-stats"><div><span>${esc(V11('growth'))}</span><strong>${v11Pct(p.revenue_cagr_5y)}</strong><small>${p.growth_from&&p.growth_to?`${p.growth_from}–${p.growth_to}`:V11('missing')}</small></div><div><span>${esc(V11('roe'))}</span><strong>${v11Pct(p.roe_ttm)}</strong><small>${esc(p.roe_year?String(p.roe_year):V11('missing'))}</small></div></div></article>`;}).join('')+`<p class="v10-meta">${esc(V11('source'))} · ${esc(V11('loaded'))}: ${esc((data.updated_at||'').slice(0,10))}${data.mixed_currencies_omitted?' · '+esc(V11('limited')):''}${data.dated_or_historical?' · '+esc(V11('old')):''}${data.loading?' · '+esc(V11('loading')):''}</p>`;return;}
 const loading=data?.status==='loading'||data?.loading;const limit=data?.status==='source_rate_limited';const missing=data?.status==='no_coverage';const sentence=loading?V11('loading'):limit?V11('rate'):missing?V11('noData'):V11('unavailable');
 root.innerHTML=`<div class="v10-state">${loading?'<span class="loading-spinner"></span> ':''}${esc(sentence)}${!loading?`<button class="v10-retry" data-v11-refresh>${esc(V11('more'))} ↻</button>`:''}</div>`;
}
async function v11Fetch(c,force=false){if(!v11Active(c.iso))return;if(!force&&V11CACHE.has(c.iso))v11Render(c.iso,V11CACHE.get(c.iso));
 try{const url=`/api/top-companies?country=${encodeURIComponent(c.iso)}${force?'&refresh=1':''}`;const response=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error(response.status);
 const data=await response.json();if(data.status!=='loading'&&!data.loading)V11CACHE.set(c.iso,data);v11Render(c.iso,data);
 if(data.loading&&v11Active(c.iso)){const n=V11TRIES.get(c.iso)||0;if(n<12){V11TRIES.set(c.iso,n+1);setTimeout(()=>{if(v11Active(c.iso))v11Fetch(c)},3500)}}else V11TRIES.delete(c.iso);
 }catch{if(!V11CACHE.has(c.iso))v11Render(c.iso,{status:'source_unavailable'});}}
// The existing app still calls this symbol when activating the market tab.
mountTradingView=function(c){if(c)void v11Fetch(c)};
const v11OldLanguage=setGMILang;
setGMILang=function(lang){v11OldLanguage(lang);if(state.selected?.kind==='country'&&state.tab==='market')renderDrawer();};
document.addEventListener('click',e=>{if(!e.target.closest('[data-v11-refresh]'))return;const c=state.selected?.c;if(!c)return;
 V11TRIES.delete(c.iso);V11CACHE.delete(c.iso);v11Render(c.iso,{status:'loading'});void v11Fetch(c,true);});
