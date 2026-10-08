(function(){
const Q=window.QDATA;
const S=window.SDATA;
const IMG=window.IMGDATA||{};
Q.forEach(q=>{if(q.img&&IMG[q.img])q.img=IMG[q.img];if(q.eimg&&IMG[q.eimg])q.eimg=IMG[q.eimg];});
const QM={}; Q.forEach(q=>QM[q.id]=q);
const SUBJ=['','컴퓨터 일반','스프레드시트 일반','데이터베이스 일반'];
const SETS=[...new Set(Q.map(q=>q.set))];
const MK='①②③④';
const KEY='comhwal1_v1';
let store={ans:{},hist:[],cur:null,pref:{instant:true}};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s) store=Object.assign(store,s);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}
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
  store.ans[id]=r;
}
function isOpenWrong(id){const r=store.ans[id];return r&&r.w>0&&r.last==='w';}
function wrongIds(){return Object.keys(store.ans).filter(id=>QM[id]&&store.ans[id].w>0);}
function openWrong(){return wrongIds().filter(isOpenWrong);}
function score(ids,picks){
  const sc={1:[0,0],2:[0,0],3:[0,0]};
  ids.forEach(id=>{const q=QM[id];sc[q.s][1]++; if(picks[id]===q.a) sc[q.s][0]++;});
  const sub=[1,2,3].map(s=>sc[s][1]?Math.round(sc[s][0]/sc[s][1]*100):null);
  const valid=sub.filter(x=>x!==null);
  const tot=valid.reduce((a,b)=>a+b,0);
  const avg=valid.length?Math.round(tot/valid.length*100)/100:0;
  const pass=valid.length===3 && avg>=60 && valid.every(x=>x>=40);
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
function subjChip(s){return `<span class="chip s${s}">${s}과목 ${SUBJ[s]}</span>`;}

/* ---------- sessions ---------- */
function startSession(opt){
  store.cur={title:opt.title,ids:opt.ids,picks:{},done:{},flags:{},instant:opt.instant,cbt:!!opt.cbt,fs:1,page:0,limit:opt.limit||null,start:Date.now(),used:0,idx:0,kind:opt.kind||'exam',set:opt.set||null};
  save(); tab='quiz'; render();
}
function elapsed(c){return c.used+(c.paused?0:(Date.now()-c.start)/1000);}
function remaining(c){return c.limit? c.limit-elapsed(c):null;}
function pauseCur(){const c=store.cur;if(c&&!c.paused){c.used=elapsed(c);c.paused=true;save();}}
function resumeCur(){const c=store.cur;if(c&&c.paused){c.paused=false;c.start=Date.now();save();}}

function finish(){
  const c=store.cur; if(!c) return;
  if(!c.instant){c.ids.forEach(id=>{if(c.picks[id]) record(id,c.picks[id]);});}
  const sc=score(c.ids,c.picks);
  const res={title:c.title,kind:c.kind,date:Date.now(),ids:c.ids,picks:c.picks,sub:sc.sub,avg:sc.avg,tot:sc.tot,pass:sc.pass,dur:Math.round(elapsed(c)),n:c.ids.length,correct:c.ids.filter(id=>c.picks[id]===QM[id].a).length};
  store.hist.unshift(res); store.hist=store.hist.slice(0,40);
  store.cur=null; save(); clearInterval(tick);
  showResult(res);
}

/* ---------- render ---------- */
function setNav(){
  nav.hidden = (tab==='quiz');
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
  if(tab==='quiz' && store.cur) return store.cur.cbt?renderCBT():renderQuiz();
  if(tab==='quiz') tab='home';
  if(view&&view.type==='result') return renderResult(view.res);
  if(tab==='home') return renderHome();
  if(tab==='notes') return renderNotes();
  if(tab==='sum') return renderSum();
  if(tab==='rec') return renderRec();
  if(tab==='cram') return renderCram();
}

function topbar(extra){return `<div class="top"><div class="brand">컴활1급 필기 특훈<small>COMPUTER SPECIALIST · LEVEL 1 · WRITTEN</small></div><div class="sp"></div>${extra||''}</div>`;}

function subjStats(){
  const st={1:[0,0],2:[0,0],3:[0,0]};
  Object.entries(store.ans).forEach(([id,r])=>{const q=QM[id];if(!q)return;st[q.s][1]++;if(r.last==='r')st[q.s][0]++;});
  return st;
}

const MAINSETS=SETS.filter(s=>{const q=Q.find(x=>x.set===s);return q.id[0]==='K'||q.id[0]==='M';});
const OLDSETS=SETS.filter(s=>Q.find(x=>x.set===s).id[0]==='O').sort();
let oldOpen=false;
function setBtn(s){
  const setDone={}; store.hist.forEach(h=>{if(h.kind==='exam'&&!setDone[h.title]) setDone[h.title]=h;});
  const rnd=s==='랜덤 모의고사'; const n=rnd?60:Q.filter(q=>q.set===s).length; const d=setDone[rnd?'':s];
  const label=rnd?'🎲 랜덤 60문항':s.replace('2024 기출','2024 상시');
  const sub=d?`최근 ${d.avg}점 · ${d.pass?'합격':'불합격'}`:(rnd?'전체에서 과목별 20문항':`${n}문항${s.startsWith('2024')?' · 실제 기출':''}`);
  return `<button class="setbtn ${d?'done':''}" data-set="${esc(s)}"><b>${esc(label)}</b><span>${sub}</span></button>`;
}
/* ---------- 랜덤 실전 모의고사 ---------- */
const RSRC={K:{t:'기출만',d:'2024 상시 + 지난 기출 2010~2020'},A:{t:'기출+모의',d:'모든 문제'}};
function qKey(q){return (q.q.replace(/[\s\W_]+/g,'').slice(0,36))+'|'+(q.o[q.a-1]||'').replace(/[\s\W_]+/g,'').slice(0,16);}
function randList(){if(!store.rand)store.rand=[];return store.rand;}
function makeRandom(src){
  const pool=Q.filter(q=>!q.ob&&(src==='A'||q.id[0]!=='M'));
  const ids=[];
  [1,2,3].forEach(s=>{const P=pool.filter(q=>q.s===s);
    const un=shuffle(P.filter(q=>!store.ans[q.id])), wr=shuffle(P.filter(q=>store.ans[q.id]&&store.ans[q.id].last==='w')), rest=shuffle(P.filter(q=>store.ans[q.id]&&store.ans[q.id].last!=='w'));
    const seen=new Set(); let k=0;
    for(const q of un.concat(wr,rest)){const key=qKey(q); if(seen.has(key)) continue; seen.add(key); ids.push(q.id); if(++k===20) break;}
  });
  const L=randList(); const no=(L.reduce((m,r)=>Math.max(m,r.no),0))+1;
  const r={no,t:`랜덤 실전 ${no}회`,src,ids,d:Date.now()}; L.unshift(r); store.rand=L.slice(0,30); save(); return r;
}
function randBlock(){
  const L=randList(); const src=store.pref.rsrc||'K';
  const setDone={}; store.hist.forEach(h=>{if(!setDone[h.title]) setDone[h.title]=h;});
  return `<div class="panel confirm randp"><b>🎲 랜덤 실전 모의고사</b><span class="hint">기출에서 과목별 20문항씩 60문항을 뽑아 새 시험지를 만들어요. 안 푼 문제 → 틀린 문제 순으로 먼저 뽑고, 똑같은 문제는 한 번만 넣어요.</span>
  <div class="seg" id="rSrc">${Object.entries(RSRC).map(([k,v])=>`<button data-v="${k}" class="${src===k?'on':''}">${v.t}</button>`).join('')}</div>
  <span class="hint" style="margin-top:-4px">${RSRC[src].d} · 옛 버전 내용 제외</span>
  <div class="row"><button class="btn" id="rNew">새 시험지 풀기</button><button class="btn ghost" id="rNewCram">새 시험지 벼락치기</button></div>
  ${L.length?`<div class="rlist">${L.slice(0,8).map(r=>{const d=setDone[r.t];return `<div class="ritem"><div><b>${esc(r.t)}</b><span>${RSRC[r.src].t} · ${new Date(r.d).getMonth()+1}/${new Date(r.d).getDate()}${d?` · 최근 ${d.avg}점 ${d.pass?'합격':'불합격'}`:''}</span></div><button class="iconbtn" data-rgo="${r.no}">풀기</button><button class="iconbtn" data-rcram="${r.no}">벼락치기</button></div>`;}).join('')}</div>`:''}</div>`;
}
function bindRand(){
  app.querySelectorAll('#rSrc button').forEach(b=>b.onclick=()=>{store.pref.rsrc=b.dataset.v;save();renderHome();});
  const go=r=>{ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go(r);}); startSession({title:r.t,ids:r.ids,instant:curMode()==='instant',cbt:curMode()==='cbt',limit:3600,kind:'exam'}); };
  const cram=r=>{cramSet=r.no;cramSrc='R';cramSubj=0;cramMine=false;cramOrder=null;cramShown=20;tab='cram';view=null;render();window.scrollTo(0,0);};
  const nb=$('#rNew'); if(nb) nb.onclick=()=>{ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;nb.click();}); go(makeRandom(store.pref.rsrc||'K')); };
  const nc=$('#rNewCram'); if(nc) nc.onclick=()=>cram(makeRandom(store.pref.rsrc||'K'));
  app.querySelectorAll('[data-rgo]').forEach(b=>b.onclick=()=>go(randList().find(r=>r.no===+b.dataset.rgo)));
  app.querySelectorAll('[data-rcram]').forEach(b=>b.onclick=()=>cram(randList().find(r=>r.no===+b.dataset.rcram)));
}
function curMode(){return store.pref.mode||(store.pref.instant?'instant':'exam');}
function renderHome(){
  const c=store.cur; // null here since tab home with cur => still allow resume
  const st=subjStats();
  const setDone={}; store.hist.forEach(h=>{if(h.kind==='exam'&&!setDone[h.title]) setDone[h.title]=h;});
  const ow=openWrong().length;
  let h=topbar();
  if(store.cur){
    const cc=store.cur, ans=Object.keys(cc.picks).length;
    h+=`<div class="sec"><div class="panel resume confirm"><b>풀던 시험이 있어요 · ${esc(cc.title)}</b><span class="hint">${ans}/${cc.ids.length}문항 답함${cc.limit?` · 남은 시간 ${fmt(remaining(cc))}`:''}</span><div class="row"><button class="btn" id="goResume">이어서 풀기</button><button class="btn ghost" id="dropCur">그만두고 채점</button></div></div></div>`;
  }
  h+=`<div class="sec"><div class="hero"><h1>이번엔 붙는다</h1>
  <p>합격 기준: 세 과목 모두 40점 이상 + 평균 60점 이상. 과목당 20문항, 한 문항 5점이에요.</p>
  <div class="rule"><div><b>40↑</b><span>과목별 과락선</span></div><div><b>60↑</b><span>평균 합격선</span></div><div><b>5점</b><span>문항당 배점</span></div></div></div></div>`;
  h+=prevBlock();
  h+=`<div class="sec"><div class="sech"><h2>실전 모의고사 (60분 타임어택)</h2></div>
  <div class="seg" id="modeSeg"><button data-v="instant" class="${curMode()==='instant'?'on':''}">바로 채점</button><button data-v="exam" class="${curMode()==='exam'?'on':''}">끝나고 채점</button><button data-v="cbt" class="${curMode()==='cbt'?'on':''}">CBT 실전</button></div>
  <p class="hint">${{instant:'답을 고르는 즉시 정답·해설이 나와요. 시간은 그대로 흘러가요.',exam:'실제 시험처럼 다 풀고 제출하면 한꺼번에 채점해요.',cbt:'상공회의소 CBT 화면처럼 풀어요. 답안 표기란·글자 크기·안 푼 문제·계산기가 있고, 답안 제출 후 채점해요.'}[curMode()]}</p>
  ${randBlock()}
  <div class="yr">회차별 시험지</div>
  <div class="sets">${MAINSETS.map(setBtn).join('')}</div>
  <details class="oldsets" ${oldOpen?'open':''}><summary><span>지난 기출 2010~2020 · ${OLDSETS.length}회</span><span class="muted">${Q.filter(q=>q.id[0]==='O').length}문항 ▾</span></summary>
  ${[...new Set(OLDSETS.map(s=>s.slice(0,4)))].sort().reverse().map(y=>`<div class="yr">${y}년</div><div class="sets">${OLDSETS.filter(s=>s.startsWith(y)).map(setBtn).join('')}</div>`).join('')}
  <p class="hint">옛날 시험이라 지금 시험 범위가 아닌 문제는 ‘옛 버전 내용’ 표시가 붙어요. 랜덤 실전 모의고사에는 빠져요.</p></details></div></div>`;
  h+=`<div class="sec"><div class="sech"><h2>빠른 연습 (시간제한 없음)</h2></div><div class="row">
    <button class="btn ghost" data-drill="1">1과목 20문제</button><button class="btn ghost" data-drill="2">2과목 20문제</button><button class="btn ghost" data-drill="3">3과목 20문제</button></div>
    <div class="row"><button class="btn ${ow?'bad':'ghost'}" id="drillWrong" ${ow?'':'disabled'}>틀린 문제 다시 풀기 ${ow?`(${ow})`:''}</button><button class="btn ghost" id="drillNew">안 푼 문제만 20개</button></div></div>`;
  h+=`<div class="sec"><div class="sech"><h2>과목별 내 정답률</h2><span class="muted" style="font-size:12px">빨간 선 40 · 검은 선 60</span></div><div class="panel bars">${[1,2,3].map(s=>{const [a,b]=st[s];const p=b?Math.round(a/b*100):0;return `<div class="bar"><span>${s}과목</span><div class="tr"><i style="width:${p}%;background:${b&&p<40?'var(--bad)':'var(--accent)'}"></i><span class="l40"></span><span class="l60"></span></div><b>${b?p+'%':'-'}</b></div>`;}).join('')}
  <p class="hint">푼 문제 ${Object.keys(store.ans).length} / 전체 ${Q.length}문항 (2024 상시 ${Q.filter(q=>q.id[0]==='K').length} + 실전 모의 ${Q.filter(q=>q.id[0]==='M').length} + 지난 기출 ${Q.filter(q=>q.id[0]==='O'||q.id[0]==='X').length})</p></div></div>`;
  app.innerHTML=h;
  bindPrev(); bindRand();
  app.querySelectorAll('#modeSeg button').forEach(b=>b.onclick=()=>{store.pref.mode=b.dataset.v;store.pref.instant=b.dataset.v==='instant';save();renderHome();});
  const od=app.querySelector('.oldsets'); if(od) od.ontoggle=()=>{oldOpen=od.open;};
  app.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{
    const s=b.dataset.set;
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;b.click();});
    let ids,title;
    if(s==='랜덤 모의고사'){ids=[1,2,3].flatMap(k=>shuffle(Q.filter(q=>q.s===k&&!q.ob)).slice(0,20).map(q=>q.id));title='랜덤 모의고사';}
    else {ids=Q.filter(q=>q.set===s).sort((a,b)=>a.n-b.n).map(q=>q.id);title=s;}
    startSession({title,ids,instant:curMode()==='instant',cbt:curMode()==='cbt',limit:3600,kind:'exam'});
  });
  app.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;b.click();});
    const s=+b.dataset.drill; // prioritize unseen & wrong
    const pool=Q.filter(q=>q.s===s&&!q.ob); const un=shuffle(pool.filter(q=>!store.ans[q.id])); const rest=shuffle(pool.filter(q=>store.ans[q.id]));
    startSession({title:`${s}과목 연습`,ids:un.concat(rest).slice(0,20).map(q=>q.id),instant:true,kind:'drill'});
  });
  const dw=$('#drillWrong'); if(dw) dw.onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;dw.click();});
    const ids=shuffle(openWrong()); startSession({title:'오답 다시 풀기',ids,instant:true,kind:'wrong'});};
  $('#drillNew').onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;$('#drillNew').click();});
    const un=shuffle(Q.filter(q=>!store.ans[q.id])).slice(0,20).map(q=>q.id); if(!un.length) return; startSession({title:'새 문제 20개',ids:un,instant:true,kind:'drill'});};
  if(store.cur){$('#goResume').onclick=()=>{resumeCur();tab='quiz';render();}; $('#dropCur').onclick=()=>confirmBox('지금까지 푼 것만 채점하고 끝낼까요?',()=>{resumeCur();finish();});}
}

function analyzePrev(p){
  const sub=[p[0],p[1],p[2]], tot=sub.reduce((a,b)=>a+b,0), avg=Math.round(tot/3*100)/100;
  const fails=sub.map((x,i)=>x<40?i:null).filter(x=>x!==null);
  const pass=!fails.length&&avg>=60;
  const raised=sub.map(x=>Math.max(x,40));
  const failPts=raised.reduce((a,b)=>a+b,0)-tot;
  const needPts=Math.max(0,180-raised.reduce((a,b)=>a+b,0))+failPts;
  const needQ=Math.ceil(needPts/5);
  const order=[0,1,2].sort((a,b)=>sub[a]-sub[b]);
  let msg='';
  if(pass) msg=`이미 합격선이에요(평균 ${avg}). 실수만 줄이면 돼요.`;
  else {
    msg=`평균 ${avg}점이에요. 합격까지 총 ${needPts}점, 약 ${needQ}문제를 더 맞히면 돼요.`;
    if(fails.length) msg+=` ${fails.map(i=>`${i+1}과목(${sub[i]}점 → 40점까지 ${Math.ceil((40-sub[i])/5)}문제)`).join(', ')}이 과락이라 먼저 올려야 해요.`;
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
  <div class="row">${[1,2,3].map(i=>`<label style="flex:1 1 90px;font-size:13px;display:flex;flex-direction:column;gap:4px">${i}과목<input class="search" id="${px}${i}" type="number" inputmode="numeric" min="0" max="100" step="5" placeholder="0~100"></label>`).join('')}</div>
  <button class="btn" id="${px}Save">점수 저장하고 분석</button><span class="hint" id="${px}Err" style="color:var(--bad)" role="status"></span></div>`;
}
function bindRealForm(px,done){
  const sv=$('#'+px+'Save'); if(!sv) return;
  sv.onclick=()=>{
    const v=[1,2,3].map(i=>$('#'+px+i).value.trim());
    if(v.some(x=>x===''||isNaN(+x)||+x<0||+x>100)){$('#'+px+'Err').textContent='세 과목 모두 0~100 사이 점수를 넣어주세요.';return;}
    realList().push({d:$('#'+px+'d').value||'',sub:v.map(Number)}); save(); done();
  };
}
function realCard(r,i,withDel){
  const a=analyzePrev(r.sub);
  return `<div class="card-score"><div class="ttl"><h2>${r.d?esc(r.d):'날짜 없음'} 실제 시험</h2>${withDel?`<button class="iconbtn" data-rdel="${i}">삭제</button>`:''}</div>
  <div class="scroll-x"><table class="scoretbl"><tr><th>1과목</th><th>2과목</th><th>3과목</th><th>총점</th><th>평균</th></tr><tr>${a.sub.map(x=>`<td class="${x<40?'fail':''}">${x}</td>`).join('')}<td>${a.tot}</td><td>${a.avg}</td></tr></table></div>
  <div class="passbox"><span style="font-size:14px">${esc(a.msg)}</span><span class="stamp ${a.pass?'p':'f'}">${a.pass?'합격':'불합격'}</span></div></div>`;
}
function prevBlock(){
  const list=realSorted();
  if(!list.length){
    return `<div class="sec">${realForm('pv','실제 시험 점수 넣기 (선택)','시험 보고 받은 점수를 넣으면 합격까지 몇 문제가 더 필요한지, 어느 과목부터 할지 알려줘요. 이 기기에만 저장돼요.')}</div>`;
  }
  const {r}=list[0]; const a=analyzePrev(r.sub);
  return `<div class="sec"><div class="panel confirm"><div class="sech"><b>최근 실제 시험 분석${r.d?` · ${esc(r.d)}`:''}</b><button class="iconbtn" id="pvGo">점수 추가·관리</button></div>
  <div class="scroll-x"><table class="scoretbl"><tr><th>1과목</th><th>2과목</th><th>3과목</th><th>총점</th><th>평균</th></tr><tr>${a.sub.map(x=>`<td class="${x<40?'fail':''}">${x}</td>`).join('')}<td>${a.tot}</td><td>${a.avg}</td></tr></table></div>
  <span style="font-size:14.5px">${esc(a.msg)}</span>
  ${a.pass?'':`<button class="btn ghost" data-drill="${a.order[0]+1}">${a.order[0]+1}과목 20문제 바로 연습</button>`}</div></div>`;
}
function bindPrev(){
  bindRealForm('pv',()=>renderHome());
  const g=$('#pvGo'); if(g) g.onclick=()=>{tab='rec';view=null;render();window.scrollTo(0,0);};
}
function confirmBox(msg,yes){
  const bg=document.createElement('div'); bg.className='sheetbg';
  bg.innerHTML=`<div class="sheet confirm"><b>${esc(msg)}</b><div class="row"><button class="btn" id="cy">네</button><button class="btn ghost" id="cn">아니요</button></div></div>`;
  document.body.appendChild(bg);
  bg.querySelector('#cy').onclick=()=>{bg.remove();yes();}; bg.querySelector('#cn').onclick=()=>bg.remove();
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
}

/* ---------- quiz ---------- */
function renderQuiz(){
  const c=store.cur; if(c.paused) resumeCur();
  const id=c.ids[c.idx], q=QM[id]; const pick=c.picks[id];
  const shown = c.instant && pick;
  const ansd=Object.keys(c.picks).length;
  let h=`<div class="top"><button class="iconbtn" id="qExit" aria-label="나가기">✕ 나가기</button><div class="sp"></div>${c.limit?`<span class="timer" id="timer">${fmt(remaining(c))}</span>`:`<span class="muted tabnum" style="font-size:13px">${esc(c.title)}</span>`}<button class="iconbtn" id="qSheet">답안지</button></div>`;
  h+=`<div class="progress"><i style="width:${ansd/c.ids.length*100}%"></i></div>`;
  h+=`<div class="qhead"><span class="qnum tabnum">${c.idx+1}<span class="muted" style="font-size:15px">/${c.ids.length}</span></span>${subjChip(q.s)}<span class="qmeta">${esc(q.set.replace('2024 기출','2024 상시'))} ${q.n}번</span>${q.ob?'<span class="obchip">옛 버전 내용</span>':''}</div>`;
  if(q.full && q.img){ h+=`<img class="qimg" src="${q.img}" alt="${esc(q.q)}">`; }
  else { h+=`<p class="stem">${esc(q.q)}</p>`; if(q.img) h+=`<img class="qimg" src="${q.img}" alt="문제 그림">`; }
  h+=`<div class="opts">${q.o.map((o,i)=>{const n=i+1;let cls='';if(shown){if(n===q.a)cls='right';else if(n===pick)cls='wrong';}else if(n===pick)cls='sel';return `<button class="opt ${cls}" data-n="${n}" ${shown?'disabled':''}><span class="n">${n}</span><span>${shown&&n===q.a?markFix(q,o):esc(o)}</span></button>`;}).join('')}</div>`;
  if(shown){const ok=pick===q.a; h+=`<div class="verdict ${ok?'ok':'no'}"><div class="vt">${ok?'○ 정답':'✕ 오답'}${ok?'':` <span class="muted" style="font-weight:500;font-size:14px">정답은 ${MK[q.a-1]}번</span>`}</div>${explainHTML(q,pick)}</div>`;}
  const last=c.idx===c.ids.length-1;
  h+=`<div class="qnav"><button class="btn ghost flag ${c.flags[id]?'on':''}" id="qFlag" title="나중에 다시 보기" aria-label="체크해 두기">★</button><button class="btn ghost" id="qPrev" ${c.idx===0?'disabled':''}>이전</button>${last?`<button class="btn" id="qDone">제출하기</button>`:`<button class="btn" id="qNext">다음</button>`}</div><div style="height:24px"></div>`;
  app.innerHTML=h;
  modal.innerHTML='';
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const n=+b.dataset.n;
    if(c.instant){ if(c.picks[id]) return; c.picks[id]=n; record(id,n); save(); renderQuiz(); const v=app.querySelector('.verdict'); if(v){const r=v.getBoundingClientRect(); if(r.top>innerHeight-120) window.scrollBy(0,r.top-innerHeight+160);} }
    else { c.picks[id]=n; save(); renderQuiz(); }
  });
  $('#qPrev').onclick=()=>{c.idx--;save();renderQuiz();window.scrollTo(0,0);};
  const nx=$('#qNext'); if(nx) nx.onclick=()=>{c.idx++;save();renderQuiz();window.scrollTo(0,0);};
  const dn=$('#qDone'); if(dn) dn.onclick=submitAsk;
  $('#qFlag').onclick=()=>{c.flags[id]=!c.flags[id];save();renderQuiz();};
  $('#qSheet').onclick=showSheet;
  $('#qExit').onclick=()=>{pauseCur();modal.innerHTML='';tab='home';render();};
  if(c.limit){tick=setInterval(()=>{const r=remaining(c);const t=$('#timer');if(t){t.textContent=fmt(r);t.classList.toggle('low',r<300);}if(r<=0){clearInterval(tick);modal.innerHTML='';finish();}},1000);}
}
/* ---------- CBT 실전 화면 ---------- */
function cbtPages(c){const pp=c.pp||2;return Math.ceil(c.ids.length/pp);}
function cbtGo(c,i){const pp=c.pp||2;c.page=Math.floor(i/pp);c.idx=i;save();renderCBT();const el=document.getElementById('cq'+i);if(el){const y=el.getBoundingClientRect().top+window.scrollY-90;window.scrollTo(0,Math.max(0,y));}else window.scrollTo(0,0);}
function cbtOmr(c){
  return `<div class="cbt-omr">${c.ids.map((id,i)=>{const p=c.picks[id];const pp=c.pp||2;const cur=Math.floor(i/pp)===c.page;return `<div class="r ${cur?'cur':''}"><b data-go="${i}">${i+1}</b>${[1,2,3,4].map(n=>`<button data-om="${i}" data-n="${n}" class="${p===n?'on':''}" aria-label="${i+1}번 ${n}">${n}</button>`).join('')}</div>`;}).join('')}</div>`;
}
function renderCBT(){
  const c=store.cur; if(c.paused) resumeCur();
  const pp=c.pp||2, fs=c.fs||1, np=cbtPages(c); if(c.page>=np) c.page=np-1; if(!c.page) c.page=c.page||0;
  const left=c.ids.filter(id=>!c.picks[id]).length;
  const from=c.page*pp, list=c.ids.slice(from,from+pp);
  let h=`<div class="cbt" style="--fs:${fs}"><div class="cbt-h"><div class="tt"><button id="cExit2" style="float:right;background:none;border:1px solid rgba(255,255,255,.5);color:#fff;border-radius:4px;font-size:11px;padding:3px 7px">나가기</button>컴퓨터활용능력 1급 필기<small>${esc(c.title.replace('2024 기출','2024 상시'))} · CBT 연습</small></div>
  <div class="grp">글자크기 ${[[1,'100'],[1.25,'150'],[1.5,'200']].map(([v,l])=>`<button data-fs="${v}" class="${fs===v?'on':''}">${l}%</button>`).join('')}</div>
  <div class="grp">화면배치 ${[1,2,3].map(v=>`<button data-pp="${v}" class="${pp===v?'on':''}">${v}문제</button>`).join('')}</div>
  <div class="cnt"><span>전체 문제 수 <b>${c.ids.length}</b></span><span>안 푼 문제 수 <b id="cLeft">${left}</b></span></div>
  <div class="clock ${c.limit&&remaining(c)<300?'low':''}" id="cClock">제한 시간 60분 · 남은 시간<b id="timer">${c.limit?fmt(remaining(c)):'--:--'}</b></div></div>
  <div class="cbt-body"><div class="cbt-main">${list.map((id,k)=>{const i=from+k,q=QM[id],p=c.picks[id];
    const stem=q.full&&q.img?`<img src="${q.img}" alt="${esc(q.q)}">`:`<div class="qt"><span class="no">${i+1}.</span><span>${esc(q.q)}</span></div>${q.img?`<img src="${q.img}" alt="문제 그림">`:''}`;
    return `<div class="cbt-q" id="cq${i}">${q.full&&q.img?`<div class="qt"><span class="no">${i+1}.</span><span></span></div>`:''}${stem}<ol>${q.o.map((o,j)=>`<li><button data-q="${i}" data-n="${j+1}" class="${p===j+1?'on':''}"><span class="m">${j+1}</span><span>${esc(o)}</span></button></li>`).join('')}</ol></div>`;}).join('')}</div>
  <aside class="cbt-side"><h3>답안 표기란</h3>${cbtOmr(c)}</aside></div>
  <div class="cbt-f"><button id="cExit">나가기</button><button id="cCalc">계산기</button><span class="sp"></span><button id="cPrev" ${c.page===0?'disabled':''}>◀ 이전</button><span class="cbt-pg">${c.page+1}/${np}</span><button id="cNext" ${c.page>=np-1?'disabled':''}>다음 ▶</button><span class="sp"></span><span class="mclock" id="mClock">${c.limit?fmt(remaining(c)):''}</span><button id="cLeftBtn">안 푼 문제</button><button class="omrbtn" id="cOmr">답안 표기란</button><button class="sub" id="cSubmit">답안 제출</button></div></div>`;
  app.innerHTML=h; modal.innerHTML='';
  const mark=(i,n)=>{const id=c.ids[i];c.picks[id]=n;c.idx=i;save();const y=window.scrollY;renderCBT();window.scrollTo(0,y);};
  app.querySelectorAll('.cbt-main [data-q]').forEach(b=>b.onclick=()=>mark(+b.dataset.q,+b.dataset.n));
  app.querySelectorAll('[data-om]').forEach(b=>b.onclick=()=>{const i=+b.dataset.om;const pp2=c.pp||2;const same=Math.floor(i/pp2)===c.page;c.picks[c.ids[i]]=+b.dataset.n;save();if(same){const y=window.scrollY;renderCBT();window.scrollTo(0,y);}else cbtGo(c,i);});
  app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>cbtGo(c,+b.dataset.go));
  app.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{c.fs=+b.dataset.fs;save();renderCBT();});
  app.querySelectorAll('[data-pp]').forEach(b=>b.onclick=()=>{const first=c.page*(c.pp||2);c.pp=+b.dataset.pp;c.page=Math.floor(first/c.pp);save();renderCBT();window.scrollTo(0,0);});
  $('#cPrev').onclick=()=>{c.page--;save();renderCBT();window.scrollTo(0,0);};
  $('#cNext').onclick=()=>{c.page++;save();renderCBT();window.scrollTo(0,0);};
  $('#cExit').onclick=$('#cExit2').onclick=()=>{pauseCur();document.body.classList.remove('cbton');tab='home';render();window.scrollTo(0,0);};
  $('#cCalc').onclick=cbtCalc;
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
  return h;
}
function submitAsk(){
  const c=store.cur; const left=c.ids.length-Object.keys(c.picks).length;
  confirmBox(left?`안 푼 문제가 ${left}개 있어요. 그래도 제출할까요?`:'제출하고 채점할까요?',()=>{finish();});
}
function showSheet(){
  const c=store.cur;
  const cells=c.ids.map((id,i)=>{const p=c.picks[id];let cls='';if(p){cls=c.instant?(p===QM[id].a?'r':'w'):'ans';} if(i===c.idx)cls+=' cur'; if(c.flags[id])cls+=' fl'; return `<button class="${cls}" data-i="${i}">${i+1}</button>`;}).join('');
  const bg=document.createElement('div'); bg.className='sheetbg';
  bg.innerHTML=`<div class="sheet"><div class="sech"><h2>답안지</h2><button class="iconbtn" id="shClose">닫기</button></div><div class="legend">${c.instant?'<span><i style="background:var(--ok)"></i>정답</span><span><i style="background:var(--bad)"></i>오답</span>':'<span><i style="background:var(--accent)"></i>답함</span>'}<span><i style="background:var(--warn)"></i>★ 체크</span></div><div class="omr">${cells}</div><button class="btn" id="shSubmit">제출하고 채점하기</button></div>`;
  document.body.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
  bg.querySelector('#shClose').onclick=()=>bg.remove();
  bg.querySelectorAll('.omr button').forEach(b=>b.onclick=()=>{c.idx=+b.dataset.i;save();bg.remove();renderQuiz();window.scrollTo(0,0);});
  bg.querySelector('#shSubmit').onclick=()=>{bg.remove();submitAsk();};
}

/* ---------- result ---------- */
function showResult(res){view={type:'result',res};tab='home';modal.innerHTML='';render();window.scrollTo(0,0);}
function scoreCard(res){
  const d=new Date(res.date);
  return `<div class="card-score"><div class="ttl"><h2>${esc(res.title)} 채점내역</h2><span class="muted" style="font-size:12.5px">${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} · ${Math.floor(res.dur/60)}분 ${res.dur%60}초</span></div>
  <div class="scroll-x"><table class="scoretbl"><tr><th>1과목</th><th>2과목</th><th>3과목</th><th>총점</th><th>평균</th></tr>
  <tr>${res.sub.map(x=>`<td class="${x!==null&&x<40?'fail':''}">${x===null?'-':x}</td>`).join('')}<td>${res.tot}</td><td>${res.avg}</td></tr></table></div>
  <div class="passbox"><div><div class="avg tabnum">${res.avg}<small>점 평균 · ${res.correct}/${res.n} 정답</small></div></div><span class="stamp ${res.pass?'p':'f'}">${res.pass?'합격':'불합격'}</span></div></div>`;
}
function renderResult(res){
  const wrong=res.ids.filter(id=>res.picks[id]!==QM[id].a);
  const fails=res.sub.map((x,i)=>x!==null&&x<40?`${i+1}과목`:null).filter(Boolean);
  let adv='';
  if(res.pass) adv='합격선 통과! 틀린 문제만 한 번 더 보고 다른 회차로 확인해 보세요.';
  else if(fails.length) adv=`${fails.join(', ')}이 과락(40점 미만)이에요. 해당 과목 오답부터 다시 풀어보세요.`;
  else adv=`과락은 없어요. 평균 ${Math.ceil((60-res.avg)*3/5)}문제 정도만 더 맞히면 합격이에요.`;
  let h=topbar()+`<div class="sec">${scoreCard(res)}<p class="hint" style="font-size:14px;color:var(--ink2)">${adv}</p>
  <div class="row"><button class="btn bad" id="rWrong" ${wrong.length?'':'disabled'}>틀린 ${wrong.length}문제 바로 다시 풀기</button><button class="btn ghost" id="rHome">처음으로</button></div></div>`;
  h+=`<div class="sec"><div class="sech"><h2>틀린 문제 (${wrong.length})</h2><span class="muted" style="font-size:12px">눌러서 해설 보기</span></div>${wrong.map(id=>{const q=QM[id];const p=res.picks[id];return `<details class="grp"><summary><span style="font-weight:500;font-size:14px;display:flex;gap:8px"><span class="no tabnum" style="color:var(--bad);font-family:var(--f-mono)">${res.ids.indexOf(id)+1}</span>${esc(q.q.slice(0,48))}${q.q.length>48?'…':''}</span><span class="c">${p?MK[p-1]:'미응답'}→${MK[q.a-1]}</span></summary><div class="body">${noteBody(q,p)}</div></details>`;}).join('')||'<div class="empty">다 맞혔어요!</div>'}</div>`;
  app.innerHTML=h;
  $('#rHome').onclick=()=>{view=null;render();window.scrollTo(0,0);};
  const rw=$('#rWrong'); if(rw) rw.onclick=()=>{view=null;startSession({title:'방금 틀린 문제',ids:shuffle(wrong),instant:true,kind:'wrong'});};
}
function noteBody(q,p){
  let h='';
  if(q.full&&q.img) h+=`<img class="qimg" src="${q.img}" alt="">`; else {h+=`<div class="note q" style="border:0;padding:0">${esc(q.q)}</div>`; if(q.img) h+=`<img class="qimg" src="${q.img}" alt="">`;}
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
  [1,2,3].forEach(s=>{
    const sids=ids.filter(id=>QM[id].s===s); if(!sids.length) return;
    const groups={}; sids.forEach(id=>{const k=QM[id].sec;(groups[k]=groups[k]||[]).push(id);});
    const order=Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);
    h+=`<div class="sec"><div class="sech"><h2>${s}과목 ${SUBJ[s]}</h2><span class="muted" style="font-size:13px">${sids.length}문제</span></div>`;
    order.forEach(k=>{const sec=S[k];h+=`<details class="grp"><summary><span>${esc(sec.t)}</span><span class="c">${groups[k].length}문제</span></summary><div class="body">
      <div class="tip"><span class="lbl">이 주제 핵심</span>${sec.items.slice().sort((a,b)=>b.f-a.f).slice(0,3).map(it=>`• ${esc(it.t)}`).join('<br>')}</div>
      ${groups[k].map(id=>{const q=QM[id],r=store.ans[id];return `<div class="note"><div class="meta">${esc(q.set.replace('2024 기출','2024 상시'))} ${q.n}번 · 틀린 횟수 ${r.w}${r.last==='r'?' · <span class="ok">다시 맞힘</span>':''}</div>${noteBody(q,r.last==='w'?r.pick:null)}</div>`;}).join('')}
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
const PDFS={full:{url:'pdf/comhwal1-summary.pdf',name:'comhwal1-summary.pdf'},top:{url:'pdf/comhwal1-top.pdf',name:'comhwal1-top.pdf'},cram:{url:'pdf/comhwal1-cram.pdf',name:'comhwal1-cram.pdf'}};
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
  const numOf={}; [1,2,3].forEach(sj=>S.map((s,i)=>({s,i})).filter(x=>x.s.s===sj).forEach((x,k)=>numOf[x.i]=`${sj}-${String(k+1).padStart(2,'0')}`));
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
    if(s.tip) b+=`<div class="stip"><b>암기</b><span>${hl(s.tip)}</span></div>`;
    b+=chartStrip(s.t+' 차트 '+s.items.map(it=>it.t).join(' '),'그림으로 보는 차트');
    b+=`<details class="sorig"><summary>기출 문장 원문 ${s.items.length}개</summary><ul>${s.items.map(it=>`<li>${hl(it.t)}${it.f>=2?`<span class="freq">${it.f}회</span>`:''}</li>`).join('')}</ul></details>`;
    if(qcount[i]) b+=`<button class="sgo" data-sgo="${i}">이 주제 문제 풀기 (${qcount[i]}문제) →</button>`;
    return b+`</article>`;
  };
  const body=list.map(card).join('');
  let h=topbar()+`<div class="sec spage"><h1 class="stitle">핵심 요약</h1><p class="ssub">출제 범위를 과목별로 정리했어요. 카드 아래 버튼으로 그 주제 문제를 바로 풀 수 있어요.</p>
  <div class="stabs" role="tablist">${[1,2,3].map(s=>`<button role="tab" aria-selected="${sumSubj===s}" data-v="${s}" class="${sumSubj===s?'on':''}"><small>SUBJECT ${s}</small>${SUBJ[s]}</button>`).join('')}</div>
  <div class="schips ${sumChips?'open':''}" id="sChips">${all.map(({s,i})=>`<button data-jump="${i}" class="${wcount[i]?'w':''}">${esc(s.t)}</button>`).join('')}</div>
  <button class="smore" id="sChipT">${sumChips?'주제 접기 ▴':`주제 ${all.length}개 모두 보기 ▾`}</button>
  <div class="stools"><input class="search" id="sQ" type="search" placeholder="검색 (예: 배열 수식, 기본키, IPv6)" value="${esc(sumQ)}">
  <div class="row"><button class="tog ${sumHot?'on':''}" id="sHotT">★ 자주 나온 주제만</button><button class="tog ${sumFlip?'on':''}" id="sFlipT">한 장씩 넘기기</button><button class="tog" id="pdfTop">PDF 빈출 TOP</button><button class="tog" id="pdfFull">PDF 전체</button></div><span class="hint" id="pdfMsg" role="status"></span></div>
  ${weak.length&&!ql?`<div class="sweak"><b>내가 약한 주제</b>${weak.slice(0,8).map(k=>`<button data-jump="${k}">${esc(S[k].t)} · ${wcount[k]}</button>`).join('')}</div>`:''}</div>`;
  h+= sumFlip&&body ? `<div class="sec"><div class="flipbar"><span>옆으로 넘기세요</span><span class="tabnum" id="flipPos">1 / ${list.length}</span></div><div class="flip" id="flip">${body}</div></div>` : `<div class="sec scards">${body||'<div class="empty">검색 결과가 없어요.</div>'}</div>`;
  h+=`<p class="hint" style="padding:0 2px 20px">★는 기출에 3번 이상 나온 내용이에요. 카드 아래 ‘기출 문장 원문’에서 실제 출제 문장을 볼 수 있어요.</p>`;
  app.innerHTML=h;
  app.querySelectorAll('.stabs button').forEach(b=>b.onclick=()=>{sumSubj=+b.dataset.v;renderSum();window.scrollTo(0,0);});
  $('#sHotT').onclick=()=>{sumHot=!sumHot;renderSum();};
  $('#sFlipT').onclick=()=>{sumFlip=!sumFlip;renderSum();};
  $('#sChipT').onclick=()=>{sumChips=!sumChips;const y=window.scrollY;renderSum();window.scrollTo(0,y);};
  $('#pdfTop').onclick=e=>exportPdf('top',e.currentTarget); $('#pdfFull').onclick=e=>exportPdf('full',e.currentTarget);
  const fl=$('#flip'); if(fl) fl.onscroll=()=>{const w=fl.firstElementChild?fl.firstElementChild.offsetWidth+12:1;const p=$('#flipPos');if(p)p.textContent=`${Math.round(fl.scrollLeft/w)+1} / ${fl.children.length}`;};
  const qi=$('#sQ'); qi.oninput=()=>{sumQ=qi.value;const pos=qi.selectionStart;renderSum();const n=$('#sQ');n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}};
  app.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{const el=document.getElementById('sec'+b.dataset.jump);if(!el)return; if(sumFlip){el.scrollIntoView({block:'nearest',inline:'start'});} else {const y=el.getBoundingClientRect().top+window.scrollY-12;window.scrollTo(0,y);}});
  app.querySelectorAll('[data-sgo]').forEach(b=>b.onclick=()=>{const k=+b.dataset.sgo;const ids=shuffle(Q.filter(q=>q.sec===k&&!q.ob).map(q=>q.id)).slice(0,20);
    const go=()=>startSession({title:`주제 연습 · ${S[k].t}`,ids,instant:true,kind:'drill'});
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go();}); go();});
}


/* ---------- cram (벼락치기) ---------- */
let cramSet=null, cramRound='';
function cramSrcOpts(){
  const yrs=[...new Set(OLDSETS.map(s=>s.slice(0,4)))].sort().reverse();
  const o=[['all','전체 문제 (기출+모의)'],['K','2024 상시 기출'],['M','실전 모의고사'],['O','지난 기출 2010~2020 전체'],...yrs.map(y=>['Y'+y,`${y}년 기출`]),['R','🎲 랜덤 시험지']];
  return o.map(([v,l])=>`<option value="${v}" ${cramSrc===v?'selected':''}>${l}</option>`).join('');
}
let cramSubj=0, cramSrc='all', cramMine=false, cramShown=20, cramOrder=null;
function cramList(){
  if(cramSrc==='R'){const r=randList().find(x=>x.no===cramSet)||randList()[0]; if(!r) return []; cramSet=r.no; let L=r.ids.map(id=>QM[id]).filter(Boolean).filter(q=>!cramSubj||q.s===cramSubj); if(cramMine) L=L.filter(q=>store.ans[q.id]&&store.ans[q.id].w>0); if(cramOrder){const pos={};cramOrder.forEach((id,i)=>pos[id]=i);L=L.slice().sort((a,b)=>(pos[a.id]??1e9)-(pos[b.id]??1e9));} return L;}
  let L=Q.filter(q=>(!cramSubj||q.s===cramSubj)&&(cramSrc==='all'||(cramSrc==='O'?(q.id[0]==='O'||q.id[0]==='X'):cramSrc[0]==='Y'?(q.id[0]==='O'&&(cramRound?q.set===cramRound:q.set.startsWith(cramSrc.slice(1)))):q.id[0]===cramSrc)));
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
  const img = q.img ? `<img class="qimg" loading="lazy" src="${q.img}" alt="">` : '';
  const qtext = q.full&&q.img ? img : `<div class="q">${esc(q.q)}</div>${img}`;
  const e = q.eimg ? `<img class="qimg" loading="lazy" src="${q.eimg}" alt="해설">` : `<div class="more">${esc(q.e)}</div><button type="button" data-more>더 보기</button>`;
  return `<div class="cramcard"><div class="meta"><span class="chip s${q.s}">${q.s}과목</span>${esc(q.set.replace('2024 기출','2024 상시'))} ${q.n}번 ${q.ob?'<span class="obchip">옛 버전</span> ':''}${neg?'<span class="neg">틀린 것 찾기</span>':'<span class="pos">맞는 것 찾기</span>'}</div>
  ${qtext}<ul class="facts">${opts}</ul>
  <div class="fixnote"><b>${neg?'해설':'정답 이유'}</b> ${e}</div>${tipHTML(q)}</div>`;
}
function renderCram(){
  const L=cramList(); const shown=L.slice(0,cramShown);
  let h=topbar()+`<div class="sec"><div class="panel confirm"><b>벼락치기 · 정답만 보며 훑기</b><span class="hint">문제를 풀지 않고 정답이 표시된 채로 넘겨봐요. ✓는 맞는 내용, ✕는 틀린 내용이에요. ‘틀린 것 찾기’ 문제는 ✕ 보기에서 <span class="wr">빨간 줄</span>이 틀린 부분, <span class="cr">초록 글씨</span>가 바르게 고친 내용이에요.</span><div class="row"><button class="btn ghost" id="cPdf">정답노트 PDF 저장 (2024 상시+모의 581문항)</button></div><span class="hint" id="pdfMsg" role="status"></span></div></div>
  <div class="crambar"><div class="seg" id="cSubj">${[0,1,2,3].map(s=>`<button data-v="${s}" class="${cramSubj===s?'on':''}">${s?s+'과목':'전체'}</button>`).join('')}</div>
  <div class="csel"><select id="cSrcSel" aria-label="문제 출처">${cramSrcOpts()}</select>${/^Y/.test(cramSrc)?`<select id="cRound" aria-label="회차">${['',...OLDSETS.filter(s=>s.startsWith(cramSrc.slice(1)))].map(s=>`<option value="${esc(s)}" ${cramRound===s?'selected':''}>${s?esc(s.slice(5).replace('.','월 ').replace(' 기출','일 시험')):'그해 전체 회차'}</option>`).join('')}</select>`:''}</div>
  ${cramSrc==='R'?`<div class="rpick">${randList().length?`<select id="cRset" aria-label="랜덤 시험지 고르기">${randList().map(r=>`<option value="${r.no}" ${r.no===cramSet?'selected':''}>${esc(r.t)} · ${RSRC[r.src].t}</option>`).join('')}</select>`:'<span class="hint">아직 만든 랜덤 시험지가 없어요.</span>'}<button class="iconbtn" id="cRnew">🎲 새로 뽑기</button>${randList().length?'<button class="iconbtn" id="cRgo">이 시험지 풀기</button>':''}</div>`:''}
  <div class="cramcount"><span><label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="cMine" ${cramMine?'checked':''}> 내가 틀린 문제만</label></span><span><span class="tabnum">${L.length}</span>문제 · <button class="iconbtn" id="cShuf" style="padding:3px 8px">${cramOrder?'순서대로':'섞기'}</button></span></div></div>
  <div class="sec">${shown.map(cramCard).join('')||'<div class="empty">해당하는 문제가 없어요.</div>'}${L.length>cramShown?`<button class="btn ghost" id="cMore">다음 20문제 더 보기 (${cramShown}/${L.length})</button>`:''}</div>`;
  app.innerHTML=h;
  const re=()=>{cramShown=20;renderCram();window.scrollTo(0,0);};
  app.querySelectorAll('#cSubj button').forEach(b=>b.onclick=()=>{cramSubj=+b.dataset.v;re();});
  $('#cSrcSel').onchange=e=>{cramSrc=e.target.value;cramRound='';re();};
  const cr=$('#cRound'); if(cr) cr.onchange=e=>{cramRound=e.target.value;re();};
  $('#cMine').onchange=e=>{cramMine=e.target.checked;re();};
  const rs=$('#cRset'); if(rs) rs.onchange=()=>{cramSet=+rs.value;re();};
  const rn=$('#cRnew'); if(rn) rn.onclick=()=>{cramSet=makeRandom(store.pref.rsrc||'K').no;re();};
  const rg=$('#cRgo'); if(rg) rg.onclick=()=>{const r=randList().find(x=>x.no===cramSet); if(!r) return; const go=()=>startSession({title:r.t,ids:r.ids,instant:curMode()==='instant',cbt:curMode()==='cbt',limit:3600,kind:'exam'}); if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go();}); go();};
  $('#cShuf').onclick=()=>{cramOrder=cramOrder?null:shuffle(Q.map(q=>q.id));re();};
  $('#cPdf').onclick=e=>exportPdf('cram',e.currentTarget);
  bindMore();
  const m=$('#cMore'); if(m){ m.onclick=()=>{cramShown+=20;const y=window.scrollY;renderCram();window.scrollTo(0,y);};
    if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();m.click();}},{rootMargin:'600px'});io.observe(m);} }
}
function bindMore(){app.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{const f=b.closest('.fixnote');f.classList.toggle('open');b.textContent=f.classList.contains('open')?'접기':'더 보기';});}

/* ---------- records ---------- */
function renderRec(){
  const rl=realSorted();
  let h=topbar()+`<div class="sec"><div class="sech"><h2>내 실제 시험 점수</h2><span class="muted" style="font-size:12px">${rl.length}회</span></div>`;
  if(rl.length>1){
    h+=`<div class="panel scroll-x"><table class="hist"><tr><th>날짜</th><th>1과목</th><th>2과목</th><th>3과목</th><th>평균</th><th>결과</th></tr>${rl.map(({r})=>{const a=analyzePrev(r.sub);return `<tr><td>${esc(r.d||'-')}</td>${r.sub.map(x=>`<td class="${x<40?'no':''}">${x}</td>`).join('')}<td><b>${a.avg}</b></td><td class="${a.pass?'ok':'no'}">${a.pass?'합격':'불합격'}</td></tr>`;}).join('')}</table></div>`;
  }
  h+=rl.map(({r,i})=>realCard(r,i,true)).join('');
  h+=realForm('rv',rl.length?'실제 시험 점수 추가':'실제 시험 점수 넣기','시험 보고 받은 과목별 점수를 넣으면 합격까지 남은 문제 수를 알려줘요.');
  h+=`</div><div class="sec"><div class="sech"><h2>앱 모의고사 기록</h2></div>`;
  if(!store.hist.length) h+=`<div class="empty">아직 모의고사 기록이 없어요. 한 번 풀어보세요.</div>`;
  else {
    h+=scoreCard(store.hist[0]);
    h+=`<div class="panel scroll-x"><table class="hist"><tr><th>시험</th><th>1과목</th><th>2과목</th><th>3과목</th><th>평균</th><th>결과</th></tr>${store.hist.map((r,i)=>`<tr data-h="${i}" style="cursor:pointer"><td>${esc(r.title.replace('2024 기출','상시'))}</td>${r.sub.map(x=>`<td class="${x!==null&&x<40?'no':''}">${x===null?'-':x}</td>`).join('')}<td><b>${r.avg}</b></td><td class="${r.pass?'ok':'no'}">${r.pass?'합격':'불합격'}</td></tr>`).join('')}</table></div><p class="hint">줄을 누르면 그 시험의 틀린 문제를 볼 수 있어요.</p>`;
  }
  h+=`</div>
  <div class="sec"><button class="btn ghost" id="reset">모의고사 기록·오답노트 지우기</button><p class="hint">실제 시험 점수는 지워지지 않아요. 기록은 이 기기의 브라우저에만 저장돼요. 휴대폰과 컴퓨터 기록은 따로예요.</p></div>`;
  app.innerHTML=h;
  app.querySelectorAll('[data-h]').forEach(tr=>tr.onclick=()=>showResult(store.hist[+tr.dataset.h]));
  bindRealForm('rv',()=>{renderRec();});
  app.querySelectorAll('[data-rdel]').forEach(b=>b.onclick=()=>confirmBox('이 시험 점수를 지울까요?',()=>{realList().splice(+b.dataset.rdel,1);save();renderRec();}));
  $('#reset').onclick=()=>confirmBox('푼 기록과 오답노트를 모두 지울까요? 되돌릴 수 없어요.',()=>{store={ans:{},hist:[],cur:null,pref:store.pref,prev:null,real:store.real||[],rand:store.rand||[]};save();render();});
}

if(store.cur){pauseCur();}
render();
document.addEventListener('visibilitychange',()=>{ if(document.hidden && store.cur && tab==='quiz') save(); });
})();
