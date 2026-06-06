'use strict';

const FLASK_URL = window.location.origin;

const ITEMS = [

  { id:'circle',    name:'Circle',    icon:'⭕', category:'shape', level:'easy',
    desc:'A perfectly round shape with no corners! Trace the smooth curve all the way around.',
    tags:['round','curved','no corners'], color:'#ff6b6b' },
  { id:'square',    name:'Square',    icon:'🟥', category:'shape', level:'easy',
    desc:'Four equal sides and four corners. Start at the top left and connect all four sides!',
    tags:['4 sides','equal','corners'], color:'#4d96ff' },
  { id:'triangle',  name:'Triangle',  icon:'🔺', category:'shape', level:'easy',
    desc:'Three sides and three corners. The simplest polygon — start at the top!',
    tags:['3 sides','pointy'], color:'#ffd93d' },
  { id:'rectangle', name:'Rectangle', icon:'▬', category:'shape', level:'easy',
    desc:'Like a square but stretched! Two long sides and two short sides.',
    tags:['4 sides','long'], color:'#6bcb77' },

  { id:'star',     name:'Star',     icon:'⭐', category:'shape', level:'medium',
    desc:'Five pointy tips! Follow each point carefully to make a shining star.',
    tags:['5 points','fun'], color:'#ffd93d' },
  { id:'heart',    name:'Heart',    icon:'❤️', category:'shape', level:'medium',
    desc:'Two curves that meet at the bottom. Full of love! Start at the dip on top.',
    tags:['curved','love'], color:'#ff6b6b' },
  { id:'diamond',  name:'Diamond',  icon:'💎', category:'shape', level:'medium',
    desc:'Like a square tilted on one corner. It sparkles and shines!',
    tags:['4 sides','tilted'], color:'#4d96ff' },
  { id:'pentagon', name:'Pentagon', icon:'⬠', category:'shape', level:'medium',
    desc:'Five sides and five corners. Like home base in baseball!',
    tags:['5 sides'], color:'#c77dff' },
  { id:'hexagon',  name:'Hexagon',  icon:'⬡', category:'shape', level:'medium',
    desc:'Six sides! Bees build honeycombs with hexagons. Can you trace all six?',
    tags:['6 sides','honeycomb'], color:'#6bcb77' },

  { id:'octagon',  name:'Octagon',  icon:'🛑', category:'shape', level:'hard',
    desc:'Eight sides — like a stop sign! Count every corner carefully as you go.',
    tags:['8 sides','stop sign'], color:'#ff8c00' },
  { id:'oval',     name:'Oval',     icon:'🥚', category:'shape', level:'hard',
    desc:'Like a stretched circle — an egg shape! Keep your curve smooth.',
    tags:['curved','egg'], color:'#ff69b4' },
  { id:'arrow',    name:'Arrow',    icon:'➡️', category:'shape', level:'hard',
    desc:'A pointy head and a long tail — like a direction sign pointing the way!',
    tags:['pointy','direction'], color:'#00bcd4' },
  { id:'crescent', name:'Crescent', icon:'🌙', category:'shape', level:'hard',
    desc:'A moon shape — curved on both sides. The trickiest of all! Take it slow.',
    tags:['moon','curved'], color:'#9c27b0' },

  { id:'orange', name:'Orange', icon:'🍊', category:'fruit', level:'easy',
    desc:'A round juicy fruit! Trace the smooth circle all the way around.',
    tags:['round','juicy','citrus'], color:'#ff8c00' },

  { id:'mango',  name:'Mango',  icon:'🥭', category:'fruit', level:'medium',
    desc:'The king of fruits! Trace its curved teardrop shape with care.',
    tags:['tropical','sweet'], color:'#ffd93d' },
  { id:'apple',  name:'Apple',  icon:'🍎', category:'fruit', level:'medium',
    desc:'A classic red fruit with a little dip at the top and a stem!',
    tags:['red','classic'], color:'#ff6b6b' },
  { id:'banana', name:'Banana', icon:'🍌', category:'fruit', level:'medium',
    desc:'A long curved yellow fruit. Follow the gentle banana curve!',
    tags:['yellow','curved'], color:'#ffd93d' },

  { id:'pear',   name:'Pear',   icon:'🍐', category:'fruit', level:'hard',
    desc:'Narrow at the top, wide at the bottom. A tricky shape to trace!',
    tags:['green','narrow top'], color:'#6bcb77' },

  { id:'carrot', name:'Carrot', icon:'🥕', category:'vegetable', level:'easy',
    desc:'A long orange vegetable that tapers to a point at the bottom!',
    tags:['orange','long'], color:'#ff8c00' },
  { id:'potato', name:'Potato', icon:'🥔', category:'vegetable', level:'easy',
    desc:'A lumpy oval vegetable grown underground. Round and bumpy!',
    tags:['oval','lumpy'], color:'#c8a96e' },

  { id:'tomato',   name:'Tomato',   icon:'🍅', category:'vegetable', level:'medium',
    desc:'Round and red with a little star of leaves on top!',
    tags:['red','round'], color:'#ff6b6b' },
  { id:'eggplant', name:'Eggplant', icon:'🍆', category:'vegetable', level:'medium',
    desc:'A deep purple vegetable with a long curved body. So shiny!',
    tags:['purple','curved'], color:'#9c27b0' },
  { id:'mushroom', name:'Mushroom', icon:'🍄', category:'vegetable', level:'medium',
    desc:'A wide cap on top and a short stalk below. Fun and tricky to trace!',
    tags:['cap','stalk'], color:'#c8a96e' },

  { id:'pumpkin', name:'Pumpkin', icon:'🎃', category:'vegetable', level:'hard',
    desc:'A big round pumpkin with bumpy ridges all around and a small stem!',
    tags:['orange','round','halloween'], color:'#ff8c00' },
];

let IS_GUEST = false;
let STATE = {
  progress:{}, points:{}, times:{}, favs:[], feedback:[], rating:0
};

async function initState() {
  try {
    const r = await fetch(FLASK_URL+'/api/me', {credentials:'include'});
    const d = await r.json();
    if (d.guest) {
      IS_GUEST = true;
      loadGuestState();
      document.getElementById('user-badge').textContent = '👤 Guest';
    } else {
      IS_GUEST = false;
      document.getElementById('user-badge').textContent = '👋 ' + d.username;
      await syncFromServer();
      applyTheme(d.theme || 'dark');
    }
  } catch(e) {
    IS_GUEST = true;
    loadGuestState();

    try {
      const u = JSON.parse(localStorage.getItem('tracely_user')||'{}');
      if (u.username) document.getElementById('user-badge').textContent = u.guest ? '👤 Guest' : '👋 ' + u.username;
    } catch(e2){}
  }
}

function loadGuestState() {
  try {
    STATE.progress = JSON.parse(localStorage.getItem('tracely_progress')||'{}');
    STATE.points   = JSON.parse(localStorage.getItem('tracely_points')||'{}');
    STATE.times    = JSON.parse(localStorage.getItem('tracely_times')||'{}');
    STATE.favs     = JSON.parse(localStorage.getItem('tracely_favs')||'[]');
    STATE.feedback = JSON.parse(localStorage.getItem('tracely_feedback')||'[]');
  } catch(e) {}
}

function saveGuestState() {
  localStorage.setItem('tracely_progress', JSON.stringify(STATE.progress));
  localStorage.setItem('tracely_points',   JSON.stringify(STATE.points));
  localStorage.setItem('tracely_times',    JSON.stringify(STATE.times));
  localStorage.setItem('tracely_favs',     JSON.stringify(STATE.favs));
  localStorage.setItem('tracely_feedback', JSON.stringify(STATE.feedback));
}

async function syncFromServer() {
  try {
    const r = await fetch(FLASK_URL+'/api/state', {credentials:'include'});
    const d = await r.json();
    if (d.guest) return;
    STATE.progress = d.progress || {};
    STATE.points   = d.points   || {};
    STATE.times    = d.times    || {};
    STATE.favs     = d.favs     || [];
    STATE.feedback = d.feedback || [];
  } catch(e) {}
}

async function persistState() {
  if (IS_GUEST) {
    saveGuestState();
  } else {
    try {
      await fetch(FLASK_URL+'/api/state', {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          progress: STATE.progress, points: STATE.points,
          times: STATE.times, favs: STATE.favs
        })
      });
    } catch(e) { saveGuestState(); }
  }
}

function getItem(id)       { return ITEMS.find(i=>i.id===id); }
function getTotalPoints()  { return Object.values(STATE.points).reduce((a,b)=>a+b,0); }
function getItemPoints(id) { return STATE.points[id]||0; }
function isComplete(id)    { const p=STATE.progress[id]; return p&&p.trace&&p.name&&p.color; }
function getProgress(id)   {
  const p=STATE.progress[id]; if(!p) return 0;
  return Math.round(((p.trace?1:0)+(p.name?1:0)+(p.color?1:0))/3*100);
}
function getLevelLabel(l)  { return {easy:'⭐ Easy',medium:'⭐⭐ Medium',hard:'⭐⭐⭐ Hard'}[l]||l; }
function isMobile()        { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||window.innerWidth<768; }
function fmtTime(s)        { return s>0? s.toFixed(1)+'s' : '—'; }
function totalTime(id)     {
  const t=STATE.times[id]||{}; return ((t.trace||0)+(t.name||0)+(t.color||0));
}

function applyTheme(t) {
  document.body.setAttribute('data-theme', t);
  document.getElementById('themeToggle').textContent = t==='dark'?'🌙':'☀️';
  localStorage.setItem('db_theme', t);
  if (!IS_GUEST) {
    fetch(FLASK_URL+'/api/theme',{method:'POST',credentials:'include',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({theme:t})}).catch(()=>{});
  }
}
document.getElementById('themeToggle').addEventListener('click', ()=>{
  const cur = document.body.getAttribute('data-theme')||'dark';
  applyTheme(cur==='dark'?'light':'dark');
});

/* ── Sidebar collapse toggle ── */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const isCollapsed = sidebar.classList.toggle('collapsed');
  toggleBtn.textContent = isCollapsed ? '›' : '‹';
  toggleBtn.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  localStorage.setItem('db_sidebar_collapsed', isCollapsed ? '1' : '0');
}

/* clicking any nav item while collapsed → expand first */
function expandIfCollapsed() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('collapsed')) {
    sidebar.classList.remove('collapsed');
    const toggleBtn = document.getElementById('sidebar-toggle');
    toggleBtn.textContent = '‹';
    toggleBtn.title = 'Collapse sidebar';
    localStorage.setItem('db_sidebar_collapsed', '0');
  }
}

function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebar-backdrop').classList.add('visible');
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-backdrop').classList.remove('visible');
}
function toggleSideSection(name) {
  expandIfCollapsed();
  const group = document.getElementById('snav-' + name);
  const isOpen = group.classList.contains('open');
  document.querySelectorAll('.snav-group').forEach(g => g.classList.remove('open'));
  if (!isOpen) group.classList.add('open');
}
function setSidebarActive(name) {
  document.querySelectorAll('.snav-item').forEach(b => b.classList.remove('active'));
  const group = document.getElementById('snav-' + name);
  if (group) {
    const btn = group.querySelector('.snav-item');
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.snav-group').forEach(g => g.classList.remove('open'));
    group.classList.add('open');
  }
}
function updateMobileScore() {
  const s = document.getElementById('total-score-mobile');
  if (s) s.textContent = getTotalPoints();
}

function showPage(name) {
  expandIfCollapsed();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  setSidebarActive(name);
  updateMobileScore();
  if(name==='learn')   { renderLearnPage(); showLearnTab('shapes'); setActiveSub('learn','shapes'); }
  if(name==='rewards') { renderRewardsPage(); showRewardsTab('points'); setActiveSub('rewards','points'); }
  if(name==='reports') { renderReportsPage(); showReportsTab('overview'); setActiveSub('reports','overview'); }
  if(name==='saved')   { renderSavedPage(); showSavedTab('favs'); setActiveSub('saved','favs'); }
}
function setActiveSub(page, sub) {
  const group = document.getElementById('snav-' + page);
  if (!group) return;
  group.querySelectorAll('.snav-sub-item').forEach(b => b.classList.remove('active'));
  const all = group.querySelectorAll('.snav-sub-item');
  all.forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes("'"+sub+"'")) {
      b.classList.add('active');
    }
  });
}
function showLearnTab(tab) {
  document.querySelectorAll('.learn-section').forEach(s=>s.classList.remove('active'));
  document.getElementById('learn-'+tab).classList.add('active');
  setActiveSub('learn', tab);
}
function showRewardsTab(tab) {
  document.querySelectorAll('.rewards-section').forEach(s=>s.classList.remove('active'));
  document.getElementById('rewards-'+tab).classList.add('active');
  setActiveSub('rewards', tab);
  if(tab==='points') renderPointsTab();
  if(tab==='levels') renderLevelsTab();
  if(tab==='badges') renderBadgesTab();
}
function showReportsTab(tab) {
  document.querySelectorAll('.reports-section').forEach(s=>s.classList.remove('active'));
  document.getElementById('reports-'+tab).classList.add('active');
  setActiveSub('reports', tab);
  if(tab==='overview') renderOverview();
}
function showSavedTab(tab) {
  document.querySelectorAll('.saved-section').forEach(s=>s.classList.remove('active'));
  document.getElementById('saved-'+tab).classList.add('active');
  setActiveSub('saved', tab);
  if(tab==='favs')     renderFavourites();
  if(tab==='feedback') renderSavedFeedback();
}

function renderLearnPage() {
  const catMap = {shape:'shapes', fruit:'fruits', vegetable:'vegetables'};
  ['shape','fruit','vegetable'].forEach(cat=>{
    ['easy','medium','hard'].forEach(lvl=>{
      const items = ITEMS.filter(i=>i.category===cat && i.level===lvl);
      const grid  = document.getElementById(`grid-${catMap[cat]}-${lvl}`);
      if (!grid) return;
      grid.innerHTML = '';
      if (!items.length) { grid.innerHTML='<p class="empty-diff">No items yet!</p>'; return; }
      items.forEach(item=>renderCard(item, grid));
    });
  });
  updateHeaderScore();
}

function renderCard(item, grid) {
  const pct   = getProgress(item.id);
  const done  = isComplete(item.id);
  const isFav = STATE.favs.includes(item.id);
  const pts   = getItemPoints(item.id);
  const card  = document.createElement('div');
  card.className = 'shape-card'+(done?' done-card':'');
  card.style.setProperty('--card-accent', item.color);
  const p = STATE.progress[item.id]||{};
  card.innerHTML = `
    ${done?'<span class="done-badge">✅ Done!</span>':''}
    <span class="card-icon">${item.icon}</span>
    <div class="card-name">${item.name}</div>
    <span class="card-level level-${item.level}">${getLevelLabel(item.level)}</span>
    <div class="card-steps">
      <span class="step-dot ${p.trace?'done':''}">T</span>
      <span class="step-dot ${p.name?'done':''}">N</span>
      <span class="step-dot ${p.color?'done':''}">C</span>
    </div>
    <div class="card-progress-wrap"><div class="card-progress-fill" style="width:${pct}%"></div></div>
    <div class="card-bottom">
      <span class="card-pts">🏆 ${pts}/30 pts</span>
      <button class="fav-star ${isFav?'active':''}"
        onclick="event.stopPropagation();toggleFav('${item.id}',this)"
        title="${isFav?'Remove favourite':'Add to favourites'}">${isFav?'⭐':'☆'}</button>
    </div>`;
  card.addEventListener('click', ()=>openItemModal(item.id));
  grid.appendChild(card);
}

let voiceRecognition = null;
function startVoiceCommand() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) { showToast('🎤 Voice not supported in this browser'); return; }
  if (voiceRecognition) { voiceRecognition.stop(); voiceRecognition=null; }
  const btn    = document.getElementById('voiceBtn');
  const status = document.getElementById('voiceStatus');
  voiceRecognition = new SpeechRec();
  voiceRecognition.lang = 'en-US';
  voiceRecognition.interimResults = false;
  voiceRecognition.maxAlternatives = 5;
  voiceRecognition.onstart = ()=>{ btn.classList.add('listening'); status.textContent='🎤 Listening…'; };
  voiceRecognition.onresult = e=>{
    const transcripts = Array.from(e.results[0]).map(r=>r.transcript.toLowerCase().trim());
    let matched = null;
    for (const t of transcripts) {
      matched = ITEMS.find(item=>{
        const name = item.name.toLowerCase();
        const id   = item.id.replace('num_','number ');
        return t.includes(name) || t.includes(id) || name.includes(t);
      });
      if (matched) break;
    }
    if (matched) {
      status.textContent = `✅ Found: ${matched.name}`;
      openItemModal(matched.id);
    } else {
      status.textContent = `❓ Didn't catch that — try again`;
      showToast(`🎤 Heard: "${transcripts[0]}" — not found`);
    }
  };
  voiceRecognition.onerror = ()=>{ status.textContent='❌ Error — try again'; };
  voiceRecognition.onend   = ()=>{ btn.classList.remove('listening'); setTimeout(()=>{ status.textContent=''; },2000); voiceRecognition=null; };
  voiceRecognition.start();
}

let speaking = false;
function speakDescription() {
  if (!window.speechSynthesis) { showToast('🔊 Speech not supported'); return; }
  const item = getItem(currentItemId);
  if (!item) return;
  window.speechSynthesis.cancel();
  const lbl = document.getElementById('modal-speaking-label');
  const text = `${item.name}. ${item.desc}`;
  const utt  = new SpeechSynthesisUtterance(text);
  utt.rate   = 0.85;
  utt.pitch  = 1.1;
  utt.onstart = ()=>{ lbl.style.display='inline'; speaking=true; };
  utt.onend   = ()=>{ lbl.style.display='none';   speaking=false; };
  window.speechSynthesis.speak(utt);
}
function stopSpeech() { window.speechSynthesis && window.speechSynthesis.cancel(); }

let currentItemId = null;
function openItemModal(id) {
  currentItemId = id;
  const item = getItem(id);
  const pct  = getProgress(id);
  const isFav= STATE.favs.includes(id);
  const p    = STATE.progress[id]||{};
  document.getElementById('modal-icon').textContent  = item.icon;
  document.getElementById('modal-name').textContent  = item.name;
  const lvlEl = document.getElementById('modal-level');
  lvlEl.textContent = getLevelLabel(item.level);
  lvlEl.className   = 'modal-level level-'+item.level;
  document.getElementById('modal-cat').textContent   =
    {shape:'🔷 Shape',fruit:'🍎 Fruit',vegetable:'🥦 Vegetable'}[item.category]||'';
  document.getElementById('modal-pct').textContent   = pct+'%';
  document.getElementById('modal-fill').style.width  = pct+'%';
  document.getElementById('modal-fav-btn').textContent = isFav?'⭐':'☆';
  document.getElementById('modal-desc').textContent  = item.desc;
  document.getElementById('modal-pts-info').textContent =
    `🏆 ${getItemPoints(id)}/30 pts earned  •  10 pts per step`;
  const tagsEl = document.getElementById('modal-tags');
  tagsEl.innerHTML = item.tags.map(t=>`<span class="modal-tag">${t}</span>`).join('');
  ['step1','step2','step3'].forEach((s,i)=>{
    document.getElementById('modal-'+s).classList.toggle('done-step',!!p[['trace','name','color'][i]]);
  });

  document.getElementById('mobile-drawing-notice').style.display = isMobile()?'block':'none';
  document.getElementById('item-modal').classList.add('open');

  setTimeout(()=>speakDescription(), 400);
}
function closeItemModal() {
  stopSpeech();
  document.getElementById('item-modal').classList.remove('open');
}
function closeModal(e) { if(e.target.id==='item-modal') closeItemModal(); }
function toggleFavModal() {
  if(!currentItemId) return;
  toggleFav(currentItemId, null);
  document.getElementById('modal-fav-btn').textContent = STATE.favs.includes(currentItemId)?'⭐':'☆';
}
function prevItem() { const i=ITEMS.findIndex(x=>x.id===currentItemId); openItemModal(ITEMS[(i-1+ITEMS.length)%ITEMS.length].id); }
function nextItem() { const i=ITEMS.findIndex(x=>x.id===currentItemId); openItemModal(ITEMS[(i+1)%ITEMS.length].id); }

function launchItem() {
  if (!currentItemId) return;
  const item = getItem(currentItemId);
  closeItemModal();
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal && !isMobile()) {
    fetch(FLASK_URL+`/launch?item=${item.id}`, {credentials:'include'})
      .then(r=>r.json())
      .then(d=>{ if(d.launched){showToast(`🎮 Launching ${item.name}!`);pollSignal();}
                 else showToast(`❌ ${d.error||'Launch failed'}`); })
      .catch(()=>showToast('⚠️ Server offline! Run python app.py first.'));
  } else {
    startMobileDrawing(item);
  }
}

let pollInterval = null;
function pollSignal() {
  if(pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(()=>{
    fetch(FLASK_URL+'/signal',{credentials:'include'}).then(r=>r.json())
      .then(d=>{ if(d.completed&&d.item){clearInterval(pollInterval);applySignal(d);fetch(FLASK_URL+'/clear_signal');} })
      .catch(()=>{});
  }, 2000);
}
function applySignal(d) {
  const id = d.item;
  if(!getItem(id)) return;
  if(!STATE.progress[id]) STATE.progress[id]={};
  STATE.progress[id].trace = true;
  STATE.progress[id].name  = true;
  STATE.progress[id].color = true;
  STATE.points[id] = d.points || 30;
  STATE.times[id]  = d.times||{trace:0,name:0,color:0};
  persistState();
  updateHeaderScore();
  renderLearnPage();
  showToast(`🎉 ${id.charAt(0).toUpperCase()+id.slice(1)} complete! +30 pts`);
  triggerConfetti();
}

let mobileHands       = null;
let mobileStream      = null;
let mobileAnimFrame   = null;
let mobileStep        = 1;
let mobileItem        = null;
let mobileDrawnPts    = [];
let mobileStepTimes   = {trace:0,name:0,color:0};
let mobileStepStart   = 0;
let mobileGesture     = 'NONE';
let mobileDrawing     = false;
let mobileSelectedColor = null;
let mobilePtsEarned   = 0;
let mobileNameCorrect = false;
let mobileTouchFallback = false;
let mobileCurrentDot  = 0;
let mobileGuideDotIndices = [];
let mobileEraserMode  = false;
let mobileEraserStrokes = [];
let mobileAnimating   = false;
let mobileAnimProgress = 0;
let colorHoverHex     = null;
let colorHoverFrames  = 0;

const SHAPE_GUIDES = {

  circle:    ()=>{ const pts=[]; for(let a=0;a<360;a+=4){ pts.push({x:200+140*Math.cos(a*Math.PI/180),y:200+140*Math.sin(a*Math.PI/180)}); } return pts; },
  square:    ()=>{ const s=[[60,60],[340,60],[340,340],[60,340],[60,60]]; return interpPath(s,200); },
  triangle:  ()=>{ return interpPath([[200,40],[360,360],[40,360],[200,40]],200); },
  rectangle: ()=>{ return interpPath([[40,100],[360,100],[360,300],[40,300],[40,100]],200); },
  star:      ()=>{ const pts=[],n=5,or=150,ir=65,cx=200,cy=200; for(let i=0;i<n*2;i++){const r=i%2===0?or:ir,a=(i*Math.PI/n)-Math.PI/2;pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});} pts.push(pts[0]); return interpPath(pts.map(p=>[p.x,p.y]),200); },
  heart:     ()=>{ const pts=[]; for(let a=0;a<=360;a+=3){const t=a*Math.PI/180;pts.push({x:200+130*(16*Math.pow(Math.sin(t),3))/16,y:200-130*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16});} return pts; },
  diamond:   ()=>{ return interpPath([[200,40],[360,200],[200,360],[40,200],[200,40]],200); },
  pentagon:  ()=>{ const pts=[],n=5; for(let i=0;i<n;i++){const a=(i*2*Math.PI/n)-Math.PI/2;pts.push([200+150*Math.cos(a),200+150*Math.sin(a)]);} pts.push(pts[0]); return interpPath(pts,200); },
  hexagon:   ()=>{ const pts=[],n=6; for(let i=0;i<n;i++){const a=i*Math.PI/3;pts.push([200+150*Math.cos(a),200+150*Math.sin(a)]);} pts.push(pts[0]); return interpPath(pts,200); },
  octagon:   ()=>{ const pts=[],n=8; for(let i=0;i<n;i++){const a=(i*2*Math.PI/n)-Math.PI/8;pts.push([200+145*Math.cos(a),200+145*Math.sin(a)]);} pts.push(pts[0]); return interpPath(pts,200); },
  oval:      ()=>{ const pts=[]; for(let a=0;a<360;a+=4){pts.push({x:200+170*Math.cos(a*Math.PI/180),y:200+110*Math.sin(a*Math.PI/180)});} return pts; },
  arrow:     ()=>{ return interpPath([[200,40],[340,160],[260,160],[260,360],[140,360],[140,160],[60,160],[200,40]],200); },
  crescent:  ()=>{ const pts=[]; for(let a=-80;a<=260;a+=4){pts.push({x:200+140*Math.cos(a*Math.PI/180),y:200+140*Math.sin(a*Math.PI/180)});} for(let a=220;a>=-40;a-=4){pts.push({x:220+100*Math.cos(a*Math.PI/180),y:200+100*Math.sin(a*Math.PI/180)});} return pts; },

  orange:    ()=>{ const pts=[]; for(let a=0;a<360;a+=4){pts.push({x:200+140*Math.cos(a*Math.PI/180),y:200+140*Math.sin(a*Math.PI/180)});} return pts; },
  mango:     ()=>{ return interpPath([[200,40],[290,120],[310,200],[290,300],[200,360],[110,300],[90,200],[110,120],[200,40]],200); },
  apple:     ()=>{ return interpPath([[200,50],[230,40],[290,80],[310,150],[300,230],[260,310],[200,360],[140,310],[100,230],[90,150],[110,80],[170,40],[200,50]],200); },
  banana:    ()=>{ return interpPath([[80,180],[100,120],[140,80],[200,70],[270,80],[330,120],[350,170],[320,200],[260,210],[200,200],[140,190],[100,195],[80,180]],200); },
  pear:      ()=>{ return interpPath([[200,40],[230,60],[260,120],[270,200],[250,280],[220,340],[200,360],[180,340],[150,280],[130,200],[140,120],[170,60],[200,40]],200); },

  carrot:    ()=>{ return interpPath([[200,30],[240,60],[250,120],[240,200],[220,280],[200,380],[180,280],[160,200],[150,120],[160,60],[200,30]],200); },
  potato:    ()=>{ return interpPath([[200,60],[260,70],[310,100],[340,150],[340,210],[310,270],[250,310],[190,320],[130,300],[80,260],[70,200],[80,140],[120,90],[170,65],[200,60]],200); },
  tomato:    ()=>{ return interpPath([[200,60],[250,55],[300,80],[330,130],[330,200],[300,270],[240,320],[200,330],[160,320],[100,270],[70,200],[70,130],[100,80],[150,55],[200,60]],200); },
  eggplant:  ()=>{ return interpPath([[200,40],[230,60],[250,110],[260,180],[250,260],[230,320],[200,360],[170,320],[150,260],[140,180],[150,110],[170,60],[200,40]],200); },
  mushroom:  ()=>{ return interpPath([[140,360],[140,240],[80,200],[60,150],[80,90],[130,60],[200,50],[270,60],[320,90],[340,150],[320,200],[260,240],[260,360],[140,360]],200); },
  pumpkin:   ()=>{ return interpPath([[200,40],[230,50],[270,70],[300,110],[310,160],[300,220],[280,280],[240,330],[200,350],[160,330],[120,280],[100,220],[90,160],[100,110],[130,70],[170,50],[200,40]],200); },
};

function letterGuide(letter) {
  const L=letter.toUpperCase();
  const guides = {
    A:[[200,30],[80,360],[200,30],[320,360],[120,220],[280,220]],
    B:[[80,30],[80,360],[80,30],[240,30],[300,80],[300,175],[240,210],[80,210],[80,210],[240,210],[300,260],[300,315],[240,360],[80,360]],
    C:[[340,80],[280,40],[200,40],[130,70],[80,130],[70,200],[80,270],[130,330],[200,360],[280,360],[340,320]],
    D:[[80,30],[80,360],[80,30],[200,30],[290,80],[330,160],[330,200],[330,240],[290,320],[200,360],[80,360]],
    E:[[300,30],[80,30],[80,30],[80,360],[80,360],[300,360],[80,200],[240,200]],
    F:[[80,30],[300,30],[80,30],[80,360],[80,200],[240,200]],
    G:[[340,80],[280,40],[200,40],[130,70],[80,130],[70,200],[80,270],[130,330],[200,360],[280,360],[340,320],[340,200],[220,200]],
    H:[[80,30],[80,360],[320,30],[320,360],[80,200],[320,200]],
    I:[[130,30],[270,30],[200,30],[200,360],[130,360],[270,360]],
    J:[[260,30],[260,290],[240,340],[200,360],[160,350],[120,310],[110,270]],
    K:[[80,30],[80,360],[80,200],[320,30],[80,200],[320,360]],
    L:[[80,30],[80,360],[80,360],[320,360]],
    M:[[80,360],[80,30],[200,180],[320,30],[320,360]],
    N:[[80,360],[80,30],[320,360],[320,30]],
    O:[[200,30],[130,50],[80,110],[70,200],[80,290],[130,350],[200,370],[270,350],[320,290],[330,200],[320,110],[270,50],[200,30]],
    P:[[80,30],[80,360],[80,30],[240,30],[310,80],[310,160],[240,210],[80,210]],
    Q:[[200,30],[130,50],[80,110],[70,200],[80,290],[130,350],[200,370],[270,350],[320,290],[330,200],[320,110],[270,50],[200,30],[240,300],[310,360]],
    R:[[80,30],[80,360],[80,30],[240,30],[310,80],[310,160],[240,210],[80,210],[180,210],[320,360]],
    S:[[330,80],[280,40],[200,40],[130,60],[100,110],[130,160],[200,190],[270,220],[310,270],[290,330],[230,360],[160,360],[100,330],[80,290]],
    T:[[80,30],[320,30],[200,30],[200,360]],
    U:[[80,30],[80,280],[100,330],[150,360],[200,370],[250,360],[300,330],[320,280],[320,30]],
    V:[[80,30],[200,370],[320,30]],
    W:[[60,30],[130,360],[200,230],[270,360],[340,30]],
    X:[[80,30],[320,360],[320,30],[80,360]],
    Y:[[80,30],[200,200],[320,30],[200,200],[200,360]],
    Z:[[80,30],[320,30],[80,360],[320,360]],
    '0':[[200,30],[130,50],[80,110],[70,200],[80,290],[130,350],[200,370],[270,350],[320,290],[330,200],[320,110],[270,50],[200,30]],
    '1':[[130,80],[200,30],[200,360]],
    '2':[[90,100],[130,60],[180,40],[240,50],[290,90],[300,140],[280,190],[200,270],[90,360],[310,360]],
    '3':[[90,60],[160,40],[230,50],[290,90],[290,160],[230,200],[290,250],[290,310],[230,360],[160,370],[90,350]],
    '4':[[290,30],[80,230],[320,230],[260,30],[260,360]],
    '5':[[310,40],[80,40],[70,200],[130,170],[200,170],[270,190],[310,240],[300,310],[250,360],[180,370],[110,350],[80,310]],
  };
  const raw = guides[L] || guides['O'];
  return interpPath(raw.map(p=>Array.isArray(p)?p:[p.x,p.y]), 180);
}

function interpPath(pts, numPts) {

  const result = [];
  const segs = [];
  for (let i=0;i<pts.length-1;i++) {
    const dx=pts[i+1][0]-pts[i][0], dy=pts[i+1][1]-pts[i][1];
    segs.push(Math.sqrt(dx*dx+dy*dy));
  }
  const total = segs.reduce((a,b)=>a+b,0);
  const step  = total/numPts;
  let dist=0, seg=0, along=0;
  result.push({x:pts[0][0],y:pts[0][1]});
  for (let n=1;n<numPts;n++) {
    dist += step;
    while (seg<segs.length-1 && along+segs[seg]<dist) { along+=segs[seg]; seg++; }
    const t = segs[seg]>0?(dist-along)/segs[seg]:0;
    result.push({
      x:pts[seg][0]+t*(pts[seg+1][0]-pts[seg][0]),
      y:pts[seg][1]+t*(pts[seg+1][1]-pts[seg][1])
    });
  }
  return result;
}

function getGuidePoints(item) {
  if (SHAPE_GUIDES[item.id]) return SHAPE_GUIDES[item.id]();
  return SHAPE_GUIDES.circle();
}

const COLORS = [
  {name:'Red',     hex:'#f44336'},{name:'Orange', hex:'#ff9800'},
  {name:'Yellow',  hex:'#ffeb3b'},{name:'Green',  hex:'#4caf50'},
  {name:'Blue',    hex:'#2196f3'},{name:'Purple', hex:'#9c27b0'},
  {name:'Pink',    hex:'#e91e63'},{name:'Brown',  hex:'#795548'},
  {name:'White',   hex:'#ffffff'},{name:'Black',  hex:'#212121'},
];

async function startMobileDrawing(item) {
  mobileItem        = item;
  mobileStep        = 1;
  mobileDrawnPts    = [];
  mobileStepTimes   = {trace:0,name:0,color:0};
  mobileStepStart   = performance.now();
  mobilePtsEarned   = 0;
  mobileNameCorrect = false;
  mobileSelectedColor = null;
  mobileCurrentDot  = 0;
  mobileGuideDotIndices = [];
  mobileEraserMode  = false;
  mobileEraserStrokes = [];
  mobileAnimating   = false;
  mobileAnimProgress = 0;
  colorHoverHex     = null;
  colorHoverFrames  = 0;

  const modal = document.getElementById('mobile-draw-modal');
  modal.style.display = 'flex';
  document.getElementById('mhud-item-name').textContent = item.name;
  updateMobileHUD();

  let dtBtn = document.getElementById('done-tracing-camera-btn');
  if (!dtBtn) {
    dtBtn = document.createElement('button');
    dtBtn.id = 'done-tracing-camera-btn';
    dtBtn.className = 'voice-name-btn';
    dtBtn.style.cssText = 'position:absolute;bottom:70px;left:50%;transform:translateX(-50%);z-index:20;display:none;';
    dtBtn.textContent = '✅ Done Tracing!';
    dtBtn.onclick = finishTrace;
    document.getElementById('mobile-canvas-wrap').appendChild(dtBtn);
  }
  showMobileStep(1);

  try {
    mobileStream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}, audio:false
    });
    const video = document.getElementById('mobile-video');
    video.srcObject = mobileStream;
    await video.play();
    await loadMediaPipe();
  } catch(err) {
    console.warn('Camera unavailable, using touch fallback:', err);
    mobileTouchFallback = true;
    hideMobileLoading();
    setupTouchFallback();
  }
}

async function loadMediaPipe() {
  setLoading('Loading MediaPipe…', 10);

  if (!window.Hands) {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.min.js');
  }
  setLoading('Loading hand model…', 40);
  if (!window.Camera) {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
  }
  setLoading('Starting hand detector…', 70);

  const hands = new window.Hands({locateFile: f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${f}`});
  hands.setOptions({maxNumHands:1, modelComplexity:0, minDetectionConfidence:0.6, minTrackingConfidence:0.5});
  hands.onResults(onHandResults);
  mobileHands = hands;

  setLoading('Initialising camera…', 90);
  const video = document.getElementById('mobile-video');
  const camera = new window.Camera(video, {
    onFrame: async ()=>{ if(mobileHands) await mobileHands.send({image:video}); },
    width:640, height:480
  });
  await camera.start();
  setLoading('Ready!', 100);
  setTimeout(hideMobileLoading, 600);
}

function loadScript(src) {
  return new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src=src; s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });
}

function setLoading(text, pct) {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-bar').style.width  = pct+'%';
}
function hideMobileLoading() {
  document.getElementById('mobile-loading').style.display='none';
  document.getElementById('mobile-canvas-wrap').style.display='block';
}

let lastGestureTime = 0;
function onHandResults(results) {
  if (mobileStep!==1 && mobileStep!==3) return;
  const canvas = document.getElementById('mobile-canvas');
  const ctx    = canvas.getContext('2d');
  const video  = document.getElementById('mobile-video');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;

  ctx.save();
  ctx.translate(canvas.width,0); ctx.scale(-1,1);
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  ctx.restore();

  if (mobileStep===1) drawGuideOnCanvas(ctx, canvas.width, canvas.height);

  if (!results.multiHandLandmarks || !results.multiHandLandmarks.length) {
    document.getElementById('gesture-label').textContent = '✋ Show your hand';
    // In step 3 (color), keep drawing the swatches even without a hand so the
    // UI doesn't blank out and appear to revert to a previous step.
    if (mobileStep === 3) {
      drawColorSwatchesOnCanvas(ctx, canvas.width, canvas.height, -999, -999, null, canvas.width, canvas.height);
    }
    return;
  }

  const lm = results.multiHandLandmarks[0];
  const gesture = detectGesture(lm);
  mobileGesture = gesture;
  document.getElementById('gesture-label').textContent = gestureLabel(gesture);

  const tx = (1-lm[8].x) * canvas.width;
  const ty = lm[8].y     * canvas.height;

  if (gesture==='DRAWING') {
    mobileDrawing = true;
    mobileDrawnPts.push({x: tx, y: ty});
    checkDotReached(tx, ty, canvas.width, canvas.height);
  } else if (gesture==='FIST') {
    mobileDrawing = false;
  } else if (gesture==='THUMBS_UP') {
    // advance only via Done Tracing button
  }

  if (mobileStep===3) {
    drawColorSwatchesOnCanvas(ctx, canvas.width, canvas.height, tx, ty, lm, canvas.width, canvas.height);
  } else {
    drawCompletedLines(ctx, canvas.width, canvas.height);
  }

  ctx.beginPath();
  ctx.arc(tx,ty,12,0,Math.PI*2);
  ctx.fillStyle=mobileStep===3?'rgba(0,255,255,0.9)':gesture==='DRAWING'?'rgba(255,255,0,0.8)':'rgba(255,255,255,0.5)';
  ctx.strokeStyle='#fff';ctx.lineWidth=2;
  ctx.fill();ctx.stroke();
}

function applyPadding(pts) {
  const scale = 0.72;
  const cx = 200, cy = 185;
  return pts.map(p => ({
    x: cx + (p.x - 200) * scale,
    y: cy + (p.y - 200) * scale
  }));
}

function getMobileGuideDots(item) {
  const ITEM_DOTS = {
    circle:    ()=>{ const pts=[]; for(let a=0;a<360;a+=30) pts.push({x:200+140*Math.cos(a*Math.PI/180),y:200+140*Math.sin(a*Math.PI/180)}); return pts; },
    square:    ()=>[ {x:72,y:72},{x:328,y:72},{x:328,y:328},{x:72,y:328} ],
    triangle:  ()=>[ {x:200,y:40},{x:360,y:340},{x:40,y:340} ],
    rectangle: ()=>[ {x:40,y:112},{x:360,y:112},{x:360,y:288},{x:40,y:288} ],
    star:      ()=>{ const pts=[]; for(let i=0;i<10;i++){ const r=i%2===0?152:64; const a=(i*36-90)*Math.PI/180; pts.push({x:200+r*Math.cos(a),y:200+r*Math.sin(a)}); } return pts; },
    heart:     ()=>{ const pts=[]; for(let t=0;t<Math.PI*2;t+=Math.PI*2/20){ pts.push({x:200+112*(16*Math.sin(t)**3)/16,y:208-112*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17}); } return pts; },
    diamond:   ()=>[ {x:200,y:32},{x:352,y:200},{x:200,y:368},{x:48,y:200} ],
    pentagon:  ()=>{ const pts=[]; for(let a=0;a<360;a+=72) pts.push({x:200+152*Math.cos((a-90)*Math.PI/180),y:200+152*Math.sin((a-90)*Math.PI/180)}); return pts; },
    hexagon:   ()=>{ const pts=[]; for(let a=0;a<360;a+=60) pts.push({x:200+152*Math.cos(a*Math.PI/180),y:200+152*Math.sin(a*Math.PI/180)}); return pts; },
    octagon:   ()=>{ const pts=[]; for(let a=0;a<360;a+=45) pts.push({x:200+152*Math.cos(a*Math.PI/180),y:200+152*Math.sin(a*Math.PI/180)}); return pts; },
    oval:      ()=>{ const pts=[]; for(let a=0;a<360;a+=20) pts.push({x:200+160*Math.cos(a*Math.PI/180),y:200+100*Math.sin(a*Math.PI/180)}); return pts; },
    arrow:     ()=>[ {x:220,y:80},{x:340,y:200},{x:220,y:320},{x:220,y:260},{x:60,y:260},{x:60,y:140},{x:220,y:140} ],
    crescent:  ()=>{ const pts=[]; for(let a=-80;a<=80;a+=16) pts.push({x:200+152*Math.cos(a*Math.PI/180),y:200+152*Math.sin(a*Math.PI/180)}); for(let a=70;a>=-70;a-=14) pts.push({x:232+120*Math.cos(a*Math.PI/180),y:200+112*Math.sin(a*Math.PI/180)}); return pts; },
    orange:    ()=>[ {x:203,y:28},{x:136,y:42},{x:105,y:59},{x:80,y:81},{x:59,y:110},{x:44,y:142},{x:34,y:210},{x:48,y:268},{x:66,y:300},{x:89,y:326},{x:145,y:360},{x:210,y:371},{x:271,y:358},{x:303,y:340},{x:330,y:316},{x:365,y:258},{x:374,y:224},{x:375,y:190},{x:358,y:123},{x:319,y:70},{x:267,y:38} ],
    mango:     ()=>[ {x:205,y:12},{x:193,y:14},{x:188,y:35},{x:147,y:42},{x:108,y:64},{x:86,y:94},{x:74,y:132},{x:80,y:190},{x:119,y:270},{x:124,y:348},{x:137,y:367},{x:162,y:376},{x:189,y:372},{x:218,y:360},{x:282,y:312},{x:322,y:252},{x:342,y:187},{x:339,y:134},{x:316,y:88},{x:272,y:52},{x:240,y:41},{x:208,y:36} ],
    apple:     ()=>[ {x:230,y:36},{x:220,y:38},{x:208,y:58},{x:193,y:109},{x:146,y:91},{x:98,y:95},{x:57,y:120},{x:34,y:160},{x:31,y:211},{x:50,y:268},{x:94,y:323},{x:140,y:348},{x:160,y:349},{x:198,y:339},{x:250,y:350},{x:282,y:342},{x:311,y:322},{x:338,y:291},{x:368,y:232},{x:373,y:202},{x:370,y:162},{x:356,y:132},{x:336,y:111},{x:310,y:97},{x:280,y:90},{x:243,y:94},{x:208,y:109},{x:220,y:76} ],
    banana:    ()=>[ {x:70,y:35},{x:55,y:40},{x:51,y:47},{x:56,y:81},{x:30,y:121},{x:26,y:167},{x:50,y:225},{x:90,y:272},{x:149,y:309},{x:218,y:327},{x:283,y:321},{x:315,y:310},{x:344,y:292},{x:382,y:252},{x:378,y:238},{x:368,y:234},{x:344,y:240},{x:253,y:247},{x:216,y:240},{x:182,y:224},{x:147,y:195},{x:123,y:162},{x:98,y:94},{x:85,y:81},{x:82,y:38} ],
    pear:      ()=>[ {x:222,y:82},{x:215,y:86},{x:205,y:106},{x:182,y:110},{x:161,y:123},{x:139,y:173},{x:96,y:218},{x:84,y:238},{x:83,y:265},{x:96,y:286},{x:119,y:302},{x:151,y:312},{x:204,y:309},{x:244,y:313},{x:265,y:309},{x:297,y:293},{x:316,y:267},{x:318,y:250},{x:314,y:234},{x:266,y:179},{x:251,y:129},{x:235,y:114},{x:216,y:107} ],
    carrot:    ()=>[ {x:185,y:71},{x:182,y:75},{x:169,y:76},{x:177,y:89},{x:164,y:93},{x:154,y:100},{x:148,y:112},{x:147,y:127},{x:175,y:267},{x:190,y:314},{x:199,y:323},{x:208,y:309},{x:238,y:164},{x:243,y:117},{x:234,y:98},{x:212,y:89},{x:222,y:73},{x:209,y:72},{x:204,y:77},{x:201,y:72} ],
    potato:    ()=>[ {x:262,y:101},{x:234,y:102},{x:202,y:108},{x:146,y:131},{x:96,y:164},{x:74,y:190},{x:68,y:216},{x:82,y:246},{x:108,y:266},{x:125,y:273},{x:150,y:279},{x:192,y:278},{x:232,y:267},{x:269,y:244},{x:304,y:205},{x:326,y:158},{x:327,y:144},{x:321,y:130},{x:308,y:116},{x:294,y:108} ],
    tomato:    ()=>[ {x:192,y:104},{x:185,y:124},{x:170,y:125},{x:142,y:118},{x:152,y:128},{x:117,y:138},{x:92,y:153},{x:71,y:179},{x:68,y:203},{x:83,y:234},{x:114,y:257},{x:165,y:273},{x:220,y:276},{x:269,y:268},{x:310,y:248},{x:335,y:219},{x:339,y:190},{x:332,y:172},{x:320,y:157},{x:304,y:145},{x:278,y:134},{x:289,y:126},{x:264,y:130},{x:246,y:126},{x:255,y:111},{x:230,y:124},{x:222,y:124},{x:230,y:110},{x:220,y:106},{x:213,y:108},{x:204,y:123} ],
    eggplant:  ()=>[ {x:248,y:68},{x:240,y:69},{x:236,y:92},{x:215,y:98},{x:194,y:118},{x:201,y:120},{x:180,y:159},{x:157,y:186},{x:112,y:225},{x:98,y:246},{x:94,y:268},{x:101,y:286},{x:114,y:299},{x:135,y:306},{x:170,y:306},{x:202,y:294},{x:231,y:267},{x:254,y:230},{x:274,y:170},{x:276,y:126},{x:283,y:124},{x:270,y:103},{x:253,y:94},{x:255,y:72} ],
    mushroom:  ()=>[ {x:194,y:116},{x:150,y:122},{x:119,y:135},{x:96,y:153},{x:89,y:165},{x:87,y:177},{x:92,y:190},{x:109,y:199},{x:130,y:202},{x:162,y:202},{x:153,y:238},{x:156,y:253},{x:174,y:265},{x:208,y:268},{x:232,y:263},{x:245,y:250},{x:247,y:233},{x:240,y:202},{x:272,y:202},{x:294,y:197},{x:310,y:186},{x:312,y:172},{x:301,y:150},{x:274,y:130},{x:234,y:118} ],
    pumpkin:   ()=>[ {x:216,y:105},{x:193,y:109},{x:183,y:131},{x:144,y:131},{x:111,y:142},{x:90,y:156},{x:75,y:178},{x:71,y:207},{x:84,y:235},{x:110,y:254},{x:151,y:266},{x:176,y:267},{x:203,y:271},{x:224,y:267},{x:246,y:267},{x:273,y:261},{x:304,y:246},{x:316,y:235},{x:325,y:219},{x:328,y:187},{x:312,y:159},{x:292,y:144},{x:270,y:135},{x:240,y:130},{x:217,y:131},{x:213,y:120} ],
  };
  const fn = ITEM_DOTS[item.id];
  return applyPadding(fn ? fn() : ITEM_DOTS.circle());
}

function drawGuideOnCanvas(ctx, w, h) {
  if (!mobileItem) return;
  const scale = Math.min(w,h) / 400;
  const ox = (w - 400*scale)/2;
  const oy = (h - 400*scale)/2;
  ctx.save();
  ctx.translate(ox,oy); ctx.scale(scale,scale);

  const dots = getMobileGuideDots(mobileItem);
  dots.forEach((d, i) => {
    const isCompleted = i < mobileCurrentDot;
    const isActive    = i === mobileCurrentDot;
    const r = isActive ? 14/scale : 9/scale;
    ctx.beginPath();
    ctx.arc(d.x, d.y, r, 0, Math.PI*2);
    if (isCompleted)    { ctx.fillStyle='#4caf50'; ctx.strokeStyle='#fff'; }
    else if (isActive)  { ctx.fillStyle='#FF6B35'; ctx.strokeStyle='#fff'; }
    else                { ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.strokeStyle='rgba(255,255,255,0.5)'; }
    ctx.lineWidth = 2/scale;
    ctx.fill(); ctx.stroke();

    if (isActive) {
      const pulse = 0.5 + 0.5*Math.sin(Date.now()/250);
      ctx.beginPath();
      ctx.arc(d.x, d.y, (r+8/scale)*pulse, 0, Math.PI*2);
      ctx.strokeStyle='rgba(255,107,53,0.6)';
      ctx.lineWidth=2/scale; ctx.stroke();
    }
    if (i===0 && !isCompleted) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, r+5/scale, 0, Math.PI*2);
      ctx.strokeStyle='rgba(255,217,61,0.9)';
      ctx.lineWidth=2/scale; ctx.stroke();
    }

    if (isActive) {
      ctx.font = `bold ${Math.round(11/scale)}px Nunito,sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAP', d.x, d.y);
    }
  });

  ctx.restore();
}

function drawCompletedLines(ctx, w, h) {
  if (!mobileItem || mobileCurrentDot < 1) return;
  const scale = Math.min(w,h)/400;
  const ox = (w-400*scale)/2;
  const oy = (h-400*scale)/2;
  const dots = getMobileGuideDots(mobileItem);
  ctx.save();
  ctx.translate(ox,oy); ctx.scale(scale,scale);
  ctx.beginPath();
  ctx.strokeStyle = mobileItem.color;
  ctx.lineWidth   = 5/scale;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  for (let i=0; i<mobileCurrentDot && i<dots.length; i++) {
    if (i===0) ctx.moveTo(dots[i].x, dots[i].y);
    else ctx.lineTo(dots[i].x, dots[i].y);
  }
  if (mobileAnimProgress > 0 && mobileCurrentDot < dots.length) {
    const from = dots[mobileCurrentDot-1] || dots[0];
    const to   = dots[mobileCurrentDot];
    ctx.lineTo(
      from.x + (to.x - from.x) * mobileAnimProgress,
      from.y + (to.y - from.y) * mobileAnimProgress
    );
  }
  if (mobileCurrentDot >= dots.length) {
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

function checkDotReached(px, py, canvasW, canvasH) {
  if (!mobileItem) return;
  const dots  = getMobileGuideDots(mobileItem);
  if (mobileCurrentDot >= dots.length) return;
  const scale = Math.min(canvasW, canvasH)/400;
  const ox    = (canvasW - 400*scale)/2;
  const oy    = (canvasH - 400*scale)/2;
  const d     = dots[mobileCurrentDot];
  const sx    = d.x*scale + ox;
  const sy    = d.y*scale + oy;
  const snapR = Math.max(35, canvasW*0.08);
  const dist  = Math.sqrt((px-sx)**2 + (py-sy)**2);
  if (dist < snapR) {
    animateToDot(mobileCurrentDot);
  }
}

function animateToDot(dotIdx) {
  if (mobileAnimating) return;
  mobileAnimating    = true;
  mobileAnimProgress = 0;
  const startTime    = performance.now();
  const duration     = 400;

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    mobileAnimProgress = t;
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      mobileCurrentDot++;
      mobileAnimProgress = 0;
      mobileAnimating    = false;
      const dots = getMobileGuideDots(mobileItem);
      if (mobileCurrentDot >= dots.length) {
        showToast('🎉 All dots traced! Click Done Tracing to continue!');
      } else {
        showToast(`✅ ${mobileCurrentDot}/${dots.length} points`);
      }
    }
  }
  requestAnimationFrame(step);
}

function detectGesture(lm) {
  const indexUp  = lm[8].y  < lm[6].y;
  const middleUp = lm[12].y < lm[10].y;
  const ringDown = lm[16].y > lm[14].y;
  const pinkyDown= lm[20].y > lm[18].y;
  const thumbOut = lm[4].x  < lm[3].x;  

  if (indexUp && !middleUp && ringDown && pinkyDown) return 'DRAWING';
  if (indexUp && middleUp && !ringDown)               return 'PEACE';
  if (!indexUp && !middleUp && thumbOut)              return 'THUMBS_UP';
  if (!indexUp && !middleUp && !thumbOut)             return 'FIST';

  const dx = lm[4].x-lm[8].x, dy = lm[4].y-lm[8].y;
  if (Math.sqrt(dx*dx+dy*dy)<0.07) return 'PINCH';
  return 'OPEN';
}

function gestureLabel(g) {
  return {
    DRAWING:'✏️ Drawing! Lift finger to pause',
    PEACE:'✌️ Erasing…',
    THUMBS_UP:'👍 Submit trace!',
    FIST:'✊ Pen lifted',
    PINCH:'🤌 Pinching',
    OPEN:'✋ Show index finger to draw',
    NONE:'✋ Show your hand',
  }[g]||'✋ Show your hand';
}

function scoreTrace() {
  const canvas  = document.getElementById('mobile-canvas');
  const w = canvas.width  || 640;
  const h = canvas.height || 480;
  const scale   = Math.min(w,h)/400;
  const ox      = (w-400*scale)/2;
  const oy      = (h-400*scale)/2;
  const guide   = getGuidePoints(mobileItem).map(p=>({
    x: p.x*scale+ox, y: p.y*scale+oy
  }));
  if (!mobileDrawnPts.length) return 0;
  const TOLERANCE = 40;
  let matched = 0;
  guide.forEach(gp=>{
    const near = mobileDrawnPts.some(dp=>{
      const dx=gp.x-dp.x, dy=gp.y-dp.y;
      return Math.sqrt(dx*dx+dy*dy) < TOLERANCE;
    });
    if(near) matched++;
  });
  return Math.round(matched/guide.length*100);
}

function setupTouchFallback() {
  document.getElementById('mobile-canvas-wrap').style.display = 'block';
  document.getElementById('mobile-video').style.display = 'none';
  const canvas = document.getElementById('mobile-canvas');
  const rect   = document.getElementById('mobile-canvas-wrap').getBoundingClientRect();
  canvas.width  = rect.width  || 360;
  canvas.height = rect.height || 480;
  drawGuideOnCanvas(canvas.getContext('2d'), canvas.width, canvas.height);
  document.getElementById('gesture-label').textContent = ' ';

  const getPos = e=>{
    const r=canvas.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    return {x:t.clientX-r.left, y:t.clientY-r.top};
  };

  canvas.addEventListener('touchstart', e=>{
    e.preventDefault();
    const p=getPos(e);
    checkDotReached(p.x, p.y, canvas.width, canvas.height);
  });
  canvas.addEventListener('touchmove', e=>{
    e.preventDefault();
    const p=getPos(e);
    checkDotReached(p.x, p.y, canvas.width, canvas.height);
  });
  canvas.addEventListener('touchend', e=>{ e.preventDefault(); });

  const doneBtn = document.createElement('button');
  doneBtn.className = 'voice-name-btn';
  doneBtn.style.cssText = 'position:absolute;top:12px;left:12px;z-index:10;';
  doneBtn.textContent = '✅ Done Tracing!';
  doneBtn.onclick = finishTrace;
  document.getElementById('mobile-canvas-wrap').appendChild(doneBtn);

  const eraserBar = document.createElement('div');
  eraserBar.id = 'mobile-eraser-bar';
  eraserBar.style.cssText = 'position:absolute;bottom:0;left:0;right:0;display:flex;gap:10px;padding:10px 14px;background:rgba(0,0,0,0.6);z-index:10;justify-content:center;align-items:center;';
  eraserBar.innerHTML = `
    <button id="eraser-btn" style="padding:10px 22px;border:2px solid #fff;border-radius:12px;background:transparent;color:#fff;font-weight:800;font-size:.9rem;font-family:inherit;cursor:pointer;">
      🔄 Reset
    </button>
    <button id="clear-btn" style="padding:10px 22px;border:2px solid rgba(255,255,255,0.4);border-radius:12px;background:transparent;color:rgba(255,255,255,0.7);font-weight:800;font-size:.9rem;font-family:inherit;cursor:pointer;">
      🗑️ Start Over
    </button>`;
  document.getElementById('mobile-canvas-wrap').appendChild(eraserBar);

  document.getElementById('eraser-btn').onclick = () => {
    mobileCurrentDot = 0;
    mobileAnimProgress = 0;
    mobileAnimating = false;
    redrawTouch();
    showToast('🔄 Reset — tap the first dot!');
  };

  document.getElementById('clear-btn').onclick = () => {
    mobileCurrentDot = 0;
    mobileAnimProgress = 0;
    mobileAnimating = false;
    redrawTouch();
    showToast('🗑️ Cleared — start again!');
  };

  animateTouchGuide();
}

function redrawTouch() {
  const canvas = document.getElementById('mobile-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGuideOnCanvas(ctx, canvas.width, canvas.height);
  drawCompletedLines(ctx, canvas.width, canvas.height);
}

function animateTouchGuide() {
  if (mobileStep !== 1 || !mobileTouchFallback) return;
  redrawTouch();
  requestAnimationFrame(animateTouchGuide);
}

function finishTrace() {
  if (mobileDrawnPts.length < 5) {
    showToast('Try drawing the shape first! ✏️');
    return;
  }
  mobileStepTimes.trace = (performance.now()-mobileStepStart)/1000;
  const score = scoreTrace();
  mobilePtsEarned += 10;
  document.getElementById('mhud-pts').textContent = `+${mobilePtsEarned}/30 pts`;
  showToast(`✏️ Trace score: ${score}% — Moving to name step!`);
  mobileStep = 2;
  showMobileStep(2);
}

function showMobileStep(step) {
  mobileStepStart = performance.now();
  updateMobileHUD();
  document.getElementById('mobile-palette').style.display   = 'none';
  document.getElementById('mobile-name-step').style.display = 'none';
  document.getElementById('mobile-canvas-wrap').style.display='none';
  const dtBtn = document.getElementById('done-tracing-camera-btn');
  if (dtBtn) dtBtn.style.display = 'none';

  const overlay = document.getElementById('step-overlay');
  overlay.style.display='none';

  if (step===1) {
    document.getElementById('mobile-canvas-wrap').style.display='block';
    if (dtBtn && !mobileTouchFallback) dtBtn.style.display='block';
    overlay.innerHTML = `<div class="step-intro"><div class="step-num">Step 1 of 3</div>
      <div class="step-title">✏️ Trace the ${mobileItem.name}</div>
      <div class="step-tip">${isMobile()&&!mobileTouchFallback?'☝️ Raise index finger to draw<br>👍 Thumbs up to finish':'👆 Draw with your finger then tap Done'}</div>
      <button class="step-dismiss-btn" onclick="document.getElementById('step-overlay').style.display='none'">Let's go! →</button>
    </div>`;
    overlay.style.display='flex';
  } else if (step===2) {
    overlay.style.display='none';
    document.getElementById('mobile-canvas-wrap').style.display='none';
    document.getElementById('mobile-name-step').style.display='flex';
    document.getElementById('name-result').textContent='';
    buildHoverKeyboard();
  } else if (step===3) {
    overlay.style.display='none';
    if (mobileTouchFallback) {
      document.getElementById('mobile-canvas-wrap').style.display='none';
      document.getElementById('mobile-palette').style.display='block';
      buildPalette();
    } else {
      document.getElementById('mobile-canvas-wrap').style.display='block';
      document.getElementById('mobile-palette').style.display='none';
      buildPaletteOverlay();
    }
  }
}

function updateMobileHUD() {
  document.getElementById('mhud-step-label').textContent =
    ['','Step 1: TRACE ✏️','Step 2: NAME 🗣️','Step 3: COLOR 🎨'][mobileStep]||'';
  document.getElementById('mhud-pts').textContent = `+${mobilePtsEarned}/30 pts`;
}

function stopCameraLoop() {
  if (mobileHands) { mobileHands.close(); mobileHands=null; }
}


// ── Step 2: hover keyboard ─────────────────────────────────────────────────
let kbTyped       = '';
let kbHoverKey    = null;
let kbHoverFrames = 0;
const KB_ROWS     = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M','<','OK']
];
const KB_NEEDED   = 18;

function buildHoverKeyboard() {
  kbTyped       = '';
  kbHoverKey    = null;
  kbHoverFrames = 0;

  const ns = document.getElementById('mobile-name-step');
  ns.innerHTML = '';
  ns.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:100%;height:100%;padding:10px 4px;box-sizing:border-box;background:rgba(0,0,0,0.85);';

  // Title
  const title = document.createElement('div');
  title.style.cssText = 'color:#0ef;font-size:1.1rem;font-weight:800;margin-bottom:6px;';
  title.textContent   = '✋ Hover finger to spell the name!';
  ns.appendChild(title);

  // Typed text box
  const box = document.createElement('div');
  box.id = 'kb-typed-box';
  box.style.cssText = 'background:#23273a;border:2px solid #fff;border-radius:10px;padding:8px 14px;font-size:1.3rem;font-weight:800;color:#fff;min-width:220px;text-align:center;margin-bottom:8px;letter-spacing:3px;';
  box.textContent = '_';
  ns.appendChild(box);

  // Result feedback
  const res = document.createElement('div');
  res.id = 'name-result';
  res.style.cssText = 'font-size:.85rem;font-weight:700;min-height:22px;margin-bottom:6px;';
  ns.appendChild(res);

  // Canvas keyboard
  const canvas = document.createElement('canvas');
  canvas.id = 'kb-canvas';
  canvas.style.cssText = 'width:100%;max-width:420px;touch-action:none;border-radius:8px;';
  ns.appendChild(canvas);

  // Fallback touch buttons
  const touchWrap = document.createElement('div');
  touchWrap.id = 'kb-touch-wrap';
  touchWrap.style.cssText = 'display:none;flex-direction:column;align-items:center;gap:4px;width:100%;max-width:420px;margin-top:4px;';
  KB_ROWS.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.style.cssText = 'display:flex;gap:4px;justify-content:center;';
    row.forEach(k => {
      const btn = document.createElement('button');
      btn.dataset.key = k;
      btn.style.cssText = `padding:8px ${k==='OK'?'12px':'6px'};min-width:${k==='OK'?'44px':'32px'};border:1.5px solid #555;border-radius:7px;background:${k==='OK'?'#0a0':'#23273a'};color:#fff;font-size:.85rem;font-weight:700;cursor:pointer;font-family:inherit;`;
      btn.textContent = k === '<' ? '⌫' : k;
      btn.onclick = () => handleKbKey(k);
      rowDiv.appendChild(btn);
    });
    touchWrap.appendChild(rowDiv);
  });
  ns.appendChild(touchWrap);

  // If touch fallback, show buttons instead of canvas
  if (mobileTouchFallback) {
    canvas.style.display = 'none';
    touchWrap.style.display = 'flex';
  } else {
    drawKbCanvas(null, -999, -999);
    // Camera hover loop
    startKbCameraLoop();
  }
}

let kbCameraActive = false;
function startKbCameraLoop() {
  kbCameraActive = true;
  if (!mobileHands) return;
  // reuse existing mediapipe — override onResults temporarily
  mobileHands.onResults(onKbHandResults);
}
function stopKbCameraLoop() {
  kbCameraActive = false;
  if (mobileHands) mobileHands.onResults(onHandResults);
}

function onKbHandResults(results) {
  if (mobileStep !== 2 || !kbCameraActive) return;
  const canvas = document.getElementById('kb-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  || 360;
  canvas.height = rect.height || 220;

  let fx = -999, fy = -999;
  if (results.multiHandLandmarks && results.multiHandLandmarks.length) {
    const lm = results.multiHandLandmarks[0];
    // mirror x like onHandResults
    const video = document.getElementById('mobile-video');
    const vw = video.videoWidth  || 640;
    const vh = video.videoHeight || 480;
    const rawX = (1 - lm[8].x) * vw;
    const rawY = lm[8].y       * vh;
    // map from video coords to canvas coords
    fx = (rawX / vw) * canvas.width;
    fy = (rawY / vh) * canvas.height;
  }
  drawKbCanvas(null, fx, fy);
}

function drawKbCanvas(ctx, fx, fy) {
  const canvas = document.getElementById('kb-canvas');
  if (!canvas) return;
  if (!ctx) ctx = canvas.getContext('2d');
  const cw = canvas.width  || 360;
  const ch = canvas.height || 220;

  const KEY_W  = Math.floor(cw / 11);
  const KEY_H  = Math.floor(ch / 4.5);
  const GAP    = 3;

  ctx.clearRect(0, 0, cw, ch);

  let hitKey = null;
  KB_ROWS.forEach((row, ri) => {
    const rowW   = row.length * (KEY_W + GAP) - GAP;
    const startX = (cw - rowW) / 2;
    row.forEach((k, ci) => {
      const x1 = startX + ci * (KEY_W + GAP);
      const y1 = ri * (KEY_H + GAP) + GAP;
      const x2 = x1 + KEY_W;
      const y2 = y1 + KEY_H;
      const cx = x1 + KEY_W/2;
      const cy = y1 + KEY_H/2;
      const hovered = fx >= x1 && fx <= x2 && fy >= y1 && fy <= y2;
      if (hovered) hitKey = k;

      // Background
      ctx.fillStyle = k==='OK' ? '#0a5' : k==='<' ? '#044' : hovered ? '#444' : '#222';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x1,y1,KEY_W,KEY_H,5) : ctx.rect(x1,y1,KEY_W,KEY_H);
      ctx.fill();
      ctx.strokeStyle = hovered ? '#0ef' : '#555';
      ctx.lineWidth   = hovered ? 2 : 1;
      ctx.stroke();

      // Progress fill
      if (hovered && kbHoverKey===k && kbHoverFrames>0) {
        const prog = Math.min(kbHoverFrames/KB_NEEDED,1);
        ctx.fillStyle = 'rgba(0,230,255,0.35)';
        ctx.fillRect(x1, y2 - KEY_H*prog, KEY_W, KEY_H*prog);
      }

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(KEY_H*0.38)}px Nunito,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(k==='<'?'⌫':k, cx, cy);
    });
  });

  // Finger dot
  if (fx > 0 && fy > 0) {
    ctx.beginPath();
    ctx.arc(fx, fy, 10, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,230,255,0.8)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
  }

  // Update hover state
  if (hitKey && hitKey === kbHoverKey) {
    kbHoverFrames++;
    if (kbHoverFrames >= KB_NEEDED) {
      handleKbKey(hitKey);
      kbHoverFrames = 0;
      kbHoverKey    = null;
    }
  } else {
    kbHoverKey    = hitKey;
    kbHoverFrames = hitKey ? 1 : 0;
  }
}

function handleKbKey(k) {
  const box = document.getElementById('kb-typed-box');
  const res = document.getElementById('name-result');
  if (k === '<') {
    kbTyped = kbTyped.slice(0, -1);
  } else if (k === 'OK') {
    const target = mobileItem.name.toLowerCase();
    const typed  = kbTyped.toLowerCase();
    if (typed === target) {
      res.textContent = '✅ Correct! Great job!';
      res.style.color = '#4caf50';
      mobilePtsEarned += 10; mobileNameCorrect = true;
      stopKbCameraLoop();
      setTimeout(goToColorStep, 1200);
    } else {
      res.textContent = `🤔 You typed "${kbTyped}" — try again!`;
      res.style.color = '#ff9800';
      kbTyped = '';
    }
  } else {
    kbTyped += k;
  }
  if (box) box.textContent = kbTyped + '_' || '_';
}

function listenForName() {
  const SpeechRec = window.SpeechRecognition||window.webkitSpeechRecognition;
  if (!SpeechRec) { skipNameStep(); return; }
  const btn = document.querySelector('#mobile-name-step .voice-name-btn') || document.querySelector('.voice-name-btn');
  btn.textContent='🎤 Listening…'; btn.disabled=true;
  const r = new SpeechRec();
  r.lang='en-US'; r.maxAlternatives=5;
  r.onresult=e=>{
    const heard=Array.from(e.results[0]).map(x=>x.transcript.toLowerCase().trim());
    const target=mobileItem.name.toLowerCase();
    const correct=heard.some(h=>{
      if(h.includes(target)) return true;
      const words=h.split(/\s+/);
      return words.some(w=>w===target);
    });
    const res=document.getElementById('name-result');
    if(correct){
      res.textContent='✅ Correct! Great job!';
      res.style.color='#4caf50';
      mobilePtsEarned+=10; mobileNameCorrect=true;
      setTimeout(goToColorStep,1200);
    } else {
      res.textContent=`🤔 I heard "${heard[0]}" — try saying "${mobileItem.name}"`;
      res.style.color='#ff9800';
      btn.textContent='🎤 Try again!'; btn.disabled=false;
    }
  };
  r.onerror=()=>{ btn.textContent='🎤 Say the name!'; btn.disabled=false; };
  r.onend  =()=>{ btn.disabled=false; };
  r.start();
}
function skipNameStep() {
  mobilePtsEarned += 5;
  mobileNameCorrect = true;
  goToColorStep();
}
function checkTypedName() {
  const nameStep = document.getElementById('mobile-name-step');
  const input = (nameStep && nameStep.querySelector('input[type="text"],input:not([type])'))
                || document.getElementById('typed-name-input')
                || document.getElementById('name-type-input')
                || document.getElementById('name-input');
  const res   = document.getElementById('name-result');
  if (!input || !mobileItem) return;
  const typed  = input.value.toLowerCase().trim();
  const target = mobileItem.name.toLowerCase();
  if (!typed) { showToast('Type the name first! ✏️'); return; }
  const correct = typed === target || typed.includes(target) || target.includes(typed);
  if (correct) {
    res.textContent = '✅ Correct! Great job!';
    res.style.color = '#4caf50';
    mobilePtsEarned += 10; mobileNameCorrect = true;
    setTimeout(goToColorStep, 1200);
  } else {
    res.textContent = `🤔 You typed "${input.value.trim()}" — try "${mobileItem.name}"`;
    res.style.color = '#ff9800';
    input.value = '';
    input.focus();
  }
}
function goToColorStep() {
  mobileStepTimes.name = (performance.now()-mobileStepStart)/1000;
  mobileStep=3;
  showMobileStep(3);
}

function getClosestColorHex(hex) {
  if(!hex)return null;
  const toRGB=h=>({r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)});
  const dist=(a,b)=>Math.sqrt((a.r-b.r)**2+(a.g-b.g)**2+(a.b-b.b)**2);
  const target=toRGB(hex);
  let best=COLORS[0],bestDist=Infinity;
  COLORS.forEach(c=>{const d=dist(target,toRGB(c.hex));if(d<bestDist){bestDist=d;best=c;}});
  return best.hex;
}
function getClosestColorName(hex) {
  if(!hex)return'';
  const toRGB=h=>({r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)});
  const dist=(a,b)=>Math.sqrt((a.r-b.r)**2+(a.g-b.g)**2+(a.b-b.b)**2);
  const target=toRGB(hex);
  let best=COLORS[0],bestDist=Infinity;
  COLORS.forEach(c=>{const d=dist(target,toRGB(c.hex));if(d<bestDist){bestDist=d;best=c;}});
  return best.name;
}

function buildPaletteOverlay() {
  const existing=document.getElementById('done-coloring-overlay-btn');
  if(!existing){
    const done=document.createElement('button');
    done.id='done-coloring-overlay-btn';
    done.className='voice-name-btn';
    done.style.cssText='position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:20;';
    done.textContent='✅ Done Coloring!';
    done.onclick=finishColor;
    document.getElementById('mobile-canvas-wrap').appendChild(done);
  } else { existing.style.display='block'; }
}

function drawColorSwatchesOnCanvas(ctx, cw, ch, tx, ty, lm, canvasW, canvasH) {
  const cols=5, swatch=50, gap=10;
  const totalW=cols*(swatch+gap)-gap;
  const startX=(cw-totalW)/2;
  const rows=Math.ceil(COLORS.length/cols);
  const swatchAreaH=rows*(swatch+gap+18)+10;
  const startY=ch-swatchAreaH-20;

  // Draw shape outline only (no fill until color selected)
  if (mobileItem) {
    const fillColor = mobileSelectedColor || 'transparent';
    const pts=getMobileGuideDots(mobileItem);
    if(pts&&pts.length){
      const pad=30;
      const previewH=startY-pad;
      const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
      const minX=Math.min(...xs),maxX=Math.max(...xs);
      const minY=Math.min(...ys),maxY=Math.max(...ys);
      const rangeX=maxX-minX||1,rangeY=maxY-minY||1;
      const scale=Math.min((cw-pad*2)/rangeX,(previewH-pad)/rangeY);
      const ox=(cw-(rangeX*scale))/2-minX*scale;
      const oy=(previewH-(rangeY*scale))/2-minY*scale+pad/2;
      ctx.beginPath();
      pts.forEach((p,i)=>{const px=p.x*scale+ox,py=p.y*scale+oy;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});
      ctx.closePath();
      ctx.fillStyle=fillColor; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=2.5; ctx.stroke();
    }
  }

  // Detect pinch from landmarks
  let isPinching = false;
  if (lm && canvasW && canvasH) {
    const thumbX = (1 - lm[4].x) * canvasW;
    const thumbY = lm[4].y * canvasH;
    const pinchDist = Math.hypot(tx - thumbX, ty - thumbY);
    isPinching = pinchDist < 40;
  }

  // Instruction label
  ctx.save();
  ctx.fillStyle = isPinching ? 'rgba(0,255,100,0.9)' : 'rgba(255,160,0,0.9)';
  ctx.font = 'bold 15px Nunito,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isPinching ? '🤌 Pinching — hold!' : '🤌 Pinch to pick a color!', cw/2, startY - 8);
  ctx.restore();

  // Suggested color
  const suggestedHex = mobileItem ? getClosestColorHex(mobileItem.color) : null;

  // Draw swatches
  COLORS.forEach((c,i)=>{
    const col=i%cols, row=Math.floor(i/cols);
    const cx=startX+col*(swatch+gap)+swatch/2;
    const cy=startY+row*(swatch+gap+18)+swatch/2;
    const hovered = Math.hypot(tx-cx, ty-cy) < swatch/2+10;

    if (hovered && isPinching) {
      if (colorHoverHex===c.hex) {
        colorHoverFrames++;
      } else {
        colorHoverHex=c.hex;
        colorHoverFrames=1;
      }
      if (colorHoverFrames>=8 && mobileSelectedColor!==c.hex) {
        mobileSelectedColor=c.hex;
        showToast(`🎨 ${c.name} selected!`);
      }
    } else if (!hovered || !isPinching) {
      if (colorHoverHex===c.hex) {
        colorHoverHex=null;
        colorHoverFrames=0;
      }
    }

    const isSuggested = suggestedHex && c.hex.toLowerCase()===suggestedHex.toLowerCase();
    const isSelected  = mobileSelectedColor===c.hex;

    if(isSuggested){
      ctx.beginPath(); ctx.arc(cx,cy,swatch/2+7,0,Math.PI*2);
      ctx.strokeStyle='#ffd93d'; ctx.lineWidth=3;
      ctx.setLineDash([5,3]); ctx.stroke(); ctx.setLineDash([]);
    }

    // Progress arc when pinching on this swatch
    if (hovered && isPinching && colorHoverHex===c.hex && colorHoverFrames>0) {
      const prog = Math.min(colorHoverFrames/8, 1);
      ctx.beginPath();
      ctx.arc(cx, cy, swatch/2+4, -Math.PI/2, -Math.PI/2 + prog*Math.PI*2);
      ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.setLineDash([]); ctx.stroke();
    }

    ctx.beginPath(); ctx.arc(cx,cy,swatch/2,0,Math.PI*2);
    ctx.fillStyle=c.hex; ctx.fill();
    ctx.strokeStyle=isSelected?'#fff':(hovered&&isPinching?'#0f0':'rgba(255,255,255,0.3)');
    ctx.lineWidth=isSelected?3:1.5; ctx.stroke();

    ctx.fillStyle='rgba(0,0,0,0.75)';
    ctx.fillRect(cx-swatch/2, cy+swatch/2+2, swatch, 16);
    ctx.fillStyle=isSuggested?'#ffd93d':'#fff';
    ctx.font=`${isSuggested?'bold ':''} 9px sans-serif`;
    ctx.textAlign='center';
    ctx.fillText(isSuggested?'⭐'+c.name:c.name, cx, cy+swatch/2+13);
  });
}

function drawShapeOnCanvas(ctx,size,fillHex) {
  if(!mobileItem)return;
  const pts=getGuidePoints(mobileItem);
  if(!pts||!pts.length)return;
  const pad=14;
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs);
  const minY=Math.min(...ys),maxY=Math.max(...ys);
  const rangeX=maxX-minX||1,rangeY=maxY-minY||1;
  const scale=Math.min((size-pad*2)/rangeX,(size-pad*2)/rangeY);
  const ox=(size-(rangeX*scale))/2-minX*scale;
  const oy=(size-(rangeY*scale))/2-minY*scale;
  ctx.beginPath();
  pts.forEach((p,i)=>{const px=p.x*scale+ox,py=p.y*scale+oy;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});
  ctx.closePath();ctx.fillStyle=fillHex||'transparent';ctx.fill();
  ctx.strokeStyle='#000';ctx.lineWidth=2.5;ctx.stroke();
}

function drawColorPreview(hex) {
  const canvas=document.getElementById('color-preview-canvas');
  if(!canvas)return;
  const size=180;canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,size,size);
  drawShapeOnCanvas(ctx,size,hex);
}

function drawBlackOutline() {
  const canvas=document.getElementById('color-preview-canvas');
  if(!canvas)return;
  const size=180;canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,size,size);
  drawShapeOnCanvas(ctx,size,'transparent');
}

function buildPalette() {
  if(mobileItem&&mobileItem.color){
    const sw=document.getElementById('suggested-swatch');
    const lb=document.getElementById('suggested-color-name');
    if(sw)sw.style.background=mobileItem.color;
    if(lb)lb.textContent=getClosestColorName(mobileItem.color);
  }
  const wrap = document.getElementById('palette-swatches');
  wrap.innerHTML='';
  COLORS.forEach(c=>{
    const sw=document.createElement('button');
    sw.className='palette-swatch';
    sw.style.background=c.hex;
    sw.title=c.name;
    sw.onclick=()=>selectColor(c.hex, sw);
    wrap.appendChild(sw);
  });

  const done=document.createElement('button');
  done.className='voice-name-btn'; done.style.marginTop='14px';
  done.textContent='✅ Done Coloring!';
  done.onclick=finishColor;
  document.getElementById('mobile-palette').appendChild(done);
  setTimeout(drawBlackOutline, 50);
}
function selectColor(hex, el) {
  mobileSelectedColor=hex;
  document.querySelectorAll('.palette-swatch').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  showToast(`🎨 ${COLORS.find(c=>c.hex===hex)?.name||'Color'} selected!`);
}
function finishColor() {
  if (!mobileSelectedColor) { showToast('Pick a color first! 🎨'); return; }
  mobileStepTimes.color=(performance.now()-mobileStepStart)/1000;
  const suggested = mobileItem && mobileItem.color ? mobileItem.color.toLowerCase() : '';
  const picked = mobileSelectedColor.toLowerCase();
  const suggestedInPalette = COLORS.some(c => c.hex.toLowerCase() === suggested);
  if (picked === suggested || !suggestedInPalette) {
    mobilePtsEarned = Math.min(mobilePtsEarned + 10, 30);
    showToast('🎉 Perfect color match! +10 pts');
  } else {
    showToast('🎨 Color chosen! Match suggested color for full points.');
  }
  updateMobileHUD();
  completeMobileItem();
}

async function completeMobileItem() {
  const id = mobileItem.id;
  if(!STATE.progress[id]) STATE.progress[id]={};
  STATE.progress[id].trace = true;
  STATE.progress[id].name  = true;
  STATE.progress[id].color = true;
  STATE.points[id]         = mobilePtsEarned;
  STATE.times[id]          = {trace:mobileStepTimes.trace,name:mobileStepTimes.name,color:mobileStepTimes.color};

  try {
    await fetch(FLASK_URL+'/api/complete',{
      method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        item:id,
        points:mobilePtsEarned,
        time_trace:mobileStepTimes.trace,
        time_name:mobileStepTimes.name,
        time_color:mobileStepTimes.color
      })
    });
  } catch(e){}

  await persistState();
  closeMobileDraw();
  updateHeaderScore();
  renderLearnPage();
  showToast(`🎉 ${mobileItem.name} complete! +${mobilePtsEarned} pts`);
  triggerConfetti();
}

function closeMobileDraw() {
  if(mobileStream){ mobileStream.getTracks().forEach(t=>t.stop()); mobileStream=null; }
  stopCameraLoop();
  stopKbCameraLoop();
  document.getElementById('mobile-draw-modal').style.display='none';

  document.getElementById('mobile-loading').style.display='flex';
  document.getElementById('loading-bar').style.width='0%';
  document.getElementById('loading-text').textContent='Loading hand detector…';
  document.getElementById('mobile-canvas-wrap').style.display='none';
  document.getElementById('mobile-palette').style.display='none';
  document.getElementById('mobile-name-step').style.display='none';
  mobileDrawnPts=[];
  mobileTouchFallback=false;
  mobileCurrentDot=0;
  mobileGuideDotIndices=[];
  mobileEraserMode=false;
  mobileEraserStrokes=[];
  mobileAnimating=false;
  mobileAnimProgress=0;
  const eb = document.getElementById('mobile-eraser-bar');
  if (eb) eb.remove();
}

function toggleFav(id, btn) {
  const idx=STATE.favs.indexOf(id);
  if(idx===-1){
    STATE.favs.push(id);
    if(btn){btn.textContent='⭐';btn.classList.add('active');}
    showToast('⭐ Added to favourites!');
  } else {
    STATE.favs.splice(idx,1);
    if(btn){btn.textContent='☆';btn.classList.remove('active');}
    showToast('Removed from favourites');
  }
  persistState();

  if(!IS_GUEST){
    fetch(FLASK_URL+'/api/fav',{method:'POST',credentials:'include',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({item_id:id})}).catch(()=>{});
  }
  updateHeaderScore();
}

function renderRewardsPage() { renderPointsTab(); }
function renderPointsTab() {
  const cats=[
    {key:'shape',    el:'rp-shapes',  label:'🔷 Shapes'},
    {key:'fruit',    el:'rp-fruits',  label:'🍎 Fruits'},
    {key:'vegetable',el:'rp-vegs',    label:'🥦 Vegetables'},
  ];
  document.getElementById('rp-total').textContent=getTotalPoints();
  cats.forEach(({key,el})=>{
    const pts=ITEMS.filter(i=>i.category===key).reduce((a,i)=>a+getItemPoints(i.id),0);
    const elRef=document.getElementById(el); if(elRef) elRef.textContent=pts;
  });
  const bd=document.getElementById('points-breakdown');
  bd.innerHTML='';
  cats.forEach(({key,label})=>{
    const h=document.createElement('div'); h.className='pts-cat-header'; h.textContent=label; bd.appendChild(h);
    ITEMS.filter(i=>i.category===key).forEach(item=>{
      const p=STATE.progress[item.id]||{};
      const row=document.createElement('div'); row.className='pts-row';
      row.innerHTML=`<span class="pts-icon">${item.icon}</span><span class="pts-name">${item.name}</span>
        <span class="pts-step ${p.trace?'earned':''}">T: ${p.trace?10:0}</span>
        <span class="pts-step ${p.name?'earned':''}">N: ${p.name?10:0}</span>
        <span class="pts-step ${p.color?'earned':''}">C: ${p.color?10:0}</span>
        <span class="pts-total-col">= ${getItemPoints(item.id)}/30</span>`;
      bd.appendChild(row);
    });
  });
}
function renderLevelsTab() {
  const wrap=document.getElementById('levels-wrap'); wrap.innerHTML='';
  const cats=[
    {key:'shape','label':'🔷 Shapes'},{key:'fruit',label:'🍎 Fruits'},
    {key:'vegetable',label:'🥦 Vegetables'},
  ];
  cats.forEach(({key,label})=>{
    ['easy','medium','hard'].forEach(lvl=>{
      const items=ITEMS.filter(i=>i.category===key&&i.level===lvl);
      const done=items.filter(i=>isComplete(i.id)).length;
      const pct=items.length?Math.round(done/items.length*100):0;
      const card=document.createElement('div'); card.className='level-card';
      card.innerHTML=`<div class="level-card-header"><span class="level-card-title">${label}</span>
        <span class="card-level level-${lvl}">${getLevelLabel(lvl)}</span></div>
        <div class="level-card-stats">${done}/${items.length} completed</div>
        <div class="level-bar-wrap"><div class="level-bar-fill level-fill-${lvl}" style="width:${pct}%"></div></div>
        <div class="level-pct">${pct}%</div>`;
      wrap.appendChild(card);
    });
  });
}
function renderBadgesTab() {
  const cats=[
    {key:'shape',elId:'badges-shapes'},{key:'fruit',elId:'badges-fruits'},
    {key:'vegetable',elId:'badges-vegetables'},
  ];
  cats.forEach(({key,elId})=>{
    const el=document.getElementById(elId); el.innerHTML='';
    ['easy','medium','hard'].forEach(lvl=>{
      const items=ITEMS.filter(i=>i.category===key&&i.level===lvl);
      const done=items.filter(i=>isComplete(i.id)).length;
      for(let n=1;n<=items.length;n++){
        const earned=done>=n;
        const b=document.createElement('div'); b.className='badge-item'+(earned?' earned':'');
        b.innerHTML=`<div class="badge-icon">${earned?'🏅':'🔒'}</div>
          <div class="badge-name">${lvl}${n}</div>
          <div class="badge-desc">${earned?`${n} ${lvl} done!`:`Complete ${n} ${lvl}`}</div>`;
        el.appendChild(b);
      }
    });
  });
}

function renderReportsPage() { renderOverview(); }
function renderOverview() {
  const cats=[
    {key:'shape',     elId:'overview-table-shapes'},
    {key:'fruit',     elId:'overview-table-fruits'},
    {key:'vegetable', elId:'overview-table-vegetables'},
  ];
  cats.forEach(({key,elId})=>{
    const el=document.getElementById(elId);
    el.innerHTML=`<div class="ov-row ov-head">
      <span></span><span>Item</span><span>Level</span>
      <span>Progress</span><span>Points</span><span>Time Taken</span><span>Status</span><span>Fav</span>
    </div>`;
    ITEMS.filter(i=>i.category===key).forEach(item=>{
      const pct   = getProgress(item.id);
      const pts   = getItemPoints(item.id);
      const done  = isComplete(item.id);
      const isFav = STATE.favs.includes(item.id);
      const tt    = totalTime(item.id);
      const row   = document.createElement('div'); row.className='ov-row';
      row.innerHTML=`
        <span>${item.icon}</span>
        <span class="ov-name">${item.name}</span>
        <span><span class="card-level level-${item.level}">${getLevelLabel(item.level)}</span></span>
        <span>
          <div class="ov-bar-wrap"><div class="ov-bar-fill" style="width:${pct}%;background:${item.color}"></div></div>
          <small>${pct}%</small>
        </span>
        <span class="ov-pts">${pts}/30</span>
        <span class="ov-time">${tt>0?tt.toFixed(1)+'s':'—'}</span>
        <span><span class="admin-done-badge ${done?'done':'notdone'}">${done?'✅ Done':'Pending'}</span></span>
        <span>
          <button class="fav-star ${isFav?'active':''}"
            onclick="toggleFav('${item.id}',this);renderOverview()"
            title="${isFav?'Remove':'Add'} favourite">${isFav?'⭐':'☆'}</button>
        </span>`;
      el.appendChild(row);
    });
  });
}

function renderSavedPage() { renderFavourites(); }
function renderFavourites() {
  const cats=[
    {key:'shape',elId:'fav-list-shapes'},{key:'fruit',elId:'fav-list-fruits'},
    {key:'vegetable',elId:'fav-list-vegetables'},
  ];
  cats.forEach(({key,elId})=>{
    const el=document.getElementById(elId);
    const favs=ITEMS.filter(i=>i.category===key&&STATE.favs.includes(i.id));
    if(!favs.length){ el.innerHTML='<p class="empty-diff">No favourites here yet!</p>'; return; }
    el.innerHTML='';
    favs.forEach(item=>{
      const chip=document.createElement('div'); chip.className='fav-chip';
      chip.innerHTML=`<span>${item.icon}</span><span>${item.name}</span>
        <span class="card-level level-${item.level}">${getLevelLabel(item.level)}</span>
        <button class="fav-remove" onclick="toggleFav('${item.id}',null);renderFavourites()">✕</button>`;
      el.appendChild(chip);
    });
  });
}
function renderSavedFeedback() {
  const el=document.getElementById('saved-feedback-list');
  const em=document.getElementById('saved-feedback-empty');
  if(!STATE.feedback.length){ el.innerHTML=''; em.style.display='block'; return; }
  em.style.display='none';
  el.innerHTML=[...STATE.feedback].reverse().map(fb=>`
    <div class="feedback-entry">
      <div class="fb-entry-name">${fb.name}
        <span class="fb-entry-rating">${'★'.repeat(fb.rating||0)}${'☆'.repeat(5-(fb.rating||0))}</span>
        <span class="fb-entry-date">${fb.date}</span>
      </div>
      ${fb.email?`<div class="fb-entry-email">${fb.email}</div>`:''}
      <div class="fb-entry-msg">${fb.msg||'(no message)'}</div>
      ${fb.checks?.length?`<div class="fb-entry-checks">Enjoyed: ${fb.checks.join(', ')}</div>`:''}
    </div>`).join('');
}

function setRating(val) {
  STATE.rating=val;
  document.querySelectorAll('.emoji-btn').forEach(b=>b.classList.toggle('selected',parseInt(b.dataset.val)===val));
}
async function submitFeedback(e) {
  e.preventDefault();
  const name=document.getElementById('fb-name').value.trim();
  const email=document.getElementById('fb-email').value.trim();
  const msg=document.getElementById('fb-msg').value.trim();
  const rating=STATE.rating;
  const checks=[...document.querySelectorAll('.checkbox-group input:checked')].map(c=>c.value);
  if(!rating){ showToast('Please select a rating emoji! 😊'); return; }
  const entry={name,email,msg,rating,checks,
    date:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})};
  STATE.feedback.push(entry);

  if(!IS_GUEST){
    try{
      await fetch(FLASK_URL+'/api/feedback',{method:'POST',credentials:'include',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)});
    }catch(e){}
  }
  await persistState();
  document.getElementById('feedback-form').style.display='none';
  document.getElementById('feedback-thanks').style.display='block';
}
function resetFeedback() {
  STATE.rating=0;
  document.getElementById('feedback-form').style.display='block';
  document.getElementById('feedback-thanks').style.display='none';
  document.getElementById('feedback-form').reset();
  document.querySelectorAll('.emoji-btn').forEach(b=>b.classList.remove('selected'));
}

function exportData() {
  const blob=new Blob([JSON.stringify(STATE,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='tracely_data.json'; a.click();
  showToast('📦 Data exported!');
}
function printProgress() { window.print(); }

function updateHeaderScore() {
  const pts = getTotalPoints();
  document.getElementById('total-score').textContent = pts;
  const mob = document.getElementById('total-score-mobile');
  if (mob) mob.textContent = pts;
}
function triggerConfetti() {
  const canvas=document.getElementById('confetti-canvas');
  if(!canvas) return;
  canvas.style.display='block';
  const ctx=canvas.getContext('2d');
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const pieces=Array.from({length:120},()=>({
    x:Math.random()*canvas.width, y:Math.random()*canvas.height-canvas.height,
    r:Math.random()*8+4, d:Math.random()*120,
    color:`hsl(${Math.random()*360},90%,60%)`,
    tilt:Math.random()*10-10,
    tiltAngleIncrement:Math.random()*0.07+0.05, tiltAngle:0,
  }));
  let angle=0,frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    angle+=0.01; frame++;
    pieces.forEach(p=>{
      p.tiltAngle+=p.tiltAngleIncrement; p.y+=(Math.cos(angle+p.d)+3+p.r/2)/2;
      p.x+=Math.sin(angle); p.tilt=Math.sin(p.tiltAngle)*15;
      ctx.beginPath(); ctx.lineWidth=p.r/2; ctx.strokeStyle=p.color;
      ctx.moveTo(p.x+p.tilt+p.r/4,p.y); ctx.lineTo(p.x+p.tilt,p.y+p.tilt+p.r/4); ctx.stroke();
      if(p.y>canvas.height){p.y=-20;p.x=Math.random()*canvas.width;}
    });
    if(frame<300) requestAnimationFrame(draw);
    else{ ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display='none'; }
  }
  draw();
}
function showToast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),2800);
}
function checkServerStatus() {
  const statusUrl = FLASK_URL+'/status';
  fetch(statusUrl,{credentials:'include'})
    .then(r=>r.json())
    .then(()=>{
      document.getElementById('server-status').className='server-status online';
      document.getElementById('server-lbl').textContent='Server Online';
    })
    .catch(()=>{
      document.getElementById('server-status').className='server-status offline';
      document.getElementById('server-lbl').textContent='Server Offline';
    });
}

async function doLogout(e) {
  e.preventDefault();
  await fetch(FLASK_URL+'/api/logout',{method:'POST',credentials:'include'});
  window.location.href = FLASK_URL+'/';
}

document.addEventListener('keydown', e=>{
  if(e.key==='Escape')     { closeItemModal(); closeMobileDraw(); }
  if(e.key==='ArrowRight'&&currentItemId) nextItem();
  if(e.key==='ArrowLeft' &&currentItemId) prevItem();
});

(async function init(){

  const savedTheme = localStorage.getItem('db_theme')||'dark';
  applyTheme(savedTheme);

  if (localStorage.getItem('db_sidebar_collapsed') === '1') {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    sidebar.classList.add('collapsed');
    if (toggleBtn) { toggleBtn.textContent = '›'; toggleBtn.title = 'Expand sidebar'; }
  }

  await initState();
  showPage('learn');
  updateHeaderScore();
  checkServerStatus();
  setInterval(checkServerStatus, 15000);
})();