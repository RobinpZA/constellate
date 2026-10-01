/*
 * Constellate: rendering and interaction
 * Depends on: d3 v7 (global), data/services.js (window.ATLAS)
 */
const { LIC, SUITES, PLANS, SERVICES, LINKS } = window.ATLAS;

/* ---------- build model ---------- */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rand = mulberry(365);
const N = {}, SVC = {}, REL = {};
SERVICES.forEach(s=>{
  s.type='svc'; SVC[s.id]=s; N[s.id]=s;
  const n=s.components.length;
  s.components.forEach((c,i)=>{
    c.type='cmp'; c.svc=s.id; N[c.id]=c;
    const a=s.angle + i/n*Math.PI*2 + (rand()-.5)*.28;
    const r=(i%2?152:106) + (rand()-.5)*20;
    c.x=s.x+Math.cos(a)*r; c.y=s.y+Math.sin(a)*r;
    c.left = c.x < s.x - 8;
  });
});
Object.values(N).forEach(n=>{ if(n.type==='cmp') REL[n.id]=REL[n.id]||new Set(); });
Object.values(N).forEach(n=>{
  if(n.type!=='cmp') return;
  (n.related||[]).forEach(r=>{ if(N[r]&&N[r].type==='cmp'&&r!==n.id){ REL[n.id].add(r); REL[r].add(n.id); } });
});
const ALL = Object.values(N);
const CMP_COUNT = ALL.filter(n=>n.type==='cmp').length;

/* ---------- DOM ---------- */
// Track the OS setting live, so changing it mid-session takes effect without a reload.
const rmQuery = matchMedia('(prefers-reduced-motion: reduce)');
let RM = rmQuery.matches;
rmQuery.addEventListener('change', e=>{ RM = e.matches; });
const COARSE = matchMedia('(pointer: coarse)').matches;
const app=document.getElementById('app'), svgEl=document.getElementById('sky'), topEl=document.getElementById('top'),
      panel=document.getElementById('panel'), crumbEl=document.getElementById('crumbs'), hint=document.getElementById('hint'),
      q=document.getElementById('q'), results=document.getElementById('results'),
      planSel=document.getElementById('plan'), suitesSel=document.getElementById('suites'), suiteFilter=document.getElementById('suite-filter');
const state={focus:null, sel:null, plan:'all', suites:[]};
const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const svg=d3.select(svgEl);
const bg=svg.append('g').attr('class','bg');
const world=svg.append('g');
const gLinks=world.append('g');
const gThreads=world.append('g');
const gSvcs=world.append('g');

// background field
const stars=d3.range(420).map(()=>({x:-1600+rand()*5200,y:-1300+rand()*4000,r:.4+rand()*1.3,o:.15+rand()*.6}));
bg.selectAll('circle').data(stars).join('circle').attr('cx',d=>d.x).attr('cy',d=>d.y).attr('r',d=>d.r).attr('opacity',d=>d.o);

gLinks.selectAll('path').data(LINKS).join('path').attr('class','link')
  .attr('d',([a,b])=>`M${SVC[a].x},${SVC[a].y}L${SVC[b].x},${SVC[b].y}`);

function constellation(s){
  const c=s.components; let d=`M${c[0].x},${c[0].y}`;
  for(let i=1;i<c.length;i++) d+=`L${c[i].x},${c[i].y}`;
  c.forEach((p,i)=>{ if(i%3===0) d+=`M${s.x},${s.y}L${p.x},${p.y}`; });
  return d;
}

const sg=gSvcs.selectAll('g.svc-g').data(SERVICES).join('g').attr('class','svc-g')
  .style('--c',d=>`var(--${d.id})`).style('--i',(d,i)=>i);
const rv=sg.append('g').attr('class','reveal');
rv.append('path').attr('class','cline').attr('d',constellation);

const cn=rv.selectAll('g.cmp').data(d=>d.components).join('g').attr('class','node cmp')
  .attr('transform',d=>`translate(${d.x},${d.y})`).attr('tabindex',-1).attr('role','button')
  .attr('aria-label',d=>`${d.name}, part of ${SVC[d.svc].short}`);
const ci=cn.append('g').attr('class','inner');
ci.append('circle').attr('class','hit').attr('r',COARSE?22:15);
ci.append('circle').attr('class','focusring').attr('r',11);
ci.append('circle').attr('class','relring').attr('r',9.5);
ci.append('circle').attr('class','core').attr('r',4.6);
ci.append('text').attr('class','lbl').attr('x',d=>d.left?-12:12).attr('y',4.5)
  .attr('text-anchor',d=>d.left?'end':'start').text(d=>d.name);

const sn=rv.append('g').attr('class','node svc').attr('transform',d=>`translate(${d.x},${d.y})`)
  .attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d.name}, ${d.components.length} components`)
  .attr('aria-describedby','kbd-help');
const si=sn.append('g').attr('class','inner');
si.append('circle').attr('class','halo').attr('r',28);
si.append('circle').attr('class','focusring').attr('r',21);
si.append('circle').attr('class','ring').attr('r',15);
si.append('path').attr('class','spark').attr('d','M0,-13L2.3,-2.3L13,0L2.3,2.3L0,13L-2.3,2.3L-13,0L-2.3,-2.3Z');
si.append('circle').attr('class','spark').attr('r',4);
si.append('text').attr('class','lbl').attr('y',48).text(d=>d.short);

d3.selectAll('.node')
  .on('click',(e,d)=>{e.stopPropagation(); selectNode(d.id);})
  .on('keydown',(e,d)=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault(); selectNode(d.id); return;}
    const step={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
    if(step){e.preventDefault(); stepFocus(d,step);}
  });

// Roving focus: only service stars are tab stops. Arrows walk a service's features,
// skipping ones the licence filter has muted.
function stepFocus(d,step){
  const s=SVC[d.type==='svc'?d.id:d.svc];
  const open=s.components.filter(c=>!nodeEl(c.id).classList.contains('muted'));
  if(!open.length) return;
  const i=open.indexOf(d);
  const next=i<0 ? open[step>0?0:open.length-1] : open[(i+step+open.length)%open.length];
  nodeEl(next.id).focus();
}

/* ---------- zoom ---------- */
let overviewK=1;
const zoom=d3.zoom().scaleExtent([.2,12]).on('zoom',e=>{
  const t=e.transform;
  world.attr('transform',t);
  bg.attr('transform',`translate(${t.x*.18},${t.y*.18}) scale(${.6+.4*Math.pow(t.k,.25)})`);
  svgEl.style.setProperty('--inv',1/t.k);
  svgEl.classList.toggle('deep',t.k>overviewK*1.6);
  if(e.sourceEvent) hideHint();
});
svg.call(zoom).on('dblclick.zoom',null);

function viewportBox(ignorePanel){
  const r=svgEl.getBoundingClientRect(), tb=topEl.getBoundingClientRect(), mobile=r.width<=720;
  let x0=0, y0=tb.bottom-r.top+6, w=r.width, h=r.height-y0-(mobile?30:34);
  if(!ignorePanel && panel.classList.contains('open')){
    if(mobile) h=r.height-panel.offsetHeight-y0-8; else w-=panel.offsetWidth;
  }
  return {x0,y0,w:Math.max(w,140),h:Math.max(h,120)};
}
function bounds(pts,px,py){const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);return[Math.min(...xs)-px,Math.min(...ys)-py,Math.max(...xs)+px,Math.max(...ys)+py+30];}
const ALL_B = bounds(ALL,70,60);
const clusterB = id => bounds([SVC[id],...SVC[id].components],95,45);
function transformFor(b,ignorePanel){
  const v=viewportBox(ignorePanel);
  const k=Math.min(v.w/(b[2]-b[0]), v.h/(b[3]-b[1]));
  const cx=(b[0]+b[2])/2, cy=(b[1]+b[3])/2;
  return d3.zoomIdentity.translate(v.x0+v.w/2-k*cx, v.y0+v.h/2-k*cy).scale(k);
}
function fitTo(b,dur=850){
  const t=transformFor(b);
  svg.interrupt();
  if(RM||!dur) svg.call(zoom.transform,t);
  else svg.transition().duration(dur).ease(d3.easeCubicInOut).call(zoom.transform,t);
}
function refreshOverviewK(){ overviewK=transformFor(ALL_B,true).k; }

/* ---------- state ---------- */
function selectNode(id){
  const n=N[id]; if(!n) return;
  hideHint(); closeResults();
  state.focus = n.type==='svc' ? n.id : n.svc;
  state.sel = id;
  apply();
  showPanel(id);
  requestAnimationFrame(()=>fitTo(clusterB(state.focus)));
}
function resetAll(){
  const back=state.focus;
  state.focus=null; state.sel=null; apply(); hidePanel(back);
  fitTo(ALL_B);
}
function apply(){
  svgEl.classList.toggle('focused',!!state.focus);
  sg.classed('is-focus',d=>d.id===state.focus);
  cn.classed('sel',d=>d.id===state.sel);
  drawThreads(); renderCrumbs();
}
function drawThreads(){
  const n=state.sel&&N[state.sel];
  const data = n&&n.type==='cmp' ? [...REL[n.id]].map(t=>({a:n,b:N[t]})) : [];
  gThreads.selectAll('path').data(data,d=>d.a.id+'>'+d.b.id).join(
    en=>en.append('path').attr('class','thread').style('opacity',0)
          .call(p=>p.transition().duration(RM?0:500).style('opacity',.85)),
    up=>up, ex=>ex.remove())
   .attr('d',d=>{
     const {a,b}=d, mx=(a.x+b.x)/2, my=(a.y+b.y)/2, dx=b.x-a.x, dy=b.y-a.y;
     return `M${a.x},${a.y}Q${mx-dy*.2},${my+dx*.2} ${b.x},${b.y}`;
   })
   .style('stroke',d=>`var(--${d.b.svc})`);
  cn.classed('rel',d=>!!(n&&n.type==='cmp'&&REL[n.id].has(d.id)));
}
// A plan covers its tier and below, plus its own `with` list, minus its `without` list.
// Suites only count on plans that can take them. A plan's `suites` object lists extra
// components each suite adds on that plan, such as Defender for Endpoint on F3.
function inPlan(c){
  if(state.plan==='all') return true;
  if(state.plan==='addon') return c.lic==='addon';
  const p=PLANS[state.plan];
  if(p.without?.includes(c.id)) return false;
  if(p.with?.includes(c.id)) return true;
  if(typeof p.suites==='object' && state.suites.some(s=>p.suites[s]?.includes(c.id))) return true;
  if(c.lic==='addon') return false;
  if(LIC[c.lic].rank<=LIC[p.upTo].rank) return true;
  return !!(p.suites && c.suite && state.suites.includes(c.suite));
}
function applyLicence(){
  cn.classed('muted',d=>!inPlan(d));
  panel.querySelectorAll('.list [data-go]').forEach(b=>{
    const h=!inPlan(N[b.dataset.go]);
    b.classList.toggle('is-muted',h);
    b.querySelector('.ex').hidden=!h;
  });
}
const lastPlanOpt=planSel.querySelector('option[value="addon"]');
Object.entries(PLANS).forEach(([k,p])=>lastPlanOpt.before(new Option(p.label,k)));
planSel.addEventListener('change',()=>{
  state.plan=planSel.value;
  suiteFilter.hidden=!PLANS[state.plan]?.suites;
  applyLicence();
});
suitesSel.addEventListener('change',()=>{ state.suites=suitesSel.value?suitesSel.value.split('+'):[]; applyLicence(); });

/* ---------- crumbs & panel ---------- */
function renderCrumbs(){
  if(!state.focus){ crumbEl.innerHTML=`<span>Microsoft 365 as a star chart: ${SERVICES.length} constellations, ${CMP_COUNT} features</span>`; return; }
  const s=SVC[state.focus];
  let h=`<button data-go="__all">All services</button><span aria-hidden="true">/</span>`;
  if(state.sel && state.sel!==s.id) h+=`<button data-go="${s.id}">${esc(s.short)}</button><span aria-hidden="true">/</span><span class="cur">${esc(N[state.sel].name)}</span>`;
  else h+=`<span class="cur">${esc(s.short)}</span>`;
  crumbEl.innerHTML=h;
}
// Spoken only when the licence filter mutes a row; the faint colour carries it visually.
const EX = `<span class="sr-only ex" hidden>, not in the selected licence</span>`;
// Plans below the component's tier that include it anyway, e.g. desktop apps in Business Standard.
const extraPlans = c => { const ps=Object.values(PLANS).filter(p=>p.with?.includes(c.id)).map(p=>p.label);
  return ps.length ? `<span class="chip">or ${esc(ps.join(', '))}</span>` : ''; };
const licShort = c =>LIC[c.lic].short + (c.suite ? ' / '+SUITES[c.suite].label.split(' ')[0] : '');
function showPanel(id){
  const n=N[id], s=SVC[n.type==='svc'?n.id:n.svc];
  panel.style.setProperty('--c',`var(--${s.id})`);
  let h=`<button class="close" data-close aria-label="Close details">\u00d7</button>`;
  if(n.type==='svc'){
    h+=`<p class="kind">Service</p><h2>${esc(n.name)}</h2><p class="sum">${esc(n.summary)}</p>
      <div class="actions"><a class="btn" href="${n.docs}" target="_blank" rel="noopener">Open documentation</a>
      <a class="btn ghost" href="${n.portal}" target="_blank" rel="noopener">Open admin centre</a></div>
      <h3>${n.components.length} components</h3><ul class="list">${n.components.map(c=>
        `<li><button data-go="${c.id}"><span class="dot"></span><span>${esc(c.name)}${EX}</span><span class="lic" title="${esc(LIC[c.lic].label)}">${licShort(c)}</span></button></li>`).join('')}</ul>`;
  } else {
    const rel=[...REL[n.id]].map(r=>N[r]);
    h+=`<p class="kind">Part of <button data-go="${s.id}">${esc(s.name)}</button></p><h2>${esc(n.name)}</h2>
      <p class="sum">${esc(n.summary)}</p>
      <p class="licline"><span class="chip">${LIC[n.lic].label}</span>${extraPlans(n)}${n.suite?`<span class="chip" title="${esc(SUITES[n.suite].full)}">or ${esc(SUITES[n.suite].label)} on Business Premium / E3</span>`:''}${n.note?`<span>${esc(n.note)}</span>`:''}</p>
      <div class="actions"><a class="btn" href="${n.docs}" target="_blank" rel="noopener">Open Microsoft Learn docs</a></div>
      ${rel.length?`<h3>Works with</h3><ul class="list">${rel.map(r=>
        `<li><button data-go="${r.id}" style="--c:var(--${r.svc})"><span class="dot"></span><span>${esc(r.name)}${EX}</span><span class="lic">${esc(SVC[r.svc].short)}</span></button></li>`).join('')}</ul>`:''}`;
  }
  panel.innerHTML=h; panel.scrollTop=0;
  panel.classList.add('open'); app.classList.add('panel-open');
  applyLicence();
  const h2=panel.querySelector('h2'); h2.tabIndex=-1; h2.focus({preventScroll:true});
}
const nodeEl = id => d3.selectAll('.node').filter(d=>d.id===id).node();
// Return focus to the map when the panel hides, so keyboard users aren't dropped onto <body>.
function hidePanel(returnTo){
  const had=panel.contains(document.activeElement);
  panel.classList.remove('open'); app.classList.remove('panel-open');
  if(had && returnTo) nodeEl(returnTo)?.focus({preventScroll:true});
}
function closePanel(){
  hidePanel(state.sel);
  if(state.sel && N[state.sel].type==='cmp'){ state.sel=state.focus; apply(); }
  requestAnimationFrame(()=>fitTo(state.focus?clusterB(state.focus):ALL_B));
}
document.addEventListener('click',e=>{
  const go=e.target.closest('[data-go]');
  if(go){ go.dataset.go==='__all' ? resetAll() : selectNode(go.dataset.go); return; }
  if(e.target.closest('[data-close]')){ closePanel(); return; }
  if(!e.target.closest('.search')) closeResults();
});

/* ---------- search ---------- */
const resultsStatus=document.getElementById('results-status');
function closeResults(){ results.hidden=true; q.setAttribute('aria-expanded','false'); }
q.addEventListener('input',()=>{
  const t=q.value.trim().toLowerCase();
  if(!t){ closeResults(); return; }
  const hay=n=>(n.name+' '+(n.short||'')+' '+(n.aka||'')).toLowerCase();
  let m=ALL.filter(n=>hay(n).includes(t));
  if(m.length<8) m=m.concat(ALL.filter(n=>!m.includes(n)&&n.summary.toLowerCase().includes(t)));
  m=m.slice(0,8);
  results.innerHTML = m.length ? m.map(n=>{
    const s=n.type==='svc'?n:SVC[n.svc];
    return `<li><button data-go="${n.id}" style="--c:var(--${s.id})"><span class="dot"></span><span>${esc(n.name)}</span><span class="where">${n.type==='svc'?'Service':esc(s.short)}</span></button></li>`;
  }).join('') : `<li class="empty">Nothing matches \u201c${esc(q.value)}\u201d. Try a product name or acronym like MDE or DLP.</li>`;
  results.hidden=false; q.setAttribute('aria-expanded','true');
  resultsStatus.textContent = m.length ? `${m.length} ${m.length===1?'result':'results'}. Press the down arrow to choose.` : 'No matches.';
});
q.addEventListener('keydown',e=>{
  if(e.key==='Enter'){ const b=results.querySelector('button'); if(b){ b.click(); q.value=''; q.blur(); } }
  if(e.key==='ArrowDown'){ const b=results.querySelector('button'); if(b){ e.preventDefault(); b.focus(); } }
});
results.addEventListener('keydown',e=>{
  const bs=[...results.querySelectorAll('button')], i=bs.indexOf(document.activeElement);
  if(e.key==='ArrowDown'&&i<bs.length-1){e.preventDefault(); bs[i+1].focus();}
  if(e.key==='ArrowUp'){e.preventDefault(); i>0?bs[i-1].focus():q.focus();}
});
results.addEventListener('click',()=>{ q.value=''; });

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if(!results.hidden){ closeResults(); return; }
  if(state.sel && N[state.sel].type==='cmp') selectNode(state.focus);
  else if(state.focus) resetAll();
});

/* ---------- hint, init, resize ---------- */
function hideHint(){ hint.classList.add('gone'); }
refreshOverviewK();
renderCrumbs();
fitTo(ALL_B,0);
let rt;
addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ refreshOverviewK(); fitTo(state.focus?clusterB(state.focus):ALL_B,0); },120); });
