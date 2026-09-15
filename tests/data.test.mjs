import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCaseData } from '../build.mjs';
import { parseCSV } from '../dist/model.js';

const data=await buildCaseData();
const read=name=>readFile(new URL(`../data/${name}.csv`,import.meta.url),'utf8').then(parseCSV);
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

test('all 12 sources are represented, exact duplicate removal and complete benchmark window',()=>{
  assert.equal(data.sources.length,12);
  assert.equal(new Set(data.sources.map(s=>s.id)).size,12);
  assert.equal(data.audit.historicalRowsRaw,706);
  assert.equal(data.audit.historicalRowsUnique,702);
  assert.equal(data.audit.duplicatesRemoved,4);
  assert.equal(data.historical.weeks,52);
  assert.equal(data.historical.windowStart,'2025-07-07');
  assert.equal(data.historical.windowEnd,'2026-06-29');
  assert.equal(data.prices.length,9);
  assert.equal(data.marketing.length,4);
  assert.equal(data.segments.find(s=>s.segment==='All segments').count,420);
  assert.equal(data.pricePerception.find(s=>s.segment==='All segments').count,300);
});

test('three price/cost spot checks match raw records',async()=>{
  const prices=await read('price_test_results');
  for(const [p,c] of [[1.79,'DTC Online'],[2.19,'Retail/Grocery'],[2.59,'Gym & Office']]){
    const raw=prices.find(r=>Number(r.price_eur)===p&&r.channel===c);
    const actual=data.prices.find(r=>r.price_eur===p&&r.channel===c);
    close(actual.unit_contribution_eur,Number(raw.unit_contribution_eur));
    close(actual.net_price_to_lumen_eur,Number(raw.net_price_to_lumen_eur));
    close(actual.estimated_acceptance_pct_of_survey,Number(raw.estimated_acceptance_pct_of_survey));
  }
  close(data.prices.find(r=>r.price_eur===1.79&&r.channel==='DTC Online').unit_contribution_eur,.77);
  close(data.prices.find(r=>r.price_eur===2.19&&r.channel==='Retail/Grocery').unit_contribution_eur,.63);
  close(data.prices.find(r=>r.price_eur===2.59&&r.channel==='Gym & Office').unit_contribution_eur,1.45);
  close(data.costs.components.reduce((n,c)=>n+c.value,0),.62);
  close(data.costs.unitCost,.62);
  close(data.costs.homeGrossMarginPct,30);
});

test('seasonality preserves annual volume with actual mean',()=>{
  close(data.audit.seasonalityMean,1220/12);
  close(data.seasonality.reduce((n,r)=>n+r.factor,0),12);
  close(data.seasonality.find(r=>r.month===1).factor,78/(1220/12));
});

test('historical and CAC aggregates independently reconcile to source',async()=>{
  const raw=await read('historical_sales_weekly');
  const unique=raw.filter((r,i)=>raw.findIndex(x=>JSON.stringify(x)===JSON.stringify(r))===i);
  const sweden=unique.filter(r=>r.country==='Sweden'&&r.week_start_date>='2025-07-07');
  close(data.historical.countries.find(r=>r.country==='Sweden').monthlyUnits,sweden.reduce((n,r)=>n+Number(r.units_sold),0)/12);
  close(data.historical.countries.find(r=>r.country==='Sweden').monthlyUnits,22941.75);
  const funnel=(await read('marketing_funnel_monthly')).filter(r=>r.channel==='Paid Social');
  close(data.marketing.find(r=>r.channel==='Paid Social').cac,funnel.reduce((n,r)=>n+Number(r.spend_eur),0)/funnel.reduce((n,r)=>n+Number(r.conversions_customers_acquired),0));
  for(const country of data.historical.countries)close(Object.values(country.channelMonthlyUnits).reduce((a,b)=>a+b,0),country.monthlyUnits);
  assert.deepEqual(data.audit.outliers,[],'Conservative three-IQR rule finds none; do not silently substitute another rule');
});

test('aggregates and perception curves reconcile without joining survey populations',async()=>{
  const raw=await read('customer_survey');
  close(data.segments[0].meanSpend,raw.reduce((n,r)=>n+Number(r.monthly_beverage_spend_eur),0)/420);
  assert.equal(data.segments.slice(1).reduce((n,r)=>n+r.count,0),420);
  const sensitivity=await read('price_sensitivity_survey');
  const curve=data.pricePerception[0].curves.find(r=>r.price===2.2);
  close(curve.tooCheapPct,sensitivity.filter(r=>Number(r.too_cheap_eur)>=2.2).length/300*100);
  close(curve.tooExpensivePct,sensitivity.filter(r=>Number(r.too_expensive_eur)<=2.2).length/300*100);
  assert.equal(data.pricePerception[0].curves.length,71);
});

test('public data contains no respondent fields or individual email/name values',async()=>{
  const prohibited=new Set(['respondent_id','first_name','last_name','email']);
  function visit(value){
    if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){
      assert.ok(!prohibited.has(key),`Private field leaked: ${key}`);visit(child);
    }
    if(typeof value==='string')assert.ok(!/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(value),'Email leaked');
    if(typeof value==='number')assert.ok(Number.isFinite(value),'Non-finite aggregate');
  }
  visit(data);
  const serialized=JSON.stringify(data);
  for(const row of await read('customer_survey'))assert.ok(!serialized.includes(row.email));
});
