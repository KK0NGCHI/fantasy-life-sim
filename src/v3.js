
import {REGIONS,ACTIONS,START_ITEMS,SKILLS,TILES} from './data.js';
const $=x=>document.querySelector(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeCopy=x=>JSON.parse(JSON.stringify(x));
const pageNames=['생활','세계 지도','인벤토리','캐릭터','숙련','제작','도감','신앙','설정'];
const icon={생활:'⌂','세계 지도':'◇',인벤토리:'▤',캐릭터:'♙',숙련:'✦',제작:'⚒',도감:'▣',신앙:'✧',설정:'⚙'};
const actionIcon={'밭을 돌본다':'♧','작물을 수확한다':'❀','작업대를 사용한다':'⚒','휴식한다':'☕','약초를 채집한다':'♣','풀을 벤다':'✂','농지를 살핀다':'◉','나무를 조사한다':'♧','나뭇가지를 줍는다':'♣','버섯을 채집한다':'◍','낚시한다':'♒','강변을 조사한다':'◉','광석을 채굴한다':'◆','지층을 조사한다':'◎','던전에 진입한다':'⚔','주변을 살핀다':'◎'};
const actionLabel=a=>({'밭을 돌본다':'밭 돌보기','작물을 수확한다':'작물 수확','작업대를 사용한다':'작업대','휴식한다':'휴식','약초를 채집한다':'약초 채집','풀을 벤다':'풀 베기','농지를 살핀다':'농지 조사','나무를 조사한다':'나무 조사','나뭇가지를 줍는다':'나뭇가지 줍기','버섯을 채집한다':'버섯 채집','낚시한다':'낚시','강변을 조사한다':'강변 조사','광석을 채굴한다':'채광','지층을 조사한다':'지층 조사','던전에 진입한다':'던전 진입','주변을 살핀다':'주변 조사','던전 나가기':'던전 나가기'}[a]||a);
const categories=['전체','식재료','재료','광석','약초','장비','도구','기타'];
const extra=[
['bronze_sword','청동 장검','장비',1,3.6,'보통','청동',15,6,['weapon:sword','material:bronze']],
['copper_pick','구리 곡괭이','도구',1,2.2,'보통','구리',0,0,['tool:mining','material:copper']],
['fur_cap','여우털 모자','장비',1,.5,'고급','모피',0,2,['armor:head','material:fur']],
['apple','사과','식재료',8,.2,'보통','과일',0,0,['food:fruit']],
['flower','달맞이꽃','약초',3,.1,'희귀','식물',0,0,['plant:flower','craft:alchemical']],
['stone','조약돌','재료',28,.8,'보통','석재',0,0,['material:stone']],
['copper','구리광석','광석',17,1.5,'보통','구리',0,0,['material:copper']],
['rope','마끈','재료',9,.1,'보통','섬유',0,0,['material:fiber']],
['bread','밀빵','식재료',6,.3,'보통','곡물',0,0,['food:prepared']],
['healing','회복 물약','기타',4,.2,'고급','유리병',0,0,['consumable:potion']],
['oak_bow','참나무 활','장비',1,1.3,'보통','목재',12,0,['weapon:bow']],
['blue_fish','푸른붕어','식재료',6,.7,'보통','민물',0,0,['origin:freshwater']],
['salt','소금','재료',18,.1,'보통','광물',0,0,['food:seasoning']],
['wool','양털','재료',14,.4,'보통','섬유',0,0,['material:fiber']],
['mushroom','구름버섯','식재료',11,.2,'고급','균류',0,0,['food:mushroom']]
].map(([id,name,group,qty,weight,quality,material,attack,defense,tags])=>({id:'mock:'+id,name,group,qty,weight,quality,material,attack,defense,tags}));
const baseItems=[...START_ITEMS.map(i=>({...i,weight:.5,quality:'보통',material:i.group,attack:0,defense:0})),...extra];

const ICON_MAP={"생활":"house","세계 지도":"map","인벤토리":"backpack","캐릭터":"user-round","숙련":"chart-no-axes-column","제작":"hammer","도감":"book-open","신앙":"sparkles","설정":"settings","던전":"footprints"};
const ACTION_ICONS={'밭을 돌본다':'sprout','작물을 수확한다':'wheat','작업대를 사용한다':'hammer','휴식한다':'bed-double','약초를 채집한다':'leaf','풀을 벤다':'scissors','농지를 살핀다':'scan-eye','나무를 조사한다':'trees','나뭇가지를 줍는다':'logs','버섯을 채집한다':'sprout','낚시한다':'fish','강변을 조사한다':'waves','광석을 채굴한다':'pickaxe','지층을 조사한다':'mountain','던전에 진입한다':'footprints','주변을 살핀다':'scan-eye'};
const STATUS_MOCK=[{name:'출혈',icon:'droplets',turns:4,desc:'매 턴 피해를 받는 상태. 실제 피해량은 미정입니다.'},{name:'중독',icon:'flask-conical',turns:12,desc:'독의 영향을 받는 상태. 실제 효과는 미정입니다.'},{name:'혼란',icon:'brain',turns:7,desc:'행동에 영향을 주는 상태. 실제 판정은 미정입니다.'},{name:'저주',icon:'shield-alert',turns:null,desc:'해제 조건이 정해지지 않은 지속 상태입니다.'},{name:'화상',icon:'flame',turns:3,desc:'화염 관련 지속 피해 후보. 효과 미정입니다.'},{name:'마력 과부하',icon:'zap',turns:9,desc:'마법 관련 상태 이상 예시입니다.'},{name:'쇠약',icon:'activity',turns:5,desc:'능력 저하 효과 후보입니다.'},{name:'빙결',icon:'snowflake',turns:2,desc:'냉기 관련 상태 이상 예시입니다.'},{name:'공포',icon:'eye',turns:8,desc:'정신 관련 상태 이상 예시입니다.'}];
let overlayPage=null,overlayReturn=null,overlayReturnTab=null,conditionExpanded=false;
function svgIcon(name){return '<i data-lucide="'+esc(name)+'" aria-hidden="true"></i>'}
function iconify(){if(window.lucide?.createIcons){window.lucide.createIcons()}else if(!document.querySelector('#lucide-load-warning')){const note=document.createElement('span');note.id='lucide-load-warning';note.className='sr';note.textContent='아이콘 라이브러리를 불러오지 못했습니다.';document.body.append(note)}}

function fresh(){return {page:'생활',region:'거점 마을',tab:'개요',turn:0,pos:[2,2],dungeon:false,hp:100,mp:80,hunger:85,day:1,hour:8,items:safeCopy(baseItems),logs:[],filter:'전체',search:'',sort:'name',selectedItem:null,selectedIds:[],logFilter:'전체',logSearch:'',pinnedIds:[],expandedLogs:[],collapsed:true,viewFont:100,theme:'aurora',auto:{hp:{on:true,pct:35},mp:{on:false,pct:20},hunger:{on:true,pct:25}}}}
let s=fresh(),autoTimer=null,previousPage='생활';const LOG_LIMIT=500;
let logHeight=274;try{const n=Number(localStorage.getItem('fantasy-log-panel-height'));if(Number.isFinite(n)&&n>=165&&n<=1000)logHeight=n}catch{}

const THEMES=[{"id":"aurora","name":"오로라","mode":"light","colors":["#9667d9","#75b4f4","#f4a2d1"],"source":"게임 기본"},{"id":"rose-dawn","name":"장미빛 새벽","mode":"light","colors":["#907aa9","#286983","#b4637a"],"source":"로즈 파인"},{"id":"solarized","name":"솔라라이즈드","mode":"light","colors":["#268bd2","#2aa198","#b58900"],"source":"솔라라이즈드"},{"id":"citrus","name":"시트러스","mode":"light","colors":["#65a30d","#f59e0b","#0d9488"],"source":"라임·호박·청록"},{"id":"red","name":"석류빛","mode":"light","colors":["#d94358","#f5a65b","#7697c7"],"source":"붉은색 중심"},{"id":"blue","name":"푸른 항해","mode":"light","colors":["#267bcc","#70c8e5","#f1c17d"],"source":"파란색 중심"},{"id":"lavender","name":"라벤더 들판","mode":"light","colors":["#9273ce","#c09bea","#97c9a7"],"source":"라벤더·세이지"},{"id":"cocoa","name":"살구 코코아","mode":"light","colors":["#b97a58","#f4b98c","#93b1a6"],"source":"따뜻한 브라운"}];
function useTheme(id,persist=true){if(!THEMES.some(t=>t.id===id))id='aurora';s.theme=id;document.documentElement.dataset.theme=id;document.documentElement.style.colorScheme='light';if(persist){try{localStorage.setItem('fantasy-ui-theme',id)}catch{}}}
try{const stored=localStorage.getItem('fantasy-ui-theme');if(THEMES.some(t=>t.id===stored))s.theme=stored}catch{}

function nextLog(kind,text,detail=''){const last=s.logs[0];if(last&&last.kind===kind&&last.text===text){last.count=(last.count||1)+1;last.lastTurn=s.turn;return}const id='log-'+Date.now()+'-'+Math.random().toString(36).slice(2);s.logs.unshift({id,kind,text,detail,turn:s.turn,count:1,pin:false});if(s.logs.length>LOG_LIMIT)s.logs.length=LOG_LIMIT}
const make=(tag,props={},parent)=>{const e=document.createElement(tag);for(const [k,v]of Object.entries(props)){if(k==='text')e.textContent=v;else if(k==='html')e.innerHTML=v;else if(k==='class')e.className=v;else e.setAttribute(k,v)}if(parent)parent.append(e);return e};
function btn(text,fn,classes='btn',parent){const b=make('button',{type:'button',text,class:classes},parent);b.addEventListener('click',fn);return b}
function top(){
$('#top').innerHTML='<div class="top-title">판타지 생활 기록</div><div class="top-meta"><span>'+svgIcon('calendar-days')+' 봄 '+s.day+'일</span><span>'+svgIcon('clock')+' '+String(s.hour).padStart(2,'0')+':00</span><span class="gold-data">'+svgIcon('coins')+' 1,250 G</span><button type="button" class="top-settings" id="settingsControl" aria-label="설정" title="설정">'+svgIcon('settings')+'</button></div>';
$('#settingsControl').onclick=()=>openPage('설정');
}

function side(){ /* v0.3: persistent left navigation removed in favor of bottom controls */ }
function head(name,description){const main=$('#main');main.innerHTML='<h1>'+esc(name)+'</h1>'+(description?'<p class="subhead">'+esc(description)+'</p>':'')+'<div id="view"></div>';return main.querySelector('#view')}
function tabs(target,names,handler){const e=make('div',{class:'tabs'},target);for(const name of names){const b=btn(name,()=>handler(name),s.tab===name?'active':'',e);b.setAttribute('aria-selected',String(s.tab===name))}return e}
function section(el,title){const sec=make('section',{class:'section'},el);make('h2',{text:title},sec);return sec}
function changeTab(t){s.tab=t;if(overlayPage)drawOverlay();else drawMain();iconify()}
function openPage(name){if(autoTimer)stopAuto();if(['인벤토리','캐릭터','숙련','도감','신앙'].includes(name)){if(!overlayPage)overlayReturnTab=s.tab;overlayReturn=document.activeElement;overlayPage=name;s.tab=name==='인벤토리'?'전체':name==='캐릭터'?'기본 정보':name==='숙련'?'생활':name==='도감'?'발견 목록':'개요';render();return;}overlayPage=null;if(s.page!==name)previousPage=s.page;s.page=name;s.tab=name==='생활'?'개요':name==='제작'?'제작법':'기본';render()}
function act(name){if(name==='던전에 진입한다'){s.dungeon=true;s.page='던전';s.tab='탐색';s.turn++;nextLog('탐험','지하미궁에 들어섰습니다.','고정 예시 지도이며 실제 절차적 생성은 아직 없습니다.');return render()}if(name==='작업대를 사용한다')return openPage('제작');s.turn++;nextLog('생활',actionLabel(name)+'을(를) 실행했습니다.','실제 생산·성장·시간 계산 없이 UI 로그만 생성했습니다.');render()}
function regionActions(){return ACTIONS[s.region]||['주변을 살핀다','휴식한다']}
function lifestyle(){
const el=head(s.region,'');const hue={'거점 마을':'town','초원·농경지':'pasture','숲':'forest','강·호수':'river','습지':'marsh','산맥':'mountain','광산':'mine','설원':'snow','사막':'desert','해안·항구':'coast','바다':'ocean','화산지대':'volcano','고대 유적':'ruins','폐허·묘지':'grave','만신전':'temple','지하미궁':'dungeon'}[s.region]||'pasture';
const hero=make('section',{class:'region-scene scene-'+hue},el);hero.innerHTML='<div class="scene-heading"><div><span class="scene-kicker">현재 머무는 지역</span><h2>'+esc(s.region)+'</h2><p>생활과 탐험의 출발점</p></div>'+svgIcon(hue==='forest'?'trees':hue==='river'?'waves':hue==='mine'?'mountain':hue==='volcano'?'flame':hue==='snow'?'snowflake':hue==='desert'?'sun':hue==='ocean'||hue==='coast'?'waves':hue==='temple'?'sparkles':hue==='dungeon'?'footprints':'sun')+'</div>';
const places=make('div',{class:'scene-spots'},hero);
const regional=hue==='town'?[['sprout','경작지','growing'],['hammer','작업장','workshop'],['waves','강변','water']]:hue==='forest'?[['trees','숲길','growing'],['leaf','채집지','workshop'],['tent-tree','야영지','water']]:hue==='river'?[['fish','어장','water'],['waves','강변','growing'],['leaf','수풀','workshop']]:[['compass','탐색지','growing'],['pickaxe','자원지','workshop'],['map-pin','지형','water']];
for(const [ico,label,cl]of regional){const tile=make('div',{class:'scene-spot '+cl},places);tile.innerHTML=svgIcon(ico)+'<span>'+label+'</span>'}
const workspace=section(el,'이곳에서 할 수 있는 일');const actions=make('div',{class:'v3-actions'},workspace);
for(const a of regionActions()){const b=make('button',{class:'v3-action',type:'button'},actions);b.innerHTML=svgIcon(ACTION_ICONS[a]||'compass')+'<span>'+esc(actionLabel(a))+'</span>';b.addEventListener('click',()=>act(a));}
const summary=section(el,'지역 현황');summary.innerHTML+='<div class="region-facts"><div><span>지역 자원</span><strong>조사 전</strong></div><div><span>현재 날씨</span><strong>맑음 · 예시</strong></div><div><span>탐사 진행</span><strong>규칙 미구현</strong></div></div>';
}
function world(){
const el=head('세계 지도','지역을 선택해 이동합니다. 이동 시간과 조건은 미구현입니다.');el.classList.add('world-screen');
const grid=make('div',{class:'mapgrid world-v4'},el);
const icons=['house','sprout','trees','waves','leaf','mountain','pickaxe','snowflake','sun','anchor','sailboat','flame','landmark','church','sparkles','footprints'];
const hues=['town','field','forest','water','forest','mountain','ore','snow','desert','water','water','volcano','mystic','ruin','mystic','dungeon'];
for(let i=0;i<REGIONS.length;i++){const region=REGIONS[i],b=make('button',{class:'region region-'+hues[i]+(region===s.region?' active':''),type:'button','aria-label':region},grid);
b.innerHTML=svgIcon(icons[i])+'<span>'+esc(region)+'</span>';b.onclick=()=>{s.region=region;s.page='생활';s.tab='개요';s.dungeon=false;s.turn++;nextLog('이동',region+'에 도착했습니다.','이동 시간은 미구현입니다.');render()}}
}

function mockDetail(i){if(!i)return '<h3>아이템 상세</h3><p class="muted small">아이템을 선택하면 속성과 태그가 여기에 표시됩니다.</p>';return '<h3>'+esc(i.name)+'</h3><div class="tiny muted">'+esc(i.id)+'</div><dl><dt>분류</dt><dd>'+esc(i.group)+'</dd><dt>소재</dt><dd>'+esc(i.material||'미정')+'</dd><dt>품질</dt><dd>'+esc(i.quality||'미정')+'</dd><dt>무게</dt><dd>'+esc(i.weight||0)+' (목업)</dd><dt>공격</dt><dd>'+esc(i.attack||0)+'</dd><dt>방어</dt><dd>'+esc(i.defense||0)+'</dd></dl><h3>속성·태그</h3>'+i.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'<p class="tiny muted" style="margin-top:14px">표시 값은 테스트용이며 실제 품질·무게·전투 공식이 아닙니다.</p>'}
function inventory(){
const el=head('인벤토리','소지품의 소재·품질·무게·태그를 확인합니다. 실제 게임 효과는 아직 연결되지 않았습니다.');
tabs(el,['전체','장비','식재료','재료','광석','약초','도구','기타'],changeTab);
const toolbar=make('div',{class:'toolbar inventory-toolbar'},el);
const search=make('input',{class:'input',placeholder:'이름·소재·태그 검색','aria-label':'소지품 검색'},toolbar);search.value=s.search;
make('label',{class:'tiny muted',text:'정렬'},toolbar);
const sort=make('select',{class:'input','aria-label':'인벤토리 정렬'},toolbar);
sort.innerHTML='<option value="name">이름순</option><option value="group">분류순</option><option value="qty">수량순</option><option value="weight">무게순</option><option value="quality">품질순</option>';sort.value=s.sort;
make('label',{class:'tiny muted',text:'필터'},toolbar);
const filter=make('select',{class:'input','aria-label':'인벤토리 분류 필터'},toolbar);
filter.innerHTML='<option value="전체">전체 분류</option>'+categories.filter(c=>c!=='전체').map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');filter.value=s.filter||'전체';
const total=make('span',{class:'tiny muted'},toolbar);
const pane=make('div',{class:'panegrid inventory-layout'},el);
const list=make('div',{class:'inventory-list'},pane);
const detail=make('aside',{class:'inventory-detail','aria-label':'선택한 아이템 상세'},pane);
const selected=new Set(s.selectedIds);
function redraw(){
let items=s.items.filter(i=>(s.tab==='전체'||i.group===s.tab)&&(s.filter==='전체'||!s.filter||i.group===s.filter)&&[i.name,i.material,i.id,...i.tags].join(' ').toLowerCase().includes(s.search.toLowerCase()));
items.sort((a,b)=>['qty','weight'].includes(s.sort)?b[s.sort]-a[s.sort]:String(a[s.sort]).localeCompare(String(b[s.sort]),'ko'));
total.textContent=items.length+'종 · 선택 '+selected.size+'종';
list.innerHTML='<label class="inventory-select-all"><input type="checkbox" id="selectAllItems"> 전체 선택 <span class="muted tiny">(보이는 아이템)</span></label>';
for(const item of items){
const row=make('div',{class:'inventory-choice'+(s.selectedItem===item.id?' selected':'')},list);
const checkbox=make('input',{type:'checkbox','aria-label':item.name+' 선택'},row);checkbox.checked=selected.has(item.id);
checkbox.onchange=()=>{checkbox.checked?selected.add(item.id):selected.delete(item.id);s.selectedIds=[...selected];redraw()};
const button=make('button',{class:'inventory-item-button',type:'button','aria-label':item.name+' 상세 보기'},row);
button.innerHTML=svgIcon(item.group==='장비'?'sword':item.group==='식재료'?'wheat':item.group==='광석'?'gem':item.group==='약초'?'leaf':item.group==='도구'?'hammer':'package')+'<span class="inventory-item-name"><strong>'+esc(item.name)+'</strong><small>'+esc(item.group)+' · '+esc(item.material)+' · '+esc(item.quality)+'</small></span><span class="inventory-quantity">×'+item.qty+'</span>';
button.onclick=()=>{s.selectedItem=item.id;redraw();iconify()};
}
if(!items.length)make('p',{class:'empty',text:'선택한 조건에 해당하는 아이템이 없습니다.'},list);
const all=list.querySelector('#selectAllItems');all.checked=items.length>0&&items.every(i=>selected.has(i.id));all.indeterminate=items.some(i=>selected.has(i.id))&&!all.checked;all.onchange=()=>{items.forEach(i=>all.checked?selected.add(i.id):selected.delete(i.id));s.selectedIds=[...selected];redraw()};
let item=s.items.find(i=>i.id===s.selectedItem);
detail.innerHTML=item?'<div class="inventory-detail-head">'+svgIcon(item.group==='장비'?'sword':item.group==='식재료'?'wheat':item.group==='광석'?'gem':item.group==='약초'?'leaf':'package')+'<div><small>'+esc(item.group)+'</small><h2>'+esc(item.name)+'</h2></div></div>'+mockDetail(item):'<h2>아이템 정보</h2><p class="muted">아이템을 선택하면 이곳에 상세 정보가 나타납니다.</p>';
iconify();
}
search.oninput=()=>{s.search=search.value;redraw()};
sort.onchange=()=>{s.sort=sort.value;redraw()};
filter.onchange=()=>{s.filter=filter.value;redraw()};
redraw();
}

function character(){const el=head('캐릭터','캐릭터 정보를 한곳에 모으는 화면입니다. EXP 총량, 레벨 공식, 능력치 수치는 기획 확정 전까지 표시하지 않습니다.');tabs(el,['기본 정보','능력치','장비','상태 이상'],changeTab);const pane=make('div',{class:'panegrid'},el),left=make('div',{},pane),right=make('div',{class:'detail'},pane);if(s.tab==='기본 정보')left.innerHTML='<h2>기본 정보</h2><div class="textrow"><strong>이름 없는 여행자</strong><span>모의 캐릭터 · 캐릭터 생성 미구현</span></div><div class="textrow"><strong>직업 및 종족</strong><span>선택 시스템 미구현</span></div><div class="textrow"><strong>EXP / 현재 레벨</strong><span>성장 공식 미정</span></div>';else if(s.tab==='상태 이상')left.innerHTML='<h2>상태 이상</h2><p class="small">현재 상태 이상 없음 <span class="mark">표시 예시</span></p><p class="muted small">추후 상태 이상 발생 시 이름, 남은 시간, 효과를 표시합니다.</p>';else left.innerHTML='<h2>'+esc(s.tab)+'</h2><p class="small muted">'+(s.tab==='장비'?'장착 부위 및 효과는 목업 상세 구성 예정입니다.':'능력치 종류와 성장 공식의 최종 확정을 기다리는 영역입니다.')+'</p>';right.innerHTML='<h3>상시 표시 위치</h3><p class="small">HP / MP / 허기: 상단</p><p class="small">골드: 상단 우측</p><p class="small">게임 날짜와 시간: 상단 우측</p><p class="small">EXP: 상단 요약 + 캐릭터 상세</p><p class="small">상태 이상: 상단 경고 + 상세 탭</p><span class="mark">레이아웃만 확정 후보</span>'}
function skills(){const el=head('숙련','카테고리별 숙련 및 진행 정보. 표시 레벨은 목업이고 EXP 계산은 미정입니다.');tabs(el,['생활','전투','마법','기타'],changeTab);const rows=s.tab==='생활'?SKILLS.filter(([n])=>!['학문'].includes(n)):s.tab==='기타'?SKILLS.filter(([n])=>n==='학문'):[];const skillTable=make('div',{class:'tablewrap'},el);skillTable.innerHTML='<table><thead><tr><th>숙련</th><th class="right">임시 레벨</th><th>성장 EXP</th><th>사용 분야</th></tr></thead><tbody>'+rows.map(([n,l])=>'<tr><td>'+esc(n)+'</td><td class="right">'+l+'</td><td>공식 미정</td><td>레퍼런스 조사 및 설계 대상</td></tr>').join('')+'</tbody></table></div>';if(!rows.length)make('p',{class:'empty',text:'세부 숙련 분류는 아직 확정하지 않았습니다.'},el)}
function crafts(){
const el=head('제작 · 가공','재료 조건과 예상 결과를 상세 영역에서 검토합니다. 제작 계산은 미구현입니다.');
const groups=['제작법','작업대','재료 태그'];if(!groups.includes(s.tab))s.tab='제작법';tabs(el,groups,changeTab);
const sets={
'제작법':[{name:'밀빵',type:'요리',icon:'cooking-pot',resources:['밀가루','물'],result:'음식',station:'조리대'},{name:'구운 생선',type:'요리',icon:'fish',resources:['생선','소금'],result:'음식',station:'조리대'},{name:'목제 손잡이',type:'목공',icon:'axe',resources:['목재'],result:'부품',station:'작업대'},{name:'철제 못',type:'대장장이',icon:'anvil',resources:['철괴'],result:'부품',station:'모루'},{name:'간이 붕대',type:'재료',icon:'bandage',resources:['섬유'],result:'소모품',station:'작업대'},{name:'기초 연금 시약',type:'연금술',icon:'flask-conical',resources:['약초','용매'],result:'시약',station:'연금술대'}],
'작업대':[{name:'조리대',type:'생활',icon:'cooking-pot'},{name:'재봉대',type:'생활',icon:'scissors'},{name:'목공 작업대',type:'생활',icon:'hammer'},{name:'모루',type:'대장장이',icon:'anvil'},{name:'연금술 설비',type:'연금술',icon:'flask-conical'}],
'재료 태그':[{name:'material:wood',type:'재료',icon:'trees'},{name:'material:metal',type:'재료',icon:'pickaxe'},{name:'food:edible',type:'음식',icon:'wheat'},{name:'craft:alchemical',type:'연금술',icon:'flask-conical'}]
};
const items=sets[s.tab];if(!window.__craftUI)window.__craftUI={sort:'default',filter:'전체',selected:'밀빵'};
const state=window.__craftUI;
const tools=make('div',{class:'toolbar craft-toolbar'},el);
const sortLabel=make('label',{class:'tiny muted',text:'정렬'},tools);
const sort=make('select',{class:'input','aria-label':'제작 목록 정렬'},tools);sort.innerHTML='<option value="default">기본 순서</option><option value="name">이름순</option><option value="type">종류순</option>';sort.value=state.sort;
const filterLabel=make('label',{class:'tiny muted',text:'필터'},tools);
const filter=make('select',{class:'input','aria-label':'제작 목록 필터'},tools);
filter.innerHTML='<option value="전체">전체 종류</option>'+[...new Set(items.map(x=>x.type))].map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');
if(!items.some(x=>x.type===state.filter))state.filter='전체';filter.value=state.filter;
const pane=make('div',{class:'panegrid craft-layout'},el),list=make('div',{class:'craft-list'},pane),detail=make('aside',{class:'craft-detail','aria-label':'제작 상세'},pane);
function repaint(){
let shown=items.filter(x=>state.filter==='전체'||x.type===state.filter);
if(state.sort==='name')shown.sort((a,b)=>a.name.localeCompare(b.name,'ko'));else if(state.sort==='type')shown.sort((a,b)=>a.type.localeCompare(b.type,'ko'));
list.innerHTML='<div class="small muted" style="margin-bottom:12px">'+shown.length+'개 항목</div>';
for(const item of shown){const b=make('button',{class:'craft-choice'+(state.selected===item.name?' selected':''),type:'button'},list);b.innerHTML=svgIcon(item.icon)+'<span><strong>'+esc(item.name)+'</strong><small>'+esc(item.type)+'</small></span>';b.onclick=()=>{state.selected=item.name;repaint();iconify()}}
const selected=shown.find(x=>x.name===state.selected)||shown[0];if(selected)state.selected=selected.name;
detail.innerHTML=selected?'<div class="craft-detail-title">'+svgIcon(selected.icon)+'<div><span class="tiny muted">'+esc(selected.type)+'</span><h2>'+esc(selected.name)+'</h2></div></div><div class="craft-detail-row"><span>필요 설비</span><strong>'+esc(selected.station||'정보 미정')+'</strong></div><h3>필요한 재료</h3><div class="craft-materials">'+(selected.resources||['상세 재료 미정']).map(r=>'<div>'+svgIcon('package')+' '+esc(r)+'</div>').join('')+'</div><h3>예상 결과</h3><p>'+esc(selected.result||'설정 전')+'</p><p class="tiny muted">제작법과 소재 계승, 결과 품질은 아직 실제로 계산되지 않습니다.</p>':'<p class="muted">필터에 해당하는 항목이 없습니다.</p>';
}
sort.onchange=()=>{state.sort=sort.value;repaint();iconify()};filter.onchange=()=>{state.filter=filter.value;repaint();iconify()};repaint();
}

function other(){const el=head(s.page,s.page==='도감'?'발견한 정보를 종류별로 축적하는 목록 구조입니다.':'신앙, 제단, 축복과 금기를 확인하는 화면입니다.');const sets=s.page==='도감'?['발견 목록','생물','자연물','제작 지식']:['개요','신 목록','금기','축복'];if(!sets.includes(s.tab))s.tab=sets[0];tabs(el,sets,changeTab);const x=make('div',{class:'panegrid'},el);make('div',{html:'<h2>'+esc(s.tab)+'</h2><div class="textrow"><strong>자료 없음</strong><span>목업: 상세 콘텐츠와 발견 기록은 구현 전</span></div>'},x);make('aside',{class:'detail',html:'<h3>상세 정보</h3><p class="muted small">선택 항목의 설명과 관련 정보를 표시합니다.</p>'},x)}
function dungeonMove(dx,dy){if(s.page!=='던전'||!s.dungeon)return;const [x,y]=s.pos,nx=x+dx,ny=y+dy,t=TILES[ny]?.[nx];if(!t||t==='#')return;s.pos=[nx,ny];s.turn++;if(t==='!'){nextLog('위험','위험한 지형을 발견했습니다.','자동 이동은 위험 타일에서 정지합니다.');stopAuto()}else if(t==='>')nextLog('탐험','계단 발견','다음 층 생성은 미구현입니다.');else if(t==='o'||t==='*')nextLog('탐험','광맥 발견','채광은 미구현입니다.');else nextLog('탐험','한 칸 이동','던전 이동은 실제 동작하지만 경로 생성은 고정입니다.');render()}
function stopAuto(){if(autoTimer){clearInterval(autoTimer);autoTimer=null}}
function autoStep(){if(!s.dungeon||s.page!=='던전'){stopAuto();return}for(const [key,value]of [['hp',s.hp],['mp',s.mp],['hunger',s.hunger]])if(s.auto[key].on&&value<=s.auto[key].pct){stopAuto();nextLog('위험','자동 탐색 중단','설정된 '+key+' 임계값에 도달했습니다.');return render()}const [x,y]=s.pos,options=[[1,0],[0,1],[-1,0],[0,-1]].filter(([dx,dy])=>TILES[y+dy]?.[x+dx]&&TILES[y+dy][x+dx]!=='#');if(!options.length){stopAuto();return}const [dx,dy]=options[s.turn%options.length];dungeonMove(dx,dy)}
function dungeon(){
const el=head('지하미궁','방향키 / WASD로 이동 · 자동 탐색은 위험 지형에서 중단');
el.classList.add('dungeon-screen');
const layout=make('div',{class:'dungeonlayout dungeon-v7'},el);
const left=make('div',{class:'dungeon-map-pane'},layout);
const right=make('aside',{class:'dungeon-controls'},layout);
const map=make('div',{class:'tilemap',role:'img','aria-label':'고정 예시 던전 지도'},left);
for(let y=0;y<TILES.length;y++)for(let x=0;x<TILES[y].length;x++){
 const v=TILES[y][x],player=s.pos[0]===x&&s.pos[1]===y;
 const tile=make('span',{class:'tile '+(player?'player':v==='#'?'wall':v==='o'||v==='*'?'ore':v==='>'?'stairs':v==='!'?'warning':''),
 html:player?svgIcon('user-round'):v==='o'||v==='*'?svgIcon('gem'):v==='>'?svgIcon('arrow-down'):v==='!'?svgIcon('skull'):''},map);
 tile.title=player?'플레이어':v==='#'?'벽':v==='!'?'위험':v==='>'?'계단':v==='o'?'광맥':'바닥';
}
make('h2',{text:'탐색 제어'},right);
const pad=make('div',{class:'dungeon-pad'},right);
for(const [text,dx,dy,slot]of [['↑',0,-1,'up'],['←',-1,0,'left'],['↓',0,1,'down'],['→',1,0,'right']]){
 const b=btn(text,()=>dungeonMove(dx,dy),'btn dungeon-arrow '+slot,pad);
 b.setAttribute('aria-label',text+' 방향 이동');
}
const actions=make('div',{class:'dungeon-main-actions'},right);
btn(autoTimer?'자동 탐색 중지':'자동 탐색 시작',()=>{
 if(autoTimer){stopAuto();nextLog('시스템','자동 이동 중지');render()}
 else{autoTimer=setInterval(autoStep,550);nextLog('시스템','자동 이동 시연 시작');render()}
},'btn primary',actions);
btn('던전 나가기',()=>{stopAuto();s.dungeon=false;s.page='생활';s.tab='개요';s.turn++;nextLog('탐험','던전에서 나왔습니다.');render()},'btn',actions);
const sec=section(right,'자동 중단 조건');
for(const [key,name]of [['hp','HP'],['mp','MP'],['hunger','허기']]){
 const r=make('label',{class:'formrow dungeon-threshold'},sec),c=make('input',{type:'checkbox'},r);
 c.checked=s.auto[key].on;r.append(document.createTextNode(name+' '));
 const input=make('input',{type:'number',min:'0',max:'100',class:'input','aria-label':name+' 중단 퍼센트'},r);
 input.value=s.auto[key].pct;r.append(document.createTextNode('% 이하'));
 c.onchange=()=>s.auto[key].on=c.checked;
 input.onchange=()=>s.auto[key].pct=Math.min(100,Math.max(0,Number(input.value)||0));
}
const quick=section(right,'빠른 메뉴');const opts=make('div',{class:'dungeon-quick'},quick);
for(const [label,name]of [['소지품','인벤토리'],['캐릭터','캐릭터']]){
 const b=btn(label,()=>openPage(name),'btn',opts);b.innerHTML=svgIcon(ICON_MAP[name])+' '+label;
}
make('p',{class:'muted tiny dungeon-note',text:'지도는 고정 목업입니다. 전투와 보상은 아직 구현되지 않았습니다.'},el);
}
function settings(){
const el=head('설정','색상 테마와 화면 설정을 변경할 수 있습니다.');
const sec=section(el,'색상 팔레트');make('p',{class:'muted small',text:'미리보기를 선택하면 바로 적용됩니다. 선택한 테마는 브라우저에 기억됩니다.'},sec);
const gallery=make('div',{class:'theme-gallery'},sec);
for(const t of THEMES){const b=make('button',{type:'button',class:'theme-choice'+(s.theme===t.id?' chosen':''),'aria-label':t.name+' 테마','aria-pressed':String(s.theme===t.id)},gallery);
const swatches=t.colors.map(color=>'<span style="background:'+color+'"></span>').join('');
b.innerHTML='<div class="theme-swatch">'+swatches+'</div><span class="theme-name">'+esc(t.name)+'</span><small>'+esc(t.mode==='dark'?'다크':'라이트')+' · '+esc(t.source)+'</small>';
b.onclick=()=>{useTheme(t.id);settings();iconify()}}
const font=section(el,'화면 가독성');const label=make('label',{class:'formrow'},font);label.append(document.createTextNode('글자 크기 '));const select=make('select',{class:'input'},label);
select.innerHTML=[90,100,110,120,130,140].map(n=>'<option value="'+n+'">'+n+'%</option>').join('');select.value=s.viewFont;select.onchange=()=>{s.viewFont=Number(select.value);document.documentElement.style.fontSize=s.viewFont*.15+'px'};
const save=section(el,'목업 퀵세이브');const actions=make('div',{class:'rows'},save);
btn('F5 · 퀵세이브',quickSave,'btn primary',actions);btn('F9 · 퀵로드',quickLoad,'btn',actions);
btn('초기화',()=>{if(!confirm('목업 상태를 초기화할까요?'))return;stopAuto();const selectedTheme=s.theme;s=fresh();useTheme(selectedTheme);nextLog('시스템','목업 초기화');render()},'btn',actions)
}
function quickSave(){try{localStorage.setItem('fantasy-v2-demo',JSON.stringify(s));nextLog('시스템','목업 상태를 로컬에 저장했습니다.');render()}catch{nextLog('위험','브라우저 저장소에 기록할 수 없습니다.');render()}}
function quickLoad(){try{const raw=localStorage.getItem('fantasy-v2-demo');if(!raw)throw Error('empty');const o=JSON.parse(raw);if(!Array.isArray(o.items)||!Array.isArray(o.logs)||!o.auto)throw Error('invalid');stopAuto();s=o;try{const savedTheme=localStorage.getItem('fantasy-ui-theme');if(THEMES.some(t=>t.id===savedTheme))s.theme=savedTheme}catch{}nextLog('시스템','목업 상태를 불러왔습니다.');render()}catch{nextLog('위험','저장된 목업 데이터를 읽을 수 없습니다.');render()}}
function logs(){
const e=$('#log');e.innerHTML='<div class="loghead"><div class="sectiontitle">사건 기록</div><div class="logtools" id="logFilters"></div></div><div class="logbody" id="logBody" aria-live="polite"></div><div class="logfoot">연속 기록 압축 · 주요 사건 고정 · 상세 보기</div>';
const filter=()=>{const target=$('#logBody');const sorted=s.logs.filter(x=>s.logFilter==='전체'||x.kind===s.logFilter);sorted.sort((a,b)=>Number(s.pinnedIds.includes(b.id))-Number(s.pinnedIds.includes(a.id)));
target.innerHTML=sorted.map(x=>{const pin=s.pinnedIds.includes(x.id),expand=s.expandedLogs.includes(x.id);return '<div class="event"><span class="etype '+(x.kind==='위험'?'danger':x.kind==='탐험'?'blue':x.kind==='시스템'?'purple':'accent')+'">['+esc(x.kind)+']</span>'+esc(x.text)+(x.count>1?'<span class="count">× '+x.count+'</span>':'')+(pin?'<span class="pin">★</span>':'')+'<div class="eventtools"><button type="button" data-detail="'+esc(x.id)+'" aria-label="사건 상세 보기">'+svgIcon('info')+' 상세</button><button type="button" data-pin="'+esc(x.id)+'" aria-label="사건 '+(pin?'고정 해제':'고정')+'">'+svgIcon(pin?'pin-off':'pin')+'</button></div>'+(expand?'<p class="muted tiny">'+esc(x.detail||'추가 상세 정보가 없습니다.')+' · 기록: '+x.turn+'턴</p>':'')+'</div>'}).join('')||'<div class="empty">기록이 없습니다.</div>';
target.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>{const id=b.dataset.detail;s.expandedLogs=s.expandedLogs.includes(id)?s.expandedLogs.filter(x=>x!==id):[...s.expandedLogs,id];filter();iconify()});
target.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>{const id=b.dataset.pin;s.pinnedIds=s.pinnedIds.includes(id)?s.pinnedIds.filter(x=>x!==id):[...s.pinnedIds,id];filter();iconify()});iconify()};
for(const kind of ['전체','생활','이동','탐험','위험','시스템'])btn(kind,()=>{s.logFilter=kind;logs()},s.logFilter===kind?'active':'',$('#logFilters'));filter();
}
function drawMain(){if(s.page==='생활')lifestyle();else if(s.page==='세계 지도')world();else if(s.page==='인벤토리')inventory();else if(s.page==='캐릭터')character();else if(s.page==='숙련')skills();else if(s.page==='제작')crafts();else if(s.page==='도감'||s.page==='신앙')other();else if(s.page==='던전')dungeon();else settings()}

function playerPanel(){
const el=$('#player');
const bar=(name,val,max,cl)=>'<div class="v3-meter"><div><strong>'+name+'</strong><span>'+val+' / '+max+'</span></div><div class="v3-track"><span class="'+cl+'" style="width:'+(val/max*100)+'%"></span></div></div>';
el.innerHTML='<div class="player-title"><div><strong>이름 없는 여행자</strong><span>모험가 · 캐릭터 생성 미구현</span></div><button class="iconbutton" id="openCharacter" type="button" aria-label="캐릭터 상세">'+svgIcon('square-arrow-out-up-right')+'</button></div>'+bar('HP',s.hp,100,'hit')+bar('MP',s.mp,80,'mana')+'<div class="v3-meter"><div><strong>EXP</strong><span>성장 공식 미정</span></div><div class="v3-track"><span class="experience" style="width:0%"></span></div></div><div class="hungerline">'+svgIcon('utensils')+' 허기 <strong>'+s.hunger+'%</strong></div><div class="status-title"><strong>상태 이상</strong><button id="expandStatus" class="linklike" type="button">'+(conditionExpanded?'접기':'모두 보기')+' ('+STATUS_MOCK.length+' · 예시)</button></div><div class="effects" id="effects"></div>';
$('#openCharacter').onclick=()=>openPage('캐릭터');$('#expandStatus').onclick=()=>{conditionExpanded=!conditionExpanded;playerPanel();iconify()};
const displayed=conditionExpanded?STATUS_MOCK:STATUS_MOCK.slice(0,6);const c=$('#effects');for(const v of displayed){const b=make('button',{class:'effect-icon',type:'button','aria-label':v.name+', '+(v.turns===null?'지속 턴수 미정':'남은 '+v.turns+'턴')},c);b.innerHTML=svgIcon(v.icon);
const show=()=>{let tip=document.querySelector('#floatingEffectTooltip');if(!tip){tip=document.createElement('div');tip.id='floatingEffectTooltip';tip.className='floating-effect-tooltip';tip.setAttribute('role','tooltip');document.body.append(tip)}
tip.innerHTML='<strong>'+esc(v.name)+'</strong><p>'+esc(v.desc)+'</p><em>'+(v.turns===null?'유지 턴수 미정':'남은 '+v.turns+'턴')+'</em>';tip.hidden=false;
const box=b.getBoundingClientRect(),width=240;let left=Math.min(window.innerWidth-width-12,Math.max(12,box.left+box.width/2-width/2));
tip.style.left=left+'px';tip.style.top='12px';const height=tip.getBoundingClientRect().height;
let top=box.bottom+10;if(top+height>window.innerHeight-12)top=Math.max(12,box.top-height-10);tip.style.top=top+'px';b.setAttribute('aria-describedby','floatingEffectTooltip')};
const hide=()=>{const tip=document.querySelector('#floatingEffectTooltip');if(tip)tip.hidden=true;b.removeAttribute('aria-describedby')};
b.addEventListener('pointerenter',show);b.addEventListener('pointerleave',hide);b.addEventListener('focus',show);b.addEventListener('blur',hide)}
}
function bottomMenu(){
const e=$('#bottom');e.innerHTML='<div id="bottomNav" class="bottom-nav"></div><div class="bottom-shortcuts">단축키 <kbd>I</kbd> 소지품 <kbd>C</kbd> 캐릭터 <kbd>M</kbd> 지도 <kbd>F5</kbd> 저장 <kbd>F9</kbd> 불러오기</div>';
for(const name of ['생활','세계 지도','제작','인벤토리','캐릭터','숙련','도감','신앙',...(s.dungeon?['던전']:[])]){const b=make('button',{class:'bottom-button'+((s.page===name||overlayPage===name)?' current':''),type:'button','aria-label':name},$('#bottomNav'));b.innerHTML=svgIcon(ICON_MAP[name]||'map')+'<span>'+name+'</span>';b.onclick=()=>openPage(name)}
}

function closeOverlay(){const previousOverlay=overlayPage;overlayPage=null;if(overlayReturnTab!==null){s.tab=overlayReturnTab;overlayReturnTab=null;}const dialog=$('#largeDialog');if(dialog?.open)dialog.close();dialog?.remove();const prior=overlayReturn;overlayReturn=null;render();const restored=prior?.isConnected?prior:[...document.querySelectorAll('.bottom-button')].find(b=>b.getAttribute('aria-label')===previousOverlay);restored?.focus()}
function drawOverlay(){
const old=$('#largeDialog');old?.remove();if(!overlayPage)return;
const dialog=make('dialog',{id:'largeDialog','aria-label':overlayPage,class:'large-dialog'},document.body);
const wrap=make('div',{class:'dialog-wrap'},dialog);const heading=make('div',{class:'dialog-heading'},wrap);heading.innerHTML='<div>'+svgIcon(ICON_MAP[overlayPage]||'book-open')+' <strong>'+esc(overlayPage)+'</strong></div>';
const close=btn('닫기',closeOverlay,'dialog-close',heading);close.innerHTML=svgIcon('x')+'<span>닫기</span>';
const body=make('div',{class:'dialog-body'},wrap);
const base=$('#main');base.id='base-main';const modalMain=make('div',{id:'main',class:'modal-main'},body),prev=s.page;s.page=overlayPage;drawMain();s.page=prev;modalMain.id='modal-main';base.id='main';
dialog.addEventListener('cancel',e=>{e.preventDefault();closeOverlay()});dialog.addEventListener('click',e=>{if(e.target===dialog)closeOverlay()});dialog.showModal();close.focus();iconify();
}

function initPanelSplitter(){
const panel=document.querySelector('.rightpanel'),handle=document.querySelector('#panelSplitter');
if(!panel||!handle)return;
const update=(height,save=false)=>{const bounds=panel.getBoundingClientRect();const allowed=Math.max(165,bounds.height-180-8);logHeight=Math.round(Math.max(165,Math.min(height,allowed)));
panel.style.setProperty('--log-pane-height',logHeight+'px');
handle.setAttribute('aria-valuenow',String(logHeight));
handle.setAttribute('aria-valuemax',String(Math.round(allowed)));
if(save)try{localStorage.setItem('fantasy-log-panel-height',String(logHeight))}catch{}
};
update(logHeight);
handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();handle.setPointerCapture(e.pointerId);handle.classList.add('dragging')});
handle.addEventListener('pointermove',e=>{if(!handle.hasPointerCapture(e.pointerId))return;const b=panel.getBoundingClientRect();update(b.bottom-e.clientY-4)});
const finish=e=>{if(handle.hasPointerCapture(e.pointerId)){handle.releasePointerCapture(e.pointerId);handle.classList.remove('dragging');update(logHeight,true)}};
handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
handle.addEventListener('keydown',e=>{const delta=e.key==='ArrowUp'?20:e.key==='ArrowDown'?-20:e.key==='Home'?10000:e.key==='End'?-10000:null;if(delta===null)return;e.preventDefault();update(logHeight+delta,true)});
}
function render(){useTheme(s.theme||'aurora',false);document.documentElement.style.fontSize=s.viewFont*.15+'px';top();drawMain();playerPanel();logs();bottomMenu();initPanelSplitter();drawOverlay();iconify()}

document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const active=document.activeElement;if(['INPUT','TEXTAREA','SELECT'].includes(active?.tagName))return;const k=e.key;if(k==='F5'){e.preventDefault();quickSave()}else if(k==='F9'){e.preventDefault();quickLoad()}else if(k==='Escape'&&overlayPage){closeOverlay()}else if(k.toLowerCase()==='i'){e.preventDefault();openPage('인벤토리')}else if(k.toLowerCase()==='c'){e.preventDefault();openPage('캐릭터')}else if(k.toLowerCase()==='m'){e.preventDefault();openPage('세계 지도')}else if(s.dungeon&&s.page==='던전'&&!overlayPage){const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]};if(directions[k]){e.preventDefault();dungeonMove(...directions[k])}}});
document.body.innerHTML='<div class="shell v3-shell"><header class="top" id="top"></header><main class="center" id="main"></main><aside class="rightpanel"><section class="playerpanel" id="player" aria-label="플레이어 정보"></section><div id="panelSplitter" class="panel-splitter" role="separator" tabindex="0" aria-label="플레이어와 로그 패널 높이 조절" aria-orientation="horizontal" aria-valuemin="165" aria-valuenow="274" aria-valuemax="800" title="드래그하여 크기 조절 · 위아래 방향키"></div><section class="log" id="log" aria-label="사건 기록"></section></aside><footer class="bottom" id="bottom"></footer></div>';nextLog('시스템','게임 화면을 열었습니다.');render();
