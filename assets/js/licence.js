// Licence rules. Pure: reads LIC and PLANS from window.ATLAS and adds window.ATLAS.inPlan.
(function(){
const {LIC,PLANS}=window.ATLAS;
// A plan covers its tier and below, plus its own `with` list, minus its `without` list.
// Suites only count on plans that can take them. A plan's `suites` object lists extra
// components each suite adds on that plan, such as Defender for Endpoint on F3.
window.ATLAS.inPlan=function inPlan(c,plan,suites){
  if(plan==='all') return true;
  if(plan==='addon') return c.lic==='addon';
  const p=PLANS[plan];
  if(p.without?.includes(c.id)) return false;
  if(p.with?.includes(c.id)) return true;
  if(typeof p.suites==='object' && suites.some(s=>p.suites[s]?.includes(c.id))) return true;
  if(c.lic==='addon') return false;
  if(LIC[c.lic].rank<=LIC[p.upTo].rank) return true;
  return !!(p.suites && c.suite && suites.includes(c.suite));
};
})();
