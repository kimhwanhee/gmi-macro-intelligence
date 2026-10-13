/* GMI v8 - authoritative institutional rosters, currency-aware macro, disciplined event schedule, CSV */
'use strict';
const V8_WORDS={
 ko:{politicians:'주요 지도부 및 장관',head:'국가 주요 지도부',ministers:'외교·국방·통상·경제 부처',list:'직책별 현황',none:'확인된 최신 발표가 없습니다.',load:'확인된 명단을 표시하고 최신 발표를 수집 중…',date:'자료 기준일',source:'원문 출처',appointments:'고위급 외교·안보 일정',planned:'방문·회담 예정',past:'관련 최근 보도',notverified:'공식 방문·회담 날짜가 확인되지 않았습니다.',when:'방문·회담일',with:'상대 인물·국가',status:'확인',newsDate:'기사 보도일',notEqual:'보도일은 방문일이 아닙니다.',rate:'환산 기준 환율',noRate:'환율을 가져오는 중…',fallback:'환율 연결이 지연되어 미 달러로 표시합니다.',csv:'데이터 CSV 다운로드',wait:'자료 수집 중',unknown:'미확인',estimate:'현재 환율 환산액 · 과거 기준환율 아님',unavailable:'발표 자료 없음',president:'대통령·국가주석',vice_president:'부통령',prime_minister:'총리',monarch:'국왕·군주',chancellor:'총리',foreign_minister:'외교장관',defense_minister:'국방장관',trade_minister:'상무·통상장관',finance_minister:'재무·경제장관',speaker:'의회의장',minister:'장관·기관장',other_official:'기관장',chief:'주요 지도부',note:'공직 명단은 표기된 자료 기준일의 현황입니다. 현재 재직 여부는 공식 출처에서 재확인해야 합니다.',partial:'확인 가능한 일부 자료만 표시합니다.',current:'경상계정',financial:'금융계정',noneFX:'금액 지표만 통화 변환; 비율 지표는 % 유지'},
 en:{politicians:'Leadership and ministers',head:'National leadership',ministers:'Foreign, defence, trade and finance',list:'Offices and officeholders',none:'No officially verified upcoming schedule.',load:'Showing dated records and checking updates…',date:'Source date',source:'Primary source',appointments:'Senior diplomatic & security schedule',planned:'Scheduled visits and meetings',past:'Related recent reports',notverified:'No confirmed date for a future visit or meeting.',when:'Visit / meeting date',with:'Counterpart / destination',status:'Status',newsDate:'Article date',notEqual:'Publication date is not the meeting date.',rate:'FX conversion basis',noRate:'Fetching FX data…',fallback:'FX source delayed; displaying in USD.',csv:'Download data CSV',wait:'Loading sources',unknown:'Unverified',estimate:'Converted at the latest rate, not the historical rate',unavailable:'Not published',president:'President',vice_president:'Vice President',prime_minister:'Prime Minister',monarch:'Monarch',chancellor:'Chancellor',foreign_minister:'Foreign Minister',defense_minister:'Defence Minister',trade_minister:'Trade / Commerce Minister',finance_minister:'Finance / Economy Minister',speaker:'Speaker',minister:'Minister / Official',other_official:'Official',chief:'National leaders',note:'Cabinet lists reflect the indicated source date; appointments may have changed.',partial:'Only confirmed published data shown.',current:'Current account',financial:'Financial account',noneFX:'Only monetary measures are converted; percentage indicators remain percentages'},
 zh:{politicians:'主要领导人与部长',head:'国家主要领导人',ministers:'外交、国防、商务及财政部门',list:'各部门负责人',none:'暂无经官方确认的未来会晤或出访安排。',load:'正在显示有日期的名单并核对更新…',date:'资料日期',source:'原始来源',appointments:'高层外交与安全日程',planned:'未来访问与会谈',past:'相关近期报道',notverified:'访问或会晤日期尚未得到正式确认。',when:'访问／会谈日期',with:'会谈对象／目的地',status:'核实状态',newsDate:'报道日期',notEqual:'报道日期不等于会谈日期。',rate:'汇率换算基准',noRate:'正在获取汇率…',fallback:'汇率服务暂不可用，显示美元。',csv:'下载数据 CSV',wait:'正在检索',unknown:'待核实',estimate:'按最新汇率换算，并非历史汇率',unavailable:'尚未公布',president:'总统／国家主席',vice_president:'副总统',prime_minister:'总理／首相',monarch:'君主',chancellor:'总理',foreign_minister:'外交部长',defense_minister:'国防部长',trade_minister:'商务／贸易部长',finance_minister:'财政／经济部长',speaker:'议长',minister:'部长／官员',other_official:'官员',chief:'国家领导人',note:'官员名单以所示资料日期为准，人事调整可能尚未反映。',partial:'仅显示已核实的信息。',current:'经常账户',financial:'金融账户',noneFX:'仅换算金额指标，百分比保持不变'}
};
const V8=k=>V8_WORDS[gmiLang]?.[k]||V8_WORDS.ko[k]||k;
const v8Identity=new Map(),v8Requested=new Set();
const v8Safe=u=>{try{let parsed=new URL(u);return parsed.protocol==='https:'?parsed.href:''}catch{return ''}};
const v8PersonName=p=>p?.[`name_${gmiLang}`]||v4Name?.(p?.name||'')||p?.name||'';
function v8Office(p){const role=p?.office||'minister';return V8_WORDS[gmiLang]?.[role]||V8_WORDS.ko[role]||role;}
const V8MINISTERS=['foreign_minister','defense_minister','trade_minister','finance_minister'];
function v8RenderCabinet(c,rec){if(state.selected?.id!==c.iso)return;const div=document.querySelector('.v7-government');if(!div)return;
 const people=(rec.people||[]).slice(0,3),groups=rec.cabinet_groups||{};
 const offices=V8MINISTERS.map(role=>({role,rows:(groups[role]||[]).slice(0,3)}));
 const leaders=people.map(p=>`<article class="v8-government-person"><small>${esc(v8Office(p))}</small><b>${esc(v8PersonName(p))}</b></article>`).join('');
 const persons=offices.map(({role,rows})=>`<div class="v8-minister-row"><span>${esc(V8_WORDS[gmiLang]?.[role]||role)}</span><div>${rows.length?rows.map(p=>`<b>${esc(v8PersonName(p))}</b><small title="${esc(p.title||'')}">${esc(p.title||'')}</small>`).join(''):`<em>${rec.loading?V8('wait'):V8('unavailable')}</em>`}</div></div>`).join('');
 const system=V7TEXT[gmiLang]?.system?.[rec.kind]||V7TEXT.ko.system?.[rec.kind]||V7TEXT.ko.system.unknown;
 const branch=V7TEXT[gmiLang]?.systems?.[rec.kind]||V7TEXT.ko.systems.unknown;
 div.innerHTML=`<div class="v7-topline"><span>${esc(V8('politicians'))}</span><strong>${esc(system)}</strong></div><h3>${esc(V8('head'))}</h3><div class="v8-gov-leaders">${leaders||`<div class="v7-muted">${esc(rec.loading?V8('load'):V8('partial'))}</div>`}</div>
 <h3>${esc(V8('ministers'))}</h3><div class="v8-ministers">${persons}</div><p class="v8-small">${esc(V8('note'))}</p><div class="v8-date">${V8('date')}: ${esc(rec.cabinet_as_of||rec.verified_as_of||'—')} · <a href="${esc(v8Safe(rec.cabinet_source||rec.seed_source)||'https://www.cia.gov/resources/world-leaders/')}" target="_blank" rel="noopener">CIA World Leaders ↗</a></div>
 <h3>${esc(v7L('offices'))}</h3><div class="v7-branches">${[['state',0],['executive',1],['legislature',2],['judiciary',2]].map(([key,i])=>`<section><b>${v7L(key)}</b><p>${esc(branch[i]||'')}</p></section>`).join('')}</div>
 <h3>${esc(v7L('chamber'))}</h3><div class="v7-inline">${(rec.parliament?.chambers||[]).map(s=>`<span class="v7-chip">${esc(s)}</span>`).join('')||`<span class="v7-muted">${V8('partial')}</span>`}</div><div class="v7-actions"><a href="https://data.ipu.org/" target="_blank" rel="noopener">IPU Parline ↗</a></div>`;
}
v7Draw=function(c,data){v8Identity.set(c.iso,data);v8RenderCabinet(c,data)};
// Reuse one roster in the country-header and the political tab. Source fetch remains asynchronous.
const v8OriginalLeadership=v7Fetch;
v7Fetch=async function(c,retry=0){const saved=v8Identity.get(c.iso);if(saved)v8RenderCabinet(c,saved);return v8OriginalLeadership(c,retry)};
// Derive high-level scheduled visits only from an explicit event date. News publication dates never fill this field.
function v8Diplomacy(c,res){const div=$('#gmiDiplomacy');if(!div||state.selected?.id!==c.iso||state.tab!=='diplomacy')return;
 const gov=v8Identity.get(c.iso)||{};let leaders=(gov.people||[]).slice(0,3);
 const roleKeys=['president','prime_minister','chancellor','monarch','vice_president','general_secretary'];
 const buckets=[...leaders.map(p=>({office:p.office,people:[p],header:esc(v8Office(p))})),...V8MINISTERS.map(r=>({office:r,people:(gov.cabinet_groups?.[r]||[]),header:V8(r)}))];
 const e=(res?.events||[]).filter(x=>x.reported_title||x.summary_ko);
 const upcoming=e.filter(x=>/^20\d\d-\d\d-\d\d$/.test(x.meeting_date||x.visit_date||'')&&((x.meeting_date||x.visit_date)>=new Date().toISOString().slice(0,10)));
 const idOfRole=r=>r==='foreign_minister'?'foreign_minister':r==='commerce_minister'?'trade_minister':r==='defense_minister'?'defense_minister':r;
 const groupMarkup=buckets.map(({office,people,header})=>{
  const matching=e.filter(x=>idOfRole(x.role)===office || (office==='prime_minister'&&x.person&&people.some(p=>x.person.toLowerCase().includes(p.name.toLowerCase())))).slice(0,2);
  const names=people.map(p=>esc(v8PersonName(p))).join(' · ');
  const identified=matching.filter(x=>x.meeting_date||x.visit_date);
  return `<section class="v8-agenda-row"><div class="v8-agenda-profile"><b>${header}</b><small>${names||V8('unknown')}</small></div><div class="v8-agenda-detail">${identified.length?identified.map(x=>`<div class="v8-agenda-item"><time>${esc(x.meeting_date||x.visit_date)}</time><span>${esc(x[`summary_${gmiLang}`]||x.counterpart||x.destination||x.reported_title)}</span><a target="_blank" rel="noopener" href="${esc(v8Safe(x.source))}">${V8('source')} ↗</a><em>${esc(x.verification==='official_confirmed'?'Official':V8('unknown'))}</em></div>`).join(''):`<span class="v8-pending">${esc(res?.loading?V8('wait'):V8('notverified'))}</span>`}</div></section>`}).join('');
 const unverified=e.filter(x=>!x.meeting_date&&!x.visit_date).slice(0,6);
 div.innerHTML=`<div class="v8-agenda"><h3>${V8('appointments')}</h3><p class="v8-small">${V8('notEqual')}</p>${groupMarkup}</div>${unverified.length?`<div class="v8-latest"><h3>${V8('past')}</h3>${unverified.map(x=>`<div class="v8-latest-item"><span>${V8('newsDate')} · ${esc(x.reported_at||'')}</span><a href="${esc(v8Safe(x.source))}" target="_blank" rel="noopener">${esc(x[`summary_${gmiLang}`]||x.reported_title)}</a></div>`).join('')}</div>`:''}`;
}
drawDiplomacy=v8Diplomacy;
const v8OldLoadDiplomacy=loadDiplomacy;
loadDiplomacy=async function(c){const roster=v8Identity.get(c.iso);if(!roster){try{const r=await fetch(`/api/politics?country=${encodeURIComponent(c.iso)}`,{signal:AbortSignal.timeout(4500)});if(r.ok)v8Identity.set(c.iso,await r.json())}catch{}}
 return v8OldLoadDiplomacy(c);
};

// Currency is selected by language, not by country. Convert only indicators with US$ base units.
const v8FX={rates:{USD:{rate:1}},updating:true};
let v8FXBusy=false;let v8FXNext=0;
async function v8EnsureFX(){if(v8FXBusy||Date.now()<v8FXNext)return;v8FXBusy=true;v8FXNext=Date.now()+15000;
 try{let r=await fetch('/api/fx',{signal:AbortSignal.timeout(6000)});if(r.ok){let data=await r.json();Object.assign(v8FX,data);if(!data.rates?.KRW||!data.rates?.CNY)v8FXNext=Date.now()+12000;else v8FXNext=Date.now()+3600000;
  if(state.selected?.kind==='country'&&state.tab==='macro'&&v4MacroCache.has(state.selected.c.iso))showMacro(state.selected.c);
 }}catch{}finally{v8FXBusy=false;}}
const v8Currency=()=>({ko:'KRW',zh:'CNY',en:'USD'})[gmiLang];
const v8CurrencyLabel=ccy=>({KRW:({ko:'조 원',en:'KRW trillion',zh:'万亿韩元'}[gmiLang]),CNY:({ko:'십억 위안',en:'CNY billion',zh:'十亿元'}[gmiLang]),USD:({ko:'십억 달러',en:'USD billion',zh:'十亿美元'}[gmiLang])})[ccy];
function v8Formatted(v,unit){if(!Number.isFinite(+v))return '—';if(unit!=='usd')return v5Number(v,unit);
 const target=v8Currency(),fx=v8FX.rates?.[target];if(!fx?.rate)return v5Number(v,'usd');
 const multiplier=target==='KRW'?1e12:1e9, val=Number(v)*fx.rate/multiplier;
 return `${val.toLocaleString(({ko:'ko-KR',en:'en-US',zh:'zh-CN'})[gmiLang],{maximumFractionDigits:2,minimumFractionDigits:1})} ${v8CurrencyLabel(target)}`;
}
showMacro=async function(c){const el=$('#macroMetrics');if(!el)return;el.innerHTML=`<div class="v5-state"><span class="loading-spinner"></span>${V8('wait')}</div>`;
 let data=v4MacroCache.get(c.iso);if(!data){try{let r=await fetch(`/api/macro-bundle?country=${encodeURIComponent(c.iso)}`,{signal:AbortSignal.timeout(19500)});if(!r.ok)throw Error();data=await r.json();if(Object.values(data.indicators||{}).some(x=>x.length))v4MacroCache.set(c.iso,data);}catch{data={indicators:{},error:true}}}
 if(state.selected?.id!==c.iso||state.tab!=='macro'||!$('#macroMetrics'))return;
 const filled=Object.values(data.indicators||{}).some(arr=>arr?.length);
 if(!filled){el.innerHTML=`<div class="v6-data-state">${V6('unavailable')} <button class="btn outline" id="v8RetryMacro">${V6('retry')}</button></div>`;$('#v8RetryMacro').onclick=()=>{v4MacroCache.delete(c.iso);showMacro(c)};return;}
 const cards=V5Indicators.map(([key,code,unit])=>{const rows=data.indicators?.[code]||[],latest=rows[0];return `<section class="v5-metric"><div class="v5-metric-title"><strong>${esc(key==='current'||key==='financial'?V8(key):V4(key))}</strong><span>${esc(latest?.date||'—')}</span></div><div class="v5-metric-value">${v8Formatted(latest?.value,unit)}</div>${v5Spark(rows)}</section>`}).join('');
 const target=v8Currency(),fx=v8FX.rates?.[target],label=target==='USD'?'USD · Original data':fx?`USD → ${target}: ${fx.rate.toLocaleString()} · ${fx.date||'latest'}`:V8('fallback');
 el.innerHTML=`<div class="v5-metrics-grid">${cards}</div><div class="v5-data-attribution">${V8('noneFX')} · ${V8('rate')}: ${esc(label)} ${target!=='USD'&&fx?'· '+V8('estimate'):''} · <a href="https://data.worldbank.org" target="_blank" rel="noopener">World Bank ↗</a> · <a href="https://frankfurter.dev" target="_blank" rel="noopener">Frankfurter ↗</a></div>`;
 if(target!=='USD'&&!fx)void v8EnsureFX();
};

// CSV can be requested immediately, even if no latest online data is loaded yet.
let v8CompareData=null;
const v8PrevCompare=fetchCompareData;
fetchCompareData=async function(force=false){
 const button=document.querySelector('#exportCompare');if(button){button.disabled=false;button.innerText=V8('csv');button.onclick=()=>v8DownloadCompare(false)}
 const result=await v8PrevCompare(force);const latest=document.querySelector('#exportCompare');if(latest){latest.disabled=false;latest.textContent=V8('csv');latest.onclick=()=>v8DownloadCompare(false);}return result;
};
async function v8DownloadCompare(force){const button=document.querySelector('#exportCompare');if(button){button.disabled=true;button.textContent=V8('wait')+'…'}
 const selected=state.compare.slice(0,4),indicator=state.comparisonIndicator;let body={indicators:{}};
 try{const r=await fetch('/api/macro-compare?'+new URLSearchParams({countries:selected.join(','),indicator}),{signal:AbortSignal.timeout(20000)});if(r.ok)body=await r.json()}catch{}
 const target=v8Currency(),rate=v8FX.rates?.[target]?.rate||null;
 const monetary=['BN.CAB.XOKA.CD','BN.FIN.TOTL.CD'].includes(indicator);
 const rows=[['country','iso3','year','indicator','original_value','original_unit','display_value','display_currency','rate_usd_to_display','rate_date','source','status']];
 for(const iso of selected){const c=countryByIso[iso],series=body.indicators?.[iso]||[];
  if(!series.length)rows.push([c?displayCountry(c):iso,iso,'',indicator,'','','','','','','World Bank WDI','no_published_data_or_unavailable']);
  for(const v of series){const num=Number(v.value),valid=Number.isFinite(num);rows.push([c?displayCountry(c):iso,iso,v.date,indicator,valid?num:'',monetary?'USD':'percent',valid&&(!monetary||rate!==null)?(monetary?num*rate:num):'',monetary?(rate!==null?target:'USD'):'percent',monetary?rate||'':'',monetary?v8FX.rates?.[target]?.date||'':'','World Bank WDI',body.stale?'cached':'published']);}
 }
 exportCSV(`GMI_${indicator.replaceAll('.','_')}_${new Date().toISOString().slice(0,10)}.csv`,rows);
 if(button){button.disabled=false;button.textContent=V8('csv');}
}
const v8PrevRenderCompare=renderCompare;
Object.assign(indMap,{current:'BN.CAB.XOKA.CD',financial:'BN.FIN.TOTL.CD'});
const v8PrevFormatMetric=formatMetric;
formatMetric=function(item){return ['BN.CAB.XOKA.CD','BN.FIN.TOTL.CD'].includes(state.comparisonIndicator)?v8Formatted(item?.value,'usd'):v8PrevFormatMetric(item)};
renderCompare=function(){v8PrevRenderCompare();const select=$('#compareIndicator');if(select){for(const [code,label] of [['BN.CAB.XOKA.CD',V8('current')],['BN.FIN.TOTL.CD',V8('financial')]]){if(![...select.options].some(o=>o.value===code)){const op=document.createElement('option');op.value=code;op.textContent=label;select.appendChild(op);}}select.value=state.comparisonIndicator;}const btn=$('#exportCompare');if(btn){btn.disabled=false;btn.textContent=V8('csv');btn.onclick=()=>v8DownloadCompare(false);}}
const v8PrevLang=setGMILang;
setGMILang=function(lang){v8PrevLang(lang);if(state.page==='compare')renderCompare();if(state.selected?.kind==='country'&&state.tab==='diplomacy')loadDiplomacy(state.selected.c);};
void v8EnsureFX();
