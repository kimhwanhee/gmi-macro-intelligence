/* GMI v5 • Restore coherent dark-card UI, keep six source-grounded indicators. */
'use strict';
const V5_TEXT={
 ko:{current:'경상계정',financial:'금융계정',loading:'자료를 불러오는 중…',retry:'자료를 확인하는 중입니다. 잠시 후 다시 확인해 주세요.',source:'출처',metricInfo:'최근 발표치 · 지난 5개 연도',bnUSD:'십억 달러',millionUSD:'백만 달러',noSeries:'최근 5년 통계를 확인할 수 없습니다.',invalidSeries:'해당 국가의 통계가 제공되지 않습니다.',issue:'경제·정치·국방·외교',cont:'전체 국가·지역',languageNote:'선택한 언어로 제공된 기사',newsWait:'선택 언어의 뉴스를 가져오는 중…'},
 en:{current:'Current account',financial:'Financial account',loading:'Loading data…',retry:'Checking data sources. Please try again shortly.',source:'Source',metricInfo:'Latest observation · last five years',bnUSD:'USD bn',millionUSD:'USD m',noSeries:'No five-year series available.',invalidSeries:'No published data for this country.',issue:'Economy · Politics · Defense · Diplomacy',cont:'Countries & territories',languageNote:'News in the selected language',newsWait:'Loading news in your language…'},
 zh:{current:'经常账户',financial:'金融账户',loading:'正在加载数据…',retry:'正在检查数据来源，请稍后重试。',source:'来源',metricInfo:'最新数据 · 近五年',bnUSD:'十亿美元',millionUSD:'百万美元',noSeries:'暂无近五年的统计数据。',invalidSeries:'该国家暂无公开数据。',issue:'经济 · 政治 · 国防 · 外交',cont:'国家与地区',languageNote:'当前语言的新闻',newsWait:'正在获取所选语言的新闻…'}
};
const V5=k=>V5_TEXT[gmiLang]?.[k]||V5_TEXT.ko[k]||k;
// The previous v4 added four extra indicators. Keep original four and substitute two BoP accounts.
const V5Indicators=[['growth','NY.GDP.MKTP.KD.ZG','percent'],['inflation','FP.CPI.TOTL.ZG','percent'],['unemployment','SL.UEM.TOTL.ZS','percent'],['trade','NE.TRD.GNFS.ZS','percent'],['current','BN.CAB.XOKA.CD','usd'],['financial','BN.FIN.TOTL.CD','usd']];
Object.assign(V4T.ko,{current:'경상계정',financial:'금융계정'});
Object.assign(V4T.en,{current:'Current account',financial:'Financial account'});
Object.assign(V4T.zh,{current:'经常账户',financial:'金融账户'});
function v5Number(value,unit){if(!Number.isFinite(+value))return '—';const n=Number(value);if(unit==='percent')return `${n.toLocaleString(gmiLang==='ko'?'ko-KR':gmiLang==='zh'?'zh-CN':'en-US',{minimumFractionDigits:1,maximumFractionDigits:2})}%`;
 let magnitude=Math.abs(n)>=1e9?1e9:1e6;
 return `${(n/magnitude).toLocaleString(gmiLang==='ko'?'ko-KR':gmiLang==='zh'?'zh-CN':'en-US',{minimumFractionDigits:1,maximumFractionDigits:2})} ${magnitude===1e9?V5('bnUSD'):V5('millionUSD')}`;
}
function v5Spark(series){const observations=series.filter(v=>/^\d{4}$/.test(''+v.date)&&Number.isFinite(+v.value)).sort((a,b)=>Number(b.date)-Number(a.date)).slice(0,5).reverse();
 if(observations.length<2)return `<div class="v5-spark-none">${V5('noSeries')}</div>`;
 const min=Math.min(...observations.map(x=>+x.value)),max=Math.max(...observations.map(x=>+x.value)),spread=(max-min)||1,w=296,h=108;
 const points=observations.map((r,i)=>({x:20+i*(w-40)/(observations.length-1),y:17+(1-(+r.value-min)/spread)*59,date:r.date,value:+r.value}));
 const d=points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
 const z=min<0&&max>0?17+(1-(0-min)/spread)*59:null;
 return `<svg class="v5-spark" viewBox="0 0 296 108" role="img" aria-label="${V5('metricInfo')}"><g stroke="#2b3b4d" stroke-width=".7"><line x1="15" y1="18" x2="282" y2="18"/><line x1="15" y1="47" x2="282" y2="47"/><line x1="15" y1="76" x2="282" y2="76"/></g>${z!==null?`<line x1="15" y1="${z}" x2="282" y2="${z}" stroke="#6f7e90" stroke-width=".8" stroke-dasharray="3 3"/>`:''}<path d="${d}" fill="none" stroke="#de9667" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#e6b08e"/>`).join('')}<g fill="#8fa1b7" font-size="10" font-family="Inter,sans-serif"><text x="15" y="101">${observations[0].date}</text><text x="282" y="101" text-anchor="end">${observations.at(-1).date}</text></g></svg>`;
}
// Explicitly get last-five-year rows while keeping the latest reported observation separate.
showMacro=async function(c){const el=$('#macroMetrics');if(!el)return;el.innerHTML=`<div class="v5-state"><span class="loading-spinner"></span>${V5('loading')}</div>`;let data=v4MacroCache.get(c.iso);
 if(!data){try{const r=await fetch(`/api/macro-bundle?country=${encodeURIComponent(c.iso)}`,{signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('source '+r.status);data=await r.json();v4MacroCache.set(c.iso,data);}catch{data={indicators:{},error:true}}}
 if(state.selected?.id!==c.iso||state.tab!=='macro'||!$('#macroMetrics'))return;
 const cards=V5Indicators.map(([key,code,unit])=>{const rows=data.indicators?.[code]||[];const latest=rows.find(x=>Number.isFinite(+x.value));return `<section class="v5-metric"><div class="v5-metric-title"><strong>${esc(key==='current'||key==='financial'?V5(key):V4(key))}</strong><span>${esc(latest?.date||'—')}</span></div><div class="v5-metric-value">${v5Number(latest?.value,unit)}</div>${v5Spark(rows)}</section>`}).join('');
 el.innerHTML=`<div class="v5-metrics-grid">${cards}</div><div class="v5-data-attribution">${V5('metricInfo')} · <a href="https://data.worldbank.org/country/${encodeURIComponent(c.iso2.toLowerCase())}" target="_blank" rel="noopener noreferrer">${V5('source')}: World Bank / IMF ↗</a></div>`;
};
// Restyle the v4 editorial directory as tasteful bordered country cells, still continent-grouped.
const v5BaseEvents=renderEvents;
renderEvents=function(){v5BaseEvents();const root=$('#sidebarEvents');if(root)root.classList.add('v5-events');};
const v5BaseCountries=renderCountriesWorkspace;
renderCountriesWorkspace=function(){v5BaseCountries();$('#directoryCountries')?.classList.add('v5-directory');};
// News always draws localized title/summary if present, with a safe local-language fallback.
function v5LocTitle(item){
 const enriched=item?.[`title_${gmiLang}`];if(enriched)return enriched;
 const original=item?.title||'';
 if(gmiLang==='ko'&&!/[가-힣]/.test(original))return '';
 if(gmiLang==='zh'&&!/[\u3400-\u9fff]/.test(original))return '';
 if(gmiLang==='en'&&(/[가-힣]/.test(original)||/[\u3400-\u9fff]{3}/.test(original)))return '';
 return original;
}
function v5LocText(item,k){return item?.[`${k}_${gmiLang}`]||'';}
const V5_COLORS={economy:'#64cbb7',politics:'#ada1df',defense:'#e3a66d',diplomacy:'#77a8e8'};
function v5NewsCard(cat,items){const available=(items||[]).filter(x=>!!v5LocTitle(x)).slice(0,2);return `<section class="v5-news-card"><div class="v5-news-heading"><i style="background:${V5_COLORS[cat]}"></i><h3>${esc(V4(cat))}</h3><span>${available.length}</span></div>${available.length?available.map(item=>{const title=v5LocTitle(item),summary=v5LocText(item,'summary'),impact=v5LocText(item,'impact');return `<article class="v5-news-item"><div class="v5-news-source"><span>${esc(item.source||'')}</span><time>${esc(item.date||'')}</time></div><a href="${esc(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>${summary&&summary!==title?`<p>${esc(summary)}</p>`:''}${impact?`<p class="v5-news-impact"><strong>${V4('partners')}:</strong> ${esc(impact)}</p>`:''}</article>`}).join(''):`<p class="v5-empty">${V4('noData')}</p>`}</section>`;}
function v5DrawBrief(data,target){const el=$(target);if(!el)return;const loaded=Object.values(data?.categories||{}).some(x=>x?.length);if(data?.loading&&!loaded){el.innerHTML=`<div class="v5-state"><span class="loading-spinner"></span>${V5('newsWait')}</div>`;return;}
 el.innerHTML=`<div class="v5-news-grid">${['economy','politics','defense','diplomacy'].map(k=>v5NewsCard(k,data?.categories?.[k])).join('')}</div>`;}
v4DrawBrief=v5DrawBrief;
// Keep source links for provenance; do not show English text masquerading as a Korean/Chinese translation.
const v5BaseLang=setGMILang;
setGMILang=function(lang){v5BaseLang(lang);if(state.selected?.kind==='country'&&state.tab==='macro')showMacro(state.selected.c);};
// Full-width chart workspaces use natural overflow and visible button outlines.
try{_localizedText();renderEvents();}catch{}
