/** Pure, deterministic scenario calculations. All currency values are EUR. */
export const CHANNELS = ['DTC Online', 'Retail/Grocery', 'Gym & Office'];
export const PRICES = [1.79, 2.19, 2.59];
export const MARKETING_CHANNELS = ['Paid Social', 'Influencer / Content', 'Referral / Subscription', 'Retail Sampling'];
export function createScenario(name, now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name, price: 2.19,
    mix: [40,40,20], segment: 'All segments', regions: ['Berlin'], positioning: '', objective: '', referenceCountry: 'Median',
    deploymentPct: 10, excludeOutliers: false, priceResponse: true, costDelta: 0,
    launchMonth: `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`, ramp: [25,50,75,100],
    monthlyBudgets: Object.fromEntries(MARKETING_CHANNELS.map(c => [c,500])), fixedCost: 10000, cacMultiplier: 1,
    targetPaybackMonths: 12, targetAcceptancePct: 0, targetContribution: 0 };
}
const finite = v => typeof v === 'number' && Number.isFinite(v);
const median = xs => { const a = [...xs].sort((a,b)=>a-b); return (a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2; };
export function validateScenario(s, data) {
  const errors = [];
  if (!s || typeof s !== 'object' || Array.isArray(s)) return ['Scenario must be an object.'];
  for (const k of ['id','name','segment','positioning','objective','referenceCountry']) if (typeof s[k] !== 'string' || s[k].length > 2000) errors.push(`Invalid ${k}.`);
  if (!s.id || !s.name) errors.push('Scenario needs an ID and name.');
  if (!PRICES.includes(s.price)) errors.push('Choose one of the three tested prices.');
  if (!Array.isArray(s.mix) || s.mix.length!==3 || s.mix.some(v=>!finite(v)||v<0||v>100) || Math.abs(s.mix.reduce((a,b)=>a+b,0)-100)>1e-7) errors.push('Channel shares must total 100%.');
  if (!Array.isArray(s.ramp)||s.ramp.length!==4||s.ramp.some(v=>!finite(v)||v<0||v>100)) errors.push('Enter four ramp percentages between 0 and 100.');
  if (!Array.isArray(s.regions)||!s.regions.length||s.regions.some(v=>typeof v!=='string'||!v.trim()||v.length>200)) errors.push('Select at least one region.');
  if (typeof s.launchMonth!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(s.launchMonth)||+s.launchMonth.slice(0,4)<1900||+s.launchMonth.slice(0,4)>9998) errors.push('Choose a valid launch month.');
  for(const k of ['deploymentPct','fixedCost','targetContribution']) if(!finite(s[k])||s[k]<0) errors.push(`${k} must be a non-negative number.`);
  if(!finite(s.cacMultiplier)||s.cacMultiplier<=0) errors.push('CAC multiplier must be greater than zero.');
  if(!finite(s.costDelta)||s.costDelta < -(data?.costs?.unitCost ?? 0.62)) errors.push('Cost adjustment cannot make unit cost negative.');
  if(!Number.isInteger(s.targetPaybackMonths)||s.targetPaybackMonths<1||s.targetPaybackMonths>12) errors.push('Payback target must be 1–12 months.');
  if(!finite(s.targetAcceptancePct)||s.targetAcceptancePct<0||s.targetAcceptancePct>100) errors.push('Acceptance target must be 0–100%.');
  for(const k of ['priceResponse','excludeOutliers']) if(typeof s[k]!=='boolean') errors.push(`Invalid ${k}.`);
  if(!s.monthlyBudgets || typeof s.monthlyBudgets!=='object' || Object.keys(s.monthlyBudgets).some(k=>!MARKETING_CHANNELS.includes(k)) || MARKETING_CHANNELS.some(k=>!finite(s.monthlyBudgets[k])||s.monthlyBudgets[k]<0)) errors.push('Enter a non-negative budget for each marketing channel.');
  if(data) {
    if(!['Median',...(data.historical?.countries??[]).map(c=>c.country)].includes(s.referenceCountry)) errors.push('Unknown reference country.');
    if(data.segments && !data.segments.some(x=>x.segment===s.segment)) errors.push('Unknown customer segment.');
  }
  return errors;
}
const totalThrough = (months, n, fixed) => {
  const rows=months.slice(0,n);
  const out=Object.fromEntries(['units','netRevenue','contribution','marketingSpend','acquiredCustomers'].map(k=>[k,rows.reduce((a,m)=>a+m[k],0)]));
  return {...out,balance:out.contribution-out.marketingSpend-fixed};
};
export function simulate(s, data) {
  const errors=validateScenario(s,data);
  if(errors.length) return {valid:false,errors};
  const rows=CHANNELS.map(channel=>data?.prices?.find(r=>r.channel===channel&&r.price_eur===s.price));
  const baseRows=CHANNELS.map(channel=>data?.prices?.find(r=>r.channel===channel&&r.price_eur===2.19));
  if([...rows,...baseRows].some(r=>!r||['unit_contribution_eur','net_price_to_lumen_eur','estimated_acceptance_pct_of_survey'].some(k=>!finite(r[k]))||r.net_price_to_lumen_eur<=0||r.estimated_acceptance_pct_of_survey<=0)) errors.push('Complete, compatible price-test data is required.');
  const countries=data?.historical?.countries??[];
  const field=s.excludeOutliers?'monthlyUnitsWithoutOutliers':'monthlyUnits';
  if(!countries.length||countries.some(c=>!finite(c[field])||c[field]<0)) errors.push('Historical volume reference is unavailable.');
  const season=data?.seasonality??[];
  if(season.length!==12||new Set(season.map(m=>m.month)).size!==12||season.some(m=>!Number.isInteger(m.month)||m.month<1||m.month>12||!finite(m.index)||m.index<=0)) errors.push('Twelve valid monthly seasonality observations are required.');
  const marketing=MARKETING_CHANNELS.map(c=>data?.marketing?.find(m=>m.channel===c));
  if(marketing.some(m=>!m||!finite(m.cac)||m.cac<=0)) errors.push('Valid historical acquisition costs are required for all marketing channels.');
  if(errors.length) return {valid:false,errors};
  const referenceMonthlyUnits=s.referenceCountry==='Median'?median(countries.map(c=>c[field])):countries.find(c=>c.country===s.referenceCountry)[field];
  const acceptanceByChannel=rows.map((r,i)=>({channel:CHANNELS[i],acceptance:r.estimated_acceptance_pct_of_survey,net:r.net_price_to_lumen_eur,contribution:r.unit_contribution_eur-s.costDelta,weight:s.mix[i]/100}));
  const unitContribution=acceptanceByChannel.reduce((a,r)=>a+r.weight*r.contribution,0);
  const unitNetRevenue=acceptanceByChannel.reduce((a,r)=>a+r.weight*r.net,0);
  // The official tests have equal acceptance across channels. Reject incompatible future data
  // rather than silently changing the meaning of the user-entered sales shares.
  const ratios=rows.map((r,i)=>r.estimated_acceptance_pct_of_survey/baseRows[i].estimated_acceptance_pct_of_survey);
  if(s.priceResponse && ratios.some(r=>Math.abs(r-ratios[0])>1e-10)) return {valid:false,errors:['Price response differs by channel; a common volume adjustment cannot preserve the selected sales mix.']};
  const priceFactor=s.priceResponse?ratios[0]:1;
  const acquisition=marketing.map(m=>({channel:m.channel,budget:s.monthlyBudgets[m.channel],cac:m.cac*s.cacMultiplier,customers:s.monthlyBudgets[m.channel]/(m.cac*s.cacMultiplier),ltv:m.ltv}));
  const marketingSpend=acquisition.reduce((a,m)=>a+m.budget,0), acquired=acquisition.reduce((a,m)=>a+m.customers,0);
  const meanIndex=season.reduce((a,m)=>a+m.index,0)/12;
  function run(volumeFactor=1,cacFactor=1) {
    let cumulativeBalance=-s.fixedCost,cumulativeContribution=0,cumulativeMarketing=0;
    const [year,month]=s.launchMonth.split('-').map(Number);
    const months=Array.from({length:12},(_,i)=>{
      const date=new Date(Date.UTC(year,month-1+i,1));
      const units=referenceMonthlyUnits*s.deploymentPct/100*priceFactor*(season.find(m=>m.month===date.getUTCMonth()+1).index/meanIndex)*s.ramp[Math.min(i,3)]/100*volumeFactor;
      const netRevenue=units*unitNetRevenue,contribution=units*unitContribution;
      const balance=contribution-marketingSpend-(i===0?s.fixedCost:0);
      cumulativeBalance+=contribution-marketingSpend;cumulativeContribution+=contribution;cumulativeMarketing+=marketingSpend;
      return {month:date.toISOString().slice(0,7),units,netRevenue,contribution,marketingSpend,acquiredCustomers:acquired/cacFactor,balance,cumulativeBalance,cumulativeContribution,cumulativeMarketing};
    });
    const paybackIndex=months.findIndex(m=>m.cumulativeBalance>0);
    return {months,totals:totalThrough(months,12,s.fixedCost),paybackMonth:paybackIndex<0?null:paybackIndex+1};
  }
  const central=run();
  const sensitivity=[['Downside',.75,1.2],['Central',1,1],['Upside',1.25,.8]].map(([name,volumeFactor,cacFactor])=>{const r=run(volumeFactor,cacFactor);return {name,volumeFactor,cacFactor,...r.totals,paybackMonth:r.paybackMonth};});
  const annualCost=s.fixedCost+marketingSpend*12;
  const rampSeasonSum=Array.from({length:12},(_,i)=>{const m=(+s.launchMonth.slice(5)-1+i)%12+1;return season.find(x=>x.month===m).index/meanIndex*s.ramp[Math.min(i,3)]/100;}).reduce((a,b)=>a+b,0);
  const contributionPerDeploymentPct=referenceMonthlyUnits/100*priceFactor*rampSeasonSum*unitContribution;
  const thresholds={breakEvenDeploymentPct:contributionPerDeploymentPct>0?annualCost/contributionPerDeploymentPct:null,breakEvenMonthlyUnits:unitContribution>0&&rampSeasonSum>0?annualCost/(unitContribution*rampSeasonSum):null};
  const minAcceptance=Math.min(...acceptanceByChannel.filter(r=>r.weight>0).map(r=>r.acceptance));
  const objectives=[{label:'Payback within target',met:central.paybackMonth!==null&&central.paybackMonth<=s.targetPaybackMonths,actual:central.paybackMonth,target:s.targetPaybackMonths},{label:'Minimum selected-channel acceptance (%)',met:minAcceptance>=s.targetAcceptancePct,actual:minAcceptance,target:s.targetAcceptancePct},{label:'12-month contribution (€)',met:central.totals.contribution>=s.targetContribution,actual:central.totals.contribution,target:s.targetContribution}];
  const warnings=['Illustrative German scenario, not a validated forecast. Regions and segments do not multiply sales.','Acquisition estimates are separate from sales volumes. Fixed marketing budgets mean CAC changes customers acquired, not commercial profit.','Recovery includes modeled spending only; excludes unprovided costs, tax and working capital.'];
  if(s.priceResponse) warnings.push('Proportional acceptance response is a user assumption, not demonstrated price elasticity.');
  if(unitContribution<=0) warnings.push('Non-positive unit contribution: increasing sales cannot recover spending.');
  return {valid:true,errors:[],referenceMonthlyUnits,priceFactor,unitContribution,unitNetRevenue,marginPct:unitContribution/unitNetRevenue*100,acceptanceByChannel,...central,horizons:Object.fromEntries([3,6,12].map(n=>[n,totalThrough(central.months,n,s.fixedCost)])),acquisition,warnings,sensitivity,thresholds,objectives};
}
export function compareScenarios(a,b,data) {
  const left=simulate(a,data),right=simulate(b,data),findings=[];
  if(!left.valid||!right.valid) return {left,right,findings,warnings:['Correct invalid scenarios before comparing.']};
  const pairs=[['12-month contribution',left.totals.contribution,right.totals.contribution],['12-month balance',left.totals.balance,right.totals.balance],['Conditional units',left.totals.units,right.totals.units],['Contribution per can',left.unitContribution,right.unitContribution]];
  pairs.forEach(([label,x,y])=>findings.push(Math.abs(x-y)<1e-7?`${label}: equal.`:`${label}: ${x>y?a.name:b.name} is higher by ${Math.abs(x-y).toFixed(2)}.`));
  if(pairs.every(([,x,y])=>Math.abs(x-y)<1e-7)) findings.unshift('The scenarios currently have identical commercial results. Names do not select a strategy.');
  for(let i=0;i<CHANNELS.length;i++){const x=left.acceptanceByChannel[i].acceptance,y=right.acceptanceByChannel[i].acceptance;findings.push(`${CHANNELS[i]} acceptance: ${a.name} ${x.toFixed(1)}%; ${b.name} ${y.toFixed(1)}%.`);}
  findings.push(`Payback: ${a.name} ${left.paybackMonth===null?'not reached':`month ${left.paybackMonth}`}; ${b.name} ${right.paybackMonth===null?'not reached':`month ${right.paybackMonth}`}.`);
  const measures=r=>[r.totals.balance,r.unitContribution,...r.acceptanceByChannel.map(x=>x.acceptance)];
  const l=measures(left),r=measures(right);
  const dominates=(x,y)=>x.every((v,i)=>v>=y[i]-1e-7)&&x.some((v,i)=>v>y[i]+1e-7);
  findings.push(dominates(l,r)?`${a.name} dominates on modeled balance, unit contribution and tested acceptance; this does not resolve brand positioning.`:dominates(r,l)?`${b.name} dominates on modeled balance, unit contribution and tested acceptance; this does not resolve brand positioning.`:'No strict dominance on modeled balance, unit contribution and tested acceptance. Choose priorities explicitly.');
  for(const [s,res] of [[a,left],[b,right]]) { const down=res.sensitivity[0],up=res.sensitivity[2]; if(down.balance<0&&up.balance>=0) findings.push(`${s.name}: the illustrative volume range changes whether spending is recovered by month 12.`); }
  return {left,right,findings,warnings:['No hidden score or universal winner. Select the recommended scenario yourself.']};
}
