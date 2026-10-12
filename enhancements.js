/* GMI v3: public-sourced country intelligence, responsive map and bilingual extensions. */
'use strict';
const gmiLocale = store.get('locale','ko');
let gmiLang=['ko','en','zh'].includes(gmiLocale)?gmiLocale:'ko';
const GMIT={
 ko:{world:'세계지도',countries:'국가 목록',calendar:'외교 일정',compare:'국가 비교',news:'뉴스 브리핑',intel:'자동 인텔리전스',market:'금융시장',macro:'거시경제',diplomacy:'고위급 외교',security:'국방·안보',trade:'통상',brief:'오늘의 브리핑',reset:'초기화 ↺',all:'전체 국가·지역 보기 ↗',eventType:'사건 유형',status:'변화 상태',region:'관심 지역',search:'국가, 지역, 이슈 검색',countrySearch:'한국어·영어·중국어·ISO 코드 검색',empty:'확인된 정보가 없습니다.',source:'출처',date:'보도일',head:'국가 지도자',headOfState:'국가원수',headOfGov:'정부수반',inOffice:'재임 시작',election:'당선일',noElection:'당선일 확인 불가',noTerm:'재임 시작일 확인 불가',leaderWait:'공개 지도자 정보 확인 중…',leaderNone:'검증 가능한 지도자 정보를 가져오지 못했습니다.',countryInfo:'국가 정보',index:'대표 주가지수',noIndex:'자동 연결된 주가지수가 없습니다. 심볼을 직접 입력할 수 있습니다.',chartNote:'TradingView 제공 차트 · 거래소별 지연 시세 또는 제공 제한이 있을 수 있습니다.',symbol:'지수 선택',customSymbol:'직접 심볼 입력 (예: SSE:000300)',apply:'적용',loading:'데이터 갱신 중…',briefNote:'최근 보도에서 분야별 최대 2건을 선정합니다. AI 요약은 기사 제목·RSS 요약에 기반하며, 기사 전체를 검토한 요약이 아닙니다.',headlines:'기사 제목 기준 · 미검증 보도',impact:'다른 국가로의 파급 가능성',reported:'보도일',meeting:'회담·방문일',role:'직책',person:'주요 인물',subject:'회담·방문 관련 보도',counterpart:'상대·방문국',verification:'확인 상태',unverified:'보도 기반 · 일정 미확인',diplomaticNote:'표의 보도일은 실제 회담일이 아닙니다. 공식 방문 일정의 확정·변경은 정부 발표로 확인해야 합니다.',econ:'경제',politics:'정치',defense:'국방',foreign:'외교',noneToday:'최근 관련 보도를 찾지 못했습니다.',newsUnavailable:'뉴스 제공처 연결이 지연되거나 제한되었습니다.',englishOnly:'자동 번역·분석 미연결: 원문 제목만 표시',viewSource:'원문 보기 ↗',latest:'최근 수집',mapTitle:'세계를 읽는 새로운 시각',mapSub:'시장 · 경제 · 외교 · 국방 · 통상을 하나의 지도에서',mapCaution:'지도 점은 분류된 보도이며, 위험도 악화·개선의 확정 판정은 아닙니다.',dir:'전 세계 국가·지역 탐색',allLabels:'국가·지역 검색',refresh:'새로고침',categories:['국가 간 충돌','외교·정상회담','국내 분쟁','군사·안보 긴장','무역·관세','제재·수출 통제','영토·해양 분쟁','정치적 불안정'],states:['악화','변화 없음','개선','추적 중'],regions:['아시아','유럽','중동','아메리카','아프리카','오세아니아']},
 en:{world:'World Map',countries:'Countries',calendar:'Diplomatic Calendar',compare:'Country Comparison',news:'Daily Brief',intel:'Auto Intelligence',market:'Markets',macro:'Macro',diplomacy:'Senior Diplomacy',security:'Defense & Security',trade:'Trade',brief:'Daily Brief',reset:'Reset ↺',all:'View all countries ↗',eventType:'Event type',status:'Trend status',region:'Regions',search:'Search countries and events',countrySearch:'Search country, territory, ISO',empty:'No verified information available.',source:'Source',date:'Reported',head:'National leadership',headOfState:'Head of State',headOfGov:'Head of Government',inOffice:'In office since',election:'Election date',noElection:'Election date unverified',noTerm:'Start date unavailable',leaderWait:'Checking public leadership records…',leaderNone:'Leadership data unavailable or not verified.',countryInfo:'Country information',index:'Benchmark stock index',noIndex:'No index mapped yet. Enter a TradingView symbol manually.',chartNote:'Chart by TradingView · Quotes may be delayed or unavailable depending on exchange.',symbol:'Index',customSymbol:'Enter symbol (e.g. SSE:000300)',apply:'Apply',loading:'Updating data…',briefNote:'Up to two recent headlines per sector. AI briefs summarize headline/RSS metadata, not full articles.',headlines:'Headline-only · unverified',impact:'Possible spillover to other countries',reported:'Published',meeting:'Meeting / visit date',role:'Office',person:'Official',subject:'Relevant report',counterpart:'Counterpart / destination',verification:'Verification',unverified:'Reported · schedule unconfirmed',diplomaticNote:'Published dates are NOT meeting dates. Official confirmations and itinerary changes require government sources.',econ:'Economy',politics:'Politics',defense:'Defense',foreign:'Diplomacy',noneToday:'No relevant recent headlines found.',newsUnavailable:'News source delayed or unavailable.',englishOnly:'Automated translation not enabled: original headline shown',viewSource:'Read source ↗',latest:'Updated',mapTitle:'See the world differently',mapSub:'Markets · Macro · Diplomacy · Defense · Trade',mapCaution:'Markers represent classified reports, NOT independently assessed conflict risk.',dir:'Countries & territories',allLabels:'Country search',refresh:'Refresh',categories:['Interstate conflict','Diplomacy & summits','Civil conflict','Military tension','Trade & tariffs','Sanctions & controls','Territorial dispute','Political instability'],states:['Worsening','Unchanged','Improving','Monitoring'],regions:['Asia','Europe','Middle East','Americas','Africa','Oceania']},
 zh:{world:'世界地图',countries:'国家与地区',calendar:'外交日程',compare:'国家对比',news:'每日简报',intel:'自动情报',market:'金融市场',macro:'宏观经济',diplomacy:'高层外交',security:'国防与安全',trade:'贸易',brief:'每日简报',reset:'重置 ↺',all:'查看全部国家和地区 ↗',eventType:'事件类型',status:'变化趋势',region:'关注地区',search:'搜索国家、地区与事件',countrySearch:'搜索中文、英文或ISO代码',empty:'暂无经过核实的信息。',source:'来源',date:'报道日期',head:'国家领导人',headOfState:'国家元首',headOfGov:'政府首脑',inOffice:'就职日期',election:'当选日期',noElection:'当选日期未核实',noTerm:'就职日期未确认',leaderWait:'正在查询公开领导人资料…',leaderNone:'暂无法取得可靠的领导人资料。',countryInfo:'国家概况',index:'代表性股指',noIndex:'尚未配置指数，可手动输入TradingView代码。',chartNote:'图表由TradingView提供；行情可能延迟或受交易所限制。',symbol:'选择指数',customSymbol:'输入代码（例如 SSE:000300）',apply:'应用',loading:'正在更新数据…',briefNote:'每个领域最多显示近期两篇报道。AI摘要基于标题及RSS简介，而非文章全文。',headlines:'仅基于标题 · 未独立核实',impact:'对其他国家的潜在影响',reported:'报道日期',meeting:'会谈／访问日期',role:'职务',person:'官员',subject:'相关报道',counterpart:'会谈对象／目的地',verification:'核实状态',unverified:'媒体报道 · 行程未确认',diplomaticNote:'报道日期不等于会谈日期。已确认行程及其变更以官方公告为准。',econ:'经济',politics:'政治',defense:'国防',foreign:'外交',noneToday:'暂无近期相关报道。',newsUnavailable:'新闻来源暂时不可用。',englishOnly:'未启用自动翻译，显示原始标题',viewSource:'查看来源 ↗',latest:'最近更新',mapTitle:'从新视角看世界',mapSub:'市场 · 宏观经济 · 外交 · 国防 · 贸易',mapCaution:'地图标记代表自动分类的报道，不表示已证实的风险变化。',dir:'探索全球国家与地区',allLabels:'国家与地区搜索',refresh:'刷新',categories:['国家间冲突','外交与峰会','国内冲突','军事安全紧张','贸易关税','制裁与出口管制','领土争端','政治动荡'],states:['恶化','无变化','改善','关注中'],regions:['亚洲','欧洲','中东','美洲','非洲','大洋洲']}
};
const L=(key)=>GMIT[gmiLang][key]??GMIT.ko[key]??key;
const isoDisplay=new Intl.DisplayNames(['zh-CN'],{type:'region'});
function displayCountry(c){if(!c)return ''; if(gmiLang==='ko')return c.name;if(gmiLang==='en')return c.english;try{return isoDisplay.of(c.iso2)==c.iso2?c.english:isoDisplay.of(c.iso2)}catch{return c.english}}
const GMI_IDX={
 USA:[['S&P 500','SP:SPX'],['NASDAQ 100','NASDAQ:NDX'],['Dow Jones','TVC:DJI']],
 CHN:[['CSI 300','SSE:000300'],['Shanghai Composite','SSE:000001']],
 KOR:[['KOSPI','KRX:KOSPI'],['KOSDAQ','KRX:KOSDAQ']],
 JPN:[['Nikkei 225','TVC:NI225']],GBR:[['FTSE 100','TVC:UKX']],DEU:[['DAX','XETR:DAX']],
 FRA:[['CAC 40','EURONEXT:PX1']],IND:[['NIFTY 50','NSE:NIFTY']],TWN:[['TAIEX','TWSE:TAIEX']],
 HKG:[['Hang Seng','HSI:HSI']],AUS:[['ASX 200','ASX:XJO']],CAN:[['TSX Composite','TSX:TSX']],BRA:[['IBOV','BMFBOVESPA:IBOV']],
 ITA:[['FTSE MIB','MIL:FTSEMIB']],ESP:[['IBEX 35','BME:IBC']],SGP:[['STI','SGX:STI']],
 CHE:[['SMI','SIX:SMI']],ZAF:[['JSE Top 40','JSE:TOP40']],MEX:[['S&P/BMV IPC','BMV:ME']],
 VNM:[['VN INDEX','HOSE:VNINDEX']],SAU:[['TASI','TADAWUL:TASI']]
};
const gmiCache={leader:new Map(),brief:new Map(),diplomacy:new Map()};
const gmiTypeColors={interstate:'#f07147',civil:'#df7a54',tension:'#e5a25c',territory:'#ce8f6c',politics:'#aa90d9',diplomacy:'#5b9ee4',trade:'#2fbf9b',sanctions:'#edbd5a'};
function _localizedText(){
 const nav=$$('.topnav [data-page]');nav.forEach(x=>x.textContent=L(x.dataset.page==='map'?'world':x.dataset.page));
 const btn=$('#resetFilters');if(btn)btn.textContent=L('reset');
 const b=$('#browseCountries');if(b)b.textContent=L('all');
 const inp=$('#eventSearch');if(inp)inp.placeholder=L('search');
 const qs=$('#countryQuickSearch');if(qs)qs.placeholder=L('countrySearch');
 const headings=$$('.filter-heading');['allLabels','eventType','status','region'].forEach((key,i)=>{let h=headings[i];if(h){let child=[...h.childNodes].find(n=>n.nodeType===3);if(child)child.textContent=L(key)+' ';}});
 const base=$('.map-heading');if(base)base.innerHTML=esc(L('mapTitle'))+'<span class="period">.</span>';
 if($('.map-description'))$('.map-description').textContent=L('mapSub');
 if($('#mapModeNotice'))$('#mapModeNotice').textContent='● '+L('mapCaution');
 const map=$('.map-legend');if(map)map.innerHTML=`<span><i class="legend-dot" style="background:${gmiTypeColors.diplomacy}"></i>${L('foreign')}</span><span><i class="legend-dot" style="background:${gmiTypeColors.tension}"></i>${L('defense')}</span><span><i class="legend-dot" style="background:${gmiTypeColors.trade}"></i>${L('trade')}</span><span><i class="legend-dot" style="background:${gmiTypeColors.politics}"></i>${L('politics')}</span>`;
 const crumb=$('#currentViewLabel');if(crumb)crumb.textContent=L(state.page==='map'?'world':state.page);
 const lang=$('#gmiLang');if(lang)lang.value=gmiLang;
 document.documentElement.lang=gmiLang==='zh'?'zh-CN':gmiLang;
}
function setGMILang(v){gmiLang=v;store.set('locale',v);_localizedText();makeFilters();
 if(state.page==='countries')renderCountriesWorkspace();
 if(state.selected?.kind==='country')renderDrawer();
 else if(state.selected?.kind==='event')renderDrawer();
 if(state.page==='news')renderNewsWorkspace();
 if(state.page==='map')renderEvents();
 refreshCountryExplorer();
}
// Map limits: clamp world view to a repeated world and ±15° latitude margin.
function boundedView(){const v=state.view;if(!v||!Number.isFinite(v.x+v.y+v.w+v.h))return;const yMargin=55,worldHeight=900;
 if(v.h>worldHeight+2*yMargin)v.y=(worldHeight-v.h)/2;
 else v.y=Math.max(-yMargin,Math.min(worldHeight+yMargin-v.h,v.y));
 // Repeated map in x=[0,5400]. User can pan within one world and its wrap.
 v.x=Math.max(0,Math.min(Math.max(0,5400-v.w),v.x));
}
const _viewSetOriginal=viewSet;
viewSet=function(){boundedView();_viewSetOriginal();};
// Distinct category fill + outlined status: color never falsely implies a verified trend.
renderMarkers=function(){const shown=filtered().slice(0,180);const v=state.view;const content=[];
 for(const e of shown){for(const off of [0,1800,3600]){const x=lonX(e.lon)+off,y=latY(e.lat);
 if(x<v.x-45||x>v.x+v.w+45||y<v.y-45||y>v.y+v.h+45)continue;
 const fill=gmiTypeColors[e.type]||'#8e9bad',outline=stat(e.status)[2];
 content.push(`<g class="event-marker ${state.selected?.id===e.id?'focused':''}" data-event-id="${esc(e.id)}"><circle class="dot-ring" cx="${x}" cy="${y}" r="12.2" stroke="${outline}"/><circle class="dot-core" cx="${x}" cy="${y}" r="10.6" fill="${fill}"/><title>${esc(e.title)}</title></g>`);
 }}const root=$('#mapMarkers');if(root)root.innerHTML=content.join('');};
const _renderEventsOriginal=renderEvents;
renderEvents=function(){_renderEventsOriginal();$$('#sidebarEvents .event-row').forEach(x=>{const id=x.dataset.openEvent;const incident=combined().find(item=>item.id===id),dot=x.querySelector('i.color-dot');if(incident&&dot)dot.style.background=gmiTypeColors[incident.type]||'#96a0ad';});};
// Leader image only from Wikimedia/Wikidata metadata; no synthetic portraits.
function leaderPanel(c){return `<div class="gmi-leader"><div class="gmi-leader-photo" id="gmiLeaderPhoto"><span class="gmi-photo-placeholder">👤</span></div><div class="gmi-leader-details"><div class="eyebrow">${L('head')}</div><div id="gmiLeaderName" class="gmi-leader-name">${L('leaderWait')}</div><div class="gmi-leader-role" id="gmiLeaderRole">${L('headOfState')}</div><div class="gmi-leader-meta" id="gmiLeaderTerm">${L('inOffice')}: —</div><div class="gmi-leader-meta" id="gmiLeaderElection">${L('election')}: —</div><div id="gmiLeaderSource"></div></div></div>`;}
function countryHeader(c){return `<div class="drawer-top gmi-drawer-top"><button class="drawer-close" data-close-drawer>×</button><div class="eyebrow">COUNTRY INTELLIGENCE · ${esc(c.region.toUpperCase())}</div><div class="drawer-heading">${c.flag} ${esc(displayCountry(c))}</div><div class="drawer-subtitle">${esc(c.city)} · ${esc(c.currency)} · ${esc(c.iso)}</div>${leaderPanel(c)}</div>`;}
function marketTab(c){const a=GMI_IDX[c.iso]||[], remember=store.get('tvSymbols',{});const symbol=remember[c.iso]||a[0]?.[1]||'',custom=remember[c.iso]&&!a.some(x=>x[1]===symbol);
 return `<div class="section-label">${L('index')}</div><div class="gmi-market-controls"><label class="gmi-select-label">${L('symbol')} <select id="gmiTVIndex">${a.map(([name,s])=>`<option value="${esc(s)}" ${s===symbol?'selected':''}>${esc(name)}</option>`).join('')}<option value="__custom" ${custom||!symbol?'selected':''}>Custom / 自选 / 직접 입력</option></select></label><div class="gmi-symbol-input"><input id="gmiCustomSymbol" value="${esc(custom?symbol:'')}" placeholder="${esc(L('customSymbol'))}"/><button class="btn smallbtn" id="gmiSetSymbol">${L('apply')}</button></div></div>
 <div class="gmi-intervals" role="group" aria-label="Chart interval">${[['60','1H'],['240','4H'],['D',gmiLang==='ko'?'일봉':gmiLang==='zh'?'日线':'1D'],['W',gmiLang==='ko'?'주봉':gmiLang==='zh'?'周线':'1W']].map(([code,label])=>`<button data-tv-interval="${code}" class="${(store.get('tvInterval','D'))===code?'active':''}">${label}</button>`).join('')}</div>
 <div id="gmiChart" class="gmi-chart" data-symbol="${esc(symbol)}">${symbol?`<div class="gmi-chart-placeholder"><span class="loading-spinner"></span> TradingView</div>`:`<div class="empty-panel">${L('noIndex')}</div>`}</div>
 ${symbol?`<a id="gmiTVSource" class="outlink" target="_blank" rel="noopener noreferrer" href="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}">TradingView · ${esc(symbol)} ↗</a>`:''}
 <div class="source-note">${L('chartNote')} ${esc(c.markets?.join(' · ')||'')}</div><div class="section-label">${L('countryInfo')}</div><div class="info-grid"><div class="info-card"><div class="info-label">English</div><div class="info-value" style="font-size:12px">${esc(c.english)}</div></div><div class="info-card"><div class="info-label">ISO</div><div class="info-value">${esc(c.iso)} / ${esc(c.iso2)}</div></div><div class="info-card"><div class="info-label">Currency</div><div class="info-value">${esc(c.currency)}</div></div><div class="info-card"><div class="info-label">Central bank</div><div class="info-value" style="font-size:12px">${esc(c.bank)}</div></div></div>`;
}
function diplomaticTab(c){return `<div class="section-label">${L('diplomacy')} · ${esc(displayCountry(c))}</div><p class="tabnote">${L('diplomaticNote')}</p><div id="gmiDiplomacy" class="gmi-table-scroll"><div class="gmi-loading"><span class="loading-spinner"></span> ${L('loading')}</div></div>`;}
function dailyTab(c){return `<div class="section-label">${L('brief')} · ${esc(displayCountry(c))}</div><p class="tabnote">${L('briefNote')}</p><div class="gmi-brief-grid" id="gmiBriefCards">${[L('econ'),L('politics'),L('defense'),L('foreign')].map(t=>`<div class="gmi-brief-card"><h4>${t}</h4><div class="gmi-loading">${L('loading')}</div></div>`).join('')}</div>`;}
const _renderDrawerOriginal=renderDrawer;
renderDrawer=function(){const sel=state.selected;if(!sel)return;
 if(sel.kind!=='country'){_renderDrawerOriginal();return;}
 const c=sel.c,box=$('#insightContent');
 box.innerHTML=countryHeader(c)+`<div class="drawer-tabs">${[['market','market'],['macro','macro'],['diplomacy','diplomacy'],['security','security'],['trade','trade'],['news','brief']].map(([key,l])=>`<button class="drawer-tab ${state.tab===key?'active':''}" data-drawer-tab="${key}">${L(l)}</button>`).join('')}</div><div class="drawer-body">${state.tab==='market'?marketTab(c):state.tab==='diplomacy'?diplomaticTab(c):state.tab==='news'?dailyTab(c):tabContent(c,state.tab)}</div>`;
 loadLeader(c);
 if(state.tab==='market')mountTradingView(c);
 if(state.tab==='macro')showMacro(c);
 if(state.tab==='diplomacy')loadDiplomacy(c);
 if(state.tab==='news')loadDailyBrief(c);
};
async function quickApi(type,iso){const url=`/api/${type}?country=${encodeURIComponent(iso)}`;const resp=await fetch(url,{signal:AbortSignal.timeout(4800)});if(!resp.ok)throw Error('API '+resp.status);return resp.json()}
function setLeaderImage(url){const holder=$('#gmiLeaderPhoto');if(!holder)return;
 if(url && /^https:\/\/(upload\.wikimedia\.org|commons\.wikimedia\.org)\//.test(url)){
  holder.innerHTML=`<img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer"/>`;
  holder.querySelector('img').onerror=()=>holder.innerHTML='<span class="gmi-photo-placeholder">👤</span>';
 }else holder.innerHTML='<span class="gmi-photo-placeholder">👤</span>';
}
function drawLeader(c,data){if(state.selected?.id!==c.iso||!$('#gmiLeaderName'))return;
 let lead=(data.people||[]).find(p=>p.office==='head_of_state')||data.people?.[0];
 $('#gmiLeaderName').textContent=lead?.name||L('leaderNone');
 $('#gmiLeaderRole').textContent=lead?.office==='head_of_government'?L('headOfGov'):L('headOfState');
 $('#gmiLeaderTerm').textContent=`${L('inOffice')}: ${lead?.term_start||L('noTerm')}`;
 $('#gmiLeaderElection').textContent=lead?.elected_on?`${L('election')}: ${lead.elected_on}`:L('noElection');
 setLeaderImage(lead?.image);
 $('#gmiLeaderSource').innerHTML=lead?.source?`<a class="gmi-tiny-link" rel="noopener noreferrer" target="_blank" href="${esc(safeUrl(lead.source))}">Wikidata / Wikimedia ↗</a>`:`<span class="gmi-tiny-link">${esc(data.source||'Wikidata')} · ${L('empty')}</span>`;
}
const gmiLeaderPending=new Set();
async function loadLeader(c){const existing=gmiCache.leader.get(c.iso);
 if(existing){drawLeader(c,existing);return;}
 if(gmiLeaderPending.has(c.iso))return;
 gmiLeaderPending.add(c.iso);
 try{
  for(const delay of [0,1800,4200,7700,11000]){
   if(delay)await new Promise(r=>setTimeout(r,delay));
   if(state.selected?.id!==c.iso)return;
   let result;
   try{result=await quickApi('leader',c.iso)}catch{result={people:[],loading:false,source:'Wikidata'}};
   if(!result.loading){gmiCache.leader.set(c.iso,result);drawLeader(c,result);return;}
  }
  if(state.selected?.id===c.iso && $('#gmiLeaderName'))$('#gmiLeaderName').textContent=L('leaderWait');
 }finally{gmiLeaderPending.delete(c.iso)}
}
function mountTradingView(c){const root=$('#gmiChart');if(!root)return;const sym=root.dataset.symbol, interval=store.get('tvInterval','D');
 if(!sym){return;} if(!/^[A-Z0-9_.^\-]{1,28}:[A-Z0-9_.^\-]{1,35}$/i.test(sym)){root.innerHTML='<div class="empty-panel">Invalid TradingView symbol</div>';return;}
 root.replaceChildren();const wrap=document.createElement('div');wrap.className='tradingview-widget-container';const w=document.createElement('div');w.className='tradingview-widget-container__widget';wrap.appendChild(w);root.appendChild(wrap);
 const sc=document.createElement('script');sc.type='text/javascript';sc.async=true;sc.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
 sc.textContent=JSON.stringify({autosize:true,symbol:sym,interval,timezone:'Etc/UTC',theme:'dark',style:'1',locale:gmiLang==='zh'?'zh_CN':gmiLang,allow_symbol_change:true,hide_side_toolbar:true,hide_top_toolbar:false,save_image:false,calendar:false,backgroundColor:'#101923',gridColor:'rgba(135,151,170,0.09)',support_host:'https://www.tradingview.com'});
 wrap.appendChild(sc);
}
function datePretty(s){return /^\d{4}-\d{2}-\d{2}/.test(s||'')?s.slice(0,10):'—';}
const GMIRoles={head_of_state:['국가원수','Head of State','国家元首'],foreign_minister:['외교장관','Foreign Minister','外交部长'],commerce_minister:['상무·통상장관','Trade Minister','商务部长'],defense_minister:['국방장관','Defense Minister','国防部长']};
function roleName(key){return (GMIRoles[key]||[key,key,key])[['ko','en','zh'].indexOf(gmiLang)];}
function drawDiplomacy(c,res){const el=$('#gmiDiplomacy');if(!el||state.selected?.id!==c.iso||state.tab!=='diplomacy')return;
 const x=res?.events||[];
 el.innerHTML=x.length?`<table class="gmi-intel-table"><thead><tr><th>${L('reported')}</th><th>${L('role')}</th><th>${L('person')}</th><th>${L('subject')}</th><th>${L('meeting')}</th><th>${L('verification')}</th></tr></thead><tbody>${x.map(v=>`<tr><td>${esc(datePretty(v.reported_at))}</td><td><b>${esc(roleName(v.role))}</b></td><td>${esc(v.person||'—')}</td><td><a target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(v.source))}">${esc(v['summary_'+gmiLang]||v.reported_title)}</a><small>${esc(v.counterpart||v.destination||v.publisher||'')} · ${esc(v.reported_title)}</small></td><td>${esc(v.meeting_date||v.visit_date||'—')}</td><td><span class="gmi-unverified">${L('unverified')}${v.schedule_status==='planned_reported'?' · planned':''}</span></td></tr>`).join('')}</tbody></table>`:`<div class="empty-panel">${L('empty')} ${L('diplomaticNote')}</div>`;
}
async function loadDiplomacy(c){if(gmiCache.diplomacy.has(c.iso)){drawDiplomacy(c,gmiCache.diplomacy.get(c.iso));return;}
 try{const x=await quickApi('diplomacy',c.iso);if(!x.loading)gmiCache.diplomacy.set(c.iso,x);drawDiplomacy(c,x);
 if(x.loading)setTimeout(async()=>{if(state.selected?.id!==c.iso)return;try{const y=await quickApi('diplomacy',c.iso);if(!y.loading)gmiCache.diplomacy.set(c.iso,y);drawDiplomacy(c,y);}catch{}},9500);
 }catch{drawDiplomacy(c,{events:[]})}
}
function briefCard(category,items){const title={economy:L('econ'),politics:L('politics'),defense:L('defense'),diplomacy:L('foreign')}[category];
 return `<section class="gmi-brief-card"><div class="gmi-brief-heading"><i class="gmi-brief-color" style="background:${({economy:'#54b7d4',politics:'#a88ad8',defense:'#eca268',diplomacy:'#4ba7a0'})[category]}"></i><h4>${title}</h4><span>${(items||[]).length}/2</span></div>${items?.length?items.map(item=>{
 const suffix={ko:'ko',en:'en',zh:'zh'}[gmiLang],summary=item[`summary_${suffix}`],impact=item[`impact_${suffix}`];
 return `<article class="gmi-story"><div class="gmi-story-meta">${esc(item.source||'RSS')} · ${esc(item.date||'—')}</div><a target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(item.url))}">${esc(item.title)}</a><p class="gmi-summary">${esc(summary||L('englishOnly'))}</p>${impact?`<div class="gmi-impact"><b>${L('impact')}:</b> ${esc(impact)}</div>`:''}<div class="gmi-story-label">${L('headlines')}</div></article>`}).join(''):`<div class="gmi-empty-news">${L('noneToday')}</div>`}</section>`;
}
function drawBrief(c,d){if(state.selected?.id!==c.iso||state.tab!=='news'||!$('#gmiBriefCards'))return;
 const cats=d?.categories||{};$('#gmiBriefCards').innerHTML=['economy','politics','defense','diplomacy'].map(x=>briefCard(x,cats[x])).join('');
 let last=$('#gmiBriefUpdated');if(!last){last=document.createElement('div');last.id='gmiBriefUpdated';last.className='source-note';$('#gmiBriefCards').after(last)}
 last.textContent=`${L('latest')}: ${d?.updated_at?.replace('T',' ').slice(0,19)||'—'} UTC. ${L('briefNote')}${d?.loading?' · '+L('loading'):''}`;
}
async function loadDailyBrief(c){let cache=gmiCache.brief.get(c.iso);if(cache){drawBrief(c,cache);if(!cache.loading)return;}
 let result;try{result=await quickApi('brief',c.iso)}catch{result={categories:{}}};drawBrief(c,result);
 if(result.loading && !result.updated_at){await new Promise(r=>setTimeout(r,3200));try{result=await quickApi('brief',c.iso)}catch{};drawBrief(c,result);}
 if(result.loading){setTimeout(async()=>{if(state.selected?.id!==c.iso)return;try{let d=await quickApi('brief',c.iso);if(!d.loading)gmiCache.brief.set(c.iso,d);drawBrief(c,d)}catch{}},11000)}
 else gmiCache.brief.set(c.iso,result);
}
// Reuse the existing event-handling delegation; new selectors handle chart controls and localization.
document.addEventListener('click',ev=>{
 const target=ev.target.closest('button');if(!target)return;
 if(target.dataset.tvInterval){store.set('tvInterval',target.dataset.tvInterval);$$('.gmi-intervals button').forEach(x=>x.classList.toggle('active',x===target));if(state.selected?.kind==='country')mountTradingView(state.selected.c);}
 if(target.id==='gmiSetSymbol'){
  const raw=($('#gmiCustomSymbol')?.value||'').trim().toUpperCase();
  if(!/^[A-Z0-9_.^\-]{1,28}:[A-Z0-9_.^\-]{1,35}$/.test(raw)){toast('TradingView: EXCHANGE:SYMBOL');return;}
  const saved=store.get('tvSymbols',{});saved[state.selected.id]=raw;store.set('tvSymbols',saved);renderDrawer();
 }
});
document.addEventListener('change',ev=>{
 if(ev.target.id==='gmiTVIndex'){
  if(ev.target.value==='__custom'){$('#gmiCustomSymbol')?.focus();return;}
  const saved=store.get('tvSymbols',{});saved[state.selected.id]=ev.target.value;store.set('tvSymbols',saved);renderDrawer();
 }
 if(ev.target.id==='gmiLang')setGMILang(ev.target.value);
});
// Existing filters and directory continue to work; translate principal screen controls on navigation.
const _navigateOriginal=navigate;
navigate=function(page){_navigateOriginal(page);_localizedText();};
const _makeFiltersOriginal=makeFilters;
makeFilters=function(){_makeFiltersOriginal();[categories,statuses,regions.map(x=>[x,x])].forEach((rows,i)=>{
 const containers=['#typeFilters','#statusFilters','#regionFilters'];$$(containers[i]+' .filter-option span').forEach((el,j)=>{
 el.textContent=i===0?L('categories')[j]||rows[j]?.[1]:i===1?L('states')[j]||rows[j]?.[1]:L('regions')[j]||rows[j]?.[1];
 });
});};
const _directoryOriginal=renderCountriesWorkspace;
renderCountriesWorkspace=function(){_directoryOriginal();const title=$('#workspaceContent .workspace-header h2');if(title)title.textContent=L('dir');translateDirectory();};
const _updateDirectoryOriginal=updateDirectoryList;
updateDirectoryList=function(){_updateDirectoryOriginal();translateDirectory();};
function translateDirectory(){$$('#directoryCountries .directory-item').forEach(el=>{const c=countryByIso[el.dataset.jumpCountry];if(c){const name=el.querySelector('strong');if(name)name.textContent=displayCountry(c);}});}
const _refreshCountryOriginal=refreshCountryExplorer;
function matchDisplayCountry(c,q){return (c.name+' '+c.english+' '+c.iso+' '+c.iso2+' '+displayCountry(c)).toLocaleLowerCase().includes(q)}
refreshCountryExplorer=function(){const q=($('#countryQuickSearch')?.value||'').trim().toLocaleLowerCase();
 if(gmiLang==='zh'&&q){const matches=countries.filter(c=>matchDisplayCountry(c,q));$('#quickCountryResults').innerHTML=matches.length?matches.slice(0,12).map(c=>`<button class="event-row" data-jump-country="${c.iso}"><span>${c.flag} ${esc(displayCountry(c))} <span class="muted">${esc(c.iso)}</span></span><span class="muted">↗</span></button>`).join(''):`<div class="source-note">${L('empty')}</div>`;return;}
 _refreshCountryOriginal();$$('#quickCountryResults [data-jump-country]').forEach(el=>{const c=countryByIso[el.dataset.jumpCountry];if(c&&el.firstElementChild)el.firstElementChild.firstChild.textContent=c.flag+' '+displayCountry(c)+' ';});};
const _updateDirectoryLocalized=updateDirectoryList;
updateDirectoryList=function(){_updateDirectoryLocalized();const q=state.countryQuery.trim().toLocaleLowerCase();if(gmiLang==='zh'&&q){const matching=countries.filter(c=>(state.countryRegion==='전체'||c.region===state.countryRegion)&&matchDisplayCountry(c,q));
 $('#directoryCountries').innerHTML=matching.map(c=>`<button class="directory-item" data-jump-country="${c.iso}"><span class="directory-flag">${c.flag}</span><span><strong>${esc(displayCountry(c))}</strong><small>${esc(c.english)} · ${c.iso}</small></span><span class="directory-arrow">↗</span></button>`).join('')||`<div class="empty-panel">${L('empty')}</div>`;
 const pill=$('#workspaceContent .workspace-header .pill');if(pill)pill.textContent=`${matching.length} / ${countries.length}`;
 }};
// Country-led workspaces replace manual diplomatic entry with automatically collected reports.
renderCalendar=function(){const events=state.autoEvents.filter(e=>e.kind==='diplomacy'&&/president|foreign minister|secretary of state|prime minister|commerce minister|trade minister|defen[cs]e minister|summit|state visit/i.test(e.title||'')).slice(0,80);
 const rows=events.map(e=>{const c=countryByIso[e.country];return `<tr><td>${esc(e.date||'—')}</td><td><button class="gmi-country-action" data-gmi-dip-country="${esc(e.country)}">${esc(c?.flag||'🌐')} ${esc(displayCountry(c)||e.country)}</button></td><td><button class="gmi-event-action" data-open-event="${esc(e.id)}">${esc(e.title)}</button></td><td>${esc(e.reportedSource||'')}</td></tr>`}).join('');
 $('#workspaceContent').innerHTML=`<div class="workspace-header"><div><div class="eyebrow">GLOBAL DIPLOMATIC DESK</div><h2>${L('calendar')} · ${L('diplomacy')}</h2><p>${L('diplomaticNote')}</p></div><span class="pill">${events.length} reports</span></div><section class="panel"><div class="section-label">${L('headlines')}</div>${events.length?`<div class="gmi-table-scroll"><table class="gmi-intel-table"><thead><tr><th>${L('reported')}</th><th>${L('countries')}</th><th>${L('subject')}</th><th>${L('source')}</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty-panel">${L('empty')} ${L('loading')}</div>`}<div class="source-note">${L('diplomaticNote')}</div></section>`;
};
renderNewsWorkspace=function(){const iso=state.newsCountry,c=countryByIso[iso]||countryByIso.USA;
 $('#workspaceContent').innerHTML=`<div class="workspace-header"><div><div class="eyebrow">COUNTRY DAILY INTELLIGENCE</div><h2>${L('brief')} · ${esc(displayCountry(c))}</h2><p>${L('briefNote')}</p></div><label class="gmi-select-label" style="min-width:190px">${L('countries')}<select id="gmiBriefCountry">${countries.map(x=>`<option value="${x.iso}" ${x.iso===iso?'selected':''}>${x.flag} ${esc(displayCountry(x))}</option>`).join('')}</select></label></div><div id="gmiWorkspaceBrief" class="gmi-brief-grid gmi-full-brief">${[L('econ'),L('politics'),L('defense'),L('foreign')].map(t=>`<section class="gmi-brief-card"><h4>${t}</h4><span class="loading-spinner"></span></section>`).join('')}</div><div id="gmiWorkspaceBriefFoot" class="source-note">${L('loading')}</div>`;
 $('#gmiBriefCountry').onchange=e=>{state.newsCountry=e.target.value;renderNewsWorkspace()};
 loadWorkspaceBrief(c);
};
async function loadWorkspaceBrief(c){let info=gmiCache.brief.get(c.iso);
 const display=data=>{if(state.page!=='news'||state.newsCountry!==c.iso||!$('#gmiWorkspaceBrief'))return;
 $('#gmiWorkspaceBrief').innerHTML=['economy','politics','defense','diplomacy'].map(k=>briefCard(k,data?.categories?.[k])).join('');
 $('#gmiWorkspaceBriefFoot').textContent=`${L('latest')}: ${data?.updated_at?.slice(0,19)||'—'} UTC · ${L('briefNote')}`;};
 if(info)display(info);
 try{info=await quickApi('brief',c.iso);display(info);if(info.loading){for(let i=0;i<3;i++){
  await new Promise(r=>setTimeout(r,i===0?3300:6800));
  if(state.page!=='news'||state.newsCountry!==c.iso)return;
  const next=await quickApi('brief',c.iso);display(next);if(!next.loading){gmiCache.brief.set(c.iso,next);return;}
 }}else gmiCache.brief.set(c.iso,info);
 }catch{if(!info)display({categories:{}});}
}
document.addEventListener('click',ev=>{const b=ev.target.closest('button[data-gmi-dip-country]');if(!b)return;
 navigate('map');openCountry(b.dataset.gmiDipCountry);state.tab='diplomacy';renderDrawer();
});
// Efficient map rendering follows pan/zoom rather than rendering every event across three worlds on every frame.
const _viewWithMarkers=viewSet;
viewSet=function(){_viewWithMarkers();renderMarkers();};
const localeSelect=document.createElement('label');localeSelect.className='gmi-lang-select';localeSelect.innerHTML='<span>🌐</span><select id="gmiLang" aria-label="Language"><option value="ko">한국어</option><option value="en">English</option><option value="zh">中文</option></select>';
$('.header-actions')?.prepend(localeSelect);
_localizedText();makeFilters();renderEvents();
$('#countryQuickSearch')?.addEventListener('input',refreshCountryExplorer);
