/* GMI v9: dated foreign-minister roster and interactive five-year macro tooltips.
   Mounted after all previous feature scripts so the existing design is retained. */
'use strict';
const V9_WORDS = {
 ko:{minister:'외교장관',loading:'외교장관 정보 확인 중…',missing:'확인된 외교장관 명단이 없습니다.',date:'자료 확인일',year:'기준 연도',source:'공식 자료'},
 en:{minister:'Foreign Minister',loading:'Checking foreign minister…',missing:'No verified foreign minister available.',date:'Source date',year:'Reference year',source:'Source'},
 zh:{minister:'外交部长',loading:'正在核对外交部长…',missing:'暂无核实的外交部长资料。',date:'资料日期',year:'统计年份',source:'官方资料'}
};
const V9=k=>V9_WORDS[gmiLang]?.[k]||V9_WORDS.ko[k]||k;
const v9ForeignCache = new Map(), v9ForeignInflight = new Set(), v9RetryCount = new Map();
const v9PersonName = p => p?.[`name_${gmiLang}`]||p?.name||'';
function v9MinisterMarkup(c){
 const item=v9ForeignCache.get(c.iso),person=item?.person;
 if(!person){return `<article class="v6-lead-person v9-minister-row"><div class="v9-minister-symbol" aria-hidden="true">✦</div><div class="v6-lead-profile"><span class="v6-lead-office">${esc(V9('minister'))}</span><small>${esc(!item||item.loading?V9('loading'):V9('missing'))}</small></div></article>`}
 const image=v6CountryImage(person);
 const verified=item.verified_as_of||person.verified_as_of||'',source=v8Safe(person.source||'');
 return `<article class="v6-lead-person v9-minister-row"><div class="v6-lead-photo">${image}</div><div class="v6-lead-profile"><span class="v6-lead-office">${esc(V9('minister'))}</span><strong>${esc(v9PersonName(person))}</strong>${person.term_start?`<small>${esc(V6('inOffice'))} · ${esc(person.term_start)}</small>`:''}${verified?`<small>${esc(V9('date'))} · ${esc(verified)}</small>`:''}${source?`<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(V9('source'))} ↗</a>`:''}</div></article>`;
}
function v9DrawMinister(c){if(state.selected?.id!==c.iso)return;
 const box=document.querySelector('#v6Leaders');if(!box)return;
 let row=box.querySelector('#v9ForeignMinister');if(!row){row=document.createElement('div');row.id='v9ForeignMinister';box.appendChild(row)}
 row.innerHTML=v9MinisterMarkup(c);
}
function v9LoadMinister(c){
 v9DrawMinister(c);
 if(v9ForeignInflight.has(c.iso)||v9ForeignCache.get(c.iso)?.person)return;
 v9ForeignInflight.add(c.iso);
 fetch(`/api/foreign-minister?country=${encodeURIComponent(c.iso)}`,{signal:AbortSignal.timeout(8000)})
  .then(r=>{if(!r.ok)throw Error(String(r.status));return r.json()})
  .then(data=>{v9ForeignCache.set(c.iso,data);v9DrawMinister(c);
    if(data.loading&&!data.person){const n=v9RetryCount.get(c.iso)||0;if(n<4){v9RetryCount.set(c.iso,n+1);setTimeout(()=>{v9ForeignInflight.delete(c.iso);if(state.selected?.id===c.iso)v9LoadMinister(c)},3500)}}
  })
  .catch(()=>{if(!v9ForeignCache.has(c.iso))v9ForeignCache.set(c.iso,{person:null,loading:false});v9DrawMinister(c)})
  .finally(()=>v9ForeignInflight.delete(c.iso));
}
const v9PreviousDrawLeaders = v6DrawLeaders;
v6DrawLeaders=function(c,payload){v9PreviousDrawLeaders(c,payload);v9LoadMinister(c)};
const v9PreviousRenderDrawer=renderDrawer;
renderDrawer=function(){v9PreviousRenderDrawer();const c=state.selected?.kind==='country'?state.selected.c:null;if(c)v9LoadMinister(c)};
// Also refresh official labels and values when changing display language.
const v9PreviousSetLang=setGMILang;
setGMILang=function(lang){v9PreviousSetLang(lang);const c=state.selected?.kind==='country'?state.selected.c:null;if(c)v9DrawMinister(c)};

// Render five precise year hit targets. Values use the same display currency as the macro cards.
v5Spark=function(series,unit='percent'){
 const rows=(series||[]).filter(v=>/^\d{4}$/.test(String(v.date))&&v.value!=null&&Number.isFinite(Number(v.value)))
 .sort((a,b)=>Number(b.date)-Number(a.date)).slice(0,5).reverse();
 if(rows.length<2)return `<div class="v5-spark-none">${esc(V5('noSeries'))}</div>`;
 const min=Math.min(...rows.map(v=>Number(v.value))),max=Math.max(...rows.map(v=>Number(v.value))),range=max-min||1;
 const w=296,h=112,x0=18,x1=278,y0=14,y1=76;
 const points=rows.map((v,i)=>({x:x0+(x1-x0)*i/(rows.length-1),y:y1-(Number(v.value)-min)/range*(y1-y0),year:String(v.date),value:Number(v.value)}));
 const line=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
 const lines=[20,47,76].map(y=>`<line x1="12" y1="${y}" x2="284" y2="${y}"/>`).join('');
 const dots=points.map(p=>{const val=unit==='usd'?v8Formatted(p.value,'usd'):v5Number(p.value,'percent');return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.7" fill="#f1b48d"/><circle class="v9-spot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="12" fill="transparent" tabindex="0" role="img" data-year="${p.year}" data-value="${p.value}" data-unit="${unit}" aria-label="${esc(p.year+': '+val)}"></circle>`}).join('');
 const years=points.map(p=>`<text x="${p.x.toFixed(1)}" y="102" text-anchor="middle">${p.year}</text>`).join('');
 return `<svg class="v5-spark v9-spark" viewBox="0 0 ${w} ${h}" aria-label="${esc(V5('metricInfo'))}" role="group"><g class="v9-grid">${lines}</g><path d="${line}" class="v9-series-line"/><g class="v9-year-labels">${years}</g>${dots}</svg>`;
};
let v9Tooltip=null;
function v9TooltipElement(){if(v9Tooltip)return v9Tooltip;
 v9Tooltip=document.createElement('div');v9Tooltip.className='v9-value-tip';v9Tooltip.setAttribute('role','tooltip');document.body.appendChild(v9Tooltip);return v9Tooltip;}
function v9ShowTooltip(dot){const t=v9TooltipElement(),unit=dot.dataset.unit,value=Number(dot.dataset.value);
 t.textContent=`${dot.dataset.country?dot.dataset.country+' · ':''}${V9('year')} ${dot.dataset.year} · ${unit==='usd'?v8Formatted(value,'usd'):v5Number(value,'percent')}`;
 t.classList.add('is-visible');const r=dot.getBoundingClientRect();let left=Math.max(12,Math.min(innerWidth-12,r.left+r.width/2));
 t.style.left=left+'px';t.style.top=Math.max(12,r.top-45)+'px';
}
function v9HideTooltip(){v9Tooltip?.classList.remove('is-visible')}
document.addEventListener('pointerover',e=>{const dot=e.target?.closest?.('.v9-spot');if(dot)v9ShowTooltip(dot)});
document.addEventListener('pointerout',e=>{if(e.target?.closest?.('.v9-spot'))v9HideTooltip()});
document.addEventListener('focusin',e=>{if(e.target?.matches?.('.v9-spot'))v9ShowTooltip(e.target)});
document.addEventListener('focusout',e=>{if(e.target?.matches?.('.v9-spot'))v9HideTooltip()});
document.addEventListener('click',e=>{const dot=e.target?.closest?.('.v9-spot');if(dot)v9ShowTooltip(dot);else v9HideTooltip()});
document.addEventListener('scroll',v9HideTooltip,true);
