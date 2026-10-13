/* GMI v6 — executive leadership and resilient World Bank comparisons. */
'use strict';
const V6T={
 ko:{leadership:'국가 주요 지도부',inOffice:'재임 시작',election:'선출·재선출',source:'공식 자료',pending:'지도자 정보를 확인하고 있습니다…',none:'해당 직책의 자료는 아직 확인되지 않았습니다.',partial:'확인된 인물만 표시합니다.',fresh:'최신 통계 조회 중…',slow:'공공 데이터 서버에서 응답을 기다리고 있습니다.',retry:'다시 조회',noData:'현재 확인되는 수치가 없습니다.',stale:'이전 조회 자료입니다. 최신 발표 여부를 확인해 주세요.',compare:'국가별 시계열 비교',value:'최근 발표된 값',year:'기준연도',unavailable:'일부 국가의 데이터가 일시적으로 제공되지 않습니다.',macro:'거시경제 지표',
   offices:{president:'대통령',vice_president:'부통령',president_general_secretary:'국가주석 · 중국공산당 총서기',premier:'국무원 총리',prime_minister:'총리',monarch:'국왕',emperor:'천황',head_of_state:'국가원수',head_of_government:'정부수반'}},
 en:{leadership:'National leadership',inOffice:'In office since',election:'Elected / re-elected',source:'Official source',pending:'Checking leadership information…',none:'Information for this office is not yet verified.',partial:'Only verified officeholders are shown.',fresh:'Loading current macroeconomic data…',slow:'Waiting for the public data provider.',retry:'Try again',noData:'No confirmed published data available.',stale:'Cached data — check for newer releases.',compare:'Country time-series comparison',value:'Latest reported values',year:'Reference year',unavailable:'Some country series are temporarily unavailable.',macro:'Macroeconomic indicators',
   offices:{president:'President',vice_president:'Vice President',president_general_secretary:'President · CPC General Secretary',premier:'Premier of the State Council',prime_minister:'Prime Minister',monarch:'King',emperor:'Emperor',head_of_state:'Head of State',head_of_government:'Head of Government'}},
 zh:{leadership:'国家主要领导人',inOffice:'就职日期',election:'选举 / 连任日期',source:'官方来源',pending:'正在核实领导人信息…',none:'暂未核实该职务的人选。',partial:'仅显示已核实的人选。',fresh:'正在加载宏观经济数据…',slow:'正在等待公共数据服务响应。',retry:'重新获取',noData:'暂无已核实的公开数据。',stale:'这是缓存数据，请核对最新发布信息。',compare:'各国时间序列比较',value:'最新公布值',year:'数据年份',unavailable:'部分国家的数据暂时无法获取。',macro:'宏观经济指标',
   offices:{president:'总统',vice_president:'副总统',president_general_secretary:'国家主席 · 中共中央总书记',premier:'国务院总理',prime_minister:'总理 / 首相',monarch:'国王',emperor:'天皇',head_of_state:'国家元首',head_of_government:'政府首脑'}}
};
const V6=(key)=>V6T[gmiLang]?.[key]||V6T.ko[key]||key;
const v6Office=(code)=>V6T[gmiLang]?.offices?.[code]||V6T.ko.offices?.[code]||code;
const v6RosterCache=new Map();
const v6SafeImage=(u)=>/^https:\/\/(commons\.wikimedia\.org|upload\.wikimedia\.org)\//.test(u||'')?u:'';
const v6CountryImage=(p)=>{const image=v6SafeImage(p.image);return image?`<img loading="lazy" decoding="async" src="${esc(image)}" alt="${esc(p.name_ko||p.name||'')}" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><span class="v6-avatar-placeholder" style="display:none">♙</span>`:'<span class="v6-avatar-placeholder">♙</span>';};
const v6Name=p=>p?.[`name_${gmiLang}`]||p?.name||'';
leaderPanel=function(c){return `<div class="v6-leadership"><div class="v6-leadership-heading">${V6('leadership')}</div><div id="v6Leaders" class="v6-leaders"><div class="v6-lead-pending"><span class="loading-spinner"></span>${V6('pending')}</div></div></div>`;};
function v6DrawLeaders(c,payload){if(state.selected?.id!==c.iso)return;const slot=document.getElementById('v6Leaders');if(!slot)return;
 const list=(payload?.people||[]).filter(p=>p?.name).slice(0,2),seen=new Set();const people=list.filter(p=>{if(seen.has(p.name))return false;seen.add(p.name);return true;});
 if(!people.length){slot.innerHTML=`<div class="v6-lead-pending">${payload?.loading?`<span class="loading-spinner"></span>${V6('pending')}`:V6('none')}</div>`;return;}
 slot.innerHTML=people.map(p=>`<article class="v6-lead-person"><div class="v6-lead-photo">${v6CountryImage(p)}</div><div class="v6-lead-profile"><span class="v6-lead-office">${esc(v6Office(p.office))}</span><strong>${esc(v6Name(p))}</strong>${p.term_start?`<small>${V6('inOffice')} · ${esc(p.term_start)}</small>`:''}${p.elected_on?`<small>${V6('election')} · ${esc(p.elected_on)}</small>`:''}${p.source?`<a href="${esc(safeUrl(p.source))}" target="_blank" rel="noopener noreferrer">${V6('source')} ↗</a>`:''}</div></article>`).join('')+(people.length<2?`<div class="v6-unverified">${V6('partial')}</div>`:'');
}
loadLeader=async function(c){const cached=v6RosterCache.get(c.iso);if(cached)v6DrawLeaders(c,cached);
 try{const r=await fetch(`/api/leadership?country=${encodeURIComponent(c.iso)}`,{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error(r.status);const data=await r.json();v6RosterCache.set(c.iso,data);v6DrawLeaders(c,data);
 if(data.loading&&!data.people?.length){setTimeout(()=>{if(state.selected?.id===c.iso)loadLeader(c)},5000);}
 }catch{if(!cached)v6DrawLeaders(c,{people:[],loading:false})}
};
// Never let a rejected network request for one country blank the other three.
let v6CompareRequest=0;
fetchCompareData=async function(force=false){const serial=++v6CompareRequest;
 const selected=state.compare.map(iso=>countryByIso[iso]).filter(Boolean),indicator=state.comparisonIndicator;
 const chart=$('#compareChart'), table=$('#compareTable');if(!chart||!table)return;
 if(!selected.length){chart.innerHTML=`<div class="empty-panel">${V6('noData')}</div>`;table.innerHTML='';return;}
 chart.innerHTML=`<div class="v6-loading"><span class="loading-spinner"></span> ${V6('fresh')}</div>`;
 table.innerHTML=`<div class="v6-loading">${V6('slow')}</div>`;
 let data;
 try{const params=new URLSearchParams({countries:selected.map(c=>c.iso).join(','),indicator,refresh:force?'1':'0'});
   const response=await fetch('/api/macro-compare?'+params,{signal:AbortSignal.timeout(17000)});
   if(!response.ok)throw Error('macro endpoint '+response.status);
   data=await response.json();
 }catch(ex){data={indicators:{},error:'source_temporarily_unavailable'};}
 if(serial!==v6CompareRequest||state.page!=='compare')return;
 const fetched=selected.map(c=>({country:c,rows:(data.indicators?.[c.iso]||[]).filter(r=>Number.isFinite(+r.value)&&/^\d{4}$/.test(String(r.date)))}));
 const rows=fetched.filter(r=>r.rows.length);
 if(!rows.length){chart.innerHTML=`<div class="v6-data-state">${V6('unavailable')}<button id="v6RetryCompare" class="btn outline">${V6('retry')} ↻</button></div>`;table.innerHTML=`<div class="v6-data-muted">${V6('noData')}</div>`;$('#v6RetryCompare').onclick=()=>fetchCompareData(true);return;}
 const years=[...new Set(rows.flatMap(r=>r.rows.map(x=>Number(x.date))))].sort((a,b)=>a-b).slice(-11);
 const values=rows.flatMap(r=>r.rows.filter(x=>years.includes(+x.date)).map(x=>+x.value));
 let ymin=Math.min(...values),ymax=Math.max(...values);if(ymin===ymax){ymin-=1;ymax+=1;}const pad=(ymax-ymin)*.12;ymin-=pad;ymax+=pad;
 const W=900,H=280,ox=72,oy=22,pw=W-105,ph=H-66;
 const xPos=y=>ox+years.indexOf(y)/Math.max(1,years.length-1)*pw;
 const yPos=v=>oy+ph-(v-ymin)/(ymax-ymin)*ph;
 const colors=['#72b2fa','#f5a16d','#52cab0','#d5a7ef'];
 const grid=Array.from({length:5},(_,i)=>{const v=ymin+i*(ymax-ymin)/4,yy=yPos(v);return `<line x1="${ox}" x2="${ox+pw}" y1="${yy}" y2="${yy}"/><text x="${ox-11}" y="${yy+4}" text-anchor="end">${Number(v).toFixed(1)}</text>`}).join('');
 const paths=rows.map((r,j)=>{const pts=r.rows.filter(q=>years.includes(+q.date)).sort((a,b)=>+a.date-+b.date).map(q=>[xPos(+q.date),yPos(+q.value)]);return `<path d="${pts.map((p,i)=>(i?'L':'M')+p.join(',')).join(' ')}" fill="none" stroke="${colors[j%colors.length]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="${colors[j%colors.length]}"/>`).join('')}`}).join('');
 chart.innerHTML=`<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${V6('compare')}"><g>${grid}</g>${years.map(y=>`<text x="${xPos(y)}" y="${H-14}" text-anchor="middle">${y}</text>`).join('')}${paths}</svg>`;
 const legend=$('#compareLegend');if(legend)legend.innerHTML=rows.map((r,i)=>`<span><i style="background:${colors[i%colors.length]}"></i>${r.country.flag} ${esc(displayCountry(r.country))}</span>`).join('');
 table.innerHTML=`<table class="data-table"><thead><tr><th>${V6('leadership').replace(V6('leadership'),gmiLang==='ko'?'국가':gmiLang==='zh'?'国家':'Country')}</th><th>${V6('value')}</th><th>${V6('year')}</th></tr></thead><tbody>${fetched.map(r=>{const latest=r.rows.sort((a,b)=>+b.date-+a.date)[0];return `<tr><td>${r.country.flag} ${esc(displayCountry(r.country))}</td><td>${latest?formatMetric(latest):'—'}</td><td>${latest?.date||'—'}</td></tr>`}).join('')}</tbody></table>${data.error||data.stale?`<div class="v6-cache-note">${V6(data.stale?'stale':'unavailable')} <button id="v6RetryCompare" class="btn outline">${V6('retry')}</button></div>`:''}`;
 if($('#v6RetryCompare'))$('#v6RetryCompare').onclick=()=>fetchCompareData(true);
 const exportButton=$('#exportCompare');if(exportButton){exportButton.disabled=false;exportButton.onclick=()=>exportCSV('macro_comparison.csv',[['Country','ISO3','Year','Indicator','Value'],...fetched.flatMap(r=>r.rows.map(p=>[r.country.name,r.country.iso,p.date,indicator,p.value]))]);}
};
// Same resilient endpoint for the six individual macro cards. Cached responses stay useful during an outage.
showMacro=async function(c){const el=$('#macroMetrics');if(!el)return;el.innerHTML=`<div class="v5-state"><span class="loading-spinner"></span>${V6('fresh')}</div>`;
 let data=v4MacroCache.get(c.iso);
 if(!data){try{const r=await fetch(`/api/macro-bundle?country=${encodeURIComponent(c.iso)}`,{signal:AbortSignal.timeout(19000)});if(!r.ok)throw Error(r.status);data=await r.json();if(!data.error||Object.values(data.indicators||{}).some(x=>x.length))v4MacroCache.set(c.iso,data);}catch{data={indicators:{},error:'source_temporarily_unavailable'}}}
 if(state.selected?.id!==c.iso||state.tab!=='macro'||!$('#macroMetrics'))return;
 const hasData=Object.values(data.indicators||{}).some(r=>r?.length);
 if(!hasData){el.innerHTML=`<div class="v6-data-state">${V6('unavailable')}<button class="btn outline" id="v6RetryMacro">${V6('retry')}</button></div>`;$('#v6RetryMacro').onclick=()=>{v4MacroCache.delete(c.iso);showMacro(c)};return;}
 el.innerHTML=`<div class="v5-metrics-grid">${V5Indicators.map(([key,code,unit])=>{const rows=data.indicators?.[code]||[],latest=rows[0];return `<section class="v5-metric"><div class="v5-metric-title"><strong>${esc(key==='current'||key==='financial'?V5(key):V4(key))}</strong><span>${esc(latest?.date||'—')}</span></div><div class="v5-metric-value">${v5Number(latest?.value,unit)}</div>${v5Spark(rows)}</section>`}).join('')}</div>${data.stale?`<div class="v6-cache-note">${V6('stale')}</div>`:''}<div class="v5-data-attribution">${V5('metricInfo')} · <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer">${V5('source')}: World Bank ↗</a></div>`;
};
