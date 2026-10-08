/* ================================================================
   Outline deck engine — shared by every section file.
   Adapted from defense.html. Sections only call the authoring API
   below; nothing in a section touches the engine state.

   Authoring API (globals):
     section(name)                       start a section (secbar label)
     st(html, {notes, cls, todo})        static slide; .b elements build in
     sc(name, src, {notes, todo})        iframe scene exposing
                                          window[name] = {advance, back, atStart,
                                          atEnd, reset, resetToEnd}
     fig(src, cap)                       plain figure (dashed placeholder if missing)
     rfig(src, ar, marks, cap)           figure with step reveals; ar = width/height;
                                          marks = [{r:[x,y,w,h], k:'cov'|'ring'|'dim', step}]
                                          normalized to the image
     judge(a, b, who, verdict, vClass, build)   the stim → judge → verdict strip
     mxGrid(rows, cols, color, seed)     toy matrix
     cite(text)                          small citation, bottom-left
     tr(fromIdx, toIdx, spec)            optional zoom transition (see defense.html)

   Builds: each click reveals the next .b element in DOM order. To reveal
   several at once, or out of DOM order, give elements data-step="k"; when
   any element on a slide has data-step, builds are grouped by step
   (elements without one get step 999).

   Keys: → / space / enter advance · ← back · PageUp/PageDown jump slides ·
   n notes · d draft mode (shows each slide's .todo animation note).
   ================================================================ */

const $ = s => document.querySelector(s);
const S = [];
let CUR_SEC = '';

function section(name){ CUR_SEC = name; }
function st(html, o={}){ S.push({kind:'static', sec:CUR_SEC, html, ...o}); }
function sc(name, src, o={}){ S.push({kind:'scene', sec:CUR_SEC, name, src, ...o}); }

const cite = t => `<div class="cite">${t}</div>`;

const fig = (src, cap) => `
  <figure class="fig">
    <div class="well missing" data-src="${src}">
      <img src="${src}" onload="this.parentNode.classList.replace('missing','loaded')" onerror="this.remove()" alt="">
    </div>
    ${cap ? `<figcaption>${cap}</figcaption>` : ''}
  </figure>`;

const rfig = (src, ar, marks=[], cap='') => `
  <figure class="fig">
    <div class="well loaded rwell">
      <div class="fw" data-ar="${ar}">
        <img src="${src}" alt="">
        ${marks.map(m => {
          const [x,y,w,h] = m.r, k = m.k || 'cov';
          return `<div class="${k} b" ${m.step!=null?`data-step="${m.step}"`:''}
            style="left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%"></div>`;
        }).join('')}
      </div>
    </div>
    ${cap ? `<figcaption>${cap}</figcaption>` : ''}
  </figure>`;

const judge = (a, b, who, verdict, vClass, build) => `
  <div class="judgeline ${build?'b':''}">
    <span class="stim a">${a}</span>
    <span class="stim b">${b}</span>
    <span class="arr">→</span>
    <span class="judge">${who}</span>
    <span class="arr">→</span>
    <span class="verdict ${vClass}">${verdict}</span>
  </div>`;

function mxGrid(rows, cols, hue, seed){
  let s = seed, cells = '';
  const rnd = () => (s = (s*1103515245+12345) % 2147483648) / 2147483648;
  for(let r=0; r<rows*cols; r++)
    cells += `<div class="cell" style="background:${hue}; opacity:${(0.12+0.85*rnd()).toFixed(2)}"></div>`;
  return `<div class="grid" style="grid-template-columns:repeat(${cols},auto)">${cells}</div>`;
}

const TRANS = [];
function tr(a, b, spec){ TRANS.push({a, b, ...spec}); }
/* index of the slide just added — use with tr(): const k = here(); */
const here = () => S.length - 1;

/* ================= runtime ================= */

function startDeck(){
  const root = $('#root');
  const els = [];
  let cur = 0, notesOn = false;

  const sceneHost = document.createElement('div');
  sceneHost.className = 'scenehost';

  S.forEach(s => {
    const d = document.createElement('div');
    d.className = 'slide';
    if(s.kind === 'static')
      d.innerHTML = `<div class="stage ${s.cls||''}">${s.html}</div>${s.todo ? `<div class="todo"><b>Animation:</b> ${s.todo}</div>` : ''}`;
    else if(s.todo)
      d.innerHTML = `<div class="todo" style="z-index:60"><b>Animation:</b> ${s.todo}</div>`;
    root.appendChild(d);
    els.push(d);
  });
  root.appendChild(sceneHost);

  const frames = {};
  function frameFor(s){
    if(!frames[s.src]){
      const f = document.createElement('iframe');
      f.src = s.src;
      f.addEventListener('load', () => {
        try{ f.contentWindow.addEventListener('keydown', onKey, true); }catch(e){}
        /* deck-wide font (Fer, 2026-10-07): every scene in Calibri */
        try{ const d = f.contentDocument, l = d.createElement('link');
          l.rel = 'stylesheet'; l.href = new URL('scenes/shared/deck-font.css', location.href).href;
          d.head.appendChild(l); }catch(e){}
      });
      frames[s.src] = f; sceneHost.appendChild(f);
    }
    return frames[s.src];
  }
  S.forEach(s => { if(s.kind === 'scene') frameFor(s); });
  const ctrlOf = s => { const f = frameFor(s); return (f.contentWindow && f.contentWindow[s.name]) || null; };

  /* ---- builds, grouped by data-step when present ---- */
  function buildGroups(){
    const bs = [...els[cur].querySelectorAll('.b')];
    if(!bs.some(b => b.dataset.step != null)) return bs.map(b => [b]);
    const m = new Map();
    bs.forEach(b => { const k = b.dataset.step != null ? +b.dataset.step : 999;
      if(!m.has(k)) m.set(k, []); m.get(k).push(b); });
    return [...m.keys()].sort((a,b)=>a-b).map(k => m.get(k));
  }

  /* ---- letterbox every .fw to its aspect ratio inside its well ---- */
  function fitFigures(){
    els[cur].querySelectorAll('.fw').forEach(fw => {
      const well = fw.parentNode, ar = +fw.dataset.ar;
      const W = well.clientWidth, H = well.clientHeight;
      if(!W || !H) return;
      let w = W, h = W / ar;
      if(h > H){ h = H; w = H * ar; }
      fw.style.width = w + 'px'; fw.style.height = h + 'px';
    });
  }
  addEventListener('resize', fitFigures);

  /* ---- zoom transitions (from defense.html) ---- */
  let liveAnims = [], transCleanup = null, transToken = 0;
  const visualOf = i => S[i].kind === 'static' ? els[i] : frameFor(S[i]);
  function cancelTransition(){
    transToken++;
    liveAnims.forEach(a => { try{ a.cancel(); }catch(e){} });
    liveAnims = [];
    if(transCleanup){ transCleanup(); transCleanup = null; }
  }
  function playTrans(t, fromI, toI, forward){
    const token = ++transToken;
    const outEl = visualOf(fromI), inEl = visualOf(toI), so = S[fromI];
    if(so.kind === 'static') outEl.style.display = 'block'; else outEl.classList.add('shown');
    outEl.style.zIndex = '35'; outEl.style.pointerEvents = 'none'; inEl.style.zIndex = '30';
    const originOn = el => {
      let cx = 50, cy = 50;
      if(t.sel){ const tg = el.querySelector(t.sel);
        if(tg){ const r = tg.getBoundingClientRect(); cx = (r.left+r.width/2)/innerWidth*100; cy = (r.top+r.height/2)/innerHeight*100; } }
      else if(t.frac){ cx = t.frac[0]*100; cy = t.frac[1]*100; }
      el.style.transformOrigin = `${cx}% ${cy}%`;
    };
    const A = (el, kf, o) => liveAnims.push(el.animate(kf, {fill:'both', ...o}));
    if(t.type === 'dive'){
      if(forward){ originOn(outEl);
        A(outEl, [{transform:'scale(1)',opacity:1},{transform:'scale(2.6)',opacity:0}], {duration:650, easing:'cubic-bezier(.6,0,.8,.4)'});
        A(inEl, [{transform:'scale(.94)',opacity:0},{transform:'scale(1)',opacity:1}], {duration:520, delay:230, easing:'ease-out'});
      } else { originOn(inEl);
        A(outEl, [{opacity:1},{opacity:0}], {duration:420, easing:'ease-in'});
        A(inEl, [{transform:'scale(2.6)',opacity:0},{transform:'scale(1)',opacity:1}], {duration:650, easing:'cubic-bezier(.2,.6,.2,1)'});
      }
    } else {
      outEl.style.transformOrigin = inEl.style.transformOrigin = '50% 50%';
      if(forward){
        A(outEl, [{transform:'scale(1)',opacity:1},{transform:'scale(.22)',opacity:0}], {duration:620, easing:'cubic-bezier(.5,0,.7,.4)'});
        A(inEl, [{transform:'scale(1.18)',opacity:0},{transform:'scale(1)',opacity:1}], {duration:560, delay:180, easing:'ease-out'});
      } else {
        A(outEl, [{transform:'scale(1)',opacity:1},{transform:'scale(1.18)',opacity:0}], {duration:520, easing:'ease-in'});
        A(inEl, [{transform:'scale(.22)',opacity:0},{transform:'scale(1)',opacity:1}], {duration:640, easing:'cubic-bezier(.2,.6,.2,1)'});
      }
    }
    transCleanup = () => {
      outEl.style.display = ''; outEl.style.zIndex = ''; outEl.style.pointerEvents = '';
      outEl.style.transformOrigin = ''; inEl.style.zIndex = ''; inEl.style.transformOrigin = '';
      if(so.kind !== 'static'){ const f = frameFor(so); if(S[cur].kind === 'static' || frameFor(S[cur]) !== f) f.classList.remove('shown'); }
    };
    const done = () => { if(token !== transToken) return;
      liveAnims.forEach(a => { try{ a.cancel(); }catch(e){} }); liveAnims = [];
      if(transCleanup){ transCleanup(); transCleanup = null; } };
    Promise.allSettled(liveAnims.map(a => a.finished)).then(done);
    setTimeout(done, 1400);
  }
  function maybeTrans(from, to, forward){
    const t = TRANS.find(t => forward ? (t.a === from && t.b === to) : (t.a === to && t.b === from));
    if(t) playTrans(t, from, to, forward);
  }

  const SECTIONS = [...new Set(S.map(x => x.sec))].filter(x => x && x !== 'Title');
  $('#secbar').innerHTML = SECTIONS.map(x => `<span>${x}</span>`).join('');

  /* ---- slide numbers (Fer, 2026-10-08): whole numbers, no click count. Consecutive slides
     that continue one thing (the same scene file split with ?from=&to=, or the same title, in
     the same section) share a number with letters: 3A, 3B. A part can force it per slide with
     {sub: true} (join the previous number) or {sub: false} (start a new one). ---- */
  const groupKey = s => {
    if(s.kind === 'scene') return 'sc:' + s.src.split('?')[0].replace(/\.final-[\w-]+(?=\.html$)/, '');
    const m = (s.html || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    return m ? 'h1:' + m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : null;
  };
  const NUM = [], SUBI = [];
  S.forEach((s, i) => {
    const p = S[i-1], k = groupKey(s);
    const join = i > 0 && (s.sub === true || (s.sub !== false && k && k === groupKey(p) && s.sec === p.sec));
    NUM[i] = join ? NUM[i-1] : (i ? NUM[i-1] + 1 : 1);
    SUBI[i] = join ? SUBI[i-1] + 1 : 0;
  });
  const LABEL = S.map((s, i) => {
    const multi = SUBI[i] > 0 || (i+1 < S.length && NUM[i+1] === NUM[i]);
    return NUM[i] + (multi ? String.fromCharCode(65 + SUBI[i]) : '');
  });
  window.slideLabel = i => LABEL[i];

  /* ---- (old) feedback numbering "14.3" (2026-10-07) replaced by LABEL above ----
     Shown on every slide, scenes included. Static slides count build groups; scenes use their
     controller's own beat when they expose getBeat()/beat, else the clicks counted here. */
  let click = 0; const maxClick = {};
  function sceneBeat(){
    const s = S[cur]; if(s.kind !== 'scene') return null;
    const c = ctrlOf(s); if(!c) return null;
    try{ if(typeof c.getBeat === 'function') return c.getBeat(); if(typeof c.beat === 'number') return c.beat; }catch(e){}
    return null;
  }
  function updateHud(){
    $('#hud-pos').textContent = `${LABEL[cur]} / ${NUM[S.length-1]}`;
  }
  setInterval(() => { if(S[cur] && S[cur].kind === 'scene') updateHud(); }, 300);

  function show(i, dir){
    cancelTransition();
    cur = Math.max(0, Math.min(S.length-1, i));
    const s = S[cur];
    click = dir < 0 ? (maxClick[cur] != null ? maxClick[cur] : (s.kind === 'static' ? buildGroups().length : 0)) : 0;
    els.forEach((d,j) => d.classList.toggle('active', j === cur));
    Object.values(frames).forEach(f => f.classList.remove('shown'));
    if(s.kind === 'scene'){
      const f = frameFor(s); f.classList.add('shown');
      const c = ctrlOf(s);
      if(c){ if(dir > 0) c.reset(); else if(dir < 0) c.resetToEnd(); }
      setTimeout(() => { try{ f.contentWindow.focus(); }catch(e){} }, 30);
    } else {
      buildGroups().flat().forEach(b => b.classList.toggle('shown', dir < 0));
      window.focus();
      requestAnimationFrame(fitFigures);
    }
    const chrome = s.kind === 'static';
    $('#hud').style.display = 'block';   /* always on: feedback numbering, scenes included */
    $('#help').style.display = (chrome && cur < 1) ? 'block' : 'none';
    $('#secbar').style.display = (chrome && s.sec !== 'Title') ? 'flex' : 'none';
    updateHud();
    const ci = SECTIONS.indexOf(s.sec);
    [...$('#secbar').children].forEach((el,k) => { el.classList.toggle('active', k === ci); el.classList.toggle('done', k < ci && ci >= 0); });
    /* progress within the current section (Fer, 2026-10-08): the active label's underline fills */
    if(ci >= 0){
      const idx = S.map((x, j) => j).filter(j => S[j].sec === s.sec);
      const pos = idx.indexOf(cur), frac = idx.length ? (pos + 1) / idx.length : 1;
      $('#secbar').children[ci].style.setProperty('--p', frac.toFixed(3));
    }
    renderNotes();
    try{ history.replaceState(null, '', location.pathname + location.search + '#' + (cur+1)); }catch(e){}
  }
  function renderNotes(){
    const n = S[cur].notes;
    $('#notes').classList.toggle('shown', notesOn && !!n);
    $('#notes-body').textContent = n || '';
  }
  function bump(d){ click = Math.max(0, click + d); maxClick[cur] = Math.max(maxClick[cur] || 0, click); updateHud(); }
  function fwd(){
    const s = S[cur];
    if(s.kind === 'scene'){ const c = ctrlOf(s); if(c && !c.atEnd()){ c.advance(); bump(+1); return; } }
    else { const g = buildGroups().find(g => g.some(b => !b.classList.contains('shown')));
      if(g){ g.forEach(b => b.classList.add('shown')); bump(+1); return; } }
    if(cur < S.length-1){ const from = cur; show(cur+1, +1); maybeTrans(from, cur, true); }
  }
  function bwd(){
    const s = S[cur];
    if(s.kind === 'scene'){ const c = ctrlOf(s); if(c && !c.atStart()){ c.back(); bump(-1); return; } }
    else { const g = buildGroups().reverse().find(g => g.some(b => b.classList.contains('shown')));
      if(g){ g.forEach(b => b.classList.remove('shown')); bump(-1); return; } }
    if(cur > 0){ const from = cur; show(cur-1, -1); maybeTrans(from, cur, false); }
  }
  function onKey(e){
    const k = e.key;
    const mine = ['ArrowRight',' ','Enter','PageDown','ArrowLeft','PageUp','Home','End'];
    if(mine.includes(k) || ((k === 'n' || k === 'd') && S[cur].kind !== 'scene')){
      e.preventDefault(); e.stopImmediatePropagation();
      if(k === 'PageDown') show(cur+1, +1);
      else if(k === 'PageUp') show(cur-1, -1);
      else if(k === 'Home') show(0, 0);
      else if(k === 'End') show(S.length-1, 0);
      else if(k === 'n'){ notesOn = !notesOn; renderNotes(); }
      else if(k === 'd'){ document.body.classList.toggle('draft'); }
      else if(k === 'ArrowLeft') bwd();
      else fwd();
    }
  }
  addEventListener('keydown', onKey, true);
  root.addEventListener('click', e => { if(S[cur].kind === 'static') fwd(); });

  /* #n in the URL lands on slide n, fully built (reload-safe deep links) */
  const jumpToHash = () => {
    const n = parseInt(location.hash.slice(1), 10);
    show(Number.isFinite(n) ? n-1 : 0, 0);
    if(Number.isFinite(n)){ buildGroups().flat().forEach(b => b.classList.add('shown'));
      if(S[cur].kind === 'static'){ click = buildGroups().length; updateHud(); } }
  };
  addEventListener('hashchange', jumpToHash);
  jumpToHash();
  window.deck = { show, fwd, bwd, get cur(){ return cur; }, S };
}

/* ================= video beats (additive; added by section 06) =================
   vid(id, src, cap)        a <video> with sound that plays only on click beats.
                            It shows src's first frame until one of its cues fires.
   vcue(id, src, html, o)   a build element (.b). When revealed, it loads src into
                            video `id` and plays it from the start; stepping back
                            past it restores the previous cue (or the idle frame).
                            html is the cue's visible label ('' for none).
                            o = {step, cls}. The current cue gets class .vcur.
   The ↻ button on each video (or the r key) replays the current cue. Videos
   pause when their slide is left; entering a slide backward or by #n restores
   the cue's first frame without playing. Video ids must be unique per slide. */
const vid = (id, src, cap='') => `
  <figure class="fig vfig">
    <div class="well loaded vwell">
      <video data-vid="${id}" data-src0="${src}" src="${src}" preload="auto" playsinline></video>
      <button class="vreplay" title="Replay (r)" onclick="event.stopPropagation(); vidReplay(this.parentNode.querySelector('video'))">↻</button>
    </div>
    ${cap ? `<figcaption>${cap}</figcaption>` : ''}
  </figure>`;
const vcue = (id, src, html='', o={}) =>
  `<div class="b vcue ${o.cls||''}" data-vid="${id}" data-vsrc="${src}" ${o.step!=null?`data-step="${o.step}"`:''}>${html}</div>`;

function vidReplay(v){ try{ v.currentTime = 0; }catch(e){} v.play().catch(()=>{}); }
function vidSync(v, play){
  const slide = v.closest('.slide');
  const cues = [...slide.querySelectorAll(`.vcue[data-vid="${v.dataset.vid}"]`)];
  const stepOf = c => c.dataset.step != null ? +c.dataset.step : 999;
  let cur = null;
  cues.forEach(c => { if(c.classList.contains('shown') && (!cur || stepOf(c) >= stepOf(cur))) cur = c; });
  cues.forEach(c => c.classList.toggle('vcur', c === cur));
  const key = cur ? 'cue' + cues.indexOf(cur) : 'idle';
  if(v.dataset.vkey === key) return;
  v.dataset.vkey = key;
  const want = cur ? cur.dataset.vsrc : v.dataset.src0;
  if((v.dataset.cur || v.dataset.src0) !== want){ v.dataset.cur = want; v.src = want; }
  v.pause();
  try{ v.currentTime = 0; }catch(e){}
  if(cur && play) v.play().catch(()=>{});
}
(function(){
  const mo = new MutationObserver(recs => {
    const entering = new Set(), vids = new Set();
    recs.forEach(r => {
      const t = r.target;
      if(t.classList.contains('slide')){
        if(t.classList.contains('active')) entering.add(t);
        else t.querySelectorAll('video[data-vid]').forEach(v => v.pause());
      } else if(t.classList.contains('vcue')){
        const s = t.closest('.slide'), v = s && s.querySelector(`video[data-vid="${t.dataset.vid}"]`);
        if(v) vids.add(v);
      }
    });
    entering.forEach(s => s.querySelectorAll('video[data-vid]').forEach(v => vids.add(v)));
    vids.forEach(v => { const s = v.closest('.slide'); vidSync(v, s.classList.contains('active') && !entering.has(s)); });
  });
  mo.observe(document.documentElement, {subtree:true, attributes:true, attributeFilter:['class']});
  addEventListener('keydown', e => {
    if(e.key !== 'r' || e.metaKey || e.ctrlKey || e.altKey) return;
    document.querySelectorAll('.slide.active video[data-vid]').forEach(v => { if(v.dataset.vkey && v.dataset.vkey !== 'idle') vidReplay(v); });
  });
})();
