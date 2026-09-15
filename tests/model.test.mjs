import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{parseCSV,rowsAt,blend,validMix}from'../dist/model.js';
const rows=parseCSV(readFileSync(new URL('../data/price_test_results.csv',import.meta.url),'utf8'));
test('raw CSV spot checks',()=>{assert.equal(Number(rowsAt(rows,1.79)[1].unit_contribution_eur),.4);assert.equal(Number(rowsAt(rows,2.19)[0].estimated_acceptance_pct_of_survey),51.7);assert.equal(Number(rowsAt(rows,2.59)[2].unit_contribution_eur),1.45);});
test('40/40/20 mix is 0.942 contribution, 1.562 net, ratio of totals',()=>{const b=blend(rows,2.19,[40,40,20]);assert.ok(Math.abs(b.contribution-.942)<1e-10);assert.ok(Math.abs(b.net-1.562)<1e-10);assert.ok(Math.abs(b.percent-(.942/1.562*100))<1e-10);});
test('single channel and invalid allocations',()=>{assert.equal(blend(rows,2.59,[0,100,0]).contribution,.86);for(const w of [[0,0,0],[40,40,19],[-10,60,50],[NaN,50,50],[101,0,-1]]){assert.equal(validMix(w),false);assert.equal(blend(rows,2.19,w),null);}});
test('missing and duplicate price records fail explicitly',()=>{assert.throws(()=>rowsAt(rows.slice(1),1.79));assert.throws(()=>rowsAt([...rows,rows[0]],1.79));assert.throws(()=>rowsAt(rows,2));});
test('quoted commas, escaped quotes and CRLF',()=>{assert.deepEqual(parseCSV('a,b\r\n"one, two","say ""hi"""\r\n'),[{a:'one, two',b:'say "hi"'}]);});
