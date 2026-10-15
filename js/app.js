(function(){
document.documentElement.setAttribute('data-theme','light'); // 늘 밝은 화면으로 (HAE)
const EX=window.EXAM;
const Q=window.QDATA, S=window.SDATA;
const IMG=window.IMGDATA||{};
Q.forEach(q=>{if(q.img&&IMG[q.img])q.img=IMG[q.img];if(q.eimg&&IMG[q.eimg])q.eimg=IMG[q.eimg];});
if(EX.autoNeg){const NR=/(옳지\s*않은|틀린|거리가\s*먼|아닌\s*것|적절하지\s*않은|해당하지\s*않는|해당되지\s*않는|잘못된|잘못\s*연결|않은\s*것|없는\s*것은|부적당한|부적합한|관계가\s*없는)[^.?]*\??\s*$/;Q.forEach(q=>{if(!q.fx&&q.neg==null&&NR.test(q.q.split(/[.。]\s/).pop()))q.neg=1;});}
document.title=EX.brand;
const QM={}; Q.forEach(q=>QM[q.id]=q);
const SUBJ=EX.subj; const SN=SUBJ.map((_,i)=>i).slice(1); const NS=SN.length; const PER=EX.per||20; const LIMIT=(EX.min||60)*60; const NQ=PER*NS;
const SETS=[...new Set(Q.map(q=>q.set))];
const MK='①②③④';
const KEY=EX.store;
let store={ans:{},hist:[],cur:null,pref:{instant:true}};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s) store=Object.assign(store,s);}catch(e){}
function save(){store._t=Date.now();try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){} cloudPush();}
/* 자동 저장 (계정): claude.ai 아티팩트로 열면 기록을 내 계정에 저장해서 다시 열거나 업데이트돼도, 폰·PC 어디서나 이어짐 */
const LOADED_T=store._t||0;
const CLOUD={db:null,base:null,timer:null,busy:false,again:false,last:[],state:'off'};
function cloudChip(){const c=document.getElementById('saveChip');if(c){c.textContent=CLOUD.state==='saving'?'저장 중…':CLOUD.state==='ok'?'✓ 자동 저장됨':CLOUD.state==='err'?'저장 안 됨 · 다시 시도 중':'';c.className='savechip '+CLOUD.state;}}
function cloudPush(){if(!CLOUD.db)return;clearTimeout(CLOUD.timer);CLOUD.state='saving';cloudChip();CLOUD.timer=setTimeout(cloudWrite,1200);}
async function cloudWrite(){if(CLOUD.busy){CLOUD.again=true;return;}CLOUD.busy=true;
  try{const js=JSON.stringify(store),N=60000,parts=[];for(let i=0;i<js.length;i+=N)parts.push(js.slice(i,i+N));if(!parts.length)parts.push('{}');
    for(let i=0;i<parts.length;i++){if(CLOUD.last[i]!==parts[i]){await CLOUD.db.doc(`${CLOUD.base}_c${i}`).set({s:parts[i]});CLOUD.last[i]=parts[i];}}
    CLOUD.last.length=parts.length;
    await CLOUD.db.doc(`${CLOUD.base}_meta`).set({n:parts.length,t:store._t||Date.now()});CLOUD.state='ok';}
  catch(e){CLOUD.state='err';clearTimeout(CLOUD.timer);CLOUD.timer=setTimeout(cloudWrite,8000);}
  CLOUD.busy=false;cloudChip();if(CLOUD.again){CLOUD.again=false;cloudWrite();}}
async function cloudInit(){
  try{if(!(window.claude&&window.claude.use))return;
    const db=await window.claude.use('db'),user=await window.claude.use('user');if(!db||!user)return;
    const id=await user.id();if(!id)return;
    const base=`data/users/${id}/${KEY}`;
    const m=await db.doc(`${base}_meta`).get();const meta=m.exists?m.data():null;
    CLOUD.db=db;CLOUD.base=base;
    if(meta&&meta.n&&(meta.t||0)>LOADED_T){
      const parts=[];for(let i=0;i<meta.n;i++){const d=await db.doc(`${base}_c${i}`).get();parts.push(d.exists?(d.data().s||''):'');}
      const cs=JSON.parse(parts.join(''));CLOUD.last=parts;
      {Object.keys(store).forEach(k=>delete store[k]);Object.assign(store,{ans:{},hist:[],cur:null,pref:{instant:true}},cs);
        try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}
        if(tab!=='quiz'){if(store.cur)pauseCur();render();}}
      CLOUD.state='ok';cloudChip();
    } else {cloudWrite();}
  }catch(e){CLOUD.state='err';cloudChip();}}
const $=s=>document.querySelector(s);
const app=$('#app'), nav=$('#nav'), modal=$('#modal');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let tab='home', view=null, tick=null;

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function record(id,pick){
  const q=QM[id]; const ok=pick===q.a;
  const r=store.ans[id]||{w:0,r:0};
  if(ok){r.r++; if(r.w>0) r.fix=(r.fix||0)+1;} else {r.w++; r.fix=0;}
  r.last=ok?'r':'w'; r.pick=pick; r.t=Date.now();
  store.ans[id]=r; logAnswer(id,ok);
}
function isOpenWrong(id){const r=store.ans[id];return r&&r.w>0&&r.last==='w';}
function wrongIds(){return Object.keys(store.ans).filter(id=>QM[id]&&store.ans[id].w>0);}
function openWrong(){return wrongIds().filter(isOpenWrong);}
function score(ids,picks){
  const sc={}; SN.forEach(s=>sc[s]=[0,0]);
  ids.forEach(id=>{const q=QM[id];sc[q.s][1]++; if(picks[id]===q.a) sc[q.s][0]++;});
  const sub=SN.map(s=>sc[s][1]?Math.round(sc[s][0]/sc[s][1]*100):null);
  const valid=sub.filter(x=>x!==null);
  const tot=valid.reduce((a,b)=>a+b,0);
  const avg=valid.length?Math.round(tot/valid.length*100)/100:0;
  const pass=valid.length===NS && avg>=60 && valid.every(x=>x>=40);
  return {sub,tot,avg,pass,raw:sc};
}
function fmt(sec){sec=Math.max(0,Math.floor(sec));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function tipHTML(q){
  if(!q.tip) return '';
  const sec=S[q.tip[0]]; const it=sec.items[q.tip[1]];
  return `<div class="tip"><span class="lbl">핵심요약 · ${esc(sec.t)}</span><mark>${esc(it.t)}</mark></div>`;
}
function markFix(q,o){
  if(!q.fx) return esc(o);
  const hits=[]; q.fx.forEach(([w,c])=>{const i=o.indexOf(w); if(i>=0 && !hits.some(h=>i<h[1]&&i+w.length>h[0])) hits.push([i,i+w.length,c]);});
  hits.sort((a,b)=>a[0]-b[0]); let out='',p=0;
  hits.forEach(([s,e,c])=>{out+=esc(o.slice(p,s))+`<span class="wr">${esc(o.slice(s,e))}</span><span class="cr">${esc(c)}</span>`;p=e;});
  return out+esc(o.slice(p));
}
function fixBlock(q){
  if(!q.fx) return '';
  return `<div class="fixbox"><span class="lbl">✍ 어디가 틀렸고 어떻게 고치나 · ${MK[q.a-1]}번</span>${markFix(q,q.o[q.a-1])}</div>`;
}
/* 그림: img(한 장, 데이터에 포함) 또는 f(회차별 그림 파일을 필요할 때 불러옴) */
const FIGW={}; window.FIGS=window.FIGS||{};
function loadFig(set){
  if(!EX.figDir||FIGW[set]) return; FIGW[set]=1;
  const sc=document.createElement('script'); sc.src=EX.figDir+set.slice(0,10).replace(/\./g,'-')+'.js';
  sc.onload=()=>{document.querySelectorAll('[data-fig]').forEach(el=>{const im=window.FIGS[el.dataset.fig]; if(im) el.outerHTML=im.map(s=>`<img class="${el.dataset.cls}" src="${s}" alt="문제 그림">`).join('');});};
  document.head.appendChild(sc);
}
function tblHTML(q){const T=q.tbl; if(!T) return ''; return `<div class="qtbl">${T.cap?`<span>${esc(T.cap)}</span>`:''}<div class="scroll-x"><table><tr>${T.h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr>${T.r.map(r=>`<tr>${r.map((c,j)=>j===0&&T.h[0]===''?`<th>${esc(c)}</th>`:`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div></div>`;}
function imgsHTML(q,cls){
  cls=cls==null?'qimg':cls; if(q.tbl&&cls!=='__no') return tblHTML(q)+imgsHTML(Object.assign({},q,{tbl:null}),cls);
  if(q.img) return `<img class="${cls}" loading="lazy" src="${q.img}" alt="문제 그림">`;
  if(q.f){const im=window.FIGS[q.fid||q.id]; if(im) return im.map(s=>`<img class="${cls}" loading="lazy" src="${s}" alt="문제 그림">`).join(''); loadFig(q.set); return `<div class="figwait" data-fig="${q.fid||q.id}" data-cls="${cls}">그림 불러오는 중…</div>`;}
  return '';
}
function subjChip(s){return `<span class="chip s${s}">${s}과목 ${SUBJ[s]}</span>`;}

/* ---------- sessions ---------- */
function startSession(opt){
  store.cur={road:opt.road||null,title:opt.title,ids:opt.ids,picks:{},done:{},flags:{},instant:opt.instant,cbt:!!opt.cbt,fs:1,page:0,limit:opt.limit||null,start:Date.now(),used:0,idx:0,kind:opt.kind||'exam',set:opt.set||null};
  save(); tab='quiz'; render();
}
function elapsed(c){return c.used+(c.paused?0:(Date.now()-c.start)/1000);}
function remaining(c){return c.limit? c.limit-elapsed(c):null;}
function pauseCur(){const c=store.cur;if(c&&!c.paused){c.used=elapsed(c);c.paused=true;save();}}
function resumeCur(){const c=store.cur;if(c&&c.paused){c.paused=false;c.start=Date.now();save();}}
/* 이어 풀기: 시간이 이미 끝난 시험이면 바로 채점하지 않고 고르게 함 */
function goResume(){
  const c=store.cur; if(!c) return;
  if(c.limit&&remaining(c)<=0){
    const bg=document.createElement('div'); bg.className='sheetbg center';
    bg.innerHTML=`<div class="sheet confirm"><b>${esc(SL(c.title))} 제한 시간이 이미 끝났어요</b><span class="hint">${Object.keys(c.picks).length}/${c.ids.length}문항 답함</span><div class="row"><button class="btn" id="rsMore">시간 다시 ${EX.min}분으로 이어 풀기</button><button class="btn ghost" id="rsEnd">지금까지 푼 것 채점</button></div></div>`;
    document.body.appendChild(bg);
    bg.querySelector('#rsMore').onclick=()=>{bg.remove();c.used=0;c.paused=false;c.start=Date.now();save();tab='quiz';render();window.scrollTo(0,0);};
    bg.querySelector('#rsEnd').onclick=()=>{bg.remove();resumeCur();finish();};
    bg.onclick=e=>{if(e.target===bg)bg.remove();};
    return;
  }
  resumeCur();tab='quiz';render();window.scrollTo(0,0);
}

function finish(){
  const c=store.cur; if(!c) return; tickQ(c,null);
  if(!c.instant){c.ids.forEach(id=>{if(c.picks[id]) record(id,c.picks[id]);});}
  const part=c.kind!=='exam'; const sIds=part?c.ids.filter(id=>c.picks[id]):c.ids; const sc=score(sIds.length?sIds:c.ids,c.picks);
  const res={title:c.title,kind:c.kind,date:Date.now(),ids:c.ids,picks:c.picks,sub:sc.sub,avg:sc.avg,tot:sc.tot,pass:sc.pass,dur:Math.round(elapsed(c)),n:part&&sIds.length?sIds.length:c.ids.length,part:part,correct:c.ids.filter(id=>c.picks[id]===QM[id].a).length,qt:c.qt||{}};
  if(c.road&&res.correct/res.n>=0.7){store.road=store.road||{};store.road[c.road]=true;}
  if(Object.keys(c.picks).length){ store.hist.unshift(res); store.hist=store.hist.slice(0,40); }
  store.cur=null; save(); clearInterval(tick);
  showResult(res);
}

/* ---------- render ---------- */
function setNav(){
  nav.hidden = (tab==='quiz')||(tab==='cram'&&cramView()==='paper');
  nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.tab===tab);});
  const nb=nav.querySelector('[data-tab="notes"]'); const n=openWrong().length;
  let bd=nb.querySelector('.badge'); if(n){if(!bd){bd=document.createElement('span');bd.className='badge';nb.appendChild(bd);} bd.textContent=n;} else if(bd) bd.remove();
}
nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;view=null;render();window.scrollTo(0,0);});

function render(){
  clearInterval(tick);
  if(tab!=='quiz'||!store.cur) modal.innerHTML='';
  setNav();
  document.body.classList.toggle('cbton',tab==='quiz'&&!!(store.cur&&store.cur.cbt));
  document.body.classList.toggle('ppon',(tab==='quiz'&&!!(store.cur&&store.cur.cbt)&&cbtStyle()==='paper')||(tab==='cram'&&cramView()==='paper'));
  if(tab==='quiz' && store.cur) return store.cur.cbt?(cbtStyle()==='paper'?renderPaper():renderCBT()):(qView()==='scroll'?renderQuizScroll():renderQuiz());
  if(tab==='quiz') tab='home';
  if(view&&view.type==='result') return renderResult(view.res);
  if(tab==='home'&&view){const V={saved:renderSaved,search:renderSearch,today:renderToday,flash:renderFlash,custom:renderCustom}[view.type]; if(V) return V();}
  if(tab==='home') return renderHome();
  if(tab==='notes') return renderNotes();
  if(tab==='sum') return renderSum();
  if(tab==='rec') return renderRec();
  if(tab==='cram') return renderCram();
}

function topbar(extra){return `<div class="top"><div class="brand">${esc(EX.brand)}<small>${esc(EX.brandSub)}</small></div><div class="sp"></div><span class="savechip ${CLOUD.state}" id="saveChip">${CLOUD.state==='ok'?'✓ 자동 저장됨':CLOUD.state==='saving'?'저장 중…':CLOUD.state==='err'?'저장 안 됨 · 다시 시도 중':''}</span>${ddayChip()}${window.PASSMATE?`<button class="iconbtn" id="pmSwitch" onclick="window.PASSMATE.pick()">시험 바꾸기</button>`:''}${extra||''}</div>`;}

function subjStats(){
  const st={}; SN.forEach(s=>st[s]=[0,0]);
  Object.entries(store.ans).forEach(([id,r])=>{const q=QM[id];if(!q)return;st[q.s][1]++;if(r.last==='r')st[q.s][0]++;});
  return st;
}

const MAINSETS=SETS.filter(s=>EX.isMain(s,Q));
const OLDSETS=SETS.filter(s=>!EX.isMain(s,Q)).sort();
const SL=s=>EX.setLabel?EX.setLabel(s):s;
let oldOpen=false;
function setBtn(s){
  const setDone={}; store.hist.forEach(h=>{if((h.kind==='exam'||h.kind==='practice')&&!setDone[h.title]) setDone[h.title]=h;});
  const rnd=s==='랜덤 모의고사'; const n=rnd?60:Q.filter(q=>q.set===s).length; const d=setDone[rnd?'':s];
  const label=rnd?`🎲 랜덤 ${NQ}문항`:SL(s);
  const sub=d?`최근 ${d.avg}점${d.kind==='practice'?'(연습)':''} · ${d.pass?'합격':'불합격'}`:(rnd?`전체에서 과목별 ${PER}문항`:`${n}문항`);
  return `<button class="setbtn ${d?'done':''}" data-set="${esc(s)}"><b>${esc(label)}</b><span>${sub}</span></button>`;
}
/* ---------- 랜덤 실전 모의고사 ---------- */
const RSRC=EX.rand;
function qKey(q){return (q.q.replace(/[\s\W_]+/g,'').slice(0,36))+'|'+(q.o[q.a-1]||'').replace(/[\s\W_]+/g,'').slice(0,16);}
function rsrc(){const k=store.pref.rsrc;return RSRC[k]?k:Object.keys(RSRC)[0];}
function randList(){if(!store.rand)store.rand=[];return store.rand;}
function makeRandom(src){
  const pool=Q.filter(q=>!q.ob&&(RSRC[src]||RSRC[Object.keys(RSRC)[0]]).f(q));
  const ids=[];
  SN.forEach(s=>{const P=pool.filter(q=>q.s===s);
    const un=shuffle(P.filter(q=>!store.ans[q.id])), wr=shuffle(P.filter(q=>store.ans[q.id]&&store.ans[q.id].last==='w')), rest=shuffle(P.filter(q=>store.ans[q.id]&&store.ans[q.id].last!=='w'));
    const seen=new Set(); let k=0;
    for(const q of un.concat(wr,rest)){const key=qKey(q); if(seen.has(key)) continue; seen.add(key); ids.push(q.id); if(++k===PER) break;}
  });
  const L=randList(); const no=(L.reduce((m,r)=>Math.max(m,r.no),0))+1;
  const r={no,t:`랜덤 실전 ${no}회`,src,ids,d:Date.now()}; L.unshift(r); store.rand=L.slice(0,30); save(); return r;
}
function randBlock(){
  const L=randList(); const src=rsrc();
  const setDone={}; store.hist.forEach(h=>{if(!setDone[h.title]) setDone[h.title]=h;});
  return `<div class="panel confirm randp"><b>🎲 랜덤 실전 모의고사</b><span class="hint">기출에서 과목별 ${PER}문항씩 ${NQ}문항을 뽑아 새 시험지를 만들어요. 안 푼 문제 → 틀린 문제 순으로 먼저 뽑고, 똑같은 문제는 한 번만 넣어요.</span>
  <div class="seg" id="rSrc">${Object.entries(RSRC).map(([k,v])=>`<button data-v="${k}" class="${src===k?'on':''}">${v.t}</button>`).join('')}</div>
  <span class="hint" style="margin-top:-4px">${RSRC[src].d} ${EX.hasOb?' · 옛 버전 내용 제외':''}</span>
  <div class="row"><button class="btn" id="rNew">새 시험지 풀기</button></div>
  ${L.length?`<div class="rlist">${L.slice(0,8).map(r=>{const d=setDone[r.t];return `<div class="ritem"><div><b>${esc(r.t)}</b><span>${RSRC[r.src].t} · ${new Date(r.d).getMonth()+1}/${new Date(r.d).getDate()}${d?` · 최근 ${d.avg}점 ${d.pass?'합격':'불합격'}`:''}</span></div><button class="iconbtn" data-rgo="${r.no}">풀기</button></div>`;}).join('')}</div>`:''}</div>`;
}
function bindRand(){
  app.querySelectorAll('#rSrc button').forEach(b=>b.onclick=()=>{store.pref.rsrc=b.dataset.v;save();renderHome();});
  const go=r=>{ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go(r);}); startExam({title:r.t,ids:r.ids}); };
  const cram=r=>{cramSet=r.no;cramSrc='R';cramSubj=0;cramMine=false;cramOrder=null;cramShown=20;tab='cram';view=null;render();window.scrollTo(0,0);};
  const nb=$('#rNew'); if(nb) nb.onclick=()=>{ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;nb.click();}); go(makeRandom(rsrc())); };
  const nc=$('#rNewCram'); if(nc) nc.onclick=()=>cram(makeRandom(rsrc()));
  app.querySelectorAll('[data-rgo]').forEach(b=>b.onclick=()=>go(randList().find(r=>r.no===+b.dataset.rgo)));
  app.querySelectorAll('[data-rcram]').forEach(b=>b.onclick=()=>cram(randList().find(r=>r.no===+b.dataset.rcram)));
}
/* 시험 시작: 한 문제씩 / CBT 시험지 중 고르기 */
function startExam(o,pr){
  const K=pr?'practicePick':'examPick'; const isC=store.pref[K]?store.pref[K]==='cbt':!pr; let sub=pr?'instant':(store.pref.lastMode||(curMode()==='cbt'?'instant':curMode()));
  const tm=pr?'시간 제한 없음 · 스톱워치':`${EX.min}분 타이머`;
  const bg=document.createElement('div'); bg.className='sheetbg center';
  bg.innerHTML=`<div class="sheet confirm"><b>${esc(SL(o.title))} · ${pr?'연습모드':'시험모드'} · 어떻게 풀까요?</b><span class="hint">${o.ids.length}문항 · ${pr?'푼 문제만 채점해서 점수 저장':'제한 시간 '+EX.min+'분'}</span>
  <div class="pick2"><button class="${isC?'on':''}" data-t="cbt"><b>CBT 시험지로 풀기</b><span>2단 시험지 + 답안지 · ${tm} · 채점하기로 끝내기</span></button><button class="${!isC?'on':''}" data-t="one"><b>한 문제씩 풀기</b><span>${sub==='exam'?'끝나고 채점':'바로 채점'} · ${tm}</span></button></div>
  ${pr?'':`<div class="vseg" id="pkMode"><span>한 문제씩 채점</span><button data-v="instant" class="${sub==='instant'?'on':''}">바로 채점</button><button data-v="exam" class="${sub==='exam'?'on':''}">끝나고 채점</button></div>`}
  <button class="btn ghost" id="pkX">취소</button></div>`;
  document.body.appendChild(bg);
  bg.querySelectorAll('#pkMode button').forEach(x=>x.onclick=e=>{e.stopPropagation();sub=x.dataset.v;store.pref.lastMode=sub;save();bg.querySelectorAll('#pkMode button').forEach(y=>y.classList.toggle('on',y===x));const sp=bg.querySelector('[data-t="one"] span');if(sp)sp.textContent=(sub==='exam'?'끝나고 채점':'바로 채점')+' · '+tm;});
  bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#pkX').onclick=()=>bg.remove();
  bg.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{bg.remove();
    store.pref[K]=b.dataset.t; const cbt=b.dataset.t==='cbt';
    if(pr){save(); return startSession(Object.assign({instant:!cbt,cbt,kind:'practice'},o));}
    if(cbt){if(curMode()!=='cbt')store.pref.lastMode=curMode();store.pref.mode='cbt';}else{store.pref.mode=sub;store.pref.instant=sub==='instant';}
    save(); startSession(Object.assign({instant:curMode()==='instant',cbt:curMode()==='cbt',limit:LIMIT,kind:'exam'},o));});
}
function curMode(){return store.pref.mode||(store.pref.instant?'instant':'exam');}
function renderHome(){
  const c=store.cur; // null here since tab home with cur => still allow resume
  const st=subjStats();
  const setDone={}; store.hist.forEach(h=>{if((h.kind==='exam'||h.kind==='practice')&&!setDone[h.title]) setDone[h.title]=h;});
  const ow=openWrong().length;
  let h=topbar();
  if(store.cur){
    const cc=store.cur, ans=Object.keys(cc.picks).length;
    h+=`<div class="sec"><div class="panel resume confirm"><b>풀던 시험이 있어요 · ${esc(SL(cc.title))}</b><span class="hint">${ans}/${cc.ids.length}문항 답함${cc.limit?(remaining(cc)>0?` · 남은 시간 ${fmt(remaining(cc))}`:' · 제한 시간 끝남'):''}</span><div class="row"><button class="btn" id="goResume">이어서 풀기</button><button class="btn ghost" id="dropCur">그만두고 채점</button></div></div></div>`;
  }
  h+=`<div class="sec">${menuGrid()}</div>`;
  h+=progressBlock();
  h+=`<div class="sec"><div class="hero"><h1>이번엔 붙는다${dday()!==null&&dday()>=0?` <small class="hdd">시험까지 ${dday()?'D-'+dday():'D-DAY'}</small>`:''}</h1>
  <p>합격 기준: ${NS===3?'세':NS===5?'다섯':NS} 과목 모두 40점 이상 + 평균 60점 이상. 과목당 ${PER}문항, 한 문항 ${100/PER}점이에요.</p>
  <div class="rule"><div><b>40↑</b><span>과목별 과락선</span></div><div><b>60↑</b><span>평균 합격선</span></div><div><b>${100/PER}점</b><span>문항당 배점</span></div></div></div></div>`;
  h+=prevBlock();
  h+=`<div class="sec" id="randSec"><div class="sech"><h2>실전 모의고사 (${EX.min}분 타임어택)</h2></div>
  ${randBlock()}
  ${MAINSETS.length?`<div class="yr">${esc(EX.mainLabel||'회차별 시험지')}</div><div class="sets">${MAINSETS.map(setBtn).join('')}</div>`:''}
  ${OLDSETS.length?`<details class="oldsets" ${oldOpen?'open':''}><summary><span>${esc(EX.oldLabel)} · ${OLDSETS.length}회</span><span class="muted">${Q.filter(q=>OLDSETS.includes(q.set)).length}문항 ▾</span></summary>
  ${[...new Set(OLDSETS.map(s=>s.slice(0,4)))].sort().reverse().map(y=>`<div class="yr">${y}년</div><div class="sets">${OLDSETS.filter(s=>s.startsWith(y)).map(setBtn).join('')}</div>`).join('')}
  ${EX.oldNote?`<p class="hint">${esc(EX.oldNote)}</p>`:''}</details>`:''}</div></div>`;
  h+=`<div class="sec" id="drillSec"><div class="sech"><h2>과목별 풀이 (시간제한 없음)</h2></div><div class="row">
    ${SN.map(s=>`<button class="btn ghost" data-drill="${s}">${s}과목 ${PER}문제</button>`).join('')}</div>
    <div class="row"><button class="btn ${ow?'bad':'ghost'}" id="drillWrong" ${ow?'':'disabled'}>틀린 문제 다시 풀기 ${ow?`(${ow})`:''}</button><button class="btn ghost" id="drillNew">안 푼 문제만 20개</button></div></div>`;
  h+=`<div class="sec"><div class="sech"><h2>과목별 내 정답률</h2><span class="muted" style="font-size:12px">빨간 선 40 · 검은 선 60</span></div><div class="panel bars">${SN.map(s=>{const [a,b]=st[s];const p=b?Math.round(a/b*100):0;return `<div class="bar"><span>${s}과목</span><div class="tr"><i style="width:${p}%;background:${b&&p<40?'var(--bad)':'var(--accent)'}"></i><span class="l40"></span><span class="l60"></span></div><b>${b?p+'%':'-'}</b></div>`;}).join('')}
  <p class="hint">푼 문제 ${Object.keys(store.ans).length} / 전체 ${Q.length}문항 ${EX.statLine?EX.statLine(Q):''}</p></div></div>`;
  app.innerHTML=h;
  bindPrev(); bindRand(); bindMenu(); bindProgress();
  app.querySelectorAll('#qvSeg button').forEach(b=>b.onclick=()=>{store.pref.qview=b.dataset.v;save();renderHome();});
  app.querySelectorAll('#cbSeg button').forEach(b=>b.onclick=()=>{store.pref.cbtStyle=b.dataset.v;save();renderHome();});
  app.querySelectorAll('#modeSeg button').forEach(b=>b.onclick=()=>{store.pref.mode=b.dataset.v;store.pref.instant=b.dataset.v==='instant';save();renderHome();});
  app.querySelectorAll('#typeSeg button').forEach(b=>b.onclick=()=>{if(b.dataset.v==='cbt'){if(curMode()!=='cbt')store.pref.lastMode=curMode();store.pref.mode='cbt';store.pref.instant=false;}else{store.pref.mode=store.pref.lastMode||'instant';store.pref.instant=store.pref.mode==='instant';}save();renderHome();});
  const od=app.querySelector('.oldsets'); if(od) od.ontoggle=()=>{oldOpen=od.open;};
  app.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{
    const s=b.dataset.set;
    if(store.cur&&store.cur.title===s){goResume();return;}
    if(store.cur) return confirmBox(`풀던 시험(${SL(store.cur.title)})이 있어요. 지우고 ${SL(s)}을 새로 시작할까요?`,()=>{store.cur=null;b.click();});
    let ids,title;
    if(s==='랜덤 모의고사'){ids=SN.flatMap(k=>shuffle(Q.filter(q=>q.s===k&&!q.ob)).slice(0,PER).map(q=>q.id));title='랜덤 모의고사';}
    else {ids=Q.filter(q=>q.set===s).sort((a,b)=>a.n-b.n).map(q=>q.id);title=s;}
    startExam({title,ids});
  });
  app.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;b.click();});
    const s=+b.dataset.drill; // prioritize unseen & wrong
    const pool=Q.filter(q=>q.s===s&&!q.ob); const un=shuffle(pool.filter(q=>!store.ans[q.id])); const rest=shuffle(pool.filter(q=>store.ans[q.id]));
    startSession({title:`${s}과목 연습`,ids:un.concat(rest).slice(0,PER).map(q=>q.id),instant:true,kind:'drill'});
  });
  const dw=$('#drillWrong'); if(dw) dw.onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;dw.click();});
    const ids=shuffle(openWrong()); startSession({title:'오답 다시 풀기',ids,instant:true,kind:'wrong'});};
  $('#drillNew').onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;$('#drillNew').click();});
    const un=shuffle(Q.filter(q=>!store.ans[q.id])).slice(0,20).map(q=>q.id); if(!un.length) return; startSession({title:'새 문제 20개',ids:un,instant:true,kind:'drill'});};
  if(store.cur){$('#goResume').onclick=()=>goResume(); $('#dropCur').onclick=()=>confirmBox('지금까지 푼 것만 채점하고 끝낼까요?',()=>{resumeCur();finish();});}
}

function analyzePrev(p){
  const sub=SN.map((_,i)=>p[i]), tot=sub.reduce((a,b)=>a+b,0), avg=Math.round(tot/NS*100)/100;
  const fails=sub.map((x,i)=>x<40?i:null).filter(x=>x!==null);
  const pass=!fails.length&&avg>=60;
  const raised=sub.map(x=>Math.max(x,40));
  const failPts=raised.reduce((a,b)=>a+b,0)-tot;
  const needPts=Math.max(0,60*NS-raised.reduce((a,b)=>a+b,0))+failPts;
  const needQ=Math.ceil(needPts/(100/PER));
  const order=SN.map(s=>s-1).sort((a,b)=>sub[a]-sub[b]);
  let msg='';
  if(pass) msg=`이미 합격선이에요(평균 ${avg}). 실수만 줄이면 돼요.`;
  else {
    msg=`평균 ${avg}점이에요. 합격까지 총 ${needPts}점, 약 ${needQ}문제를 더 맞히면 돼요.`;
    if(fails.length) msg+=` ${fails.map(i=>`${i+1}과목(${sub[i]}점 → 40점까지 ${Math.ceil((40-sub[i])/(100/PER))}문제)`).join(', ')}이 과락이라 먼저 올려야 해요.`;
    else msg+=` 과락은 없어요. 가장 낮은 ${order[0]+1}과목(${sub[order[0]]}점)부터 올리는 게 제일 빨라요.`;
    const low=order.filter(i=>!fails.includes(i)).slice(0,1);
    if(fails.length&&low.length&&sub[low[0]]<60) msg+=` 그다음은 ${low[0]+1}과목(${sub[low[0]]}점)이에요.`;
  }
  return {sub,tot,avg,pass,msg,order};
}
function realList(){
  if(!Array.isArray(store.real)){ store.real=[]; if(store.prev){store.real.push({d:'',sub:store.prev.slice()});} save(); }
  return store.real;
}
function realSorted(){ return realList().map((r,i)=>({r,i})).sort((x,y)=>(y.r.d||'').localeCompare(x.r.d||'')); }
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function realForm(px,title,hint){
  return `<div class="panel confirm"><b>${title}</b>${hint?`<span class="hint">${hint}</span>`:''}
  <label style="font-size:13px;display:flex;flex-direction:column;gap:4px">시험 날짜<input class="search" id="${px}d" type="date" value="${todayStr()}"></label>
  <div class="row">${SN.map(i=>`<label style="flex:1 1 90px;font-size:13px;display:flex;flex-direction:column;gap:4px">${i}과목<input class="search" id="${px}${i}" type="number" inputmode="numeric" min="0" max="100" step="5" placeholder="0~100"></label>`).join('')}</div>
  <button class="btn" id="${px}Save">점수 저장하고 분석</button><span class="hint" id="${px}Err" style="color:var(--bad)" role="status"></span></div>`;
}
function bindRealForm(px,done){
  const sv=$('#'+px+'Save'); if(!sv) return;
  sv.onclick=()=>{
    const v=SN.map(i=>$('#'+px+i).value.trim());
    if(v.some(x=>x===''||isNaN(+x)||+x<0||+x>100)){$('#'+px+'Err').textContent='모든 과목에 0~100 사이 점수를 넣어주세요.';return;}
    realList().push({d:$('#'+px+'d').value||'',sub:v.map(Number)}); save(); done();
  };
}
function realCard(r,i,withDel){
  const a=analyzePrev(r.sub);
  return `<div class="card-score"><div class="ttl"><h2>${r.d?esc(r.d):'날짜 없음'} 실제 시험</h2>${withDel?`<button class="iconbtn" data-rdel="${i}">삭제</button>`:''}</div>
  <div class="scroll-x"><table class="scoretbl"><tr>${SN.map(s=>`<th>${s}과목</th>`).join('')}<th>총점</th><th>평균</th></tr><tr>${a.sub.map(x=>`<td class="${x<40?'fail':''}">${x}</td>`).join('')}<td>${a.tot}</td><td>${a.avg}</td></tr></table></div>
  <div class="passbox"><span style="font-size:14px">${esc(a.msg)}</span><span class="stamp ${a.pass?'p':'f'}">${a.pass?'합격':'불합격'}</span></div></div>`;
}
function prevBlock(){
  const list=realSorted();
  if(!list.length){
    return `<div class="sec">${realForm('pv','실제 시험 점수 넣기 (선택)','시험 보고 받은 점수를 넣으면 합격까지 몇 문제가 더 필요한지, 어느 과목부터 할지 알려줘요. 이 기기에만 저장돼요.')}</div>`;
  }
  const {r}=list[0]; const a=analyzePrev(r.sub);
  return `<div class="sec"><div class="panel confirm"><div class="sech"><b>최근 실제 시험 분석${r.d?` · ${esc(r.d)}`:''}</b><button class="iconbtn" id="pvGo">점수 추가·관리</button></div>
  <div class="scroll-x"><table class="scoretbl"><tr>${SN.map(s=>`<th>${s}과목</th>`).join('')}<th>총점</th><th>평균</th></tr><tr>${a.sub.map(x=>`<td class="${x<40?'fail':''}">${x}</td>`).join('')}<td>${a.tot}</td><td>${a.avg}</td></tr></table></div>
  <span style="font-size:14.5px">${esc(a.msg)}</span>
  ${a.pass?'':`<button class="btn ghost" data-drill="${a.order[0]+1}">${a.order[0]+1}과목 ${PER}문제 바로 연습</button>`}</div></div>`;
}
function bindPrev(){
  bindRealForm('pv',()=>renderHome());
  const g=$('#pvGo'); if(g) g.onclick=()=>{tab='rec';view=null;render();window.scrollTo(0,0);};
}
function confirmBox(msg,yes){
  const bg=document.createElement('div'); bg.className='sheetbg center';
  bg.innerHTML=`<div class="sheet confirm"><b>${esc(msg)}</b><div class="row"><button class="btn" id="cy">네</button><button class="btn ghost" id="cn">아니요</button></div></div>`;
  document.body.appendChild(bg);
  bg.querySelector('#cy').onclick=()=>{bg.remove();yes();}; bg.querySelector('#cn').onclick=()=>bg.remove();
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
}

/* ---------- quiz ---------- */
/* ---------- 시험: 스크롤로 풀기 ---------- */
function qView(){return store.pref.qview||'one';}
/* 시험 중 한 문제씩 <-> CBT 시험지 전환 */
function switchStyle(cbt,i){const c=store.cur;if(!c)return;clearInterval(tick);modal.innerHTML='';
  c.cbt=cbt; if(cbt){c.page=Math.floor(i/10);}else{c.idx=Math.min(i,c.ids.length-1); if(c.kind==='practice') c.instant=true; document.body.classList.remove('cbton','ppon');}
  if(c.kind==='exam'){ if(cbt){if(curMode()!=='cbt')store.pref.lastMode=curMode();store.pref.mode='cbt';store.pref.examPick='cbt';} else {store.pref.examPick='one';} }
  else if(c.kind==='practice') store.pref.practicePick=cbt?'cbt':'one';
  save(); render(); if(!cbt&&qView()==='scroll') setTimeout(()=>goQ(c.idx),0); else window.scrollTo(0,0);}
function viewToggle(){return `<button class="iconbtn" id="qView" title="보기 방식 바꾸기">${qView()==='scroll'?'1문제씩':'스크롤'}</button>`;}
function bindViewToggle(){const b=$('#qView'); if(b) b.onclick=()=>{store.pref.qview=qView()==='scroll'?'one':'scroll';save();const c=store.cur;render(); if(qView()==='scroll') setTimeout(()=>goQ(c.idx),0); else window.scrollTo(0,0);};}
function goQ(i){const c=store.cur;c.idx=i;save(); if(qView()==='scroll'&&!c.cbt){const el=document.getElementById('qs'+i); if(el){const y=el.getBoundingClientRect().top+window.scrollY-70;window.scrollTo(0,Math.max(0,y));}} else {renderQuiz();window.scrollTo(0,0);}}
function qBlock(c,i){
  const id=c.ids[i], q=QM[id], pick=c.picks[id], shown=c.instant&&pick;
  let h=`<section class="qs ${shown?(pick===q.a?'okq':'noq'):''}" id="qs${i}"><div class="qhead"><span class="qnum tabnum">${i+1}</span>${subjChip(q.s)}<span class="qmeta">${esc(SL(q.set))} ${q.n}번</span>${q.ob?'<span class="obchip">옛 버전 내용</span>':''}${saveBtn(id)}<button class="flagmini ${c.flags[id]?'on':''}" data-flag="${i}" aria-label="체크해 두기">★</button></div>`;
  if(q.full&&q.img) h+=`<img class="qimg" loading="lazy" src="${q.img}" alt="${esc(q.q)}">`;
  else { h+=`<p class="stem">${esc(q.q)}</p>`+imgsHTML(q); }
  h+=`<div class="opts">${q.o.map((o,j)=>{const n=j+1;let cls='';if(shown){if(n===q.a)cls='right';else if(n===pick)cls='wrong';}else if(n===pick)cls='sel';return `<button class="opt ${cls}" data-i="${i}" data-n="${n}" ${shown?'disabled':''}><span class="n">${n}</span><span>${shown&&n===q.a?markFix(q,o):esc(o)}</span></button>`;}).join('')}</div>`;
  if(shown){const ok=pick===q.a; h+=`<div class="verdict ${ok?'ok':'no'}"><div class="vt">${ok?'○ 정답':'✕ 오답'}${ok?'':` <span class="muted" style="font-weight:500;font-size:14px">정답은 ${MK[q.a-1]}번</span>`}</div>${explainHTML(q,pick)}</div>`;}
  return h+`</section>`;
}
function renderQuizScroll(){
  const c=store.cur; if(c.paused) resumeCur();
  const ansd=Object.keys(c.picks).length;
  let h=`<div class="top"><button class="iconbtn" id="qExit" aria-label="나가기">✕ 나가기</button><div class="sp"></div>${c.limit?`<span class="timer" id="timer">${fmt(remaining(c))}</span>`:`<span class="timer up" id="timerUp" title="걸린 시간">${fmt(elapsed(c))}</span>`}${viewToggle()}<button class="iconbtn" id="qToCbt" title="CBT 시험지로 전환">CBT</button><button class="iconbtn" id="qSheet">답안지</button></div>`;
  h+=`<div class="progress sticky"><i id="qProg" style="width:${ansd/c.ids.length*100}%"></i></div><p class="hint" style="margin:0 0 10px">${esc(SL(c.title))} · <span id="qAns">${ansd}</span>/${c.ids.length}문항 답함 · 쭉 내리면서 풀어요</p>`;
  h+=`<div class="qlist">${c.ids.map((_,i)=>qBlock(c,i)).join('')}</div>`;
  h+=`<div class="qsubmit"><button class="btn" id="qDone">제출하고 채점하기</button></div><div style="height:24px"></div>`;
  app.innerHTML=h; modal.innerHTML='';
  const upd=()=>{const a=Object.keys(c.picks).length;$('#qAns').textContent=a;$('#qProg').style.width=(a/c.ids.length*100)+'%';};
  const bindBlock=root=>{
    root.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,n=+b.dataset.n,id=c.ids[i];
      if(c.instant){ if(c.picks[id]) return; c.picks[id]=n; record(id,n);} else c.picks[id]=n;
      c.qsId=id; tickQ(c,id);
      c.idx=i; save(); const old=document.getElementById('qs'+i); old.outerHTML=qBlock(c,i); const nw=document.getElementById('qs'+i); bindBlock(nw); bindMore(); upd();});
    root.querySelectorAll('[data-flag]').forEach(b=>b.onclick=()=>{const i=+b.dataset.flag,id=c.ids[i];c.flags[id]=!c.flags[id];save();b.classList.toggle('on',!!c.flags[id]);});
  };
  bindBlock(app);
  $('#qDone').onclick=submitAsk;
  $('#qSheet').onclick=showSheet;
  bindViewToggle();
  $('#qExit').onclick=()=>{pauseCur();modal.innerHTML='';tab='home';render();};
  {const b=$('#qToCbt'); if(b) b.onclick=()=>switchStyle(true,c.idx||0);}
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){c.idx=+e.target.id.slice(2);}});},{rootMargin:'-40% 0px -55% 0px'});app.querySelectorAll('.qs').forEach(s=>io.observe(s));}
  if(c.limit){tick=setInterval(()=>{const r=remaining(c);const t=$('#timer');if(t){t.textContent=fmt(r);t.classList.toggle('low',r<300);}if(r<=0){clearInterval(tick);modal.innerHTML='';finish();}},1000);}
  else {tick=setInterval(()=>{const t=$('#timerUp');if(t)t.textContent=fmt(elapsed(c));},1000);}
}

function renderQuiz(){
  const c=store.cur; if(c.paused) resumeCur();
  const id=c.ids[c.idx], q=QM[id]; const pick=c.picks[id];
  if(c.qsId!==id) tickQ(c,id);
  const peekNow=!!c.peek&&!pick;
  const shown = (c.instant && pick) || peekNow || (c.peek&&pick);
  const ansd=Object.keys(c.picks).length;
  let h=`<div class="top"><button class="iconbtn" id="qExit" aria-label="나가기">✕ 나가기</button><div class="sp"></div>${c.limit?`<span class="timer" id="timer">${fmt(remaining(c))}</span>`:`<span class="timer up" id="timerUp" title="걸린 시간">${fmt(elapsed(c))}</span>`}${viewToggle()}<button class="iconbtn" id="qToCbt" title="CBT 시험지로 전환">CBT</button><button class="iconbtn" id="qSheet">답안지</button></div>`;
  h+=`<div class="progress"><i style="width:${ansd/c.ids.length*100}%"></i></div>`;
  h+=`<div class="qhead"><span class="qnum tabnum">${c.idx+1}<span class="muted" style="font-size:15px">/${c.ids.length}</span></span>${subjChip(q.s)}<span class="qmeta">${esc(SL(q.set))} ${q.n}번</span>${q.ob?'<span class="obchip">옛 버전 내용</span>':''}</div>
  <div class="qtools"><button class="tog ${c.peek?'on':''}" id="qPeek" aria-pressed="${!!c.peek}">정답모드 ${c.peek?'켜짐':'꺼짐'}</button>${saveBtn(id)}<button class="tog" id="qInfo">문제 정보</button></div>`;
  if(q.full && q.img){ h+=`<img class="qimg" src="${q.img}" alt="${esc(q.q)}">`; }
  else { h+=`<p class="stem">${esc(q.q)}</p>`+imgsHTML(q); }
  h+=`<div class="opts">${q.o.map((o,i)=>{const n=i+1;let cls='';if(shown){if(n===q.a)cls='right';else if(n===pick)cls='wrong';}else if(n===pick)cls='sel';return `<button class="opt ${cls}" data-n="${n}" ${shown?'disabled':''}><span class="n">${n}</span><span>${shown&&n===q.a?markFix(q,o):esc(o)}</span></button>`;}).join('')}</div>`;
  if(shown&&!pick){h+=`<div class="verdict"><div class="vt">정답은 ${MK[q.a-1]}번 <span class="muted" style="font-weight:500;font-size:13px">정답모드 · 채점에 안 들어가요</span></div>${explainHTML(q,0)}</div>`;}
  else if(shown){const ok=pick===q.a; h+=`<div class="verdict ${ok?'ok':'no'}"><div class="vt">${ok?'○ 정답':'✕ 오답'}${ok?'':` <span class="muted" style="font-weight:500;font-size:14px">정답은 ${MK[q.a-1]}번</span>`}</div>${explainHTML(q,pick)}</div>`;}
  const last=c.idx===c.ids.length-1;
  h+=`<div class="qnav"><button class="btn ghost flag ${c.flags[id]?'on':''}" id="qFlag" title="나중에 다시 보기" aria-label="체크해 두기">★</button><button class="btn ghost" id="qPrev" ${c.idx===0?'disabled':''}>이전</button>${last?`<button class="btn" id="qDone">제출하기</button>`:`<button class="btn" id="qNext">다음</button>`}</div><div style="height:24px"></div>`;
  app.innerHTML=h;
  modal.innerHTML='';
  $('#qPeek').onclick=()=>{c.peek=!c.peek;save();renderQuiz();};
  $('#qInfo').onclick=()=>infoBox(id);
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const n=+b.dataset.n;
    if(c.instant){ if(c.picks[id]) return; c.picks[id]=n; record(id,n); save(); renderQuiz(); const v=app.querySelector('.verdict'); if(v){const r=v.getBoundingClientRect(); if(r.top>innerHeight-120) window.scrollBy(0,r.top-innerHeight+160);} }
    else { c.picks[id]=n; save(); renderQuiz(); }
  });
  $('#qPrev').onclick=()=>{c.idx--;save();renderQuiz();window.scrollTo(0,0);};
  const nx=$('#qNext'); if(nx) nx.onclick=()=>{c.idx++;save();renderQuiz();window.scrollTo(0,0);};
  const dn=$('#qDone'); if(dn) dn.onclick=submitAsk;
  $('#qFlag').onclick=()=>{c.flags[id]=!c.flags[id];save();renderQuiz();};
  $('#qSheet').onclick=showSheet; bindViewToggle();
  $('#qExit').onclick=()=>{pauseCur();modal.innerHTML='';tab='home';render();};
  {const b=$('#qToCbt'); if(b) b.onclick=()=>switchStyle(true,c.idx||0);}
  if(c.limit){tick=setInterval(()=>{const r=remaining(c);const t=$('#timer');if(t){t.textContent=fmt(r);t.classList.toggle('low',r<300);}if(r<=0){clearInterval(tick);modal.innerHTML='';finish();}},1000);}
  else {tick=setInterval(()=>{const t=$('#timerUp');if(t)t.textContent=fmt(elapsed(c));},1000);}
}
/* ---------- CBT 실전 화면 ---------- */
function cbtPages(c){const pp=c.pp||2;return Math.ceil(c.ids.length/pp);}
function cbtGo(c,i){const pp=c.pp||2;c.page=Math.floor(i/pp);c.idx=i;save();renderCBT();const el=document.getElementById('cq'+i);if(el){const y=el.getBoundingClientRect().top+window.scrollY-90;window.scrollTo(0,Math.max(0,y));}else window.scrollTo(0,0);}
function cbtOmr(c){
  return `<div class="cbt-omr">${c.ids.map((id,i)=>{const p=c.picks[id];const pp=c.pp||2;const cur=Math.floor(i/pp)===c.page;return `<div class="r ${cur?'cur':''}"><b data-go="${i}">${i+1}</b>${[1,2,3,4].map(n=>`<button data-om="${i}" data-n="${n}" class="${p===n?'on':''}" aria-label="${i+1}번 ${n}">${n}</button>`).join('')}</div>`;}).join('')}</div>`;
}
/* ---------- CBT 시험지형 (2단 기출 시험지 + 답안지) ---------- */
function cbtStyle(){return 'paper';}
function renderPaper(){
  const c=store.cur; if(c.paused) resumeCur();
  const PS=10, np=Math.ceil(c.ids.length/PS); if(c.page==null||c.page>=np) c.page=0;
  const left=c.ids.filter(id=>!c.picks[id]).length;
  const from=c.page*PS, list=c.ids.slice(from,from+PS);
  const subjFirst={}; c.ids.forEach((id,i)=>{const s=QM[id].s; if(subjFirst[s]==null) subjFirst[s]=i;});
  const el=()=>{const s=Math.floor(elapsed(c));return `${Math.floor(s/60)}분 ${String(s%60).padStart(2,'0')}초`;};
  let h=`<div class="pp"><header class="pp-h"><div class="pp-l"><button class="pp-brand" id="ppExit" title="홈으로">${esc(EX.brand)}</button><button class="pp-sw" id="ppToOne">한 문제씩<span class="swl">으로 전환</span></button></div>
  <h1>${esc(EX.name.replace(' 필기',''))} : ${esc(SL(c.title))}</h1>
  <div class="pp-r"><span class="pp-time">경과시간 : <b id="ppEl">${el()}</b>${c.limit?` <small>(남은 <i id="timer">${fmt(remaining(c))}</i>)</small>`:''}</span>
  <select id="ppSubj" aria-label="과목으로 이동">${SN.filter(s=>subjFirst[s]!=null).map(s=>`<option value="${subjFirst[s]}" ${QM[c.ids[from]].s===s?'selected':''}>${s}과목 : ${esc(SUBJ[s])}(${c.ids.filter(id=>QM[id].s===s).length}문항)</option>`).join('')}</select>
</div></header>
  <div class="pp-body"><main class="pp-paper">${list.map((id,k)=>{const i=from+k,q=QM[id],p=c.picks[id];
    const head=subjFirst[q.s]===i?`<div class="pp-subj">${q.s}과목 : ${esc(SUBJ[q.s])}</div>`:'';
    const stem=q.full&&q.img?`<div class="pp-qt"><span>${i+1}.</span></div>${imgsHTML(q,'pp-img')}`:`<div class="pp-qt"><span>${i+1}.</span><span>${esc(q.q)}</span></div>${imgsHTML(q,'pp-img')}`;
    return `${head}<section class="pp-q" id="pq${i}">${stem}<ol>${q.o.map((o,j)=>`<li><button data-pq="${i}" data-n="${j+1}" class="${p===j+1?'on':''}${tentHas(c,id,j+1)?' tn':''}"><span class="m bub">${j+1}</span><span>${esc(o)}</span></button></li>`).join('')}</ol></section>`;}).join('')}</main>
  <aside class="pp-sheet"><h2>답 안 지</h2><p class="pp-tip"><i></i>가답안 : 우클릭 · 길게 누르기</p><div class="pp-omr">${c.ids.map((id,i)=>`${i&&i%5===0?'<hr>':''}<div class="pr ${Math.floor(i/PS)===c.page?'cur':''}"><b data-pgo="${i}">${String(i+1).padStart(2,'0')}.</b>${[1,2,3,4].map(n=>`<button data-pom="${i}" data-n="${n}" class="${c.picks[id]===n?'on':''}${tentHas(c,id,n)?' tn':''}" aria-label="${i+1}번 ${n}">${n}</button>`).join('')}</div>`).join('')}</div></aside></div>
  <footer class="pp-f"><button id="ppPrev" ${c.page===0?'disabled':''}>◀ 이전</button><span class="pp-pg">- ${c.page+1} -</span><button id="ppNext" ${c.page>=np-1?'disabled':''}>다음 ▶</button>
  <span class="pp-left">남은문항수 : <b id="ppLeft">${left}</b></span><button class="pp-omrbtn" id="ppOmr">답안지</button><button class="pp-sub" id="ppSub">채점하기</button></footer></div>`;
  app.innerHTML=h; modal.innerHTML='';
  const go=i=>{c.page=Math.floor(i/PS);save();renderPaper();const e=document.getElementById('pq'+i);if(e)window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-80);else window.scrollTo(0,0);};
  const mark=(i,n,keep)=>{const id=c.ids[i];c.qsId=id;tickQ(c,id);c.picks[id]=c.picks[id]===n&&!keep?undefined:n;if(c.picks[id]===undefined)delete c.picks[id];else if(c.tent&&c.tent[id])delete c.tent[id];save();
    document.querySelectorAll(`[data-pq="${i}"],[data-pom="${i}"]`).forEach(b=>{b.classList.toggle('on',+b.dataset.n===c.picks[id]);b.classList.toggle('tn',tentHas(c,id,+b.dataset.n));});
    $('#ppLeft').textContent=c.ids.filter(x=>!c.picks[x]).length;};
  const tent=(i,n)=>{const id=c.ids[i];c.tent=c.tent||{};if(c.picks[id]){delete c.picks[id];c.qsId=id;document.querySelectorAll(`[data-pq="${i}"],[data-pom="${i}"]`).forEach(b=>b.classList.remove('on'));const L=$('#ppLeft');if(L)L.textContent=c.ids.filter(x=>!c.picks[x]).length;}const a=c.tent[id]||[];const k=a.indexOf(n);if(k>=0)a.splice(k,1);else a.push(n);if(a.length)c.tent[id]=a;else delete c.tent[id];save();
    document.querySelectorAll(`[data-pq="${i}"],[data-pom="${i}"]`).forEach(b=>b.classList.toggle('tn',tentHas(c,id,+b.dataset.n)));};
  bindTent(app.querySelectorAll('[data-pq],[data-pom]'),b=>tent(+(b.dataset.pq??b.dataset.pom),+b.dataset.n));
  app.querySelectorAll('[data-pq]').forEach(b=>b.onclick=()=>{if(b._skip){b._skip=false;return;}mark(+b.dataset.pq,+b.dataset.n);});
  app.querySelectorAll('[data-pom]').forEach(b=>b.onclick=()=>{if(b._skip){b._skip=false;return;}const i=+b.dataset.pom;mark(i,+b.dataset.n,true);if(Math.floor(i/PS)!==c.page)go(i);});
  app.querySelectorAll('[data-pgo]').forEach(b=>b.onclick=()=>go(+b.dataset.pgo));
  $('#ppSubj').onchange=e=>go(+e.target.value);
  $('#ppPrev').onclick=()=>{c.page--;save();renderPaper();window.scrollTo(0,0);};
  $('#ppNext').onclick=()=>{c.page++;save();renderPaper();window.scrollTo(0,0);};
  $('#ppExit').onclick=()=>{pauseCur();document.body.classList.remove('cbton','ppon');tab='home';render();window.scrollTo(0,0);};
  $('#ppOmr').onclick=()=>{const s=$('.pp-sheet');s.classList.toggle('open');};
  $('#ppToOne').onclick=()=>switchStyle(false,c.page*PS);
  $('#ppSub').onclick=()=>submitFlow(i=>go(i),()=>{document.body.classList.remove('cbton','ppon');finish();});
  const cur=app.querySelector('.pp-omr .pr.cur'); if(cur){const box=app.querySelector('.pp-omr');box.scrollTop=cur.offsetTop-box.offsetTop-40;}
  tick=setInterval(()=>{const e=$('#ppEl');if(e)e.textContent=el();if(c.limit){const r=remaining(c);const t=$('#timer');if(t)t.textContent=fmt(r);if(r<=0){clearInterval(tick);document.querySelectorAll('.sheetbg').forEach(x=>x.remove());document.body.classList.remove('cbton','ppon');finish();}}},1000);
}
function renderCBT(){
  const c=store.cur; if(c.paused) resumeCur();
  const pp=c.pp||2, fs=c.fs||1, np=cbtPages(c); if(c.page>=np) c.page=np-1; if(!c.page) c.page=c.page||0;
  const left=c.ids.filter(id=>!c.picks[id]).length;
  const from=c.page*pp, list=c.ids.slice(from,from+pp);
  let h=`<div class="cbt" style="--fs:${fs}"><div class="cbt-h"><div class="tt"><button id="cExit2" style="float:right;background:none;border:1px solid rgba(255,255,255,.5);color:#fff;border-radius:4px;font-size:11px;padding:3px 7px">나가기</button>${esc(EX.name)}<small>${esc(SL(c.title))} · CBT 연습</small></div>
  <div class="grp">글자크기 ${[[1,'100'],[1.25,'150'],[1.5,'200']].map(([v,l])=>`<button data-fs="${v}" class="${fs===v?'on':''}">${l}%</button>`).join('')}</div>
  <div class="grp">화면배치 ${[1,2,3].map(v=>`<button data-pp="${v}" class="${pp===v?'on':''}">${v}문제</button>`).join('')}</div>
  <div class="cnt"><span>전체 문제 수 <b>${c.ids.length}</b></span><span>안 푼 문제 수 <b id="cLeft">${left}</b></span></div>
  <div class="clock ${c.limit&&remaining(c)<300?'low':''}" id="cClock">제한 시간 ${EX.min}분 · 남은 시간<b id="timer">${c.limit?fmt(remaining(c)):'--:--'}</b></div></div>
  <div class="cbt-body"><div class="cbt-main">${list.map((id,k)=>{const i=from+k,q=QM[id],p=c.picks[id];
    const stem=q.full&&q.img?`<img src="${q.img}" alt="${esc(q.q)}">`:`<div class="qt"><span class="no">${i+1}.</span><span>${esc(q.q)}</span></div>${imgsHTML(q,'')}`;
    return `<div class="cbt-q" id="cq${i}">${q.full&&q.img?`<div class="qt"><span class="no">${i+1}.</span><span></span></div>`:''}${stem}<ol>${q.o.map((o,j)=>`<li><button data-q="${i}" data-n="${j+1}" class="${p===j+1?'on':''}"><span class="m">${j+1}</span><span>${esc(o)}</span></button></li>`).join('')}</ol></div>`;}).join('')}</div>
  <aside class="cbt-side"><h3>답안 표기란</h3>${cbtOmr(c)}</aside></div>
  <div class="cbt-f"><button id="cExit">나가기</button><button id="cCalc">계산기</button><button id="cToPaper">시험지형</button><span class="sp"></span><button id="cPrev" ${c.page===0?'disabled':''}>◀ 이전</button><span class="cbt-pg">${c.page+1}/${np}</span><button id="cNext" ${c.page>=np-1?'disabled':''}>다음 ▶</button><span class="sp"></span><span class="mclock" id="mClock">${c.limit?fmt(remaining(c)):''}</span><button id="cLeftBtn">안 푼 문제</button><button class="omrbtn" id="cOmr">답안 표기란</button><button class="sub" id="cSubmit">답안 제출</button></div></div>`;
  app.innerHTML=h; modal.innerHTML='';
  const mark=(i,n)=>{const id=c.ids[i];c.qsId=id;tickQ(c,id);c.picks[id]=n;c.idx=i;save();const y=window.scrollY;renderCBT();window.scrollTo(0,y);};
  app.querySelectorAll('.cbt-main [data-q]').forEach(b=>b.onclick=()=>mark(+b.dataset.q,+b.dataset.n));
  app.querySelectorAll('[data-om]').forEach(b=>b.onclick=()=>{const i=+b.dataset.om;const pp2=c.pp||2;const same=Math.floor(i/pp2)===c.page;c.picks[c.ids[i]]=+b.dataset.n;save();if(same){const y=window.scrollY;renderCBT();window.scrollTo(0,y);}else cbtGo(c,i);});
  app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>cbtGo(c,+b.dataset.go));
  app.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{c.fs=+b.dataset.fs;save();renderCBT();});
  app.querySelectorAll('[data-pp]').forEach(b=>b.onclick=()=>{const first=c.page*(c.pp||2);c.pp=+b.dataset.pp;c.page=Math.floor(first/c.pp);save();renderCBT();window.scrollTo(0,0);});
  $('#cPrev').onclick=()=>{c.page--;save();renderCBT();window.scrollTo(0,0);};
  $('#cNext').onclick=()=>{c.page++;save();renderCBT();window.scrollTo(0,0);};
  $('#cExit').onclick=$('#cExit2').onclick=()=>{pauseCur();document.body.classList.remove('cbton');tab='home';render();window.scrollTo(0,0);};
  $('#cCalc').onclick=cbtCalc;
  $('#cToPaper').onclick=()=>{store.pref.cbtStyle='paper';c.page=0;save();render();window.scrollTo(0,0);};
  $('#cOmr').onclick=()=>{const bg=document.createElement('div');bg.className='sheetbg';bg.innerHTML=`<div class="cbt-sheet cbt"><div class="cbt-side" style="display:flex;width:auto;position:static;max-height:none;border:0"><h3>답안 표기란 <span style="float:right;cursor:pointer" id="omClose">닫기 ✕</span></h3>${cbtOmr(c)}</div></div>`;document.body.appendChild(bg);
    bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#omClose').onclick=()=>bg.remove();
    bg.querySelectorAll('[data-om]').forEach(b=>b.onclick=()=>{const i=+b.dataset.om;c.picks[c.ids[i]]=+b.dataset.n;save();b.parentNode.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));const l=$('#cLeft');if(l)l.textContent=c.ids.filter(id=>!c.picks[id]).length;});
    bg.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{bg.remove();cbtGo(c,+b.dataset.go);});
    const cur=bg.querySelector('.r.cur'); if(cur) cur.scrollIntoView({block:'center'});};
  $('#cLeftBtn').onclick=()=>{const L=c.ids.map((id,i)=>c.picks[id]?null:i).filter(x=>x!==null);
    const bg=document.createElement('div');bg.className='sheetbg';bg.innerHTML=`<div class="sheet"><div class="sech"><h2>안 푼 문제 ${L.length}개</h2><button class="iconbtn" id="lfC">닫기</button></div>${L.length?`<div class="omr">${L.map(i=>`<button data-i="${i}">${i+1}</button>`).join('')}</div><p class="hint">번호를 누르면 그 문제로 가요.</p>`:'<p>모든 문제에 답을 표기했어요.</p>'}</div>`;document.body.appendChild(bg);
    bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#lfC').onclick=()=>bg.remove();
    bg.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{bg.remove();cbtGo(c,+b.dataset.i);});};
  $('#cSubmit').onclick=()=>{const l=c.ids.filter(id=>!c.picks[id]).length;
    confirmBox(l?`안 푼 문제가 ${l}개 있습니다. 답안을 제출하시겠습니까?`:'답안을 제출하시겠습니까?',()=>confirmBox('제출하면 답안을 수정할 수 없습니다. 정말 제출할까요?',()=>{document.body.classList.remove('cbton');finish();}));};
  if(c.limit){tick=setInterval(()=>{const r=remaining(c);const t=$('#timer');if(t){t.textContent=fmt(r);$('#cClock').classList.toggle('low',r<300);}const mc=$('#mClock');if(mc){mc.textContent=fmt(r);mc.classList.toggle('low',r<300);}if(r<=0){clearInterval(tick);modal.innerHTML='';document.querySelectorAll('.sheetbg').forEach(x=>x.remove());document.body.classList.remove('cbton');finish();}},1000);}
}
function cbtCalc(){
  let ex='';const bg=document.createElement('div');bg.className='sheetbg';bg.style.alignItems='center';
  const keys=['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','(',')','C','←'];
  bg.innerHTML=`<div class="calc"><div class="sech"><b>계산기</b><button class="iconbtn" id="kc">닫기</button></div><div class="scr" id="ks">0</div><div class="k">${keys.map(k=>`<button data-k="${k}">${k==='*'?'×':k==='/'?'÷':k}</button>`).join('')}</div></div>`;
  document.body.appendChild(bg);const sc=bg.querySelector('#ks');
  bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#kc').onclick=()=>bg.remove();
  bg.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;
    if(k==='C')ex='';else if(k==='←')ex=ex.slice(0,-1);
    else if(k==='='){try{if(/^[0-9+\-*/().\s]+$/.test(ex)){const v=Function('return ('+ex+')')();ex=String(Math.round(v*1e10)/1e10);}}catch(e){ex='오류';}}
    else {if(ex==='오류')ex='';ex+=k;}
    sc.textContent=ex||'0';});
}

function chartStrip(text,label){
  const C=window.CHARTS, P=window.CHART_PATTERNS; if(!C||!P||!/차트/.test(text)) return '';
  let t=text; const found=[];
  P.forEach(([k,re])=>{const r=new RegExp(re,'g'); let m; while((m=r.exec(t))){found.push([m.index,k]);} t=t.replace(new RegExp(re,'g'),s=>' '.repeat(s.length));});
  const ks=[...new Set(found.sort((a,b)=>a[0]-b[0]).map(x=>x[1]))];
  if(!ks.length) return '';
  return `<div class="chartbox"><span class="lbl">${label||'그림으로 보는 차트'}</span><div class="cs">${ks.map(k=>`<figure>${C[k].svg}<figcaption><b>${k} 차트</b>${esc(C[k].tip)}</figcaption></figure>`).join('')}</div></div>`;
}
function qText(q){return q.q+' '+q.o.join(' ')+' '+q.e;}
function explainHTML(q,pick){
  let h='';
  if(pick && pick!==q.a) h+=`<div class="mine"><span class="x">내 답 <b>${MK[pick-1]}</b> ${esc(q.o[pick-1]).slice(0,60)}${q.o[pick-1].length>60?'…':''}</span></div>`;
  h+=fixBlock(q);
  h+=`<div class="why"><span class="lbl">왜 ${MK[q.a-1]}번인가</span>${q.eimg?`<img class="qimg" src="${q.eimg}" alt="해설">`:esc(q.e)}</div>`;
  h+=tipHTML(q);
  h+=chartStrip(qText(q));
  h+=histLine(q.id);
  return h;
}
function submitAsk(){ submitFlow(i=>{modal.innerHTML='';goQ(i);},()=>finish()); }
/* 제출: 안 푼 문제가 있으면 알려주고 그 문제로 이동 (연습모드는 그냥 제출도 가능) */
function submitFlow(goTo,done){
  const c=store.cur; const left=c.ids.map((id,i)=>c.picks[id]?-1:i).filter(i=>i>=0);
  if(!left.length) return confirmBox('제출하고 채점할까요?',done);
  const pr=c.kind!=='exam';
  const bg=document.createElement('div'); bg.className='sheetbg center';
  bg.innerHTML=`<div class="sheet confirm leftbox"><b>안 푼 문제가 ${left.length}개 있어요</b>${left.some(i=>c.tent&&c.tent[c.ids[i]])?'<span class="hint" style="color:#2F6FD6">파란 번호 = 가답안만 칠한 문제 (답 미체크)</span>':''}<span class="hint">${pr?'번호를 누르면 그 문제로 가요. 연습모드는 그냥 제출할 수도 있어요.':'번호를 누르면 그 문제로 가요. 모두 풀어야 제출할 수 있어요.'}</span>
  <div class="leftnums">${left.slice(0,60).map(i=>`<button data-lgo="${i}" class="${c.tent&&c.tent[c.ids[i]]?'tn':''}">${i+1}</button>`).join('')}${left.length>60?`<span class="muted">외 ${left.length-60}개</span>`:''}</div>
  <div class="row"><button class="btn" id="lGo">안 푼 문제로 이동</button>${pr?'<button class="btn ghost" id="lSub">그냥 제출하기</button>':''}</div><button class="btn ghost" id="lX">닫기</button></div>`;
  document.body.appendChild(bg);
  const go=i=>{bg.remove();goTo(i);};
  bg.querySelectorAll('[data-lgo]').forEach(b=>b.onclick=()=>go(+b.dataset.lgo));
  bg.querySelector('#lGo').onclick=()=>go(left[0]);
  const ls=bg.querySelector('#lSub'); if(ls) ls.onclick=()=>{bg.remove();done();};
  bg.querySelector('#lX').onclick=()=>bg.remove(); bg.onclick=e=>{if(e.target===bg)bg.remove();};
}
function tentHas(c,id,n){return !!(c.tent&&c.tent[id]&&c.tent[id].includes(n));}
/* 가답안: 오른쪽 클릭 / 길게 누르기 */
function bindTent(list,fn){list.forEach(b=>{let t=null,ctx=0;
  b.addEventListener('contextmenu',e=>{e.preventDefault();ctx=Date.now();fn(b);});
  b.addEventListener('touchstart',()=>{clearTimeout(t);t=setTimeout(()=>{if(Date.now()-ctx>700){fn(b);}b._skip=true;setTimeout(()=>{b._skip=false;},900);},600);},{passive:true});
  ['touchend','touchmove','touchcancel'].forEach(ev=>b.addEventListener(ev,()=>clearTimeout(t),{passive:true}));});}
function showSheet(){
  const c=store.cur;
  const cells=c.ids.map((id,i)=>{const p=c.picks[id];let cls='';if(p){cls=c.instant?(p===QM[id].a?'r':'w'):'ans';} if(i===c.idx)cls+=' cur'; if(c.flags[id])cls+=' fl'; return `<button class="${cls}" data-i="${i}">${i+1}</button>`;}).join('');
  const bg=document.createElement('div'); bg.className='sheetbg';
  bg.innerHTML=`<div class="sheet"><div class="sech"><h2>답안지</h2><button class="iconbtn" id="shClose">닫기</button></div><div class="legend">${c.instant?'<span><i style="background:var(--ok)"></i>정답</span><span><i style="background:var(--bad)"></i>오답</span>':'<span><i style="background:var(--accent)"></i>답함</span>'}<span><i style="background:var(--warn)"></i>★ 체크</span></div><div class="omr">${cells}</div><button class="btn" id="shSubmit">제출하고 채점하기</button></div>`;
  document.body.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
  bg.querySelector('#shClose').onclick=()=>bg.remove();
  bg.querySelectorAll('.omr button').forEach(b=>b.onclick=()=>{bg.remove();goQ(+b.dataset.i);});
  bg.querySelector('#shSubmit').onclick=()=>{bg.remove();submitAsk();};
}

/* ---------- result ---------- */
function showResult(res){view={type:'result',res};tab='home';modal.innerHTML='';render();window.scrollTo(0,0);}
function scoreCard(res){
  const d=new Date(res.date);
  return `<div class="card-score"><div class="ttl"><h2>${esc(res.title)} 채점내역</h2><span class="muted" style="font-size:12.5px">${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} · ${Math.floor(res.dur/60)}분 ${res.dur%60}초</span></div>
  <div class="scroll-x"><table class="scoretbl"><tr>${SN.map(s=>`<th>${s}과목</th>`).join('')}<th>총점</th><th>평균</th></tr>
  <tr>${res.sub.map(x=>`<td class="${x!==null&&x<40?'fail':''}">${x===null?'-':x}</td>`).join('')}<td>${res.tot}</td><td>${res.avg}</td></tr></table></div>
  <div class="passbox"><div><div class="avg tabnum">${res.avg}<small>점 평균 · ${res.correct}/${res.n} 정답</small></div></div><span class="stamp ${res.pass?'p':'f'}">${res.pass?'합격':'불합격'}</span></div></div>`;
}
function renderResult(res){
  const wrong=res.ids.filter(id=>(!res.part||res.picks[id])&&res.picks[id]!==QM[id].a);
  const fails=res.sub.map((x,i)=>x!==null&&x<40?`${i+1}과목`:null).filter(Boolean);
  let adv='';
  if(res.pass) adv='합격선 통과! 틀린 문제만 한 번 더 보고 다른 회차로 확인해 보세요.';
  else if(fails.length) adv=`${fails.join(', ')}이 과락(40점 미만)이에요. 해당 과목 오답부터 다시 풀어보세요.`;
  else adv=`과락은 없어요. 평균 ${Math.ceil((60-res.avg)*NS/(100/PER))}문제 정도만 더 맞히면 합격이에요.`;
  const qt=res.qt||{}; const tsum=Object.values(qt).reduce((a,b)=>a+b,0);
  let h=topbar()+`<div class="sec"><div class="tiles"><div><span>정답 수</span><b>${res.correct}/${res.n}</b></div><div><span>평균 점수</span><b>${res.avg}</b></div><div><span>소요 시간</span><b>${fmt(res.dur)}</b></div></div>${scoreCard(res)}<p class="hint" style="font-size:14px;color:var(--ink2)">${adv}</p>
  <div class="row"><button class="btn bad" id="rWrong" ${wrong.length?'':'disabled'}>틀린 ${wrong.length}문제 바로 다시 풀기</button><button class="btn ghost" id="rHome">처음으로</button></div></div>`;
  h+=`<div class="sec"><div class="sech"><h2>틀린 문제 (${wrong.length})</h2><span class="muted" style="font-size:12px">눌러서 해설 보기</span></div>${wrong.map(id=>{const q=QM[id];const p=res.picks[id];return `<details class="grp"><summary><span style="font-weight:500;font-size:14px;display:flex;gap:8px"><span class="no tabnum" style="color:var(--bad);font-family:var(--f-mono)">${res.ids.indexOf(id)+1}</span>${esc(q.q.slice(0,48))}${q.q.length>48?'…':''}</span><span class="c">${p?MK[p-1]:'미응답'}→${MK[q.a-1]}</span></summary><div class="body">${noteBody(q,p)}</div></details>`;}).join('')||'<div class="empty">다 맞혔어요!</div>'}</div>`;
  h+=`<div class="sec"><details class="grp"><summary><span>문항별 결과 · 걸린 시간</span><span class="c">${res.n}문항</span></summary><div class="body"><div class="scroll-x"><table class="hist qres"><tr><th>문제</th><th>과목</th><th>시간</th><th>내 답</th><th>결과</th></tr>${res.ids.map((id,i)=>{const q=QM[id];const p=res.picks[id];const ok=p===q.a;return `<tr><td>${i+1}번</td><td>${q.s}</td><td>${qt[id]?fmt(qt[id]):'-'}</td><td>${p?MK[p-1]:'-'}</td><td>${p?(ok?'<b class="ok">○</b>':'<b class="no">✕</b>'):'<span class="muted">−</span>'}</td></tr>`;}).join('')}</table></div>${tsum?`<p class="hint">문항 평균 ${fmt(tsum/Math.max(1,Object.keys(qt).length))}</p>`:''}</div></details></div>`;
  app.innerHTML=h;
  $('#rHome').onclick=()=>{view=null;render();window.scrollTo(0,0);};
  const rw=$('#rWrong'); if(rw) rw.onclick=()=>{view=null;startSession({title:'방금 틀린 문제',ids:shuffle(wrong),instant:true,kind:'wrong'});};
}
function noteBody(q,p){
  let h='';
  if(q.full&&q.img) h+=`<img class="qimg" src="${q.img}" alt="">`; else {h+=`<div class="note q" style="border:0;padding:0">${esc(q.q)}</div>`; h+=imgsHTML(q);}
  h+=`<div class="opts">${q.o.map((o,i)=>{const n=i+1;const cls=n===q.a?'right':(n===p?'wrong':'');return `<div class="opt ${cls}" style="padding:9px 10px;font-size:14px"><span class="n">${n}</span><span>${n===q.a?markFix(q,o):esc(o)}</span></div>`;}).join('')}</div>`;
  h+=`<div class="why"><span class="lbl">해설</span>${q.eimg?`<img class="qimg" src="${q.eimg}" alt="해설">`:esc(q.e)}</div>`+tipHTML(q)+chartStrip(qText(q));
  return h;
}

/* ---------- notes ---------- */
let noteFilter='open';
function renderNotes(){
  const all=wrongIds(); const ids=noteFilter==='open'?all.filter(isOpenWrong):all;
  let h=topbar()+`<div class="sec"><div class="sech"><h2>내 오답 노트</h2></div>
  <div class="seg" id="nSeg"><button data-v="open" class="${noteFilter==='open'?'on':''}">아직 못 맞힌 것 (${all.filter(isOpenWrong).length})</button><button data-v="all" class="${noteFilter==='all'?'on':''}">틀렸던 것 전부 (${all.length})</button></div>
  <p class="hint">틀린 문제는 주제별로 모여요. 다시 풀어서 맞히면 ‘아직 못 맞힌 것’에서 빠져요.</p>
  ${ids.length?`<button class="btn bad" id="nRetry">이 목록 ${ids.length}문제 다시 풀기</button>`:''}</div>`;
  if(!ids.length){app.innerHTML=h+`<div class="empty">${all.length?'모두 다시 맞혔어요. 잘했어요!':'아직 틀린 문제가 없어요. 모의고사를 풀면 여기에 쌓여요.'}</div>`;bindNotes(ids);return;}
  SN.forEach(s=>{
    const sids=ids.filter(id=>QM[id].s===s); if(!sids.length) return;
    const groups={}; sids.forEach(id=>{const k=QM[id].sec;(groups[k]=groups[k]||[]).push(id);});
    const order=Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);
    h+=`<div class="sec"><div class="sech"><h2>${s}과목 ${SUBJ[s]}</h2><span class="muted" style="font-size:13px">${sids.length}문제</span></div>`;
    order.forEach(k=>{const sec=S[k];h+=`<details class="grp"><summary><span>${esc(sec.t)}</span><span class="c">${groups[k].length}문제</span></summary><div class="body">
      <div class="tip"><span class="lbl">이 주제 핵심</span>${sec.items.slice().sort((a,b)=>b.f-a.f).slice(0,3).map(it=>`• ${esc(it.t)}`).join('<br>')}</div>
      ${groups[k].map(id=>{const q=QM[id],r=store.ans[id];return `<div class="note"><div class="meta">${esc(SL(q.set))} ${q.n}번 · 틀린 횟수 ${r.w}${r.last==='r'?' · <span class="ok">다시 맞힘</span>':''}</div>${noteBody(q,r.last==='w'?r.pick:null)}</div>`;}).join('')}
      <button class="btn ghost" data-retry="${k}">이 주제만 다시 풀기</button></div></details>`;});
    h+=`</div>`;
  });
  app.innerHTML=h; bindNotes(ids);
}
function bindNotes(ids){
  app.querySelectorAll('#nSeg button').forEach(b=>b.onclick=()=>{noteFilter=b.dataset.v;renderNotes();});
  const r=$('#nRetry'); if(r) r.onclick=()=>go(ids);
  app.querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>go(ids.filter(id=>String(QM[id].sec)===b.dataset.retry)));
  function go(list){ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go(list);}); startSession({title:'오답 다시 풀기',ids:shuffle(list),instant:true,kind:'wrong'});}
}

/* ---------- summary ---------- */
let sumSubj=1, sumQ='', sumHot=false, sumFlip=false, sumChips=false;
const PDFS=EX.pdfs||{};
async function exportPdf(kind,btn){
  const f=PDFS[kind]; const old=btn.textContent; btn.disabled=true; btn.textContent='준비 중…';
  const msg=t=>{const m=$('#pdfMsg'); if(m) m.textContent=t;};
  try{
    let dl=null;
    try{ if(window.claude&&window.claude.use) dl=await window.claude.use('downloads'); }catch(e){}
    let blob=null;
    try{ const r=await fetch(f.url); if(r.ok) blob=await r.blob(); }catch(e){}
    if(dl&&blob){
      try{ await dl.save({filename:f.name,data:blob}); msg('저장했어요. 다운로드 폴더(폰은 파일 앱)에서 열면 돼요.'); }
      catch(e){ msg(e&&e.code==='declined'?'저장을 취소했어요.':'여기서는 저장이 안 돼요. 잠시 뒤 다시 눌러보세요.'); }
    } else {
      const a=document.createElement('a'); a.href=blob?URL.createObjectURL(blob):f.url; a.download=f.name; if(!blob){a.target='_blank'; a.rel='noopener';}
      document.body.appendChild(a); a.click(); a.remove();
      msg('PDF를 내려받았어요. 안 열리면 한 번 더 눌러주세요.');
    }
  } finally { btn.disabled=false; btn.textContent=old; }
}
function renderSum(){
  const wcount={}; wrongIds().filter(isOpenWrong).forEach(id=>{const k=QM[id].sec;wcount[k]=(wcount[k]||0)+1;});
  const qcount={}; Q.forEach(q=>{if(!q.ob&&q.sec!=null) qcount[q.sec]=(qcount[q.sec]||0)+1;});
  const ql=sumQ.trim().toLowerCase();
  const rx=ql?new RegExp(ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'):null;
  const hl=t=>{let e=esc(t);if(rx)e=e.replace(rx,m=>`<span class="hl">${m}</span>`);return e;};
  const all=S.map((s,i)=>({s,i})).filter(x=>x.s.s===sumSubj);
  const numOf={}; SN.forEach(sj=>S.map((s,i)=>({s,i})).filter(x=>x.s.s===sj).forEach((x,k)=>numOf[x.i]=`${sj}-${String(k+1).padStart(2,'0')}`));
  const txt=s=>[s.t,s.lead||'',s.tip||'',...(s.table?s.table.r.flat():[]),...(s.kv||[]).flat(),...s.items.map(it=>it.t)].join(' ').toLowerCase();
  let list=all;
  if(ql) list=S.map((s,i)=>({s,i})).filter(x=>txt(x.s).includes(ql));
  if(sumHot) list=list.filter(x=>x.s.items.some(it=>it.f>=3));
  const weak=Object.keys(wcount).map(Number).filter(k=>S[k].s===sumSubj).sort((a,b)=>wcount[b]-wcount[a]);
  const card=({s,i})=>{
    const hot=new Set(s.hot||[]); const star=k=>hot.has(k)?'<span class="star" title="자주 나옴">★</span>':'';
    let b=`<article class="scard ${wcount[i]?'weak':''}" id="sec${i}"><header><span class="sno">${numOf[i]}</span><h3>${hl(s.t)}</h3>${wcount[i]?`<span class="my">내 오답 ${wcount[i]}</span>`:''}</header>`;
    if(s.lead) b+=`<p class="slead">${hl(s.lead)}</p>`;
    if(s.table) b+=`<div class="stbl"><table><thead><tr>${s.table.h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${s.table.r.map(r=>`<tr>${r.map((c,j)=>j?`<td>${hl(c)}</td>`:`<th scope="row">${hl(c)}${star(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if(s.kv&&s.kv.length) b+=`<dl class="skv">${s.kv.map(([k,v])=>`<dt>${hl(k)}${star(k)}</dt><dd>${hl(v)}</dd>`).join('')}</dl>`;
    if(!s.table&&!(s.kv&&s.kv.length)) b+=`<ul class="sraw">${s.items.map(it=>`<li>${hl(it.t)}</li>`).join('')}</ul>`;
    if(s.gallery==='charts'&&window.CHARTS){const C=window.CHARTS;const order=['세로 막대형','가로 막대형','꺾은선형','영역형','원형','도넛형','분산형','거품형','주식형','표면형','방사형','혼합형','원형 대 원형','원형 대 가로 막대형','히스토그램','상자 수염','폭포','깔때기','트리맵','선버스트'].filter(k=>C[k]);
      b+=`<div class="cgal"><div class="cgal-h">차트 종류 한눈에 <span>${order.length}가지</span></div><div class="cgal-g">${order.map(k=>`<figure>${C[k].svg}<figcaption><b>${esc(k)}</b>${esc(C[k].tip)}</figcaption></figure>`).join('')}</div></div>`;}
    if(s.tip) b+=`<div class="stip"><b>암기</b><span>${hl(s.tip)}</span></div>`;
    if(!s.gallery) b+=chartStrip(s.t+' 차트 '+s.items.map(it=>it.t).join(' '),'그림으로 보는 차트');
    b+=`<details class="sorig"><summary>기출 문장 원문 ${s.items.length}개</summary><ul>${s.items.map(it=>`<li>${hl(it.t)}${it.f>=2?`<span class="freq">${it.f}회</span>`:''}</li>`).join('')}</ul></details>`;
    if(qcount[i]) b+=`<button class="sgo" data-sgo="${i}">이 주제 문제 풀기 (${qcount[i]}문제) →</button>`;
    return b+`</article>`;
  };
  const body=list.map(card).join('');
  let h=topbar()+`<div class="sec spage"><h1 class="stitle">핵심 요약</h1><p class="ssub">출제 범위를 과목별로 정리했어요. 카드 아래 버튼으로 그 주제 문제를 바로 풀 수 있어요.</p>
  <div class="stabs ${NS>3?'many':''}" role="tablist" style="grid-template-columns:repeat(${NS},1fr)">${SN.map(s=>`<button role="tab" aria-selected="${sumSubj===s}" data-v="${s}" class="${sumSubj===s?'on':''}"><small>SUBJECT ${s}</small>${SUBJ[s]}</button>`).join('')}</div>
  <div class="schips ${sumChips?'open':''}" id="sChips">${all.map(({s,i})=>`<button data-jump="${i}" class="${wcount[i]?'w':''}">${esc(s.t)}</button>`).join('')}</div>
  <button class="smore" id="sChipT">${sumChips?'주제 접기 ▴':`주제 ${all.length}개 모두 보기 ▾`}</button>
  <div class="stools"><input class="search" id="sQ" type="search" placeholder="검색 (예: 배열 수식, 기본키, IPv6)" value="${esc(sumQ)}">
  <div class="row"><button class="tog ${sumHot?'on':''}" id="sHotT">★ 자주 나온 주제만</button><button class="tog ${sumFlip?'on':''}" id="sFlipT">한 장씩 넘기기</button><button class="tog" id="sFlash">플래시 카드로 외우기</button>${PDFS.top?'<button class="tog" id="pdfTop">PDF 빈출 TOP</button>':''}${PDFS.full?'<button class="tog" id="pdfFull">PDF 전체</button>':''}</div><span class="hint" id="pdfMsg" role="status"></span></div>
  ${weak.length&&!ql?`<div class="sweak"><b>내가 약한 주제</b>${weak.slice(0,8).map(k=>`<button data-jump="${k}">${esc(S[k].t)} · ${wcount[k]}</button>`).join('')}</div>`:''}</div>`;
  h+= sumFlip&&body ? `<div class="sec"><div class="flipbar"><span>옆으로 넘기세요</span><span class="tabnum" id="flipPos">1 / ${list.length}</span></div><div class="flip" id="flip">${body}</div></div>` : `<div class="sec scards">${body||'<div class="empty">검색 결과가 없어요.</div>'}</div>`;
  h+=`<p class="hint" style="padding:0 2px 20px">★는 기출에 3번 이상 나온 내용이에요. 카드 아래 ‘기출 문장 원문’에서 실제 출제 문장을 볼 수 있어요.</p>`;
  app.innerHTML=h;
  app.querySelectorAll('.stabs button').forEach(b=>b.onclick=()=>{sumSubj=+b.dataset.v;renderSum();window.scrollTo(0,0);});
  $('#sHotT').onclick=()=>{sumHot=!sumHot;renderSum();};
  $('#sFlipT').onclick=()=>{sumFlip=!sumFlip;renderSum();};
  $('#sFlash').onclick=()=>openView('flash');
  $('#sChipT').onclick=()=>{sumChips=!sumChips;const y=window.scrollY;renderSum();window.scrollTo(0,y);};
  if($('#pdfTop'))$('#pdfTop').onclick=e=>exportPdf('top',e.currentTarget); if($('#pdfFull'))$('#pdfFull').onclick=e=>exportPdf('full',e.currentTarget);
  const fl=$('#flip'); if(fl) fl.onscroll=()=>{const w=fl.firstElementChild?fl.firstElementChild.offsetWidth+12:1;const p=$('#flipPos');if(p)p.textContent=`${Math.round(fl.scrollLeft/w)+1} / ${fl.children.length}`;};
  const qi=$('#sQ'); qi.oninput=()=>{sumQ=qi.value;const pos=qi.selectionStart;renderSum();const n=$('#sQ');n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}};
  app.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{const el=document.getElementById('sec'+b.dataset.jump);if(!el)return; if(sumFlip){el.scrollIntoView({block:'nearest',inline:'start'});} else {const y=el.getBoundingClientRect().top+window.scrollY-12;window.scrollTo(0,y);}});
  app.querySelectorAll('[data-sgo]').forEach(b=>b.onclick=()=>{const k=+b.dataset.sgo;const ids=shuffle(Q.filter(q=>q.sec===k&&!q.ob).map(q=>q.id)).slice(0,20);
    const go=()=>startSession({title:`주제 연습 · ${S[k].t}`,ids,instant:true,kind:'drill'});
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go();}); go();});
}


/* ---------- cram (벼락치기) ---------- */
let cramSet=null, cramRound='', cramPos=0, cramSec=null;
function cramView(){return store.pref.cview||'scroll';}
function cramSrcOpts(){
  const yrs=[...new Set(SETS.map(s=>s.slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort().reverse();
  const o=[['all','전체 문제'],...EX.cramSrc.map(x=>[x.v,x.l]),...yrs.map(y=>['Y'+y,`${y}년 기출`]),['R','🎲 랜덤 시험지']];
  return o.map(([v,l])=>`<option value="${v}" ${cramSrc===v?'selected':''}>${l}</option>`).join('');
}
let cramSubj=0, cramSrc='all', cramMine=false, cramShown=20, cramOrder=null;
function cramList(){
  if(cramSec!=null){let L=Q.filter(q=>q.sec===cramSec); if(cramMine) L=L.filter(q=>store.ans[q.id]&&store.ans[q.id].w>0); return L.sort((a,b)=>((store.ans[b.id]||{}).w||0)-((store.ans[a.id]||{}).w||0));}
  if(cramSrc==='R'){const r=randList().find(x=>x.no===cramSet)||randList()[0]; if(!r) return []; cramSet=r.no; let L=r.ids.map(id=>QM[id]).filter(Boolean).filter(q=>!cramSubj||q.s===cramSubj); if(cramMine) L=L.filter(q=>store.ans[q.id]&&store.ans[q.id].w>0); if(cramOrder){const pos={};cramOrder.forEach((id,i)=>pos[id]=i);L=L.slice().sort((a,b)=>(pos[a.id]??1e9)-(pos[b.id]??1e9));} return L;}
  let L=Q.filter(q=>(!cramSubj||q.s===cramSubj)&&(cramSrc==='all'||(cramSrc[0]==='Y'?(cramRound?q.set===cramRound:q.set.startsWith(cramSrc.slice(1))):(EX.cramSrc.find(x=>x.v===cramSrc)||{f:()=>true}).f(q))));
  if(cramMine) L=L.filter(q=>store.ans[q.id]&&store.ans[q.id].w>0);
  if(cramOrder){const pos={};cramOrder.forEach((id,i)=>pos[id]=i);L=L.slice().sort((a,b)=>(pos[a.id]??1e9)-(pos[b.id]??1e9));}
  return L;
}
function cramCard(q){
  const neg=!!(q.fx||q.neg);
  const opts=q.o.map((o,i)=>{const n=i+1, ok=n===q.a;
    if(neg){ return ok? `<li class="fix"><span class="ic">✕</span><span><span class="tx2">${MK[i]} ${markFix(q,o)}</span></span></li>` : `<li class="t"><span class="ic">✓</span><span class="tx">${MK[i]} ${esc(o)}</span></li>`; }
    return ok? `<li class="t key"><span class="ic">✓</span><span class="tx">${MK[i]} ${esc(o)}</span></li>` : `<li class="f"><span class="ic">✕</span><span class="tx">${MK[i]} ${esc(o)}</span></li>`;
  }).join('');
  const img = imgsHTML(q);
  const qtext = q.full&&q.img ? img : `<div class="q">${esc(q.q)}</div>${img}`;
  const e = q.eimg ? `<img class="qimg" loading="lazy" src="${q.eimg}" alt="해설">` : `<div class="more">${esc(q.e)}</div><button type="button" data-more>더 보기</button>`;
  return `<div class="cramcard"><div class="meta"><span class="chip s${q.s}">${q.s}과목</span>${esc(SL(q.set))} ${q.n}번 ${q.ob?'<span class="obchip">옛 버전</span> ':''}${neg?'<span class="neg">틀린 것 찾기</span>':'<span class="pos">맞는 것 찾기</span>'}${saveBtn(q.id)}</div>
  ${qtext}<ul class="facts">${opts}</ul>
  <div class="fixnote"><b>${neg?'해설':'정답 이유'}</b> ${e}</div>${tipHTML(q)}</div>`;
}
const cramAns={};
function cramSolve(q){
  const p=cramAns[q.id];
  if(p){ // 푼 뒤: 정답 표시 카드 + 내 답
    const ok=p===q.a;
    return `<div class="csolve ${ok?'csok':'csno'}"><div class="vt">${ok?'○ 정답':'✕ 오답'} <span class="muted">내 답 ${MK[p-1]} · 정답 ${MK[q.a-1]}</span><button class="iconbtn" data-cretry="${esc(q.id)}">다시 풀기</button></div>${cramCard(q)}</div>`;
  }
  const img=imgsHTML(q); const qtext=q.full&&q.img?img:`<div class="q">${esc(q.q)}</div>${img}`;
  return `<div class="cramcard"><div class="meta"><span class="chip s${q.s}">${q.s}과목</span>${esc(SL(q.set))} ${q.n}번 ${saveBtn(q.id)}</div>${qtext}
  <div class="opts">${q.o.map((o,i)=>`<button class="opt" data-cpick="${i+1}"><span class="n">${i+1}</span><span>${esc(o)}</span></button>`).join('')}</div>
  <p class="hint">답을 고르면 정답과 틀린 부분 고친 내용, 해설이 나와요.</p></div>`;
}
/* ---------- 벼락치기 CBT 시험지형 (정답 표시) ---------- */
let cpPage=0;
function renderCramPaper(){
  const L=cramList(); const PS=10, np=Math.max(1,Math.ceil(L.length/PS)); if(cpPage>=np) cpPage=np-1; if(cpPage<0) cpPage=0;
  document.body.classList.add('ppon'); nav.hidden=true;
  const from=cpPage*PS, list=L.slice(from,from+PS);
  const srcName=(()=>{const o=document.createElement('div');o.innerHTML=`<select>${cramSrcOpts()}</select>`;const s=o.querySelector('option[selected]');return s?s.textContent:'전체 문제';})();
  let h=`<div class="pp cp"><header class="pp-h"><div class="pp-l"><button class="pp-brand" id="cpHome" title="홈으로">${esc(EX.brand)}</button><button class="pp-sw" id="cpExit">← 벼락치기 목록으로</button></div>
  <h1>${esc(EX.name.replace(' 필기',''))} : 벼락치기 정답 시험지</h1>
  <div class="pp-r"><span class="pp-time">${esc(srcName)}${cramSubj?` · ${cramSubj}과목`:''}${cramMine?' · 내가 틀린 문제':''}</span><span class="pm">${L.length}문제 · 정답에 ● 표시</span></div></header>
  <div class="pp-body"><main class="pp-paper">${list.map((q,k)=>{const i=from+k;const neg=!!(q.fx||q.neg);
    const stem=q.full&&q.img?`<div class="pp-qt"><span>${i+1}.</span></div>${imgsHTML(q,'pp-img')}`:`<div class="pp-qt"><span>${i+1}.</span><span>${esc(q.q)}</span></div>${imgsHTML(q,'pp-img')}`;
    return `<section class="pp-q" id="pq${i}"><div class="cp-meta">${esc(SL(q.set))} ${q.n}번 · ${q.s}과목${neg?' · <b>틀린 것 찾기</b>':''}</div>${stem}<ol>${q.o.map((o,j)=>`<li><div class="cp-o ${j+1===q.a?'on':''}"><span class="m bub">${j+1}</span><span>${j+1===q.a?markFix(q,o):esc(o)}</span></div></li>`).join('')}</ol>
    <details class="cp-e"><summary>해설 보기</summary><div>${q.eimg?`<img class="pp-img" src="${q.eimg}" alt="해설">`:esc(q.e)}</div></details></section>`;}).join('')||'<p>해당하는 문제가 없어요.</p>'}</main>
  <aside class="pp-sheet"><h2>정 답 표</h2><div class="pp-omr">${L.map((q,i)=>`${i&&i%5===0?'<hr>':''}<div class="pr ${Math.floor(i/PS)===cpPage?'cur':''}"><b data-pgo="${i}">${String(i+1).padStart(2,'0')}.</b>${[1,2,3,4].map(n=>`<span class="${q.a===n?'on':''}">${n}</span>`).join('')}</div>`).join('')}</div></aside></div>
  <footer class="pp-f"><button id="cpPrev" ${cpPage===0?'disabled':''}>◀ 이전</button><span class="pp-pg">- ${cpPage+1} / ${np} -</span><button id="cpNext" ${cpPage>=np-1?'disabled':''}>다음 ▶</button><button class="pp-omrbtn" id="ppOmr">정답표</button></footer></div>`;
  app.innerHTML=h;
  const go=i=>{cpPage=Math.floor(i/PS);renderCramPaper();const e=document.getElementById('pq'+i);if(e)window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-80);};
  app.querySelectorAll('[data-pgo]').forEach(b=>b.onclick=()=>go(+b.dataset.pgo));
  $('#cpPrev').onclick=()=>{cpPage--;renderCramPaper();window.scrollTo(0,0);};
  $('#cpNext').onclick=()=>{cpPage++;renderCramPaper();window.scrollTo(0,0);};
  $('#ppOmr').onclick=()=>$('.pp-sheet').classList.toggle('open');
  $('#cpHome').onclick=()=>{store.pref.cview='scroll';save();document.body.classList.remove('ppon');nav.hidden=false;tab='home';render();window.scrollTo(0,0);};
  $('#cpExit').onclick=()=>{store.pref.cview='scroll';save();document.body.classList.remove('ppon');nav.hidden=false;renderCram();window.scrollTo(0,0);};
  const cur=app.querySelector('.pp-omr .pr.cur'); if(cur){const box=app.querySelector('.pp-omr');box.scrollTop=cur.offsetTop-box.offsetTop-40;}
}
function cramRec(){
  if(cramSec!=null) return `<div class="sec"><div class="panel recp"><b>주제: ${esc(S[cramSec].t)}</b><span class="hint">이 주제 문제만 모아 보는 중이에요. 내가 틀린 문제가 먼저 나와요.</span><button class="iconbtn" id="cRecX">전체 문제로 돌아가기</button></div></div>`;
  const ow=wrongIds(); if(!ow.length) return '';
  const open=ow.filter(isOpenWrong).length; const bySub=SN.map(s=>ow.filter(id=>QM[id].s===s).length);
  const wt=weakTopics().filter(w=>w.p<70).slice(0,3);
  return `<div class="sec"><div class="panel recp ${cramMine?'on':''}"><b>추천 · 내가 틀린 문제부터 보기</b><span class="hint">틀렸던 문제 ${ow.length}개${open?` (아직 못 맞힌 것 ${open}개)`:''}를 정답이 표시된 채로 먼저 훑어보세요. 시험 직전엔 이게 제일 효과적이에요.</span>
  <div class="row">${cramMine?`<button class="btn ghost" id="cRecOff">전체 문제 보기</button>`:`<button class="btn" id="cRecOn">틀린 문제 ${ow.length}개 보기</button>`}</div>
  <div class="recchips">${SN.map((s,i)=>bySub[i]?`<button data-recs="${s}">${s}과목 ${bySub[i]}</button>`:'').join('')}${wt.map(w=>`<button data-recsec="${w.k}">약한 주제 · ${esc(S[w.k].t)} ${w.p}%</button>`).join('')}</div></div></div>`;
}
/* 벼락치기 열람 코드 */
function cramOk(){if(store.pref&&store.pref.cramOk)return true;try{return localStorage.getItem('hae_cram_ok')==='1';}catch(e){return !!window.__cramOk;}}
function cramCode(v){const n=String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');let x=5381;for(const ch of n)x=((x*33)^ch.charCodeAt(0))>>>0;const h=x.toString(36);return h==='18esp9g'?'wish':h==='1g7ltp7'?'admin':'';}
function renderCramLock(){
  document.body.classList.remove('ppon'); nav.hidden=false;
  app.innerHTML=topbar()+`<div class="sec"><div class="panel lockp" id="lockP"><div class="lk-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>
  <b>벼락치기는 열람 코드가 필요해요</b><span class="hint">코드를 입력하면 벼락치기가 열려요.</span>
  <form id="lkF" autocomplete="off"><input id="lkIn" type="text" placeholder="열람 코드" aria-label="열람 코드" autocapitalize="off" spellcheck="false"><button class="btn" type="submit">열기</button></form>
  <span class="lk-err" id="lkErr"></span></div></div>`;
  const f=$('#lkF'), inp=$('#lkIn'), p=$('#lockP');
  f.onsubmit=e=>{e.preventDefault();
    const kind=cramCode(inp.value);if(!kind){$('#lkErr').textContent='코드가 달라요. 다시 입력해 주세요.';p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake');inp.select();return;}
    try{localStorage.setItem('hae_cram_ok','1');}catch(err){} window.__cramOk=true; store.pref.cramOk=1; if(kind==='admin')store.pref.admin=1; save();
    p.innerHTML=kind==='admin'?`<div class="lk-ok"><span class="lk-fr">ADMIN</span><b>관리자 모드로 열렸어요</b></div>`:`<div class="lk-ok"><span class="lk-fr">Que le ciel vous entende</span><b>하늘이 당신의 소원을 들어주길</b></div>`;
    setTimeout(()=>{if(tab==='cram'){renderCram();window.scrollTo(0,0);}},2200);};
}
function renderCram(){
  if(!cramOk()) return renderCramLock();
  if(cramView()==='paper') return renderCramPaper();
  document.body.classList.remove('ppon'); nav.hidden=false;
  const L=cramList(); const shown=L.slice(0,cramShown);
  let h=topbar()+`<div class="sec"><div class="panel confirm"><b>벼락치기 · 정답만 보며 훑기</b><span class="hint">문제를 풀지 않고 정답이 표시된 채로 넘겨봐요. ✓는 맞는 내용, ✕는 틀린 내용이에요. ‘틀린 것 찾기’ 문제는 ✕ 보기에서 <span class="wr">빨간 줄</span>이 틀린 부분, <span class="cr">초록 글씨</span>가 바르게 고친 내용이에요.</span><div class="row">${PDFS.cram?`<button class="btn ghost" id="cPdf">정답노트 PDF 저장${EX.cramPdfNote?' ('+EX.cramPdfNote+')':''}</button>`:''}</div><span class="hint" id="pdfMsg" role="status"></span></div></div>
  ${cramRec()}
  <div class="crambar ${cramView()==='one'?'nost':''}"><div class="seg" id="cSubj">${[0,...SN].map(s=>`<button data-v="${s}" class="${cramSubj===s?'on':''}">${s?s+'과목':'전체'}</button>`).join('')}</div>
  <div class="csel"><select id="cSrcSel" aria-label="문제 출처">${cramSrcOpts()}</select>${/^Y/.test(cramSrc)?`<select id="cRound" aria-label="회차">${['',...SETS.filter(s=>s.startsWith(cramSrc.slice(1))).sort()].map(s=>`<option value="${esc(s)}" ${cramRound===s?'selected':''}>${s?esc(s.slice(5).replace('.','월 ').replace(' 기출','일 시험')):'그해 전체 회차'}</option>`).join('')}</select>`:''}</div>
  ${cramSrc==='R'?`<div class="rpick">${randList().length?`<select id="cRset" aria-label="랜덤 시험지 고르기">${randList().map(r=>`<option value="${r.no}" ${r.no===cramSet?'selected':''}>${esc(r.t)} · ${RSRC[r.src].t}</option>`).join('')}</select>`:'<span class="hint">아직 만든 랜덤 시험지가 없어요.</span>'}<button class="iconbtn" id="cRnew">🎲 새로 뽑기</button>${randList().length?'<button class="iconbtn" id="cRgo">이 시험지 풀기</button>':''}</div>`:''}
  <div class="vseg" id="cvSeg"><span>보기</span><button data-v="scroll" class="${cramView()==='scroll'?'on':''}">스크롤로 쭉</button><button data-v="paper" class="${cramView()==='paper'?'on':''}">CBT 시험지로 보기</button><button data-v="one" class="${cramView()==='one'?'on':''}">한 문제씩 풀고 확인</button></div>
  <div class="cramcount"><span><label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="cMine" ${cramMine?'checked':''}> 내가 틀린 문제만</label></span><span><span class="tabnum">${L.length}</span>문제 · <button class="iconbtn" id="cShuf" style="padding:3px 8px">${cramOrder?'순서대로':'섞기'}</button></span></div></div>
  ${cramView()==='one'?(L.length?(()=>{if(cramPos>=L.length)cramPos=L.length-1;if(cramPos<0)cramPos=0;return `<div class="sec cone"><div class="conebar"><button class="btn ghost" id="cPrev" ${cramPos===0?'disabled':''}>◀ 이전</button><label class="cpos"><input id="cJump" type="number" min="1" max="${L.length}" value="${cramPos+1}" inputmode="numeric"> / ${L.length}</label><button class="btn" id="cNext" ${cramPos>=L.length-1?'disabled':''}>다음 ▶</button></div><div id="cOneCard">${cramSolve(L[cramPos])}</div><p class="hint" style="text-align:center">옆으로 밀어도 넘어가요</p></div>`;})():'<div class="empty">해당하는 문제가 없어요.</div>'):
  `<div class="sec">${shown.map(cramCard).join('')||'<div class="empty">해당하는 문제가 없어요.</div>'}${L.length>cramShown?`<button class="btn ghost" id="cMore">다음 20문제 더 보기 (${cramShown}/${L.length})</button>`:''}</div>`}`;
  app.innerHTML=h;
  const re=()=>{cramShown=20;cramPos=0;renderCram();window.scrollTo(0,0);};
  const ro=$('#cRecOn'); if(ro) ro.onclick=()=>{cramMine=true;cramSrc='all';cramSubj=0;cramSec=null;re();};
  const rf=$('#cRecOff'); if(rf) rf.onclick=()=>{cramMine=false;re();};
  const rx=$('#cRecX'); if(rx) rx.onclick=()=>{cramSec=null;re();};
  app.querySelectorAll('[data-recs]').forEach(b=>b.onclick=()=>{cramMine=true;cramSrc='all';cramSec=null;cramSubj=+b.dataset.recs;re();});
  app.querySelectorAll('[data-recsec]').forEach(b=>b.onclick=()=>{cramSec=+b.dataset.recsec;cramMine=false;re();});
  app.querySelectorAll('#cvSeg button').forEach(b=>b.onclick=()=>{store.pref.cview=b.dataset.v;save();re();});
  if(cramView()==='one'&&L.length){
    const go=k=>{cramPos=Math.max(0,Math.min(L.length-1,k));const y=window.scrollY;renderCram();window.scrollTo(0,Math.min(y,($('.cone')?$('.cone').getBoundingClientRect().top+window.scrollY-120:0)));};
    $('#cPrev').onclick=()=>go(cramPos-1); $('#cNext').onclick=()=>go(cramPos+1);
    $('#cJump').onchange=e=>go((+e.target.value||1)-1);
    const card=$('#cOneCard'); let sx=null,sy=null;
    card.querySelectorAll('[data-cpick]').forEach(b=>b.onclick=()=>{const q=L[cramPos];const n=+b.dataset.cpick;cramAns[q.id]=n;record(q.id,n);save();card.innerHTML=cramSolve(q);bindMore();bindRetry();});
    function bindRetry(){card.querySelectorAll('[data-cretry]').forEach(b=>b.onclick=()=>{delete cramAns[b.dataset.cretry];renderCram();});}
    bindRetry();
    card.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
    card.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(cramPos+(dx<0?1:-1));},{passive:true});
    document.onkeydown=e=>{if(tab!=='cram'||cramView()!=='one'||e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;if(e.key==='ArrowRight')go(cramPos+1);if(e.key==='ArrowLeft')go(cramPos-1);};
  }
  app.querySelectorAll('#cSubj button').forEach(b=>b.onclick=()=>{cramSubj=+b.dataset.v;re();});
  $('#cSrcSel').onchange=e=>{cramSrc=e.target.value;cramRound='';re();};
  const cr=$('#cRound'); if(cr) cr.onchange=e=>{cramRound=e.target.value;re();};
  $('#cMine').onchange=e=>{cramMine=e.target.checked;re();};
  const rs=$('#cRset'); if(rs) rs.onchange=()=>{cramSet=+rs.value;re();};
  const rn=$('#cRnew'); if(rn) rn.onclick=()=>{cramSet=makeRandom(rsrc()).no;re();};
  const rg=$('#cRgo'); if(rg) rg.onclick=()=>{const r=randList().find(x=>x.no===cramSet); if(!r) return; const go=()=>startExam({title:r.t,ids:r.ids}); if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go();}); go();};
  $('#cShuf').onclick=()=>{cramOrder=cramOrder?null:shuffle(Q.map(q=>q.id));re();};
  if($('#cPdf'))$('#cPdf').onclick=e=>exportPdf('cram',e.currentTarget);
  bindMore();
  const m=$('#cMore'); if(m){ m.onclick=()=>{cramShown+=20;const y=window.scrollY;renderCram();window.scrollTo(0,y);};
    if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();m.click();}},{rootMargin:'600px'});io.observe(m);} }
}
function bindMore(){app.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{const f=b.closest('.fixnote');f.classList.toggle('open');b.textContent=f.classList.contains('open')?'접기':'더 보기';});}

/* ---------- records ---------- */
function renderRec(){
  const rl=realSorted();
  let h=topbar()+`<div class="sec" id="anaSec"><div class="sech"><h2>나의 학습 분석</h2><button class="iconbtn" id="goCustom">맞춤학습 →</button></div>${anaCharts()}</div><div class="sec">${ddayForm()}</div>
  <div class="sec"><div class="sech"><h2>내 실제 시험 점수</h2><span class="muted" style="font-size:12px">${rl.length}회</span></div>`;
  if(rl.length>1){
    h+=`<div class="panel scroll-x"><table class="hist"><tr><th>날짜</th>${SN.map(s=>`<th>${s}과목</th>`).join('')}<th>평균</th><th>결과</th></tr>${rl.map(({r})=>{const a=analyzePrev(r.sub);return `<tr><td>${esc(r.d||'-')}</td>${r.sub.map(x=>`<td class="${x<40?'no':''}">${x}</td>`).join('')}<td><b>${a.avg}</b></td><td class="${a.pass?'ok':'no'}">${a.pass?'합격':'불합격'}</td></tr>`;}).join('')}</table></div>`;
  }
  h+=rl.map(({r,i})=>realCard(r,i,true)).join('');
  h+=realForm('rv',rl.length?'실제 시험 점수 추가':'실제 시험 점수 넣기','시험 보고 받은 과목별 점수를 넣으면 합격까지 남은 문제 수를 알려줘요.');
  h+=`</div><div class="sec"><div class="sech"><h2>앱 모의고사 기록</h2></div>`;
  if(!store.hist.length) h+=`<div class="empty">아직 모의고사 기록이 없어요. 한 번 풀어보세요.</div>`;
  else {
    h+=scoreCard(store.hist[0]);
    h+=`<div class="panel scroll-x"><table class="hist"><tr><th>시험</th>${SN.map(s=>`<th>${s}과목</th>`).join('')}<th>평균</th><th>결과</th></tr>${store.hist.map((r,i)=>`<tr data-h="${i}" style="cursor:pointer"><td>${esc(SL(r.title))}${r.kind==='practice'?' <small class="muted">연습</small>':''}</td>${r.sub.map(x=>`<td class="${x!==null&&x<40?'no':''}">${x===null?'-':x}</td>`).join('')}<td><b>${r.avg}</b></td><td class="${r.pass?'ok':'no'}">${r.pass?'합격':'불합격'}</td></tr>`).join('')}</table></div><p class="hint">줄을 누르면 그 시험의 틀린 문제를 볼 수 있어요.</p>`;
  }
  h+=`</div>
  <div class="sec"><button class="btn ghost" id="reset">모의고사 기록·오답노트 지우기</button><p class="hint">실제 시험 점수는 지워지지 않아요. 기록은 이 기기의 브라우저에만 저장돼요. 휴대폰과 컴퓨터 기록은 따로예요.</p></div>`;
  app.innerHTML=h;
  app.querySelectorAll('[data-h]').forEach(tr=>tr.onclick=()=>showResult(store.hist[+tr.dataset.h]));
  bindDday(()=>renderRec()); $('#goCustom').onclick=()=>openView('custom');
  bindRealForm('rv',()=>{renderRec();});
  app.querySelectorAll('[data-rdel]').forEach(b=>b.onclick=()=>confirmBox('이 시험 점수를 지울까요?',()=>{realList().splice(+b.dataset.rdel,1);save();renderRec();}));
  $('#reset').onclick=()=>confirmBox('푼 기록과 오답노트를 모두 지울까요? 되돌릴 수 없어요.',()=>{store={ans:{},hist:[],cur:null,pref:store.pref,prev:null,real:store.real||[],rand:store.rand||[],saved:store.saved||{}};save();render();});
}

/* ================= 추가 기능 (HAE) ================= */
const ICON={
 subj:'<path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
 rand:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="15" cy="9" r="1.3"/><circle cx="9" cy="15" r="1.3"/>',
 custom:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
 today:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M10 14l2 2 3-3"/>',
 flash:'<rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/>',
 notes:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 12l6 6M15 12l-6 6"/>',
 saved:'<path d="M7 3h10v18l-5-4-5 4z"/>',
 search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
 score:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
 chart:'<path d="M4 19h16"/><path d="M5 15l4-5 4 3 6-7"/>'
};
const ico=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
function dayKey(t){const d=t?new Date(t):new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function logAnswer(id,ok){
  store.day=store.day||{}; const d=dayKey(); const v=store.day[d]||[0,0]; ok?v[0]++:v[1]++; store.day[d]=v;
  store.log=(store.log||[]); store.log.push([id,ok?1:0]); if(store.log.length>400) store.log=store.log.slice(-400);
}
function streak(){const D=store.day||{};let n=0;const t=new Date();for(;;){const k=dayKey(t);if(D[k]&&D[k][0]+D[k][1]>0){n++;t.setDate(t.getDate()-1);}else break;}return n;}
/* D-day */
function dday(){const d=store.pref&&store.pref.examDate; if(!d) return null; const a=new Date(d+'T00:00:00'), b=new Date(dayKey()+'T00:00:00'); return Math.round((a-b)/864e5);}
function ddayChip(){const n=dday(); if(n===null) return ''; return `<span class="dday" title="시험일 ${esc(store.pref.examDate)}">${n>0?'D-'+n:n===0?'D-DAY':'D+'+(-n)}</span>`;}
/* 저장한 문제 */
function isSaved(id){return !!(store.saved&&store.saved[id]);}
function toggleSaved(id){store.saved=store.saved||{}; if(store.saved[id]) delete store.saved[id]; else store.saved[id]=Date.now(); save(); return isSaved(id);}
function saveBtn(id){return `<button class="savebtn ${isSaved(id)?'on':''}" data-save="${esc(id)}" aria-label="문제 저장" title="문제 저장">${ico('saved')}<span>${isSaved(id)?'저장됨':'저장'}</span></button>`;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-save]'); if(!b) return; e.stopPropagation(); const on=toggleSaved(b.dataset.save); document.querySelectorAll(`[data-save="${CSS.escape(b.dataset.save)}"]`).forEach(x=>{x.classList.toggle('on',on);const s=x.querySelector('span');if(s)s.textContent=on?'저장됨':'저장';});},true);
/* 풀이 이력 */
function histLine(id){const r=store.ans[id]; if(!r) return ''; const n=r.r+r.w; return `<div class="qhist">내 기록 · 이 문제 ${n}번 풀어 ${r.r}번 맞힘 · 최근 ${r.last==='r'?'<b class="ok">○</b>':'<b class="no">✕</b>'}${r.t?` (${new Date(r.t).getMonth()+1}/${new Date(r.t).getDate()})`:''}</div>`;}
/* 문제 정보 */
function infoBox(id){
  const q=QM[id]; const sec=S[q.sec]; const r=store.ans[id];
  const bg=document.createElement('div'); bg.className='sheetbg';
  bg.innerHTML=`<div class="sheet"><div class="sech"><h2>문제 정보</h2><button class="iconbtn" id="ifC">닫기</button></div>
  <dl class="skv"><dt>출처</dt><dd>${esc(SL(q.set))} ${q.n}번</dd><dt>과목</dt><dd>${q.s}과목 ${esc(SUBJ[q.s])}</dd>
  ${sec?`<dt>관련 요약</dt><dd>${esc(sec.t)}</dd>`:''}${q.g>1?`<dt>반복 출제</dt><dd>비슷한 문제가 ${q.g}개 회차에 나옴</dd>`:''}
  <dt>내 기록</dt><dd>${r?`${r.r+r.w}번 풀어 ${r.r}번 맞힘`:'아직 안 풂'}</dd><dt>저장</dt><dd>${isSaved(id)?'저장한 문제':'—'}</dd></dl>
  ${sec?`<button class="btn ghost" id="ifSum">이 주제 핵심요약 보기</button>`:''}</div>`;
  document.body.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#ifC').onclick=()=>bg.remove();
  const g=bg.querySelector('#ifSum'); if(g) g.onclick=()=>{bg.remove(); if(store.cur&&tab==='quiz') pauseCur(); sumSubj=q.s; sumQ=''; tab='sum'; view=null; render(); setTimeout(()=>{const el=document.getElementById('sec'+q.sec); if(el) window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-12);},30);};
}
/* 문항별 시간 */
function tickQ(c,newId){const now=Date.now(); if(c.qsId&&c.qsAt){c.qt=c.qt||{}; c.qt[c.qsId]=(c.qt[c.qsId]||0)+Math.min(600,(now-c.qsAt)/1000);} c.qsId=newId||null; c.qsAt=now;}
/* 시작 도우미 */
function startGuard(fn){ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;fn();}); fn(); }
function openView(type,extra){view=Object.assign({type},extra||{}); if(type==='analysis'){tab='rec';view=null;render();setTimeout(()=>{const el=$('#anaSec'); if(el) window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-10);},20);return;} tab='home'; render(); window.scrollTo(0,0);}
function subTop(title){return topbar()+`<div class="subhead"><button class="iconbtn" id="vBack">← 뒤로</button><h1>${title}</h1></div>`;}
function bindBack(){const b=$('#vBack'); if(b) b.onclick=()=>{view=null;render();window.scrollTo(0,0);};}

/* 홈 메뉴 */
function menuGrid(){
  const M=[['subj','과목별 풀이','drillSec'],['rand','랜덤 모의고사','randSec'],['custom','맞춤학습','v:custom'],['today','오늘의 문제','v:today'],['flash','플래시 카드','v:flash'],
           ['notes','오답노트','t:notes'],['saved','저장한 문제','v:saved'],['search','문제 검색','v:search'],['score','시험 성적','t:rec'],['chart','학습 분석','v:analysis']];
  return `<div class="mgrid">${M.map(([k,l,go])=>`<button data-go="${go}">${ico(k)}<span>${l}</span></button>`).join('')}</div>`;
}
function bindMenu(){
  app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go;
    if(g.startsWith('v:')) return openView(g.slice(2));
    if(g.startsWith('t:')){tab=g.slice(2);view=null;render();window.scrollTo(0,0);return;}
    const el=document.getElementById(g); if(el) window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-10);});
}
/* 진행 중인 회차 */
function setProgress(s){const ids=Q.filter(q=>q.set===s).map(q=>q.id); const done=ids.filter(id=>store.ans[id]).length; const times=store.hist.filter(h=>h.title===s).length; return {n:ids.length,done,times,p:ids.length?Math.round(done/ids.length*100):0};}
function ring(p,sz){sz=sz||44;const r=sz/2-4,c=2*Math.PI*r;return `<svg class="ring" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" aria-label="${p}%"><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="4"/><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 ${sz/2} ${sz/2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${sz*0.26}" font-weight="700" fill="var(--ink)">${p}%</text></svg>`;}
function progressBlock(){
  const act={}; Object.entries(store.ans).forEach(([id,r])=>{const q=QM[id]; if(q) act[q.set]=Math.max(act[q.set]||0,r.t||0);});
  const L=Object.keys(act).filter(s=>{const p=setProgress(s);return p.done>0&&!(EX.hide&&EX.hide(s));}).sort((a,b)=>act[b]-act[a]).slice(0,8);
  if(!L.length) return '';
  return `<div class="sec"><div class="sech"><h2>진행 중인 회차별 기출</h2></div><div class="pcards">${L.map(s=>{const p=setProgress(s);return `<div class="pcard"><div class="ph"><div><b>${esc(SL(s))}</b><span class="pm">${p.times?`${p.times}회 완료 · `:''}푼 문제 ${p.done} / 전체 ${p.n}</span>${(()=>{const h=store.hist.find(x=>x.title===s);return h?`<span class="pm">최근 ${h.avg}점${h.kind==='practice'?' (연습)':''} · ${h.pass?'합격':'불합격'}</span>`:'';})()}</div>${ring(p.p)}</div><div class="row2"><button class="iconbtn" data-pset="${esc(s)}" data-m="practice">연습모드</button><button class="iconbtn" data-pset="${esc(s)}" data-m="exam">시험모드</button></div></div>`;}).join('')}</div></div>`;
}
function bindProgress(){
  app.querySelectorAll('[data-pset]').forEach(b=>b.onclick=()=>{const s=b.dataset.pset;const all=Q.filter(q=>q.set===s).sort((a,b)=>a.n-b.n);
    if(b.dataset.m==='practice'){const ids=all.filter(q=>!store.ans[q.id]).concat(all.filter(q=>store.ans[q.id])).map(q=>q.id); startGuard(()=>startExam({title:s,ids},true));}
    else startGuard(()=>startExam({title:s,ids:all.map(q=>q.id)}));});
}
/* 오늘의 문제 */
function seedRand(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return ((h>>>0)%100000)/100000;};}
function todaySet(){
  const d=dayKey(); if(store.today&&store.today.d===d) return store.today;
  const rnd=seedRand(EX.key+d); const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const ow=sh(openWrong()).slice(0,3); const pool=Q.filter(q=>!q.ob&&!ow.includes(q.id)); const un=sh(pool.filter(q=>!store.ans[q.id])); const per=Math.ceil((10-ow.length)/NS);
  let ids=ow.slice(); SN.forEach(s=>{ids=ids.concat(un.filter(q=>q.s===s).slice(0,per).map(q=>q.id));}); ids=ids.slice(0,10);
  if(ids.length<10) ids=ids.concat(sh(pool).map(q=>q.id).filter(id=>!ids.includes(id)).slice(0,10-ids.length));
  store.today={d,ids}; save(); return store.today;
}
function renderToday(){
  const T=todaySet(); const done=T.ids.filter(id=>{const r=store.ans[id];return r&&r.t&&dayKey(r.t)===T.d;}); const ok=done.filter(id=>store.ans[id].last==='r').length;
  let h=subTop('오늘의 문제')+`<div class="sec"><div class="panel confirm"><b>${T.d.slice(5).replace('-','월 ')}일 · 10문제</b><span class="hint">매일 새 10문제가 나와요. 아직 못 맞힌 오답 몇 개와 안 풀어본 문제를 과목별로 섞었어요.</span>
  <div class="tstats"><div><b>${done.length}/10</b><span>오늘 푼 문제</span></div><div><b>${ok}</b><span>맞힌 문제</span></div><div><b>${streak()}일</b><span>연속 공부</span></div></div>
  <button class="btn" id="tGo">${done.length>=10?'다시 풀기':done.length?'이어서 풀기':'오늘의 문제 풀기'}</button></div></div>
  <div class="sec">${T.ids.map(id=>{const q=QM[id];const r=store.ans[id];const did=r&&r.t&&dayKey(r.t)===T.d;return `<div class="qrow"><span class="no">${did?(r.last==='r'?'<b class="ok">○</b>':'<b class="no">✕</b>'):'·'}</span><span class="tx">${esc(q.q)}</span><span class="cnt">${q.s}과목</span></div>`;}).join('')}</div>`;
  app.innerHTML=h; bindBack();
  $('#tGo').onclick=()=>{const ids=done.length>=10?T.ids:T.ids.filter(id=>!done.includes(id)).concat(done); startGuard(()=>startSession({title:'오늘의 문제',ids,instant:true,kind:'drill'}));};
}
/* 저장한 문제 */
function renderSaved(){
  const ids=Object.keys(store.saved||{}).filter(id=>QM[id]).sort((a,b)=>store.saved[b]-store.saved[a]);
  let h=subTop('저장한 문제')+`<div class="sec"><p class="hint">문제 화면·벼락치기·오답노트에서 ‘저장’을 누른 문제가 모여요.</p>${ids.length?`<button class="btn" id="svGo">저장한 ${ids.length}문제 풀기</button>`:''}</div>
  <div class="sec">${ids.map(id=>cramCard(QM[id])).join('')||'<div class="empty">아직 저장한 문제가 없어요.</div>'}</div>`;
  app.innerHTML=h; bindBack(); bindMore();
  const g=$('#svGo'); if(g) g.onclick=()=>startGuard(()=>startSession({title:'저장한 문제',ids:shuffle(ids),instant:true,kind:'drill'}));
}
/* 문제 검색 */
let srchQ='', srchS=0;
function renderSearch(){
  const ql=srchQ.trim().toLowerCase();
  const L=ql.length<2?[]:Q.filter(q=>(!srchS||q.s===srchS)&&(q.q+' '+q.o.join(' ')+' '+(q.e||'')+' '+SL(q.set)).toLowerCase().includes(ql));
  let h=subTop('문제 검색')+`<div class="sec"><input class="search" id="srQ" type="search" placeholder="두 글자 이상 (예: 정규화, VLOOKUP, 철근)" value="${esc(srchQ)}">
  <div class="seg" id="srS">${[0,...SN].map(s=>`<button data-v="${s}" class="${srchS===s?'on':''}">${s?s+'과목':'전체'}</button>`).join('')}</div>
  ${ql.length>=2?`<div class="cramcount"><span>${L.length}문제 찾음${L.length>40?' · 앞 40개만 보여요':''}</span>${L.length?`<button class="iconbtn" id="srGo">찾은 문제 풀기</button>`:''}</div>`:'<p class="hint">문제·보기·해설에서 찾아요.</p>'}</div>
  <div class="sec">${L.slice(0,40).map(cramCard).join('')}</div>`;
  app.innerHTML=h; bindBack(); bindMore();
  if(ql){const rx=new RegExp(ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'); app.querySelectorAll('.scards,.sec .cramcard .q,.sec .cramcard .tx,.sec .cramcard .tx2').forEach(el=>{if(el.children.length===0) el.innerHTML=el.innerHTML.replace(rx,m=>`<span class="hl">${m}</span>`);});}
  const qi=$('#srQ'); qi.oninput=()=>{srchQ=qi.value;const pos=qi.selectionStart;renderSearch();const n=$('#srQ');n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}};
  app.querySelectorAll('#srS button').forEach(b=>b.onclick=()=>{srchS=+b.dataset.v;renderSearch();});
  const g=$('#srGo'); if(g) g.onclick=()=>startGuard(()=>startSession({title:`검색: ${srchQ}`,ids:shuffle(L.map(q=>q.id)).slice(0,60),instant:true,kind:'drill'}));
}
/* 취약점 분석 · 맞춤학습 */
function subjAcc(){const a={};SN.forEach(s=>a[s]=[0,0]); (store.log||[]).slice(-100).forEach(([id,ok])=>{const q=QM[id]; if(q){a[q.s][1]++; if(ok)a[q.s][0]++;}}); return a;}
function secAcc(){const a={}; Object.entries(store.ans).forEach(([id,r])=>{const q=QM[id]; if(!q||q.sec==null) return; const v=a[q.sec]||[0,0]; v[0]+=r.r; v[1]+=r.r+r.w; a[q.sec]=v;}); return a;}
function radar(vals,labels,sz){
  sz=sz||260; const cx=sz/2, cy=sz/2+6, R=sz*0.32, n=vals.length; const pt=(i,f)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*R*f, cy+Math.sin(a)*R*f];};
  let g=''; [0.25,0.5,0.75,1].forEach(f=>{g+=`<polygon points="${vals.map((_,i)=>pt(i,f).join(',')).join(' ')}" fill="none" stroke="var(--line)" stroke-width="1"/>`;});
  vals.forEach((_,i)=>{const [x,y]=pt(i,1);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`;});
  g+=`<polygon points="${vals.map((v,i)=>pt(i,Math.max(.03,v/100)).join(',')).join(' ')}" fill="var(--ink)" fill-opacity=".14" stroke="var(--ink)" stroke-width="2"/>`;
  vals.forEach((v,i)=>{const [x,y]=pt(i,Math.max(.03,v/100));g+=`<circle cx="${x}" cy="${y}" r="3.5" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>`;});
  labels.forEach((l,i)=>{const [x,y]=pt(i,1.28);g+=`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="11.5" fill="var(--ink2)">${esc(l)}</text><text x="${x}" y="${y+14}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">${vals[i]}%</text>`;});
  return `<svg class="radar" viewBox="-50 -6 ${sz+100} ${sz+24}" role="img" aria-label="과목별 정답률">${g}</svg>`;
}
function weakTopics(){const A=secAcc(); return Object.entries(A).filter(([k,v])=>v[1]>=2&&S[k]).map(([k,v])=>({k:+k,p:Math.round(v[0]/v[1]*100),n:v[1]})).sort((a,b)=>a.p-b.p||b.n-a.n);}
function renderCustom(){
  const sa=subjAcc(); const tot=SN.reduce((a,s)=>a+sa[s][1],0);
  const vals=SN.map(s=>sa[s][1]?Math.round(sa[s][0]/sa[s][1]*100):0);
  const wt=weakTopics().filter(w=>w.p<80).slice(0,4);
  store.road=store.road||{};
  let steps=wt.length?wt:SN.map(s=>({s,p:vals[s-1]})).sort((a,b)=>a.p-b.p).slice(0,4).map(x=>({subj:x.s,p:x.p}));
  let h=subTop('맞춤학습')+`<div class="sec"><div class="panel confirm"><b>취약점 분석</b><span class="hint">${tot?`최근 푼 ${tot}문제 기준 과목별 정답률이에요.`:'아직 푼 문제가 없어요. 문제를 풀면 과목별 정답률이 그려져요.'}</span>${radar(vals,SN.map(s=>SUBJ[s]))}</div></div>
  <div class="sec"><div class="panel confirm"><b>학습 로드맵</b><span class="hint">${wt.length?'정답률이 낮은 주제부터 차례로 10문제씩 풀어요. 70% 이상 맞히면 체크돼요.':'주제별 기록이 쌓이기 전이라 정답률 낮은 과목부터 시작해요.'}</span>
  <ol class="road">${steps.map((w,i)=>{const key=w.k!=null?'s'+w.k:'p'+w.subj; const done=store.road[key]; const name=w.k!=null?S[w.k].t:`${w.subj}과목 ${SUBJ[w.subj]}`;return `<li class="${done?'done':''}"><span class="dot">${done?'✓':i+1}</span><div><b>${esc(name)}</b><span>${w.k!=null?`${SUBJ[S[w.k].s]} · 내 정답률 ${w.p}%`:`정답률 ${w.p}%`}</span></div><button class="iconbtn" data-road="${key}">${done?'다시':'10문제'}</button></li>`;}).join('')}</ol></div></div>`;
  app.innerHTML=h; bindBack();
  app.querySelectorAll('[data-road]').forEach(b=>b.onclick=()=>{const key=b.dataset.road; const pool=key[0]==='s'?Q.filter(q=>q.sec===+key.slice(1)&&!q.ob):Q.filter(q=>q.s===+key.slice(1)&&!q.ob);
    const wr=shuffle(pool.filter(q=>isOpenWrong(q.id))), un=shuffle(pool.filter(q=>!store.ans[q.id])), rest=shuffle(pool.filter(q=>store.ans[q.id]&&!isOpenWrong(q.id)));
    const ids=wr.concat(un,rest).slice(0,10).map(q=>q.id); startGuard(()=>startSession({title:'맞춤학습',ids,instant:true,kind:'drill',road:key}));});
}
/* 학습 분석 차트 */
function anaCharts(){
  const D=store.day||{}; const keys=Object.keys(D).sort().slice(-10);
  if(!keys.length) return `<div class="empty">문제를 풀면 날짜별 정답률과 푼 문제 수가 그려져요.</div>`;
  const W=320,H=150,pl=30,pr=10,pt=12,pb=28, iw=W-pl-pr, ih=H-pt-pb, n=keys.length, x=i=>pl+(n===1?iw/2:i*iw/(n-1));
  const lbl=keys.map(k=>k.slice(5).replace('-','/'));
  const acc=keys.map(k=>{const v=D[k];return Math.round(v[0]/(v[0]+v[1])*100);});
  const y1=v=>pt+ih-(v/100)*ih;
  let a=`<svg viewBox="0 0 ${W} ${H}" class="achart" role="img" aria-label="날짜별 정답률">`;
  [0,20,40,60,80,100].forEach(v=>{a+=`<line x1="${pl}" x2="${W-pr}" y1="${y1(v)}" y2="${y1(v)}" stroke="var(--line)" stroke-width="${v===60?1.4:.8}" ${v===60?'stroke-dasharray="4 3"':''}/><text x="${pl-6}" y="${y1(v)}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="var(--ink3)">${v}</text>`;});
  a+=`<polyline points="${acc.map((v,i)=>x(i)+','+y1(v)).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2"/>`;
  acc.forEach((v,i)=>{a+=`<circle cx="${x(i)}" cy="${y1(v)}" r="3.2" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"><title>${lbl[i]} ${v}%</title></circle>`;});
  lbl.forEach((l,i)=>{a+=`<text x="${x(i)}" y="${H-10}" font-size="9" text-anchor="middle" fill="var(--ink3)">${l}</text>`;}); a+='</svg>';
  const mx=Math.max(...keys.map(k=>D[k][0]+D[k][1])); const top=Math.max(10,Math.ceil(mx/10)*10); const y2=v=>pt+ih-(v/top)*ih; const bw=Math.min(22,iw/n*0.55);
  let b=`<svg viewBox="0 0 ${W} ${H}" class="achart" role="img" aria-label="날짜별 푼 문제 수">`;
  [0,.25,.5,.75,1].forEach(f=>{const v=Math.round(top*f);b+=`<line x1="${pl}" x2="${W-pr}" y1="${y2(v)}" y2="${y2(v)}" stroke="var(--line)" stroke-width=".8"/><text x="${pl-6}" y="${y2(v)}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="var(--ink3)">${v}</text>`;});
  keys.forEach((k,i)=>{const [r,w]=D[k];const cx=x(i);b+=`<rect x="${cx-bw/2}" y="${y2(r+w)}" width="${bw}" height="${y2(0)-y2(w)}" fill="var(--bad)" opacity=".55"><title>${lbl[i]} 틀림 ${w}</title></rect><rect x="${cx-bw/2}" y="${y2(r)}" width="${bw}" height="${y2(0)-y2(r)}" fill="var(--ok)" opacity=".8"><title>${lbl[i]} 맞음 ${r}</title></rect><text x="${cx}" y="${y2(r+w)-4}" font-size="9" text-anchor="middle" fill="var(--ink2)">${r+w}</text>`;});
  lbl.forEach((l,i)=>{b+=`<text x="${x(i)}" y="${H-10}" font-size="9" text-anchor="middle" fill="var(--ink3)">${l}</text>`;}); b+='</svg>';
  const T=keys.reduce((s,k)=>[s[0]+D[k][0],s[1]+D[k][1]],[0,0]); const all=Object.values(D).reduce((s,v)=>[s[0]+v[0],s[1]+v[1]],[0,0]);
  return `<div class="tstats"><div><b>${all[0]+all[1]}</b><span>전체 푼 문제</span></div><div><b>${all[0]+all[1]?Math.round(all[0]/(all[0]+all[1])*100):0}%</b><span>전체 정답률</span></div><div><b>${Object.keys(D).length}일</b><span>공부한 날</span></div><div><b>${streak()}일</b><span>연속</span></div></div>
  <div class="panel"><div class="chd"><b>정답률</b><span>점선 60%</span></div>${a}</div>
  <div class="panel"><div class="chd"><b>푼 문제 수</b><span><i class="lg ok"></i>맞음 <i class="lg no"></i>틀림</span></div>${b}<p class="hint">* 공부한 날 기준, 최근 10일</p></div>`;
}
/* 플래시 카드 */
let fl=null;
function flashDeck(subj,hot){
  const D=[];
  S.forEach((s,i)=>{ if(subj&&s.s!==subj) return; const H=new Set(s.hot||[]);
    const push=(f,b,isHot)=>{ if(hot&&!isHot) return; D.push({f,b,t:s.t,s:s.s,i}); };
    if(s.table) s.table.r.forEach(r=>push(r[0],s.table.h.slice(1).map((h,j)=>`${h}: ${r[j+1]}`).join('\n'),H.has(r[0])));
    if(s.kv) s.kv.forEach(([k,v])=>push(k,v,H.has(k)));
    if(!s.table&&!s.kv) s.items.forEach(it=>{const m=it.t.match(/^(.{2,28}?)\s*(?::|=|：|→)\s*(.+)$/); if(m) push(m[1],m[2],it.f>=3); else push(s.t+' — 빈칸 채우기',it.t,it.f>=3);});
  });
  return D;
}
function renderFlash(){
  if(!fl||fl.ex!==EX.key){fl={ex:EX.key,subj:0,hot:false,deck:null,i:0,ok:0,no:0,miss:[],flip:false};}
  if(!fl.deck){fl.deck=shuffle(flashDeck(fl.subj,fl.hot));fl.i=0;fl.ok=0;fl.no=0;fl.miss=[];fl.flip=false;}
  const N=fl.deck.length, c=fl.deck[fl.i];
  let h=subTop('플래시 카드')+`<div class="sec"><div class="seg" id="fS">${[0,...SN].map(s=>`<button data-v="${s}" class="${fl.subj===s?'on':''}">${s?s+'과목':'전체'}</button>`).join('')}</div>
  <div class="vseg"><button id="fHot" class="${fl.hot?'on':''}">★ 자주 나온 것만</button><button id="fNew">새로 섞기</button></div></div>`;
  if(!N){h+=`<div class="empty">카드가 없어요.</div>`;}
  else if(fl.i>=N){h+=`<div class="sec"><div class="panel confirm" style="text-align:center"><b>한 바퀴 끝!</b><div class="tstats"><div><b>${fl.ok}</b><span>알았어요</span></div><div><b>${fl.no}</b><span>몰랐어요</span></div></div>${fl.miss.length?`<button class="btn" id="fMiss">모른 ${fl.miss.length}장만 다시</button>`:''}<button class="btn ghost" id="fAgain">처음부터 다시</button></div></div>`;}
  else {h+=`<div class="sec"><div class="fbar"><span>${fl.i+1}/${N}</span><div class="progress"><i style="width:${(fl.i)/N*100}%"></i></div></div>
  <button class="fcard ${fl.flip?'turned':''}" id="fCard" aria-label="카드 뒤집기"><span class="ft">${esc(SUBJ[c.s]||'')} · ${esc(c.t)}</span>${fl.flip?`<span class="fb">${esc(c.b).replace(/\n/g,'<br>')}</span><span class="fq">${esc(c.f)}</span>`:`<span class="ff">${esc(c.f)}</span><span class="fh">눌러서 뒤집기</span>`}</button>
  <div class="frow"><button class="fno" id="fNo">✕ <span>${fl.no}</span></button><button class="fok" id="fOk"><span>${fl.ok}</span> ○</button></div><p class="hint" style="text-align:center">뒤집어서 확인하고, 알았으면 ○ 몰랐으면 ✕</p></div>`;}
  app.innerHTML=h; bindBack();
  app.querySelectorAll('#fS button').forEach(b=>b.onclick=()=>{fl.subj=+b.dataset.v;fl.deck=null;renderFlash();});
  $('#fHot').onclick=()=>{fl.hot=!fl.hot;fl.deck=null;renderFlash();}; $('#fNew').onclick=()=>{fl.deck=null;renderFlash();};
  const fc=$('#fCard'); if(fc) fc.onclick=()=>{fl.flip=!fl.flip;renderFlash();};
  const nx=ok=>{if(ok)fl.ok++;else{fl.no++;fl.miss.push(fl.deck[fl.i]);} fl.i++; fl.flip=false; renderFlash();};
  const a=$('#fOk'),b=$('#fNo'); if(a)a.onclick=()=>nx(true); if(b)b.onclick=()=>nx(false);
  const m=$('#fMiss'); if(m) m.onclick=()=>{fl.deck=shuffle(fl.miss);fl.i=0;fl.ok=0;fl.no=0;fl.miss=[];renderFlash();};
  const ag=$('#fAgain'); if(ag) ag.onclick=()=>{fl.deck=null;renderFlash();};
  if(fc){let sx=null;fc.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});fc.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>70){e.preventDefault();nx(dx>0);}},{passive:false});}
}
/* D-day 설정 */
function ddayForm(){return `<div class="panel confirm" id="ddayP"><b>시험일 (D-day)</b><div class="row" style="align-items:center"><input class="search" type="date" id="ddIn" value="${esc(store.pref.examDate||'')}" style="flex:1"><button class="iconbtn" id="ddSave">저장</button>${store.pref.examDate?'<button class="iconbtn" id="ddDel">지우기</button>':''}</div><span class="hint">정하면 위쪽에 D-day가 보여요.</span></div>`;}
function bindDday(re){const s=$('#ddSave'); if(s) s.onclick=()=>{store.pref.examDate=$('#ddIn').value||null;save();re();}; const d=$('#ddDel'); if(d) d.onclick=()=>{store.pref.examDate=null;save();re();};}

if(store.cur){pauseCur();}
render();
cloudInit();
window.addEventListener('pagehide',()=>{if(CLOUD.db&&CLOUD.state==='saving'){clearTimeout(CLOUD.timer);cloudWrite();}});
document.addEventListener('visibilitychange',()=>{ if(document.hidden && store.cur && tab==='quiz') save(); });
})();
