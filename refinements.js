/* GMI v4 – continent navigation, editorial UI, eight-indicator trends and source-grounded research. */
'use strict';
const V4T={
 ko:{combined:'외교 · 국방 · 통상',brief:'오늘의 뉴스',economy:'경제',politics:'정치',defense:'국방',diplomacy:'외교',loading:'최신 정보를 가져오는 중…',slow:'자료를 확인하고 있습니다. 잠시만 기다려 주세요.',noData:'현재 제공되는 자료가 없습니다.',noIndex:'연결 가능한 대표 주가지수 차트가 없습니다.',recent:'최근 5년',reported:'보도일',macroSource:'세계은행 · 지표마다 발표 연도가 다를 수 있습니다',event:'지정학 사건',region:'지역',topic:'분야',all:'전체',more:'더 보기',less:'접기',list:'국가별 목록',compare:'국가 비교',news:'뉴스 브리핑',monitor:'사건 추적',now:'수집 중',profile:'국가 지도자',visit:'고위급 인사 · 회담 및 통상·안보 동향',newsHint:'기사 원문·출처 확인',stockUnavailable:'대표 주가지수가 확인되지 않았습니다.',chartExternal:'차트가 표시되지 않으면 외부 제공자가 임베드를 제한했을 수 있습니다.',growth:'GDP 성장률',inflation:'소비자물가',unemployment:'실업률',trade:'무역/GDP',exports:'수출/GDP',fdi:'외국인직접투자/GDP',current:'경상수지/GDP',spend:'정부지출/GDP',select:'국가 선택',sector:'분야',partners:'관련국 영향',notKnown:'자료 확인 중',last:'갱신',first:'최신 보도',open:'원문',reader:'자동 검색 결과',unconfirmed:'보도된 정보',noEvents:'선택한 조건의 보도가 없습니다.',source:'출처'},
 en:{combined:'Diplomacy · Defense · Trade',brief:'Daily Brief',economy:'Economy',politics:'Politics',defense:'Defense',diplomacy:'Diplomacy',loading:'Loading the latest information…',slow:'Checking sources; this may take a moment.',noData:'No data is currently available.',noIndex:'No embeddable benchmark index is available.',recent:'Last 5 years',reported:'Published',macroSource:'World Bank · reporting years vary by indicator',event:'Geopolitical events',region:'Region',topic:'Sector',all:'All',more:'Show more',less:'Show less',list:'Countries',compare:'Compare countries',news:'Daily news',monitor:'Events',now:'Collecting',profile:'National leadership',visit:'Officials · diplomatic, security & trade developments',newsHint:'View original article and source',stockUnavailable:'No benchmark index confirmed.',chartExternal:'If the chart does not appear, the provider may restrict embedding.',growth:'GDP growth',inflation:'Consumer inflation',unemployment:'Unemployment',trade:'Trade / GDP',exports:'Exports / GDP',fdi:'FDI / GDP',current:'Current account / GDP',spend:'Gov. expenditure / GDP',select:'Select country',sector:'Sector',partners:'Regional implications',notKnown:'Checking records',last:'Updated',first:'Latest reports',open:'Source',reader:'Automatically collected',unconfirmed:'Reported information',noEvents:'No reports match these filters.',source:'Source'},
 zh:{combined:'外交 · 国防 · 贸易',brief:'每日新闻',economy:'经济',politics:'政治',defense:'国防',diplomacy:'外交',loading:'正在获取最新信息…',slow:'正在核对资料，请稍候。',noData:'暂无可用数据。',noIndex:'暂无可嵌入的代表性股指。',recent:'最近五年',reported:'报道日期',macroSource:'世界银行 · 各项指标公布年份可能不同',event:'地缘政治事件',region:'地区',topic:'领域',all:'全部',more:'查看更多',less:'收起',list:'国家列表',compare:'国家比较',news:'每日新闻',monitor:'事件追踪',now:'采集中',profile:'国家领导人',visit:'高层官员 · 外交、安全及贸易动向',newsHint:'查看原文与来源',stockUnavailable:'尚未确认代表性股指。',chartExternal:'若图表不可见，数据提供方可能限制嵌入。',growth:'GDP增长率',inflation:'居民消费价格涨幅',unemployment:'失业率',trade:'贸易/GDP',exports:'出口/GDP',fdi:'外商直接投资/GDP',current:'经常账户/GDP',spend:'政府支出/GDP',select:'选择国家',sector:'领域',partners:'对其他国家的潜在影响',notKnown:'正在核实资料',last:'更新时间',first:'最新报道',open:'原文',reader:'自动采集结果',unconfirmed:'媒体报道信息',noEvents:'没有符合筛选条件的报道。',source:'来源'}
};
const V4=k=>V4T[gmiLang]?.[k]||V4T.ko[k]||k;
Object.assign(GMIT.ko,{brief:'오늘의 뉴스',diplomacy:'외교·안보·통상',noIndex:'대표 주가지수가 등록되지 않았습니다.',leaderWait:'국가 지도자 자료를 확인하는 중…',leaderNone:'확인 가능한 지도자 정보가 없습니다.'});
Object.assign(GMIT.en,{brief:'Daily News',diplomacy:'Diplomacy · Security · Trade',leaderWait:'Looking up public leadership records…'});
Object.assign(GMIT.zh,{brief:'每日新闻',diplomacy:'外交·安全·贸易',leaderWait:'正在查询国家领导人资料…'});
const v4Regions=['아시아','유럽','중동','아메리카','아프리카','오세아니아','기타'];
const v4RegionNames={ko:['아시아','유럽','중동','아메리카','아프리카','오세아니아','기타'],en:['Asia','Europe','Middle East','Americas','Africa','Oceania','Other'],zh:['亚洲','欧洲','中东','美洲','非洲','大洋洲','其他']};
function regionName(k){return v4RegionNames[gmiLang][Math.max(0,v4Regions.indexOf(k))]||k;}
function sortByLocale(arr){const locale={ko:'ko-KR',en:'en-US',zh:'zh-CN-u-co-pinyin'}[gmiLang];const co=new Intl.Collator(locale,{numeric:true,sensitivity:'base'});return [...arr].sort((a,b)=>co.compare(displayCountry(a),displayCountry(b)));}
function countryMatches(c,q){return [c.name,c.english,c.iso,c.iso2,displayCountry(c)].join(' ').toLocaleLowerCase().includes(q)}
function directoryMarkup(){const q=(state.countryQuery||'').trim().toLocaleLowerCase();const matched=countries.filter(c=>(state.countryRegion==='전체'||state.countryRegion===c.region)&&(!q||countryMatches(c,q)));return {matched,html:v4Regions.map(reg=>{const group=sortByLocale(matched.filter(c=>(c.region||'기타')===reg));if(!group.length)return '';return `<section class="v4-continent"><div class="v4-continent-head"><h3>${regionName(reg)}</h3><span>${group.length}</span></div><div class="v4-country-grid">${group.map(c=>`<button class="v4-country" data-jump-country="${esc(c.iso)}"><span class="v4-flag">${c.flag}</span><span class="v4-country-copy"><strong>${esc(displayCountry(c))}</strong><small>${esc(c.iso)} · ${esc(c.currency)}</small></span><span class="v4-chevron">↗</span></button>`).join('')}</div></section>`}).join('')};}
renderCountriesWorkspace=function(){const r=directoryMarkup();$('#workspaceContent').innerHTML=`<div class="workspace-header v4-heading"><div><div class="eyebrow">GLOBAL ATLAS</div><h2>${L('dir')}</h2><p>${r.matched.length} / ${countries.length}</p></div></div><div class="v4-country-controls"><input id="directorySearch" placeholder="${esc(L('countrySearch'))}" value="${esc(state.countryQuery)}"/><select id="directoryRegion"><option value="전체">${V4('all')}</option>${v4Regions.map(r=>`<option value="${r}" ${state.countryRegion===r?'selected':''}>${regionName(r)}</option>`).join('')}</select></div><div id="directoryCountries" class="v4-directory">${r.html}</div>`;
 $('#directorySearch').addEventListener('input',e=>{state.countryQuery=e.target.value;updateDirectoryList()});$('#directoryRegion').addEventListener('change',e=>{state.countryRegion=e.target.value;updateDirectoryList()});};
updateDirectoryList=function(){if(!$('#directoryCountries'))return;const r=directoryMarkup();$('#directoryCountries').innerHTML=r.html||`<p>${V4('noData')}</p>`;const p=$('#workspaceContent .v4-heading p');if(p)p.textContent=`${r.matched.length} / ${countries.length}`;};
refreshCountryExplorer=function(){const el=$('#quickCountryResults');if(!el)return;const q=($('#countryQuickSearch')?.value||'').toLocaleLowerCase().trim();if(!q){el.replaceChildren();return;}const list=sortByLocale(countries.filter(c=>countryMatches(c,q))).slice(0,10);el.innerHTML=list.map(c=>`<button class="v4-quick-country" data-jump-country="${c.iso}">${c.flag} ${esc(displayCountry(c))}<small>${c.iso}</small></button>`).join('')||`<p class="v4-subtle">${V4('noData')}</p>`};
const v4TypeLabels={ko:['전체','외교','국방·안보','통상·제재','정치'],en:['All','Diplomacy','Defense','Trade & Sanctions','Politics'],zh:['全部','外交','国防安全','贸易与制裁','政治']};
let v4Sector='all',v4Region='전체',v4ShowAll=false;
function eventSector(e){if(['trade','sanctions'].includes(e.type))return 'trade';if(e.type==='diplomacy')return 'diplomacy';if(e.type==='politics')return 'politics';return 'defense'}
const sectCodes=['all','diplomacy','defense','trade','politics'];
renderEvents=function(){const r=filtered().filter(e=>(v4Region==='전체'||e.region===v4Region)&&(v4Sector==='all'||eventSector(e)===v4Sector));const target=$('#sidebarEvents');if(!target)return;
 $('#visibleEventCount').textContent=r.length;$('#filteredCounter').textContent=String(r.length);
 const controls=`<div class="v4-event-filter"><select id="v4EventRegion"><option value="전체">${V4('all')} · ${V4('region')}</option>${v4Regions.map(x=>`<option value="${x}" ${x===v4Region?'selected':''}>${regionName(x)}</option>`).join('')}</select><select id="v4EventSector">${sectCodes.map((x,i)=>`<option value="${x}" ${x===v4Sector?'selected':''}>${v4TypeLabels[gmiLang][i]}</option>`).join('')}</select></div>`;
 const selection=r.slice(0,v4ShowAll?120:16);const groups={};selection.forEach(e=>(groups[e.region||'기타']??=[]).push(e));
 target.innerHTML=controls+Object.entries(groups).sort((a,b)=>v4Regions.indexOf(a[0])-v4Regions.indexOf(b[0])).map(([k,items])=>`<div class="v4-event-region">${regionName(k)}</div>${items.map(e=>`<button class="v4-event" data-open-event="${esc(e.id)}"><i style="background:${gmiTypeColors[e.type]||'#9eafbe'}"></i><span>${esc(e.title)}</span></button>`).join('')}`).join('')+(r.length>16?`<button id="v4MoreEvents" class="v4-more">${v4ShowAll?V4('less'):V4('more')} <span>${r.length}</span> ↗</button>`:'')+(!r.length?`<p class="v4-subtle">${V4('noEvents')}</p>`:'');renderMarkers();};
// The selected-country panel has four research sections; adjacent issues are integrated.
renderDrawer=function(){const sel=state.selected;if(!sel)return;if(sel.kind!=='country'){_renderDrawerOriginal();return;}
 if(['security','trade'].includes(state.tab))state.tab='diplomacy';const c=sel.c;
 $('#insightContent').innerHTML=countryHeader(c)+`<div class="drawer-tabs v4-tabs">${[['market','market'],['macro','macro'],['diplomacy','diplomacy'],['news','brief']].map(([key,l])=>`<button class="drawer-tab ${state.tab===key?'active':''}" data-drawer-tab="${key}">${L(l)}</button>`).join('')}</div><div class="drawer-body v4-body">${state.tab==='market'?marketTab(c):state.tab==='macro'?`<div id="macroMetrics" class="v4-macro"><div class="v4-loading"><span class="loading-spinner"></span>${V4('loading')}</div></div>`:state.tab==='diplomacy'?diplomaticTab(c):dailyTab(c)}</div>`;
 loadLeader(c);if(state.tab==='market')mountTradingView(c);if(state.tab==='macro')showMacro(c);if(state.tab==='diplomacy')loadDiplomacy(c);if(state.tab==='news')loadDailyBrief(c);
};
// Benchmark charts: no misleading synthetic 'index' values and no visible custom-symbol UI.
Object.assign(GMI_IDX,{
 USA:[['S&P 500 추종 ETF · SPY','AMEX:SPY'],['NASDAQ 100 추종 ETF · QQQ','NASDAQ:QQQ'],['Dow Jones 추종 ETF · DIA','AMEX:DIA']],
 CHN:[['CSI 300 추종 ETF · 510300','SSE:510300'],['Shanghai Composite','SSE:000001']],
 KOR:[['KOSPI 200 추종 ETF · 069500','KRX:069500'],['KOSDAQ 150 추종 ETF · 229200','KRX:229200']],
 JPN:[['Nikkei 225 추종 ETF · 1321','TSE:1321']],
 RUS:[],
 GBR:[['FTSE 100 추종 ETF · ISF','LSE:ISF']],
 DEU:[['DAX 추종 ETF · EXS1','XETR:EXS1']],
 FRA:[['CAC 40 추종 ETF · CAC','EURONEXT:CAC']],
 IND:[['NIFTY 50','NSE:NIFTY']],
 CAN:[['S&P/TSX 60 추종 ETF · XIU','TSX:XIU']]
});
function v4MarketLabel(label){if(gmiLang==='ko')return label;if(gmiLang==='en')return label.replace(' 추종 ETF',' tracker ETF');return label.replace(' 추종 ETF',' 跟踪ETF').replace('Shanghai Composite','上证综合指数').replace('Nikkei','日经');}
marketTab=function(c){const available=GMI_IDX[c.iso]||[],chosen=store.get('v4Symbols',{})[c.iso],a=available.some(x=>x[1]===chosen)?chosen:available[0]?.[1]||'';
 if(!a)return `<div class="section-label">${L('index')}</div><div class="v4-no-index">${V4('stockUnavailable')}</div><div class="v4-footnote">${esc(c.exchange||'')}</div>`;
 return `<div class="v4-market-select"><label>${L('index')}</label><select id="v4Index">${available.map(([label,sym])=>`<option value="${esc(sym)}" ${sym===a?'selected':''}>${esc(v4MarketLabel(label))}</option>`).join('')}</select></div><div class="gmi-intervals" role="group" aria-label="Chart interval">${[['60','1H'],['240','4H'],['D',gmiLang==='ko'?'일봉':gmiLang==='zh'?'日线':'Daily'],['W',gmiLang==='ko'?'주봉':gmiLang==='zh'?'周线':'Weekly']].map(([code,label])=>`<button data-tv-interval="${code}" class="${store.get('tvInterval','D')===code?'active':''}">${label}</button>`).join('')}</div><div id="gmiChart" class="gmi-chart" data-symbol="${esc(a)}"><div class="v4-loading">${V4('loading')}</div></div><div class="v4-footnote">${V4('chartExternal')}</div>`;
};
// Eight macro series fetched through a single World Bank multi-indicator request.
const V4Indicators=[['growth','NY.GDP.MKTP.KD.ZG'],['inflation','FP.CPI.TOTL.ZG'],['unemployment','SL.UEM.TOTL.ZS'],['trade','NE.TRD.GNFS.ZS'],['exports','NE.EXP.GNFS.ZS'],['fdi','BX.KLT.DINV.WD.GD.ZS'],['current','BN.CAB.XOKA.GD.ZS'],['spend','GC.XPN.TOTL.GD.ZS']];
const v4MacroCache=new Map();
function sparkline(vals){const annual=vals.filter(v=>/^\d{4}$/.test(String(v.date))&&Number.isFinite(+v.value));const end=Math.max(...annual.map(v=>Number(v.date)));const rows=annual.filter(v=>Number(v.date)>=end-4&&Number(v.date)<=end).sort((a,b)=>Number(a.date)-Number(b.date));if(rows.length<2)return `<div class="v4-spark-empty">—</div>`;
 const min=Math.min(...rows.map(r=>+r.value)),max=Math.max(...rows.map(r=>+r.value)),spread=Math.max(.001,max-min),pts=rows.map((r,i)=>[6+i*250/(rows.length-1),51-(+r.value-min)/spread*43]);
 return `<svg viewBox="0 0 264 64" class="v4-spark" aria-label="${V4('recent')}"><path d="${pts.map((v,i)=>(i?'L':'M')+v.join(' ')).join(' ')}" fill="none" stroke="#d59a73" stroke-width="2.1" stroke-linejoin="round"/><g fill="#9caec0" font-size="10"><text x="3" y="62">${esc(rows[0].date)}</text><text x="261" y="62" text-anchor="end">${esc(rows.at(-1).date)}</text></g></svg>`;
}
showMacro=async function(c){const el=$('#macroMetrics');if(!el)return;el.innerHTML=`<div class="v4-loading"><span class="loading-spinner"></span>${V4('loading')}</div>`;let data=v4MacroCache.get(c.iso);
 if(!data){try{const res=await fetch(`/api/macro-bundle?country=${c.iso}`,{signal:AbortSignal.timeout(18000)});if(!res.ok)throw Error('source');data=await res.json();v4MacroCache.set(c.iso,data)}catch{data={indicators:{},error:true}}}
 if(state.selected?.id!==c.iso||state.tab!=='macro'||!$('#macroMetrics'))return;
 const cards=V4Indicators.map(([key,code])=>{const series=data.indicators?.[code]||[],latest=series[0];return `<section class="v4-metric"><div class="v4-metric-head"><span>${V4(key)}</span><span class="v4-year">${esc(latest?.date||'—')}</span></div><div class="v4-metric-value">${latest?Number(latest.value).toFixed(2)+'%':'—'}</div>${sparkline(series)}</section>`}).join('');
 el.innerHTML=`<div class="v4-metrics-grid">${cards}</div><div class="v4-footnote">${V4('macroSource')} · <a href="https://data.worldbank.org/country/${encodeURIComponent(c.iso2.toLowerCase())}" target="_blank" rel="noopener noreferrer">World Bank ↗</a></div>`;
};
// Use country-language RSS and AI summaries when available, but never fabricate translations.
quickApi=async function(type,iso){const q=`/api/${type}?country=${encodeURIComponent(iso)}`+(type==='brief'?`&lang=${gmiLang}`:'');const res=await fetch(q,{signal:AbortSignal.timeout(14000)});if(!res.ok)throw Error('API '+res.status);return res.json();};
function v4LoadingBrief(){return `<div class="v4-loading"><span class="loading-spinner"></span>${V4('loading')}</div>`;}
function v4BriefCard(cat,items){const colors={economy:'#70bdbd',politics:'#ad9ed5',defense:'#dba46d',diplomacy:'#6eadd0'};
 return `<section class="v4-news-section"><div class="v4-section-title"><span style="background:${colors[cat]}"></span><h3>${V4(cat)}</h3></div>${items?.length?items.slice(0,2).map(x=>{const title=x[`title_${gmiLang}`]||x.title,summary=x[`summary_${gmiLang}`]||x.summary||'',impact=x[`impact_${gmiLang}`]||'';
 return `<article class="v4-article"><div class="v4-article-byline">${esc(x.source||'RSS')} <span>·</span> ${esc(x.date||'')}</div><a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>${summary&&summary!==title?`<p>${esc(summary)}</p>`:''}${impact?`<div class="v4-impact"><b>${V4('partners')}</b> ${esc(impact)}</div>`:''}</article>`}).join(''):`<div class="v4-news-placeholder">${V4('noData')}</div>`}</section>`;
}
function v4DrawBrief(data,target){const root=$(target);if(!root)return;const filled=Object.values(data?.categories||{}).some(a=>a?.length);
 if(data?.loading&&!filled){root.innerHTML=v4LoadingBrief();return;}
 root.innerHTML=`<div class="v4-news-sections">${['economy','politics','defense','diplomacy'].map(k=>v4BriefCard(k,data?.categories?.[k])).join('')}</div>`;
}
async function v4BriefFetch(c,target,check){const cacheKey=c.iso+':'+gmiLang,existing=gmiCache.brief.get(cacheKey);if(existing)v4DrawBrief(existing,target);else $(target).innerHTML=v4LoadingBrief();
 const attempt=async()=>{const data=await quickApi('brief',c.iso);if(!check())return false;if(!data.loading||Object.values(data.categories||{}).some(x=>x.length)){gmiCache.brief.set(cacheKey,data);v4DrawBrief(data,target);}else v4DrawBrief({loading:true},target);return !!data.loading};
 try{let waiting=await attempt();if(waiting){for(const delay of [2200,4000,6200]){await new Promise(r=>setTimeout(r,delay));if(!check())return;waiting=await attempt();if(!waiting)break;}}
 }catch{if(check())$(target).innerHTML=`<p class="v4-loading">${V4('slow')}</p>`;}
}
loadDailyBrief=function(c){return v4BriefFetch(c,'#gmiBriefCards',()=>state.selected?.id===c.iso&&state.tab==='news')};
dailyTab=function(c){return `<div class="v4-section-label">${V4('brief')} · ${esc(displayCountry(c))}</div><div id="gmiBriefCards">${v4LoadingBrief()}</div>`};
renderNewsWorkspace=function(){const c=countryByIso[state.newsCountry]||countryByIso.USA;$('#workspaceContent').innerHTML=`<div class="workspace-header v4-heading"><div><div class="eyebrow">DAILY INTELLIGENCE</div><h2>${c.flag} ${esc(displayCountry(c))}</h2></div><select id="gmiBriefCountry" class="v4-news-select">${sortByLocale(countries).map(x=>`<option value="${x.iso}" ${x.iso===c.iso?'selected':''}>${x.flag} ${esc(displayCountry(x))}</option>`).join('')}</select></div><div id="gmiWorkspaceBrief">${v4LoadingBrief()}</div>`;
 $('#gmiBriefCountry').onchange=e=>{state.newsCountry=e.target.value;renderNewsWorkspace()};v4BriefFetch(c,'#gmiWorkspaceBrief',()=>state.page==='news'&&state.newsCountry===c.iso);
};
// Unified high-level diplomacy, defense and trade table, showing only sourced reports.
diplomaticTab=function(c){return `<div class="v4-section-label">${V4('visit')} · ${esc(displayCountry(c))}</div><div id="gmiDiplomacy">${v4LoadingBrief()}</div>`;};
function v4OfficialRows(c,res){const arr=(res.events||[]).slice(0,40);const items=combined().filter(e=>(e.countries||[]).includes(c.iso)&&['diplomacy','trade','defense'].includes(e.kind)).slice(0,18);
 const unique=new Set();const rows=[...arr.map(v=>({title:v[`summary_${gmiLang}`]||v.reported_title,source:v.publisher,date:v.reported_at,url:v.source,role:roleName(v.role),person:v.person||'',when:v.meeting_date||v.visit_date||'',category:'diplomacy'})),
 ...items.map(v=>({title:v.title,source:v.reportedSource||v.source,date:v.date,url:v.url,role:v.kind==='trade'?V4('trade'):v.kind==='defense'?V4('defense'):V4('diplomacy'),person:'',when:'',category:v.kind}))].filter(v=>{const id=(v.url||'')+v.title;if(unique.has(id))return false;unique.add(id);return true;}).slice(0,38);
 return rows.length?`<div class="v4-intel-list">${rows.map(v=>`<article class="v4-intel-row"><div class="v4-intel-meta"><span>${esc(v.role||'')}</span> <time>${esc(v.when||v.date||'')}</time></div><a href="${esc(safeUrl(v.url))}" target="_blank" rel="noopener noreferrer">${esc(v.title||'')}</a><small>${v.person?esc(v.person)+' · ':''}${esc(v.source||'')}</small></article>`).join('')}</div>`:`<p class="v4-loading">${V4('loading')}</p>`;
}
drawDiplomacy=function(c,res){if(state.selected?.id!==c.iso||state.tab!=='diplomacy'||!$('#gmiDiplomacy'))return;$('#gmiDiplomacy').innerHTML=v4OfficialRows(c,res);};
// Simplify official roster display: do not show a glaring red error card while sources are loading.
const v4OriginalLeader=drawLeader;
drawLeader=function(c,data){v4OriginalLeader(c,data);const box=$('#gmiLeaderName');if(!box)return;
 if(!(data?.people||[]).length){box.textContent=(data?.loading?L('leaderWait'):V4('notKnown'));$('#gmiLeaderElection').textContent='';}
};
// Render footer/nav only in chosen language; no mixed-language status labels.
const v4Localized=_localizedText;
_localizedText=function(){v4Localized();const sidebarLabel=$('.section-title.top-title span');if(sidebarLabel)sidebarLabel.innerHTML='<strong id="visibleEventCount">'+filtered().length+'</strong> '+esc(V4('monitor'));const eHead=$('.section-title:not(.top-title) span');if(eHead)eHead.textContent=V4('monitor');const evtLabel=$('#filteredCounter')?.previousElementSibling;if(evtLabel&&evtLabel.tagName==='SPAN')evtLabel.textContent=V4('monitor');const warning=$('#mapModeNotice');if(warning)warning.remove();$('.map-bottom-left')?.remove();$('.map-hint')?.remove();if($('#gmiLang'))$('#gmiLang').value=gmiLang;
 const crumb=$('.crumb');if(crumb&&crumb.firstChild?.nodeType===Node.TEXT_NODE)crumb.firstChild.textContent=({ko:'글로벌 현황 ',en:'GLOBAL OVERVIEW ',zh:'全球概览 '})[gmiLang];
 const count=$('.country-finder .filter-heading span');if(count)count.textContent=({ko:'250개 국가·지역',en:'250 countries / territories',zh:'250个国家／地区'})[gmiLang];
 const intro=$('.v4-heading .eyebrow');if(intro)intro.textContent=({ko:'국가별 탐색',en:'GLOBAL ATLAS',zh:'全球国家地图册'})[gmiLang];
};

// Do not hide a government-verified leader while optional Wikidata photo enrichment is pending.
const v4LeaderPolls=new Set();
loadLeader=async function(c){const cached=gmiCache.leader.get(c.iso);if(cached)drawLeader(c,cached);
 try{const result=await quickApi('leader',c.iso);if(state.selected?.id!==c.iso)return;
  if(result.people?.length){gmiCache.leader.set(c.iso,result);drawLeader(c,result)}
  else if(!cached)drawLeader(c,{loading:true,people:[]});
  if(result.loading&&!v4LeaderPolls.has(c.iso)){
   v4LeaderPolls.add(c.iso);setTimeout(async()=>{v4LeaderPolls.delete(c.iso);
    if(state.selected?.id!==c.iso)return;
    try{const updated=await quickApi('leader',c.iso);if(updated.people?.length){gmiCache.leader.set(c.iso,updated);drawLeader(c,updated)}}catch{}
   },4500);
  }
 }catch{if(!cached&&state.selected?.id===c.iso)drawLeader(c,{people:[],loading:true});}
};
// Display dated government-office snapshots alongside live source-driven diplomacy.
const v4OfficeNames={
 'Donald Trump':['도널드 트럼프','Donald Trump','唐纳德·特朗普'],'Xi Jinping':['시진핑','Xi Jinping','习近平'],'Vladimir Putin':['블라디미르 푸틴','Vladimir Putin','弗拉基米尔·普京'],
 'Lee Jae-myung':['이재명','Lee Jae-myung','李在明'],'Andy Burnham':['앤디 번햄','Andy Burnham','安迪·伯纳姆'],
 'Marco Rubio':['마코 루비오','Marco Rubio','马尔科·鲁比奥'],'Howard Lutnick':['하워드 러트닉','Howard Lutnick','霍华德·卢特尼克'],
 'Pete Hegseth':['피트 헤그세스','Pete Hegseth','皮特·赫格塞思'],'Wang Yi':['왕이','Wang Yi','王毅'],
 'Dong Jun':['둥쥔','Dong Jun','董军'],'Wang Wentao':['왕원타오','Wang Wentao','王文涛'],
 'Ed Miliband':['에드 밀리밴드','Ed Miliband','埃德·米利班德'],'Jonathan Reynolds':['조너선 레이놀즈','Jonathan Reynolds','乔纳森·雷诺兹'],
 'Wes Streeting':['웨스 스트리팅','Wes Streeting','韦斯·斯特里廷']};
function v4Name(n){return v4OfficeNames[n]?.[['ko','en','zh'].indexOf(gmiLang)]||n}
const v4OriginalLeaderExtended=drawLeader;
drawLeader=function(c,data){v4OriginalLeaderExtended(c,data);const p=(data?.people||[]).find(v=>v.office==='head_of_state')||(data?.people||[])[0];if(p&&$('#gmiLeaderName'))$('#gmiLeaderName').textContent=v4Name(p.name);
 if(data?.verified_as_of&&$('#gmiLeaderTerm'))$('#gmiLeaderTerm').textContent+=` · ${{ko:'확인',en:'as of',zh:'核对于'}[gmiLang]} ${data.verified_as_of}`;if(p?.source&&$('#gmiLeaderSource'))$('#gmiLeaderSource').innerHTML=`<a class="gmi-tiny-link" href="${esc(safeUrl(p.source))}" target="_blank" rel="noopener noreferrer">${V4('source')} ↗</a>${p.photo_source?` <a class="gmi-tiny-link v4-photo-credit" href="${esc(safeUrl(p.photo_source))}" target="_blank" rel="noopener noreferrer">${esc(p.photo_credit||'Photo credit')} ↗</a>`:''}`;};
function v4RoleLabel(role){return ({head_of_state:[L('headOfState'),'Head of State','国家元首'],head_of_government:[L('headOfGov'),'Head of Government','政府首脑'],foreign_minister:['외교장관','Foreign Minister','外交部长'],commerce_minister:['상무·통상장관','Commerce / Trade Minister','商务／贸易部长'],defense_minister:['국방장관','Defense Minister','国防部长']}[role]||[role,role,role])[["ko","en","zh"].indexOf(gmiLang)]}
async function loadV4Officials(c){let root=$('#v4OfficialsMini');if(!root)return;
 try{const result=await quickApi('officials',c.iso);if(state.selected?.id!==c.iso||!$('#v4OfficialsMini'))return;
 const official=(result.people||[]).filter(x=>!['head_of_state','head_of_government'].includes(x.office));
 if(!official.length){root.remove();return;}
 root.innerHTML=`<div class="v4-official-title">${V4('visit')} <small>${esc(result.verified_as_of||'')}</small></div><div class="v4-office-grid">${official.map(p=>`<a href="${esc(safeUrl(p.source))}" target="_blank" rel="noopener noreferrer"><small>${esc(v4RoleLabel(p.office))}</small><strong>${esc(v4Name(p.name))}</strong></a>`).join('')}</div>`;
 }catch{root.remove();}
}
const v4CountryRender=renderDrawer;
renderDrawer=function(){v4CountryRender();const c=state.selected?.kind==='country'?state.selected.c:null;if(!c)return;
 const parent=$('.gmi-leader');if(parent){const row=document.createElement('div');row.id='v4OfficialsMini';row.className='v4-officials-mini';row.innerHTML=`<div class="v4-loading">${V4('loading')}</div>`;parent.after(row);loadV4Officials(c);}
};

const v4SetLang=setGMILang;
setGMILang=function(lang){gmiCache.brief.clear();v4SetLang(lang);if(state.page==='countries')renderCountriesWorkspace();if(state.page==='news')renderNewsWorkspace();if(state.selected?.kind==='country')renderDrawer();renderEvents();};
document.addEventListener('change',ev=>{if(ev.target.id==='v4EventRegion'){v4Region=ev.target.value;v4ShowAll=false;renderEvents();}if(ev.target.id==='v4EventSector'){v4Sector=ev.target.value;v4ShowAll=false;renderEvents();}
 if(ev.target.id==='v4Index'){const c=state.selected?.c;if(!c)return;const chosen=store.get('v4Symbols',{});chosen[c.iso]=ev.target.value;store.set('v4Symbols',chosen);renderDrawer();}
});
document.addEventListener('click',e=>{if(e.target.closest('#v4MoreEvents')){v4ShowAll=!v4ShowAll;renderEvents();}});

// Apply the same facet filters to map markers and the sidebar.
const v4BaseFiltered=filtered;
filtered=function(){return v4BaseFiltered().filter(e=>(v4Region==='전체'||e.region===v4Region)&&(v4Sector==='all'||eventSector(e)===v4Sector))};
// Country-comparison datasets share the same eight-indicator World Bank bundle cache.
loadMacro=async function(c){if(state.macroCache.has(c.iso))return state.macroCache.get(c.iso);
 const data=v4MacroCache.get(c.iso)||await (async()=>{const r=await fetch(`/api/macro-bundle?country=${encodeURIComponent(c.iso)}`,{signal:AbortSignal.timeout(18000)});if(!r.ok)throw Error('macro');const value=await r.json();v4MacroCache.set(c.iso,value);return value})();
 const result={};for(const [key,id] of Object.entries(indMap))result[key]=data.indicators?.[id]||[];
 state.macroCache.set(c.iso,result);return result;
};
// The cross-country picker should not dump 250 chips into the interface.
const v4BaseCompare=renderCompare;
renderCompare=function(){v4BaseCompare();const container=$('#workspaceContent .compare-selector');if(!container)return;
 const options=v4Regions.map(reg=>{const rows=sortByLocale(countries.filter(c=>(c.region||'기타')===reg));return rows.length?`<optgroup label="${regionName(reg)}">${rows.map(c=>`<option value="${c.iso}">${c.flag} ${esc(displayCountry(c))}</option>`).join('')}</optgroup>`:''}).join('');
 container.innerHTML=`<div class="v4-compare-current">${state.compare.map(iso=>{const c=countryByIso[iso];return c?`<button data-v4-remove="${c.iso}">${c.flag} ${esc(displayCountry(c))} ×</button>`:''}).join('')}</div><select id="v4CompareAdd"><option value="">＋ ${V4('select')}</option>${options}</select>`;
 const hdr=$('#workspaceContent .panel h3');if(hdr)hdr.textContent=V4('select');
 $('#v4CompareAdd').onchange=e=>{if(e.target.value&&!state.compare.includes(e.target.value)){state.compare=[...state.compare.slice(-3),e.target.value];store.set('compare',state.compare);renderCompare()}};
};
document.addEventListener('click',e=>{const btn=e.target.closest('[data-v4-remove]');if(!btn)return;state.compare=state.compare.filter(iso=>iso!==btn.dataset.v4Remove);store.set('compare',state.compare);renderCompare()});

_localizedText();renderEvents();
