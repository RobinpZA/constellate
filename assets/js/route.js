// Deep-link hash rules. Pure: adds window.ATLAS.parseHash and window.ATLAS.formatHash.
// Format: #<id>?plan=<key>&suites=<a+b>. Every part is optional.
(function(){
const {PLANS,SUITES,SERVICES}=window.ATLAS;
const ids=new Set();
for(const s of SERVICES){ ids.add(s.id); for(const c of s.components||[]) ids.add(c.id); }
const takesSuites=plan=>plan!=='all' && plan!=='addon' && !!PLANS[plan]?.suites;

window.ATLAS.parseHash=function parseHash(hash){
  const out={id:null,plan:'all',suites:[]};
  try{
    const h=String(hash||'').replace(/^#/,'');
    const q=h.indexOf('?');
    const idPart=decodeURIComponent(q<0?h:h.slice(0,q));
    const query=q<0?'':h.slice(q+1);
    if(ids.has(idPart)) out.id=idPart;
    let suites=[];
    for(const pair of query.split('&')){
      const e=pair.indexOf('=');
      if(e<0) continue;
      const k=pair.slice(0,e), v=decodeURIComponent(pair.slice(e+1));
      if(k==='plan' && (v==='all'||v==='addon'||Object.hasOwn(PLANS,v))) out.plan=v;
      else if(k==='suites') suites=v.split('+');
    }
    if(takesSuites(out.plan)) out.suites=Object.keys(SUITES).filter(k=>suites.includes(k));
  }catch(e){
    return {id:null,plan:'all',suites:[]};
  }
  return out;
};

window.ATLAS.formatHash=function formatHash({id,plan,suites}){
  const parts=[];
  if(plan && plan!=='all') parts.push('plan='+encodeURIComponent(plan));
  if(takesSuites(plan) && suites && suites.length) parts.push('suites='+suites.map(encodeURIComponent).join('+'));
  const idPart=id?encodeURIComponent(id):'';
  if(!idPart && !parts.length) return '';
  return '#'+idPart+(parts.length?'?'+parts.join('&'):'');
};
})();
