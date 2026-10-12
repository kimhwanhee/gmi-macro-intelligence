/* GMI / Global Macro Intelligence — dependency-free research MVP */
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (s='') => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const store = {get(k,d){try{return JSON.parse(localStorage.getItem('gmi_'+k))??d}catch{return d}},set(k,v){try{localStorage.setItem('gmi_'+k,JSON.stringify(v))}catch{}}};
const countries = GMI_COUNTRIES.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
const countryByIso = Object.fromEntries(countries.map(c=>[c.iso,c]));
const categories=[['interstate','국가 간 충돌'],['diplomacy','외교·정상회담'],['civil','국내 분쟁'],['tension','군사·안보 긴장'],['trade','무역·관세'],['sanctions','제재·수출 통제'],['territory','영토·해양 분쟁'],['politics','정치적 불안정']];
const statuses=[['worsening','악화','#e96b38'],['unchanged','변화 없음','#64a4e6'],['improving','개선','#30bd91'],['monitoring','추적 중','#9a9ca8']];
const regions=['아시아','유럽','중동','아메리카','아프리카','오세아니아'];
// Demonstration issues and status tags are NOT verified live geopolitical risk assessments.
const examples=[
 ['우크라이나 전쟁 모니터링',31.2,49.1,'interstate','unchanged','유럽','UKR','전쟁·외교·제재 및 에너지시장 관련 정보를 분석하는 시연용 사건'],
 ['대만해협 긴장 추적',121.5,24.3,'tension','monitoring','아시아','TWN','양안 관계, 반도체 공급망 및 지역 안보 추적용 샘플'],
 ['홍해 항로 안보 이슈',42.5,16.1,'tension','worsening','중동','SAU','해상 물류비·원유 공급망 파급 경로 분석 예시'],
 ['미·중 통상정책',116,39,'trade','unchanged','아시아','CHN','관세와 기술·산업 정책 변화 분석 예시'],
 ['한국 반도체 수출 통제',127.8,36.3,'sanctions','monitoring','아시아','KOR','수출 허가·규제 및 기업 영향 분석용 샘플'],
 ['일본 경제안보 정책',139,35.5,'politics','monitoring','아시아','JPN','경제안보·공급망 정책 모니터링 주제'],
 ['이란 주변 안보 긴장',52,33,'tension','worsening','중동','IRN','에너지와 금융시장 반응 연결 예시'],
 ['이스라엘 지역 안보',35,31.6,'interstate','unchanged','중동','ISR','지역 외교·국방 변화 모니터링 예시'],
 ['인도·파키스탄 관계',74.3,32.2,'territory','unchanged','아시아','IND','국경 분쟁과 외교 채널 추적 예시'],
 ['남중국해 해양 분쟁',114,13,'territory','unchanged','아시아','VNM','해양 물류와 역내 안보 이슈'],
 ['아프리카 사헬 안보',1,15,'civil','worsening','아프리카','ZAF','사헬 지역 안보 동향을 예시로 표현'],
 ['수단 분쟁 모니터링',30.8,13.2,'civil','worsening','아프리카','EGY','분쟁·난민·지역 물류 영향 주제'],
 ['콩고민주공화국 동부',29,-1.5,'civil','unchanged','아프리카','ZAF','광물 공급망과 안보 위험 분석 예시'],
 ['아르메니아·아제르바이잔',45,40,'territory','improving','유럽','TUR','외교 협상과 운송 회랑에 대한 분석 주제'],
 ['EU 산업·관세 정책',12,51,'trade','monitoring','유럽','DEU','유럽 무역·산업·규제 정책'],
 ['영국 통상협정',-1,53,'trade','monitoring','유럽','GBR','무역 협정 발표 및 시장 반응 분석'],
 ['미국 통상정책',-78,39,'sanctions','unchanged','아메리카','USA','통상조치와 주요 수입 업종의 영향 분석'],
 ['멕시코 치안·산업망',-101,23,'politics','unchanged','아메리카','MEX','치안 및 근거리 공급망 투자 이슈'],
 ['아이티 정치·치안',-72.3,18.9,'civil','worsening','아메리카','USA','카리브해 지역 정치·치안 분석 주제'],
 ['브라질 무역·재정',-47,-15.6,'trade','monitoring','아메리카','BRA','원자재 무역 및 국내 정책 분석'],
 ['캐나다 무역정책',-75,46,'trade','monitoring','아메리카','CAN','북미 공급망·교역 모니터링'],
 ['호주 핵심광물 공급망',133,-25,'trade','unchanged','오세아니아','AUS','광물·배터리 소재 공급망 분석 주제'],
 ['인도네시아 자원정책',117,-1,'sanctions','monitoring','아시아','IDN','니켈·자원 산업과 무역 정책'],
 ['튀르키예 지역 외교',35,39.5,'tension','improving','중동','TUR','지역 외교 및 경제 정책 검토 주제']
].map((e,i)=>({id:'demo'+i,title:e[0],lon:e[1],lat:e[2],type:e[3],status:e[4],region:e[5],country:e[6],detail:e[7],demo:true,impact:'regional',date:'',source:''}));
const state={page:'map', selected:null,tab:'market', search:'', types:new Set(),statuses:new Set(),regions:new Set(),events:store.get('events',[]),visits:store.get('visits',[]),view:{x:980,y:-60,w:1400,h:1000},drag:null,moved:false,compare:store.get('compare',['USA','CHN','JPN']),comparisonIndicator:'NY.GDP.MKTP.KD.ZG',countryQuery:'',countryRegion:'전체',newsCountry:'USA',newsCategory:'economy',macroCache:new Map(),macroLoading:new Set(),newsCache:new Map(),autoEvents:[],autoStatus:null,autoAvailable:false,autoBusy:false};
const typeLabel=k=>categories.find(x=>x[0]===k)?.[1]||k;
const stat = k=>statuses.find(x=>x[0]===k)||statuses[3];
const combined=()=>[...(state.autoAvailable?state.autoEvents:examples),...state.events];
const lonX=lon=>(lon+180)/360*1800;
const latY=lat=>(83-Math.max(-60,Math.min(83,lat)))/(83+60)*900;
function filtered(){return combined().filter(e=>(!state.search||(e.title+' '+(countryByIso[e.country]?.name||'')+' '+(countryByIso[e.country]?.english||'')+' '+e.region+' '+e.detail).toLowerCase().includes(state.search.toLowerCase()))&&(!state.types.size||state.types.has(e.type))&&(!state.statuses.size||state.statuses.has(e.status))&&(!state.regions.size||state.regions.has(e.region)))}
function toast(text){const e=$('#toast');e.textContent=text;e.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.add('hidden'),3100)}
function formatDate(s){if(!s)return '날짜 미등록';const d=new Date(s+'T12:00:00');return Number.isNaN(d.getTime())?s:d.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'})}
function makeFilters(){
 const make=(items,group)=>items.map(row=>{const [id,label,color]=row;const checked=state[group].has(id);return `<label class="filter-option"><input type="checkbox" data-filter-group="${group}" data-filter="${esc(id)}" ${checked?'checked':''}/><span>${esc(label)}</span>${color?`<i class="color-dot" style="background:${color}"></i>`:''}</label>`}).join('');
 $('#typeFilters').innerHTML=make(categories,'types');$('#statusFilters').innerHTML=make(statuses,'statuses');$('#regionFilters').innerHTML=make(regions.map(x=>[x,x]),'regions');
}
function refreshCountryExplorer(){
 const q=($('#countryQuickSearch')?.value||'').trim().toLocaleLowerCase();
 const matching=q?countries.filter(c=>(c.name+' '+c.english+' '+c.iso+' '+c.iso2).toLocaleLowerCase().includes(q)):[];
 const target=$('#quickCountryResults');if(!target)return;
 target.innerHTML=q?(matching.length?matching.slice(0,12).map(c=>`<button class="event-row" data-jump-country="${c.iso}"><span>${c.flag} ${esc(c.name)} <span class="muted">${esc(c.iso)}</span></span><span class="muted">↗</span></button>`).join('')+`<div class="source-note">${matching.length}개 검색됨 · 최대 12개 표시</div>`:'<div class="source-note">일치하는 국가·지역이 없습니다.</div>'):'<div class="source-note">국가명을 입력하면 전 세계 국가·지역을 찾습니다.</div>';
}
function renderCountriesWorkspace(){
 const q=state.countryQuery.trim().toLocaleLowerCase();
 const items=countries.filter(c=>(state.countryRegion==='전체'||c.region===state.countryRegion)&&(!q||(c.name+' '+c.english+' '+c.iso+' '+c.iso2).toLocaleLowerCase().includes(q)));
 $('#workspaceContent').innerHTML=`<div class="workspace-header"><div><div class="eyebrow">COUNTRY & TERRITORY DIRECTORY</div><h2>전 세계 국가·지역 탐색</h2><p>ISO 3166-1 국가·지역 249개와 코소보 연구 단위 1개를 검색할 수 있습니다. 국경 표시가 없는 소규모 지역도 목록에서 열 수 있습니다.</p></div><span class="pill">${items.length} / ${countries.length}개</span></div><section class="panel"><div class="form-row"><label class="field"><span>국가 검색 (한국어·영어·ISO)</span><input id="directorySearch" placeholder="예: 미얀마, Myanmar, MMR" value="${esc(state.countryQuery)}" autocomplete="off"/></label><label class="field"><span>지역</span><select id="directoryRegion">${['전체',...regions,'기타'].map(r=>`<option ${state.countryRegion===r?'selected':''}>${r}</option>`).join('')}</select></label></div><div id="directoryCountries" class="countries-directory">${items.map(c=>`<button class="directory-item" data-jump-country="${c.iso}"><span class="directory-flag">${c.flag}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.english)} · ${c.iso} · ${esc(c.region)}</small></span><span class="directory-arrow">↗</span></button>`).join('')||'<div class="empty-panel">검색 결과가 없습니다.</div>'}</div><p class="source-note">국가·지역은 모두 선택할 수 있지만, 시세·중앙은행·관료·방문 일정 데이터는 제공처별로 결측이 있을 수 있습니다. 기준 표기: ISO 3166-1 + 코소보.</p></section>`;
 $('#directorySearch').addEventListener('input',e=>{state.countryQuery=e.target.value;updateDirectoryList()});
 $('#directoryRegion').addEventListener('change',e=>{state.countryRegion=e.target.value;updateDirectoryList()});
}
function updateDirectoryList(){
 const q=state.countryQuery.trim().toLocaleLowerCase();const items=countries.filter(c=>(state.countryRegion==='전체'||c.region===state.countryRegion)&&(!q||(c.name+' '+c.english+' '+c.iso+' '+c.iso2).toLocaleLowerCase().includes(q)));
 $('#directoryCountries').innerHTML=items.map(c=>`<button class="directory-item" data-jump-country="${c.iso}"><span class="directory-flag">${c.flag}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.english)} · ${c.iso} · ${esc(c.region)}</small></span><span class="directory-arrow">↗</span></button>`).join('')||'<div class="empty-panel">검색 결과가 없습니다.</div>';
 const pill=$('#workspaceContent .workspace-header .pill');if(pill)pill.textContent=`${items.length} / ${countries.length}개`;
}
function jumpCountry(iso){navigate('map');openCountry(iso);const c=countryByIso[iso];if(!c?.coords)return;const [lon,lat]=c.coords;
 // Bring selected geography into view even when the low-resolution map lacks an outline.
 const w=state.view.w,h=state.view.h,x=lonX(lon)+1800,y=latY(lat);state.view.x=x-w*.52;state.view.y=y-h*.50;viewSet();
}
function renderEvents(){const events=filtered();$('#visibleEventCount').textContent=events.length;$('#filteredCounter').textContent=events.length+'개';
 const groups={};events.forEach(e=>(groups[e.region]??=[]).push(e));
 $('#sidebarEvents').innerHTML=Object.entries(groups).sort((a,b)=>regions.indexOf(a[0])-regions.indexOf(b[0])).map(([region,items])=>`<div class="group-label">${esc(region.toUpperCase())}</div>${items.map(e=>`<button class="event-row ${state.selected?.id===e.id?'selected':''}" data-open-event="${esc(e.id)}"><span>${esc(e.title)} ${e.auto?'<span class="auto-chip">AUTO</span>':''}</span><i class="color-dot" style="background:${stat(e.status)[2]}"></i></button>`).join('')}`).join('')||'<div class="empty-sidebar">조건에 맞는 사건이 없습니다.<br/>필터를 변경하거나 자동 수집 상태를 확인하세요.</div>';
 renderMarkers();
}
function renderMarkers(){const events=filtered();const html=events.flatMap(e=>[0,1800,3600].map(off=>{const x=lonX(e.lon)+off,y=latY(e.lat),color=stat(e.status)[2];return `<g class="event-marker ${state.selected?.id===e.id?'focused':''}" data-event-id="${esc(e.id)}"><circle class="dot-ring" cx="${x}" cy="${y}" r="12" stroke="${color}"/><circle class="dot-core" cx="${x}" cy="${y}" r="10.8" fill="${color}"/><title>${esc(e.title)}</title></g>`})).join('');$('#mapMarkers').innerHTML=html}
function setupGrid(){let l='';for(let x=0;x<=5400;x+=300)l+=`<line class="geo-line" x1="${x}" y1="0" x2="${x}" y2="900"/>`;for(let y=0;y<=900;y+=150)l+=`<line class="geo-line" x1="0" y1="${y}" x2="5400" y2="${y}"/>`;$('#gridLines').innerHTML=l;
 const oceans=[['Pacific Ocean',1950,510],['Indian Ocean',1310,700],['Atlantic Ocean',2480,540],['Pacific Ocean',150,510],['Arctic Ocean',1900,78]];
 $('#oceanLabels').innerHTML=oceans.map(([name,x,y])=>`<text class="ocean-label" x="${x}" y="${y}">${name}</text>`).join('')}
function viewSet(){const v=state.view;$('#worldMap').setAttribute('viewBox',`${v.x} ${v.y} ${v.w} ${v.h}`)}
function zoom(mult,px=.5,py=.5){const v=state.view,oldW=v.w,oldH=v.h;v.w=Math.max(450,Math.min(3200,v.w*mult));v.h=oldH*v.w/oldW;v.x+=(oldW-v.w)*px;v.y+=(oldH-v.h)*py;viewSet()}
function fitMap(){const el=$('#mapStage'),r=el.getBoundingClientRect();if(!r.width||!r.height)return;const mobile=r.width<700,h=mobile?900:1000,w=mobile?Math.max(400,r.width/r.height*h):Math.max(960,r.width/r.height*h);state.view={x:mobile?1250:1010,y:mobile?-20:-70,w,h:w*r.height/r.width};viewSet()}
function setupMap(){setupGrid();renderMarkers();fitMap();const svg=$('#worldMap');
 svg.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;state.drag={x:ev.clientX,y:ev.clientY,vx:state.view.x,vy:state.view.y,target:ev.target};state.moved=false;svg.setPointerCapture(ev.pointerId);svg.classList.add('dragging')});
 svg.addEventListener('pointermove',ev=>{
   if(state.drag){const r=svg.getBoundingClientRect();const dx=ev.clientX-state.drag.x,dy=ev.clientY-state.drag.y;if(Math.abs(dx)+Math.abs(dy)>5)state.moved=true;state.view.x=state.drag.vx-dx*state.view.w/r.width;state.view.y=state.drag.vy-dy*state.view.h/r.height;viewSet();$('#mapTooltip').classList.add('hidden');return}
   const marker=ev.target.closest?.('[data-event-id]'),country=ev.target.closest?.('.country-path, .country-pin');const tip=$('#mapTooltip');
   if(!marker&&!country){tip.classList.add('hidden');return}
   if(marker){const e=combined().find(q=>q.id===marker.dataset.eventId);if(!e)return;tip.innerHTML=`<strong>${esc(e.title)}</strong><small>${esc(typeLabel(e.type))} · ${esc(e.region)} · ${e.demo?'시연용':'직접 등록'}</small>`}
   else{const code=country.dataset.iso,c=countryByIso[code];tip.innerHTML=`<strong>${c?c.flag+' '+esc(c.name):esc(country.dataset.name)}</strong><small>클릭하여 국가 분석 패널 열기</small>`}
   const rect=$('#mapStage').getBoundingClientRect();tip.style.left=Math.min(rect.width-280,Math.max(10,ev.clientX-rect.left+16))+'px';tip.style.top=Math.min(rect.height-75,Math.max(10,ev.clientY-rect.top+16))+'px';tip.classList.remove('hidden');
 });
 svg.addEventListener('pointerup',ev=>{const was=state.moved,target=state.drag?.target||ev.target;state.drag=null;svg.classList.remove('dragging');if(was)return;const marker=target.closest?.('[data-event-id]'),country=target.closest?.('.country-path, .country-pin');if(marker){openEvent(marker.dataset.eventId)}else if(country){openCountry(country.dataset.iso,country.dataset.name)}});
 svg.addEventListener('pointercancel',()=>{state.drag=null;svg.classList.remove('dragging')});
 svg.addEventListener('mouseleave',()=>{$('#mapTooltip').classList.add('hidden')});
 svg.addEventListener('wheel',ev=>{ev.preventDefault();const r=svg.getBoundingClientRect();zoom(ev.deltaY>0?1.14:.88,(ev.clientX-r.left)/r.width,(ev.clientY-r.top)/r.height)},{passive:false});
 $('#zoomIn').onclick=()=>zoom(.78);$('#zoomOut').onclick=()=>zoom(1.25);$('#resetMap').onclick=()=>fitMap();window.addEventListener('resize',()=>{const r=$('#mapStage').getBoundingClientRect();if(r.width&&r.height){state.view.h=state.view.w*r.height/r.width;viewSet()}});
}
function closeDrawer(){state.selected=null;$('#insightDrawer').classList.add('hidden');$$('.country-path.is-selected, .country-pin.is-selected').forEach(e=>e.classList.remove('is-selected'));renderEvents()}
function openCountry(iso,geoName=''){const c=countryByIso[iso];if(!c){toast('국가 목록에서 검색해주세요: '+(geoName||iso));return;}state.selected={kind:'country',id:iso,c};state.tab='market';$('#insightDrawer').classList.remove('hidden');$$('.country-path.is-selected, .country-pin.is-selected').forEach(e=>e.classList.remove('is-selected'));$$(`[data-iso="${CSS.escape(iso)}"].country-path, [data-iso="${CSS.escape(iso)}"].country-pin`).forEach(e=>e.classList.add('is-selected'));renderDrawer();$('#sidebar').classList.remove('open')}
function openEvent(id){const e=combined().find(x=>x.id===id);if(!e)return;state.selected={kind:'event',id,e};$('#insightDrawer').classList.remove('hidden');renderDrawer();renderEvents();$('#sidebar').classList.remove('open')}
function formatMetric(item){if(!item||item.value==null)return '—';const n=Number(item.value);return Number.isFinite(n)?n.toFixed(2)+'%':'—'}
function latest(rows){return Array.isArray(rows)?rows.find(x=>x.value!==null&&x.value!==undefined):null}
const indMap={'growth':'NY.GDP.MKTP.KD.ZG','inflation':'FP.CPI.TOTL.ZG','unemployment':'SL.UEM.TOTL.ZS','trade':'NE.TRD.GNFS.ZS'};
async function loadMacro(c){if(state.macroCache.has(c.iso))return state.macroCache.get(c.iso);const result={};const getData=async (key,ind)=>{
  const direct=`https://api.worldbank.org/v2/country/${encodeURIComponent(c.iso2||c.iso)}/indicator/${ind}?format=json&per_page=14`;
  let res;try{res=await fetch(`/api/worldbank?country=${encodeURIComponent(c.iso2||c.iso)}&indicator=${ind}`,{signal:AbortSignal.timeout(9000)});if(!res.ok)throw new Error('no backend')}catch{res=await fetch(direct,{signal:AbortSignal.timeout(12000)})}
  if(!res.ok)throw new Error('World Bank '+res.status);const body=await res.json();return Array.isArray(body)&&Array.isArray(body[1])?body[1].filter(x=>x.value!=null).map(x=>({date:x.date,value:Number(x.value)})).sort((a,b)=>Number(b.date)-Number(a.date)):[]};
  const keys=Object.entries(indMap);const settled=await Promise.allSettled(keys.map(async ([key,ind])=>[key,await getData(key,ind)]));settled.forEach((s,i)=>{result[keys[i][0]]=s.status==='fulfilled'?s.value[1]:[]});state.macroCache.set(c.iso,result);return result;
}
function showMacro(c){const holder=$('#macroMetrics');if(!holder)return;
 holder.innerHTML='<div class="tabnote"><span class="loading-spinner"></span> 세계은행 거시경제 데이터를 불러오는 중…</div>';
 loadMacro(c).then(data=>{if(!$('#macroMetrics')||state.selected?.kind!=='country'||state.selected?.id!==c.iso)return;const names=[['growth','GDP 성장률'],['inflation','소비자물가 상승률'],['unemployment','실업률'],['trade','무역/GDP 비율']];const found=names.some(([k])=>data[k]?.length);
 holder.innerHTML=(found?`<div class="info-grid">${names.map(([k,n])=>{const row=latest(data[k]);return `<div class="info-card"><div class="info-label">${n}</div><div class="info-value">${formatMetric(row)}</div><div class="info-sub">${row?row.date+'년 발표 통계':'데이터 없음'}</div></div>`}).join('')}</div>`:'<div class="empty-panel">데이터에 연결하지 못했습니다. 인터넷 연결 및 World Bank API 접근을 확인하세요.</div>')+
 `<div class="source-note">데이터 출처: World Bank API. 발표 연도는 지표마다 다를 수 있으며 실시간 수치가 아닙니다. 지표는 추후 수정될 수 있습니다.</div><div class="button-row"><a class="btn outline smallbtn" target="_blank" rel="noopener noreferrer" href="https://data.worldbank.org/country/${encodeURIComponent(c.iso2.toLowerCase())}">원본 국가 통계 ↗</a></div>`;
 }).catch(()=>{if($('#macroMetrics'))holder.innerHTML='<div class="empty-panel">세계은행 API 연결 실패. 네트워크를 확인해 주세요.</div>'})}
function tabContent(c,tab){if(tab==='market')return `<div class="section-label">대표 주가지수</div>${c.markets?.length?c.markets.map(m=>`<div class="market-item"><span>${esc(m)}</span><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/finance/">시장 조회 ↗</a></div>`).join(''):'<div class="tabnote">대표 주가지수 자료가 아직 등록되지 않았습니다. 자료가 없는 것은 주식시장이 존재하지 않는다는 뜻은 아닙니다.</div>'}${c.exchange?`<div class="section-label">증권거래소</div><div class="market-item">${esc(c.exchange)}</div>`:''}<div class="section-label">국가 정보</div><div class="info-grid"><div class="info-card"><div class="info-label">영문 국가·지역명</div><div class="info-value" style="font-size:12px">${esc(c.english)}</div></div><div class="info-card"><div class="info-label">국가 코드</div><div class="info-value">${esc(c.iso)} / ${esc(c.iso2)}</div></div><div class="info-card"><div class="info-label">통화</div><div class="info-value">${esc(c.currency)}</div></div><div class="info-card"><div class="info-label">중앙은행</div><div class="info-value" style="font-size:12px">${esc(c.bank)}</div></div></div><div class="source-note">개별 주가지수의 실시간 수치는 표시하지 않습니다. 현재는 지수 목록과 시장 탐색 기능을 제공합니다. 실시간 가격은 계약된 시세 API를 연결해야 합니다.</div>`;
 if(tab==='macro')return '<div id="macroMetrics"></div>';
 if(tab==='diplomacy'){const v=state.visits.filter(x=>x.from===c.iso||x.to===c.iso).sort((a,b)=>a.date.localeCompare(b.date));return `<div class="section-label">등록된 외교 방문 일정 <span class="pill">${v.length}건</span></div>${v.length?v.map(visitCard).join(''):'<div class="empty-panel">등록된 외교 일정이 없습니다.<br/>공식 발표 링크를 확인한 후 일정을 추가하세요.</div>'}<div class="section-label">자동 수집된 외교 관련 보도 <span class="pill">${state.autoEvents.filter(e=>e.countries.includes(c.iso)&&e.kind==='diplomacy').length}건</span></div>${state.autoEvents.filter(e=>e.countries.includes(c.iso)&&e.kind==='diplomacy').slice(0,15).map(eventShort).join('')||'<div class="empty-panel">수집된 외교 보도가 없습니다.</div>'}<div class="button-row"><button class="btn" data-page-go="intel">자동 수집 확인 →</button></div><div class="source-note">자동 수집 뉴스에서 외교 방문 날짜를 추측하지 않으며 공식 확인 일정은 별도 확인합니다.</div>`}
 if(tab==='security')return `<div class="section-label">관련 사건 모니터링</div>${combined().filter(e=>e.country===c.iso&&e.type!=='trade').map(eventShort).join('')||'<div class="empty-panel">등록된 관련 사건이 없습니다.</div>'}<div class="source-note">샘플 마커의 위험 상태는 실제 최신 안보 평가가 아닙니다. 공식 국방부·정부 발표와 출처 검증이 필요합니다.</div>`;
 if(tab==='trade')return `<div class="section-label">통상·산업 관련 이슈</div>${combined().filter(e=>e.country===c.iso&&['trade','sanctions'].includes(e.type)).map(eventShort).join('')||'<div class="empty-panel">등록된 통상 관련 사건이 없습니다.</div>'}<div class="button-row"><a class="btn outline smallbtn" target="_blank" rel="noopener noreferrer" href="https://comtradeplus.un.org/">UN Comtrade ↗</a><a class="btn outline smallbtn" target="_blank" rel="noopener noreferrer" href="https://www.wto.org/">WTO ↗</a></div>`;
 if(tab==='news')return '<div id="countryNews" class="tabnote"><span class="loading-spinner"></span> 뉴스를 검색 중…</div>';
 return ''}
function eventShort(e){return `<button class="event-row" style="width:100%;padding:12px 0;border-bottom:1px solid #27313d" data-open-event="${esc(e.id)}"><span>${esc(e.title)} ${e.demo?'<span class="muted">· 샘플</span>':''}</span><i class="color-dot" style="background:${stat(e.status)[2]}"></i></button>`}
function visitCard(v){const a=countryByIso[v.from],b=countryByIso[v.to];return `<div class="saved-record"><div class="record-tag">${esc(v.status)} · ${formatDate(v.date)}</div><div class="record-title">${esc(v.person)} ${esc(v.role||'')} — ${esc(a?.name||v.from)} → ${esc(b?.name||v.to)}</div><div class="record-sub">${esc(v.purpose||'방문 의제 미등록')}</div>${v.source?`<div class="record-actions"><a class="outlink" href="${esc(safeUrl(v.source))}" target="_blank" rel="noopener noreferrer">공식 근거 ↗</a></div>`:''}<div class="record-actions"><button class="btn outline smallbtn" data-edit-visit="${esc(v.id)}">수정</button><button class="btn danger smallbtn" data-delete-visit="${esc(v.id)}">삭제</button></div></div>`}
function safeUrl(raw){try{const u=new URL(raw);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch{return '#'}}
function renderDrawer(){const s=state.selected;if(!s)return;const body=$('#insightContent');if(s.kind==='event'){
 const e=s.e,c=countryByIso[e.country];body.innerHTML=`<div class="drawer-top"><button class="drawer-close" data-close-drawer>×</button><div class="eyebrow">GEO-POLITICAL EVENT · ${esc(e.region.toUpperCase())}</div><div class="drawer-heading">${esc(e.title)}</div><div class="drawer-subtitle">${esc(c?.flag||'🌐')} ${esc(c?.name||e.region)} · ${esc(typeLabel(e.type))}</div><div class="event-meta"><span class="chip">${esc(stat(e.status)[1])}</span><span class="chip">${e.demo?'시연용 사례':e.auto?'자동 수집 · 사실 미검증':'사용자 등록 사건'}</span></div></div><div class="drawer-body"><div class="section-label">사건 개요</div><p class="tabnote">${esc(e.detail||'설명이 등록되지 않았습니다.')}</p><div class="section-label">이벤트 메타데이터</div><div class="detail-list"><div class="detail-pair"><span class="key">유형</span><span class="val">${esc(typeLabel(e.type))}</span></div><div class="detail-pair"><span class="key">추적 상태</span><span class="val">${esc(stat(e.status)[1])}${e.demo?' (시연용)':e.auto?' (분쟁 추세 판정 아님)':''}</span></div><div class="detail-pair"><span class="key">사건 날짜</span><span class="val">${esc(e.date||'미등록')}</span></div><div class="detail-pair"><span class="key">근거 자료</span><span class="val">${e.source?`<a href="${esc(safeUrl(e.source))}" target="_blank" rel="noopener noreferrer">등록된 원문 링크 ↗</a>`:'미등록 — 실제 확인 불가'}</span></div></div><div class="source-note">${e.demo?'이 항목은 화면 작동을 보여주기 위한 가상의 상태 분류입니다. 실시간 분쟁 상태나 예측으로 사용하지 마세요.':e.auto?'제목 또는 요약을 자동 분류했습니다. 보도 자체는 사건의 공식 확정 또는 상황 악화를 입증하지 않습니다. 반드시 출처를 확인하세요.':'사용자가 입력한 정보입니다. 별도 사실 검증을 거치지 않았습니다.'}</div><div class="button-row">${e.auto?`<a class="btn outline" href="${esc(safeUrl(e.source))}" target="_blank" rel="noopener noreferrer">뉴스 원문 ↗</a>`:''}${c?`<button class="btn" data-open-country="${esc(c.iso)}">${esc(c.name)} 분석 →</button>`:''}${!e.demo&&!e.auto?`<button class="btn outline" data-edit-event="${esc(e.id)}">수정</button><button class="btn danger" data-delete-event="${esc(e.id)}">삭제</button>`:''}</div></div>`;
 }else{
 const c=s.c;body.innerHTML=`<div class="drawer-top"><button class="drawer-close" data-close-drawer>×</button><div class="eyebrow">COUNTRY INTELLIGENCE · ${esc(c.region.toUpperCase())}</div><div class="drawer-heading">${c.flag} ${esc(c.name)}</div><div class="drawer-subtitle">${esc(c.city)} · ${esc(c.currency)} · ${esc(c.bank==='확인 필요'?'중앙은행 미등록':c.bank)}</div></div><div class="drawer-tabs">${[['market','금융시장'],['macro','거시경제'],['diplomacy','외교'],['security','국방·안보'],['trade','통상'],['news','뉴스']].map(([id,title])=>`<button class="drawer-tab ${state.tab===id?'active':''}" data-drawer-tab="${id}">${title}</button>`).join('')}</div><div class="drawer-body">${tabContent(c,state.tab)}</div>`;
 if(state.tab==='macro')showMacro(c);
 if(state.tab==='news')showCountryNews(c);
 }}
function navigate(page){state.page=page;$$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#currentViewLabel').textContent=({map:'세계 상황판',countries:'국가 목록',calendar:'외교 일정',compare:'국가 비교',news:'뉴스 팔로업',intel:'자동 인텔리전스'})[page]||page;$('#workspace').classList.toggle('hidden',page==='map');$('#mapStage').classList.toggle('hidden',page!=='map');$('#insightDrawer').classList.add('hidden');$('#sidebar').classList.remove('open');if(page==='countries')renderCountriesWorkspace();if(page==='calendar')renderCalendar();if(page==='compare')renderCompare();if(page==='news')renderNewsWorkspace();if(page==='intel')renderIntelWorkspace()}
function optionsCountries(selected='',exclude=''){return countries.filter(x=>x.iso!==exclude).map(x=>`<option value="${x.iso}" ${x.iso===selected?'selected':''}>${x.flag} ${esc(x.name)}</option>`).join('')}
function renderCalendar(editId=''){const v=state.visits.find(x=>x.id===editId)||null, sorted=[...state.visits].sort((a,b)=>a.date.localeCompare(b.date));
 $('#workspaceContent').innerHTML=`<div class="workspace-header"><div><div class="eyebrow">DIPLOMATIC CALENDAR</div><h2>외교 방문 · 국제 일정</h2><p>정상, 외교장관, 재무·통상 고위급 인사 방문을 출처와 함께 기록하고 국가별로 추적합니다.</p></div><button class="btn outline" id="exportVisits">일정 CSV 내보내기 ↓</button></div><div class="workspace-grid"><section class="panel"><h3>${v?'외교 일정 수정':'새 외교 일정 등록'}</h3><form id="visitForm"><input type="hidden" name="id" value="${esc(v?.id||'')}"/><div class="form-row"><div class="field"><span>방문 인물 이름 *</span><input name="person" required placeholder="방문 인물 이름" value="${esc(v?.person||'')}"/></div><div class="field"><span>직책</span><input name="role" placeholder="국가원수, 외교장관…" value="${esc(v?.role||'')}"/></div></div><div class="form-row"><div class="field"><span>출발 국가 *</span><select name="from">${optionsCountries(v?.from||'USA')}</select></div><div class="field"><span>방문 국가 *</span><select name="to">${optionsCountries(v?.to||'CHN')}</select></div></div><div class="form-row"><div class="field"><span>방문 시작일 *</span><input type="date" name="date" required value="${esc(v?.date||'')}"/></div><div class="field"><span>일정 상태</span><select name="status">${['공식 확정','언론 보도·미확정','변경·연기','종료','취소'].map(x=>`<option ${x===v?.status?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="field"><span>방문 목적 및 회담 의제</span><textarea name="purpose" placeholder="회담 상대, 논의 예정 주제, 관련 산업…">${esc(v?.purpose||'')}</textarea></div><div class="field"><span>근거 URL (가능하면 정부 공식 발표)</span><input type="url" name="source" placeholder="https://..." value="${esc(v?.source||'')}"/></div><div class="button-row"><button type="submit" class="btn">${v?'변경사항 저장':'일정 저장'}</button>${v?'<button type="button" class="btn outline" id="cancelVisitEdit">수정 취소</button>':''}</div></form><div class="source-note">AI는 외교 방문 및 정상회담 관련 보도를 자동 수집합니다. 단, 보도에 명시되지 않은 정확한 방문 날짜를 만들어내지 않으며, 공식 방문 일정 확정 기능은 추가 검증이 필요합니다.</div></section><section class="panel"><h3>저장된 외교 일정 <span class="pill">${sorted.length}건</span></h3><div id="visitRecords">${sorted.length?sorted.map(visitCard).join(''):'<div class="empty-panel">등록된 일정이 없습니다.<br/>오른쪽(모바일에서는 위)의 양식으로 일정을 추가해 보세요.</div>'}</div></section><section class="panel full-span"><h3>자동 수집된 외교 보도 <span class="pill">${state.autoEvents.filter(x=>x.kind==='diplomacy').length}건</span></h3><p class="source-note">정상 방문 일정은 날짜·장소·공식 확인이 있는 경우에만 확정 표시할 수 있습니다. 이 목록은 관련 보도 모니터링입니다.</p>${state.autoEvents.filter(x=>x.kind==='diplomacy').slice(0,20).map(eventShort).join('')||'<div class="empty-panel">아직 수집된 외교 보도가 없습니다. 자동 수집 메뉴에서 상태를 확인하세요.</div>'}</section><section class="panel full-span"><h3>외교 일정 공식 자료 바로가기</h3><div class="link-grid">${[['대한민국 외교부','https://www.mofa.go.kr/'],['미국 국무부','https://www.state.gov/'],['중국 외교부','https://www.fmprc.gov.cn/eng/'],['일본 외무성','https://www.mofa.go.jp/'],['EU 이사회 일정','https://www.consilium.europa.eu/en/meetings/calendar/'],['UN 회의 및 행사','https://www.un.org/en/']].map(([name,url])=>`<a class="outlink" style="display:inline-block;margin:9px 15px 9px 0" target="_blank" rel="noopener noreferrer" href="${url}">${name} ↗</a>`).join('')}</div></section></div>`;
 $('#visitForm').addEventListener('submit',onSaveVisit);$('#exportVisits').onclick=()=>exportCSV('diplomatic_visits.csv',[['인물','직책','출발','도착','방문일','상태','의제','출처'],...sorted.map(x=>[x.person,x.role,x.from,x.to,x.date,x.status,x.purpose,x.source])]);if($('#cancelVisitEdit'))$('#cancelVisitEdit').onclick=()=>renderCalendar();}
function onSaveVisit(evt){evt.preventDefault();const f=new FormData(evt.target),x=Object.fromEntries(f.entries());if(x.from===x.to){toast('출발 국가와 방문 국가는 달라야 합니다.');return}if(!x.person.trim()||!x.date){toast('인물 이름과 날짜를 입력하세요.');return}x.id=x.id||'visit_'+Date.now();const i=state.visits.findIndex(v=>v.id===x.id);if(i>=0)state.visits[i]=x;else state.visits.push(x);store.set('visits',state.visits);toast('외교 일정이 브라우저에 저장되었습니다.');renderCalendar()}
function renderCompare(){const checked=state.compare;const i=state.comparisonIndicator;$('#workspaceContent').innerHTML=`<div class="workspace-header"><div><div class="eyebrow">CROSS-COUNTRY RESEARCH</div><h2>국가 간 거시경제 비교</h2><p>세계은행의 실제 연간 통계를 가져와 선택 국가의 시계열을 같은 차트에 표시합니다.</p></div><button class="btn outline" id="exportCompare" disabled>데이터 CSV ↓</button></div><div class="panel" style="margin-bottom:16px"><h3>비교 국가 선택 <span class="pill">최대 4개</span></h3><div class="compare-selector">${countries.map(c=>`<button class="country-choice ${checked.includes(c.iso)?'active':''}" data-compare-country="${c.iso}">${c.flag} ${esc(c.name)}</button>`).join('')}</div><div class="field" style="max-width:330px;margin-top:20px"><span>비교 지표</span><select id="compareIndicator">${[['NY.GDP.MKTP.KD.ZG','실질 GDP 성장률 (%)'],['FP.CPI.TOTL.ZG','소비자물가 상승률 (%)'],['SL.UEM.TOTL.ZS','실업률 (%)'],['NE.TRD.GNFS.ZS','무역/GDP 비율 (%)']].map(([k,v])=>`<option value="${k}" ${k===i?'selected':''}>${v}</option>`).join('')}</select></div></div><div class="workspace-grid"><section class="panel full-span"><h3>국가별 시계열 비교</h3><div id="compareChart" class="chart-wrap"><div class="tabnote"><span class="loading-spinner"></span> 세계은행 API 연결 중…</div></div><div id="compareLegend" class="legend-inline"></div></section><section class="panel full-span"><h3>최근 발표된 값</h3><div id="compareTable" class="tabnote">불러오는 중…</div></section></div>`;$('#compareIndicator').onchange=e=>{state.comparisonIndicator=e.target.value;renderCompare()};fetchCompareData()}
async function fetchCompareData(){const selected=state.compare.map(iso=>countryByIso[iso]).filter(Boolean), key=Object.keys(indMap).find(k=>indMap[k]===state.comparisonIndicator);const chart=$('#compareChart');if(!selected.length){chart.innerHTML='<div class="empty-panel">국가를 하나 이상 선택해 주세요.</div>';$('#compareTable').innerHTML='';return}
 try{const fetched=await Promise.all(selected.map(async c=>({country:c,rows:(await loadMacro(c))[key]||[]})));if(state.page!=='compare')return;const rows=fetched.filter(x=>x.rows.length);if(!rows.length){chart.innerHTML='<div class="empty-panel">연결 가능한 데이터가 없습니다. 인터넷 연결을 확인해 주세요.</div>';$('#compareTable').innerHTML='데이터 없음';return}
 const years=[...new Set(rows.flatMap(r=>r.rows.map(x=>+x.date)))].sort((a,b)=>a-b).slice(-11);const vals=rows.flatMap(r=>r.rows.filter(x=>years.includes(+x.date)).map(x=>x.value));let ymin=Math.min(...vals),ymax=Math.max(...vals);if(ymin===ymax){ymin-=1;ymax+=1}const pad=(ymax-ymin)*.1;ymin-=pad;ymax+=pad;
 const W=900,H=260,ox=55,oy=20,pw=W-90,ph=H-60;
 const xPos=y=>ox+((years.indexOf(y))/Math.max(1,years.length-1))*pw;
 const yPos=v=>oy+ph-(v-ymin)/(ymax-ymin)*ph;
 const colors=['#67a7f3','#ef9c62','#39c5a4','#ba9def'];const paths=rows.map((r,j)=>{const pts=r.rows.filter(q=>years.includes(+q.date)).sort((a,b)=>+a.date-+b.date).map(q=>[xPos(+q.date),yPos(q.value)]);return `<path d="${pts.map((p,i)=>(i?'L':'M')+p.join(',')).join(' ')}" fill="none" stroke="${colors[j%colors.length]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="${colors[j%colors.length]}"/>`).join('')}`}).join('');
 const grid=Array.from({length:5},(_,i)=>{const v=ymin+i*(ymax-ymin)/4,yy=yPos(v);return `<line x1="${ox}" x2="${ox+pw}" y1="${yy}" y2="${yy}"/><text x="${ox-10}" y="${yy+4}" text-anchor="end">${v.toFixed(1)}</text>`}).join('');
 chart.innerHTML=`<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="국가별 거시경제 지표 비교 차트"><g>${grid}</g>${years.map(y=>`<text x="${xPos(y)}" y="${H-13}" text-anchor="middle">${y}</text>`).join('')}${paths}</svg>`;
 $('#compareLegend').innerHTML=rows.map((r,j)=>`<span><i style="background:${colors[j%colors.length]}"></i>${r.country.flag} ${esc(r.country.name)}</span>`).join('');
 $('#compareTable').innerHTML=`<table class="data-table"><thead><tr><th>국가</th><th>값</th><th>기준연도</th></tr></thead><tbody>${fetched.map(r=>{const v=latest(r.rows);return `<tr><td>${r.country.flag} ${esc(r.country.name)}</td><td>${formatMetric(v)}</td><td>${v?.date||'—'}</td></tr>`}).join('')}</tbody></table><div class="source-note">출처: World Bank API · 국가와 지표에 따라 데이터 발표 시점이 다릅니다.</div>`;
 $('#exportCompare').disabled=false;$('#exportCompare').onclick=()=>exportCSV('macro_comparison.csv',[['국가','ISO3','연도','지표코드','값'],...fetched.flatMap(r=>r.rows.map(p=>[r.country.name,r.country.iso,p.date,state.comparisonIndicator,p.value]))]);
 }catch{chart.innerHTML='<div class="empty-panel">데이터를 불러오지 못했습니다. 인터넷을 확인해 주세요.</div>';$('#compareTable').textContent='네트워크 오류'} }
async function getNews(country,category){const ck=`${country}|${category}`;if(state.newsCache.has(ck))return state.newsCache.get(ck);
 const search={'economy':'economy OR inflation OR central bank','diplomacy':'foreign minister OR summit OR diplomatic visit','defense':'defense OR security policy OR military','trade':'tariff OR trade agreement OR export control'}[category]||'economy';
 const full=`(${search}) ${countryByIso[country]?.name==='미국'?'US':countryByIso[country]?.name||'global'}`;
 const res=await fetch(`/api/news?country=${encodeURIComponent(country)}&category=${encodeURIComponent(category)}&query=${encodeURIComponent(full)}`,{signal:AbortSignal.timeout(13000)});if(!res.ok)throw Error('news API '+res.status);const data=await res.json();if(!Array.isArray(data.articles))throw Error('invalid news data');state.newsCache.set(ck,data.articles);return data.articles;
}
const newsLinks=[['Google 뉴스에서 검색','https://news.google.com/'],['GDELT 뉴스 데이터','https://www.gdeltproject.org/'],['Reuters 세계 뉴스','https://www.reuters.com/world/'],['미국 국무부','https://www.state.gov/'],['EU 이사회','https://www.consilium.europa.eu/']];
function newsCards(articles){return articles.map(a=>`<div class="news-item"><div class="tag">${esc(a.source||'뉴스')} · ${esc(a.date||'')}</div><a target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(a.url))}">${esc(a.title||'기사')} ↗</a><p>출처: ${esc(a.domain||a.source||'')} · 자동 수집된 뉴스 (사실 확인 별도)</p></div>`).join('')}
function newsFallback(msg){return `<div class="empty-panel">${esc(msg)}<br/>서버를 실행하고 연결을 확인하세요.</div><div class="section-label">수동 자료 검색</div>${newsLinks.map(([n,u])=>`<div class="market-item"><a href="${u}" target="_blank" rel="noopener noreferrer">${esc(n)} ↗</a></div>`).join('')}`}
function showCountryNews(c){const el=$('#countryNews');if(!el)return;getNews(c.iso,'economy').then(items=>{if(state.selected?.id!==c.iso||state.tab!=='news'||!$('#countryNews'))return;el.innerHTML=items.length?newsCards(items.slice(0,6)):newsFallback('최근 확인된 기사가 없거나 제공자가 응답하지 않습니다.')}).catch(()=>{if($('#countryNews'))el.innerHTML=newsFallback('뉴스 API 연결 실패')})}
function renderNewsWorkspace(){const c=countryByIso[state.newsCountry];$('#workspaceContent').innerHTML=`<div class="workspace-header"><div><div class="eyebrow">NEWS & POLICY INTELLIGENCE</div><h2>국가별 뉴스 팔로업</h2><p>국가·주제별 최신 보도를 확인합니다. 기사는 GDELT 연결이 가능한 서버 환경에서만 나타납니다.</p></div><a class="btn outline" href="https://www.gdeltproject.org/" target="_blank" rel="noopener noreferrer">GDELT 원본 ↗</a></div><div class="panel" style="margin-bottom:16px"><div class="form-row"><div class="field"><span>추적 국가</span><select id="newsCountry">${optionsCountries(state.newsCountry)}</select></div><div class="field"><span>분석 주제</span><select id="newsCategory">${[['economy','경제·금융'],['diplomacy','외교·정상회담'],['defense','국방·안보'],['trade','통상·관세']].map(([k,n])=>`<option value="${k}" ${state.newsCategory===k?'selected':''}>${n}</option>`).join('')}</select></div></div></div><div class="workspace-grid"><section class="panel full-span"><h3>${c.flag} ${esc(c.name)} · 최근 뉴스</h3><div id="newsResults" class="tabnote"><span class="loading-spinner"></span> 데이터를 검색하고 있습니다…</div></section></div>`;
 $('#newsCountry').onchange=e=>{state.newsCountry=e.target.value;renderNewsWorkspace()};$('#newsCategory').onchange=e=>{state.newsCategory=e.target.value;renderNewsWorkspace()};
 getNews(state.newsCountry,state.newsCategory).then(articles=>{if(state.page==='news'&&$('#newsResults'))$('#newsResults').innerHTML=articles.length?newsCards(articles.slice(0,18)):newsFallback('조건에 맞는 기사를 찾지 못했습니다.')}).catch(()=>{if($('#newsResults'))$('#newsResults').innerHTML=newsFallback('외부 뉴스 연결이 불가능합니다.')});}
function exportCSV(filename,rows){const data='\ufeff'+rows.map(r=>r.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8;'}));a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function modal(html){$('#modalContent').innerHTML=html;$('#modalBackdrop').classList.remove('hidden')}
function closeModal(){$('#modalBackdrop').classList.add('hidden')}
function eventEditor(id=''){const e=state.events.find(x=>x.id===id),curr=e||{};
 modal(`<div class="modal-head"><h3>${e?'지도 사건 수정':'새 지도 사건 등록'}</h3><button data-close-modal aria-label="닫기">×</button></div><p>직접 확인한 정책·외교·안보 사건을 지도에 추가할 수 있습니다. 자동 검증되지 않은 사용자 자료입니다.</p><form id="eventForm"><input name="id" type="hidden" value="${esc(curr.id||'')}"/><div class="field"><span>사건 제목 *</span><input required name="title" maxlength="130" value="${esc(curr.title||'')}" placeholder="예: 신규 관세 발표"/></div><div class="form-row"><div class="field"><span>관련 국가</span><select name="country">${optionsCountries(curr.country||'USA')}</select></div><div class="field"><span>사건 유형</span><select name="type">${categories.map(([id,n])=>`<option value="${id}" ${id===curr.type?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="form-row"><div class="field"><span>상태 (사용자 평가)</span><select name="status">${statuses.map(([id,n])=>`<option value="${id}" ${id===(curr.status||'monitoring')?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><span>사건 날짜</span><input type="date" name="date" value="${esc(curr.date||'')}"/></div></div><div class="field"><span>내용·경제적 영향 경로</span><textarea name="detail" placeholder="사건 개요, 영향받는 산업, 가능한 경제적 경로">${esc(curr.detail||'')}</textarea></div><div class="field"><span>근거 출처 URL</span><input type="url" name="source" placeholder="https://..." value="${esc(curr.source||'')}"/></div><button type="submit" class="btn">지도에 저장</button></form>`);
 $('#eventForm').onsubmit=eve=>{eve.preventDefault();const d=Object.fromEntries(new FormData(eve.target).entries()),c=countryByIso[d.country];if(!c)return;const obj={...d,id:d.id||'user_'+Date.now(),lon:c.coords[0],lat:c.coords[1],region:c.region,demo:false,impact:'regional'};const index=state.events.findIndex(x=>x.id===obj.id);if(index>=0)state.events[index]=obj;else state.events.push(obj);store.set('events',state.events);closeModal();renderEvents();navigate('map');openEvent(obj.id);toast('사용자 사건이 지도에 추가되었습니다.')};}

function autoRow(raw){
 const codes=Array.isArray(raw.countries)?raw.countries.filter(k=>countryByIso[k]):[];
 const c=countryByIso[codes[0]];
 if(!c||!Array.isArray(c.coords))return null;
 return {id:raw.id,title:raw.title,lon:c.coords[0],lat:c.coords[1],type:raw.event_type||'tension',
 status:'monitoring',region:c.region||'아시아',country:c.iso,countries:codes,
 detail:(raw.summary||'')+'\n분류: '+(raw.classification||'자동 분류')+' · 근거 수준: '+(raw.evidence||'뉴스 보도'),
 source:raw.url,date:raw.date||'',auto:true,kind:raw.kind,reportedSource:raw.source,
 evidence:raw.evidence,classification:raw.classification,confidence:raw.confidence};
}
async function loadAutoIntel(){
 try{
  const res=await fetch('/api/intel/events?limit=750',{signal:AbortSignal.timeout(8000),cache:'no-store'});
  if(!res.ok)throw Error('server unavailable');
  const data=await res.json();
  state.autoEvents=(data.events||[]).map(autoRow).filter(Boolean);
  state.autoStatus=data.status;state.autoAvailable=true;
  const ok=(data.status?.sources_ok||[]).length>0;
  const label=ok?'자동 수집 연결 · '+state.autoEvents.length+'건':
     '자동 수집 서버 연결 · 출처 응답 확인 필요';
  const bar=$('#intelSidebarStatus');if(bar)bar.textContent=label;
  const note=$('#mapModeNotice');if(note)note.textContent='● 지도 마커는 뉴스 제목·요약 기반 자동 수집이며 사실·위험도 확정이 아닙니다.';
  renderEvents();if(state.page==='intel')renderIntelWorkspace();
  if(state.selected?.kind==='event'&&state.selected?.e?.auto){const update=state.autoEvents.find(x=>x.id===state.selected.id);if(update){state.selected.e=update;renderDrawer()}}
 }catch(e){
  const label=$('#intelSidebarStatus');if(label)label.textContent='단독 데모 · 자동 수집은 Python 서버 실행 필요';
  if(state.page==='intel')renderIntelWorkspace();
 }
}
function intelCard(e){
 const co=(e.countries||[]).map(k=>countryByIso[k]?.flag+' '+countryByIso[k]?.name).join(' · ');
 return `<div class="intel-card"><div class="intel-meta"><span class="auto-chip">자동 수집</span> ${esc(typeLabel(e.type))} · ${esc(e.date||'발표일 미확인')} · ${esc(e.reportedSource||'')}</div>
 <button class="intel-title" data-open-event="${esc(e.id)}">${esc(e.title)}</button>
 <div class="intel-countries">${esc(co)} · ${esc(e.classification||'분류 정보 없음')}</div>
 <div class="intel-summary">${esc(e.detail||'')}</div>
 <a target="_blank" rel="noopener noreferrer" class="outlink" href="${esc(safeUrl(e.source))}">원문 확인 ↗</a></div>`;
}
function renderIntelWorkspace(){
 const st=state.autoStatus,ev=state.autoEvents;
 const mode=st?.mode||'자동 수집 서버 미연결';
 const errs=st?.errors||[];
 $('#workspaceContent').innerHTML=`<div class="workspace-header"><div><div class="eyebrow">AUTO INTELLIGENCE ENGINE</div><h2>외교 · 국방 · 통상 자동 모니터링</h2><p>국제 뉴스 및 공개 정부 발표를 자동 탐색·분류하고 관련 국가를 연결합니다. 수집 기사 자체는 사건의 확정이 아닙니다.</p></div><div class="button-row"><button class="btn" id="refreshIntel" ${st?.running?'disabled':''}>${st?.running?'수집 중…':'지금 수집'}</button><button class="btn outline" id="exportIntel">CSV 내보내기 ↓</button></div></div>
 <div class="intel-stats"><div class="intel-stat"><span>저장된 자동 사건</span><strong>${st?.saved_count??'—'}</strong></div><div class="intel-stat"><span>화면 로드</span><strong>${ev.length}</strong></div><div class="intel-stat"><span>확인된 피드</span><strong>${st?.sources_ok?.length??0}</strong></div><div class="intel-stat"><span>마지막 수집 시도</span><strong style="font-size:13px">${esc(st?.last_attempt?.replace('T',' ').slice(0,16)||'없음')} UTC</strong></div></div>
 <section class="panel" style="margin-bottom:15px"><h3>수집 엔진 상태</h3><div class="detail-list"><div class="detail-pair"><span class="key">분류 방식</span><span class="val">${esc(mode)}</span></div><div class="detail-pair"><span class="key">자동 갱신 주기</span><span class="val">${st?.interval_minutes||'—'}분 (서버 실행 중)</span></div><div class="detail-pair"><span class="key">성공한 출처</span><span class="val">${esc((st?.sources_ok||[]).join(' / ')||'아직 성공 확인 불가')}</span></div><div class="detail-pair"><span class="key">연결 오류</span><span class="val">${esc(errs.length?errs.slice(0,3).join(' / '):'없음')}</span></div></div><div class="source-note">AI 모델의 구조화는 OPENAI_API_KEY가 서버에 설정되어 있을 때만 작동합니다. 뉴스 기반 상태는 모두 ‘추적 중’이며, 자동으로 악화·개선이나 공식 방문 날짜를 판정하지 않습니다.</div></section>
 <section class="panel"><h3>수집된 국가 간 외교 · 안보 · 통상 이벤트 <span class="pill">${ev.length}건 표시</span></h3><div class="intel-records">${ev.length?ev.slice(0,150).map(intelCard).join(''):'<div class="empty-panel">아직 데이터가 없습니다. 잠시 기다렸다가 ‘지금 수집’을 눌러 주세요. 인터넷 또는 데이터 제공자에 문제가 있을 수 있습니다.</div>'}</div></section>`;
}
async function refreshIntelNow(){
 try{
  const r=await fetch('/api/intel/refresh',{method:'POST',signal:AbortSignal.timeout(6000)});
  if(!r.ok)throw Error();
  const data=await r.json();toast(data.message||'수집 요청을 보냈습니다.');
  await loadAutoIntel();
 }catch{toast('서버에 연결하지 못했습니다. start_windows.bat을 실행하세요.');}
}
function exportAutoIntel(){const x=state.autoEvents;exportCSV('gmi_auto_intelligence.csv',[
 ['제목','유형','국가 코드','보도일','기사 출처','구분','근거','링크'],
 ...x.map(e=>[e.title,e.kind,e.countries.join(';'),e.date,e.reportedSource,e.classification,e.evidence,e.source])]);}

function help(){modal(`<div class="modal-head"><h3>GMI 사용 가이드</h3><button data-close-modal>×</button></div><p>첨부한 CFR 스타일을 참고한 거시경제·지정학 연구용 작동 데모입니다.</p><div class="detail-list"><div class="detail-pair"><span class="key">국가 목록</span><span class="val">250개 국가·지역 검색 지원. 지도에 다 표시되지 않는 섬·지역도 검색 목록에서 열 수 있습니다.</span></div><div class="detail-pair"><span class="key">세계지도</span><span class="val">지도를 드래그하고 휠로 확대하세요. 국가 또는 사건 마커를 클릭하면 상세 패널이 열립니다.</span></div><div class="detail-pair"><span class="key">좌측 필터</span><span class="val">사건 유형·상태·지역을 다중 선택하거나 검색해서 지도 마커를 필터링합니다.</span></div><div class="detail-pair"><span class="key">외교 일정</span><span class="val">뉴스 기반 자동 외교 보도를 확인하고, 정확한 일정 날짜는 공식 출처를 근거로 별도 보존합니다.</span></div><div class="detail-pair"><span class="key">국가별 거시경제</span><span class="val">World Bank API에서 실제 데이터를 조회합니다. 인터넷 연결이 필요합니다.</span></div><div class="detail-pair"><span class="key">뉴스</span><span class="val">제공 서버가 외부 GDELT API에 연결되어 있으면 실제 기사 제목 및 링크를 불러옵니다.</span></div><div class="detail-pair"><span class="key">자동 인텔리전스</span><span class="val">로컬 서버 시작 시 주기적으로 뉴스와 공식 피드를 수집합니다. OPENAI_API_KEY 설정 시 AI 분류, 미설정 시 규칙 기반으로 작동합니다. 보도는 사실 확정이 아닙니다.</span></div><div class="detail-pair"><span class="key">데이터 주의</span><span class="val">지도 기본 사건·색상은 샘플이며 실시간 분석 결과가 아닙니다. 주가 시세와 공식 외교 일정은 자동 제공하지 않습니다.</span></div></div><div class="button-row"><button class="btn" data-close-modal>확인</button></div>`)}
function init(){loadAutoIntel();setInterval(loadAutoIntel,120000);makeFilters();renderEvents();setupMap();refreshCountryExplorer();$('#countryQuickSearch').addEventListener('input',refreshCountryExplorer);$('#browseCountries').onclick=()=>navigate('countries');
 $('#worldClock').textContent=new Date().toISOString().slice(0,16).replace('T',' ')+' UTC';setInterval(()=>$('#worldClock').textContent=new Date().toISOString().slice(0,16).replace('T',' ')+' UTC',30000);
 $('#eventSearch').oninput=e=>{state.search=e.target.value.trim();renderEvents()};
 $('#resetFilters').onclick=()=>{state.types.clear();state.statuses.clear();state.regions.clear();state.search='';$('#eventSearch').value='';makeFilters();renderEvents();toast('모든 필터를 초기화했습니다.')};
 document.addEventListener('change',e=>{if(e.target.matches('[data-filter-group]')){const group=e.target.dataset.filterGroup,id=e.target.dataset.filter;e.target.checked?state[group].add(id):state[group].delete(id);renderEvents()}});
 document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
  if(t.dataset.openEvent)openEvent(t.dataset.openEvent);
   if(t.id==='refreshIntel'){refreshIntelNow()}
   if(t.id==='exportIntel'){exportAutoIntel()}
  if(t.dataset.openCountry)openCountry(t.dataset.openCountry);
  if(t.dataset.jumpCountry)jumpCountry(t.dataset.jumpCountry);
  if(t.hasAttribute('data-close-drawer'))closeDrawer();
  if(t.dataset.drawerTab){state.tab=t.dataset.drawerTab;renderDrawer()}
  if(t.dataset.pageGo)navigate(t.dataset.pageGo);
  if(t.dataset.page)navigate(t.dataset.page);
  if(t.dataset.editVisit){navigate('calendar');renderCalendar(t.dataset.editVisit)}
  if(t.dataset.deleteVisit){if(confirm('이 외교 일정을 삭제할까요?')){state.visits=state.visits.filter(x=>x.id!==t.dataset.deleteVisit);store.set('visits',state.visits);renderCalendar();toast('일정 삭제 완료')}}
  if(t.dataset.editEvent)eventEditor(t.dataset.editEvent);
  if(t.dataset.deleteEvent){if(confirm('이 사건을 삭제할까요?')){state.events=state.events.filter(x=>x.id!==t.dataset.deleteEvent);store.set('events',state.events);closeDrawer();renderEvents();toast('사건 삭제 완료')}}
  if(t.dataset.compareCountry){const code=t.dataset.compareCountry;state.compare=state.compare.includes(code)?state.compare.filter(x=>x!==code):(state.compare.length>=4?state.compare:[...state.compare,code]);if(state.compare.length>=4&&!state.compare.includes(code))toast('최대 4개 국가까지 선택할 수 있습니다.');store.set('compare',state.compare);renderCompare()}
  if(t.hasAttribute('data-close-modal'))closeModal();
 });
 $('#addEventButton').onclick=()=>navigate('intel');$('#toggleHelp').onclick=help;
 $('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal()});
 $('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');$('#mobileClose').onclick=()=>$('#sidebar').classList.remove('open');
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeDrawer();$('#sidebar').classList.remove('open')}if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();$('#sidebar').classList.add('open');$('#eventSearch').focus()}});
}
init();
