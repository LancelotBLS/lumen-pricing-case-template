import { readFile, writeFile, mkdir, readdir, unlink, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseCSV } from './dist/model.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const schemas = {
  price_test_results: 'price_eur,channel,estimated_acceptance_pct_of_survey,net_price_to_lumen_eur,unit_contribution_eur,contribution_margin_pct',
  channel_economics: 'channel,illustrative_retail_price_eur,retailer_margin_pct,distributor_cut_pct,payment_processing_pct,fulfillment_cost_eur,net_price_to_lumen_eur,unit_contribution_eur',
  cost_breakdown: 'cost_component,cost_per_unit_eur,pct_of_total',
  competitor_prices_by_channel: 'competitor,positioning,channel,format,price_eur,marketing_spend_index_0_100',
  competitor_price_history: 'competitor,month,list_price_eur,promo_active,promo_discount_pct,shelf_price_eur',
  market_context: 'dimension_type,name,metric,value,unit,year,notes',
  historical_sales_weekly: 'week_start_date,country,channel,units_sold,revenue_eur,promo_active',
  marketing_funnel_monthly: 'month,channel,reach,engagements,conversions_customers_acquired,spend_eur,cac_eur,ltv_estimate_eur',
  customer_survey: 'respondent_id,first_name,last_name,email,segment,age,city,purchase_frequency_per_month,monthly_beverage_spend_eur,price_sensitivity_1_10,preferred_channel,aware_pulsup,aware_matelibre,aware_voltfit,aware_rootandrise,lumen_purchase_intent_1_10',
  customer_quotes: 'segment,sentiment,quote',
  price_sensitivity_survey: 'respondent_id,segment,too_cheap_eur,cheap_eur,expensive_eur,too_expensive_eur',
  seasonality_and_weather: 'month,seasonality_index_100_avg,avg_temp_germany_celsius',
};
const numeric = {
  price_test_results: ['price_eur','estimated_acceptance_pct_of_survey','net_price_to_lumen_eur','unit_contribution_eur','contribution_margin_pct'],
  channel_economics: ['illustrative_retail_price_eur','retailer_margin_pct','distributor_cut_pct','payment_processing_pct','fulfillment_cost_eur','net_price_to_lumen_eur','unit_contribution_eur'],
  cost_breakdown: ['cost_per_unit_eur'],
  competitor_prices_by_channel: ['price_eur','marketing_spend_index_0_100'],
  competitor_price_history: ['list_price_eur','promo_discount_pct','shelf_price_eur'],
  market_context: ['value','year'],
  historical_sales_weekly: ['units_sold','revenue_eur'],
  marketing_funnel_monthly: ['reach','engagements','conversions_customers_acquired','spend_eur','cac_eur','ltv_estimate_eur'],
  customer_survey: ['age','purchase_frequency_per_month','monthly_beverage_spend_eur','price_sensitivity_1_10','aware_pulsup','aware_matelibre','aware_voltfit','aware_rootandrise','lumen_purchase_intent_1_10'],
  price_sensitivity_survey: ['too_cheap_eur','cheap_eur','expensive_eur','too_expensive_eur'],
  seasonality_and_weather: ['month','seasonality_index_100_avg','avg_temp_germany_celsius'],
};
const sum = xs => xs.reduce((a,b)=>a+b,0);
const mean = xs => sum(xs)/xs.length;
const quantile = (xs,p) => { const a=[...xs].sort((a,b)=>a-b),i=(a.length-1)*p,l=Math.floor(i); return a[l]+(a[Math.ceil(i)]-a[l])*(i-l); };
const counts = (rows,key) => rows.reduce((a,r)=>(a[r[key]]=(a[r[key]]||0)+1,a),{});
function aggregate(rows, segment, extra={}) {
  return {segment,...extra,count:rows.length,meanSpend:mean(rows.map(r=>r.monthly_beverage_spend_eur)),medianSpend:quantile(rows.map(r=>r.monthly_beverage_spend_eur),.5),meanIntent:mean(rows.map(r=>r.lumen_purchase_intent_1_10)),meanSensitivity:mean(rows.map(r=>r.price_sensitivity_1_10)),meanFrequency:mean(rows.map(r=>r.purchase_frequency_per_month)),channels:counts(rows,'preferred_channel'),cities:counts(rows,'city'),awareness:Object.fromEntries(Object.entries({PulsUp:'aware_pulsup',MateLibre:'aware_matelibre',VoltFit:'aware_voltfit','Root & Rise':'aware_rootandrise'}).map(([brand,k])=>[brand,mean(rows.map(r=>r[k]))*100]))};
}
export async function buildCaseData() {
  const raw={};
  for (const [id,schema] of Object.entries(schemas)) {
    const text=await readFile(path.join(root,'data',`${id}.csv`),'utf8');
    if(text.split(/\r?\n/)[0].replace(/^\uFEFF/,'')!==schema) throw Error(`${id}.csv: unexpected columns`);
    raw[id]=parseCSV(text.replace(/^\uFEFF/,'')).map((row,i)=> {
      for (const key of numeric[id]||[]) {if(row[key].trim()===''||!Number.isFinite(Number(row[key])))throw Error(`${id}.csv row ${i+2}: missing/invalid ${key}`);row[key]=Number(row[key]);}
      for(const [key,value] of Object.entries(row)) if(value===''&&!(id==='cost_breakdown'&&key==='pct_of_total')) throw Error(`${id}.csv row ${i+2}: missing ${key}`);
      if('promo_active' in row) {if(!['True','False'].includes(row.promo_active))throw Error(`${id}: invalid promo flag`);row.promo_active=row.promo_active==='True';}
      return row;
    });
    if(!raw[id].length)throw Error(`${id}.csv: no records`);
  }
  const history=[...new Map(raw.historical_sales_weekly.map(r=>[JSON.stringify(r),r])).values()];
  const weeks=[...new Set(history.map(r=>r.week_start_date))].sort().slice(-52);
  if(weeks.length!==52)throw Error('Historical sales require 52 distinct weeks');
  const outlierRows=new Set();
  for(const country of new Set(history.map(r=>r.country)))for(const channel of new Set(history.map(r=>r.channel))) {
    const rows=history.filter(r=>r.country===country&&r.channel===channel),q1=quantile(rows.map(r=>r.units_sold),.25),q3=quantile(rows.map(r=>r.units_sold),.75),iqr=q3-q1;
    rows.filter(r=>r.units_sold<q1-3*iqr||r.units_sold>q3+3*iqr).forEach(r=>outlierRows.add(r));
  }
  const historical={windowStart:weeks[0],windowEnd:weeks.at(-1),weeks:52,countries:[...new Set(history.map(r=>r.country))].map(country=> {
    const rows=history.filter(r=>r.country===country&&weeks.includes(r.week_start_date)),clean=rows.filter(r=>!outlierRows.has(r));
    const perChannel=rs=>Object.fromEntries([...new Set(rows.map(r=>r.channel))].map(c=>[c,sum(rs.filter(r=>r.channel===c).map(r=>r.units_sold))/12]));
    return {country,monthlyUnits:sum(rows.map(r=>r.units_sold))/12,monthlyUnitsWithoutOutliers:sum(clean.map(r=>r.units_sold))/12,channelMonthlyUnits:perChannel(rows),channelMonthlyUnitsWithoutOutliers:perChannel(clean)};
  })};
  const seasonalityMean=mean(raw.seasonality_and_weather.map(r=>r.seasonality_index_100_avg));
  const segments=['All segments',...new Set(raw.customer_survey.map(r=>r.segment))];
  const filterSegment=(rs,s)=>s==='All segments'?rs:rs.filter(r=>r.segment===s);
  const cogs=raw.cost_breakdown.find(r=>r.cost_component.startsWith('TOTAL COGS'));
  const kpi=raw.cost_breakdown.find(r=>r.cost_component.startsWith('[KPI'));
  if(!cogs||!kpi)throw Error('Missing total unit cost or home-market KPI');
  const marketing=[...new Set(raw.marketing_funnel_monthly.map(r=>r.channel))].map(channel=> {
    const rows=raw.marketing_funnel_monthly.filter(r=>r.channel===channel),spend=sum(rows.map(r=>r.spend_eur)),acquisitions=sum(rows.map(r=>r.conversions_customers_acquired));
    if(acquisitions<=0)throw Error(`No acquisitions for ${channel}`);
    return {channel,spend,acquisitions,cac:spend/acquisitions,ltv:sum(rows.map(r=>r.ltv_estimate_eur*r.conversions_customers_acquired))/acquisitions};
  });
  return {schemaVersion:1,sources:Object.keys(schemas).map(id=>({id,file:`data/${id}.csv`,description:id.replaceAll('_',' ')})),
    audit:{historicalRowsRaw:raw.historical_sales_weekly.length,historicalRowsUnique:history.length,duplicatesRemoved:raw.historical_sales_weekly.length-history.length,outliers:[...outlierRows].map(r=>({country:r.country,channel:r.channel,week:r.week_start_date,units:r.units_sold})),seasonalityMean,warnings:['No German sales history: volumes are conditional estimates.','Regional splits are illustrative.','Survey populations are independent and were not joined.','Multipack price units are ambiguous; use single 330ml cans for comparisons.','LTV is an acquisition-weighted historical reference, not profit or monthly cash flow.','Outlier exclusion retains the 12-month denominator; missing volume is not imputed.']},
    prices:raw.price_test_results,economics:raw.channel_economics,costs:{components:raw.cost_breakdown.filter(r=>r!==cogs&&r!==kpi).map(r=>({name:r.cost_component,value:r.cost_per_unit_eur})),unitCost:cogs.cost_per_unit_eur,homeGrossMarginPct:kpi.cost_per_unit_eur},competitors:raw.competitor_prices_by_channel,competitorHistory:raw.competitor_price_history,market:raw.market_context,
    seasonality:raw.seasonality_and_weather.map(r=>({month:r.month,index:r.seasonality_index_100_avg,temperature:r.avg_temp_germany_celsius,factor:r.seasonality_index_100_avg/seasonalityMean})),historical,marketing,
    segments:segments.map(s=>aggregate(filterSegment(raw.customer_survey,s),s)),customersByCity:[...new Set(raw.customer_survey.map(r=>r.city))].flatMap(city=>segments.map(s=>({s,rs:filterSegment(raw.customer_survey.filter(r=>r.city===city),s)})).filter(x=>x.rs.length).map(({s,rs})=>aggregate(rs,s,{city}))),quotes:raw.customer_quotes,
    pricePerception:['All segments',...new Set(raw.price_sensitivity_survey.map(r=>r.segment))].map(segment=>{const rows=filterSegment(raw.price_sensitivity_survey,segment);return {segment,count:rows.length,curves:Array.from({length:71},(_,i)=>{const price=Number((.5+i*.05).toFixed(2));return {price,tooCheapPct:rows.filter(r=>r.too_cheap_eur>=price).length/rows.length*100,cheapPct:rows.filter(r=>r.cheap_eur>=price).length/rows.length*100,expensivePct:rows.filter(r=>r.expensive_eur<=price).length/rows.length*100,tooExpensivePct:rows.filter(r=>r.too_expensive_eur<=price).length/rows.length*100};})};})};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const data=await buildCaseData(),dist=path.join(root,'dist');
  await mkdir(dist,{recursive:true});
  const stale=path.join(dist,'data');
  try {
    const resolved=await realpath(stale),resolvedDist=await realpath(dist);
    if(path.dirname(resolved)!==resolvedDist||path.basename(resolved)!=='data')throw Error('Refusing cleanup outside dist/data');
    for(const entry of await readdir(resolved,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.csv')) {
      const target=path.resolve(resolved,entry.name);
      if(path.dirname(target)!==resolved)throw Error('Unsafe stale data path');
      await unlink(target);
    }
  } catch(error) {if(error.code!=='ENOENT')throw error;}
  await writeFile(path.join(dist,'case-data.json'),JSON.stringify(data));
  console.log(`Prepared ${data.sources.length} sources; ${data.audit.duplicatesRemoved} duplicates removed; public survey aggregates only.`);
}
