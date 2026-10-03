import test from 'node:test';
import assert from 'node:assert/strict';
import {stepsFromLines,flatten} from '../lib/records.mjs';
import {assess,assessRaw,keywordBaseline} from '../lib/assess.mjs';
import {score} from '../lib/score.mjs';
const make=(id,q,lines)=>({_id:'receipt.record-'+id,_type:'receiptRecord',recordId:'record-'+id,
 question:q,sourceUrl:'https://example.org/public-record',sourceDigest:'fixture',lineCount:lines.length,steps:stepsFromLines(lines)});
const question='Report whether the end-to-end checkout test passes against staging.';
test('A passed setup does not prove the required check',()=>{
 const d=make('000000000001',question,['$ seed','seed finished']);
 assert.equal(assess(d).status,'not shown');
 assert.equal(keywordBaseline(d).status,'done');
});
test('Explicit failure wins over the setup success',()=>{
 const d=make('000000000002',question,['$ seed','seed finished','$ npx playwright test checkout.spec.ts --project=staging','1 failed']);
 const a=assess(d);assert.equal(a.status,'failed');assert.equal(a.receipt.line,4);
});
test('Missing check output stays not shown',()=>{
 const d=make('000000000003',question,['$ npx playwright test checkout.spec.ts --project=staging','Running 1 test']);
 assert.equal(assess(d).status,'not shown');
});
test('The latest matching check supersedes an earlier pass',()=>{
 const d=make('000000000004',question,['$ npx playwright test checkout.spec.ts --project=staging','1 passed',
 '$ npx playwright test checkout.spec.ts --project=staging','1 failed']);
 assert.equal(assess(d).status,'failed');assert.equal(assess(d).receipt.step,2);
});
test('An unrelated test does not establish checkout success',()=>{
 const d=make('000000000005',question,['$ npx playwright test login.spec.ts --project=staging','1 passed']);
 assert.equal(assess(d).status,'not shown');
});
test('A later mutation invalidates an earlier verification',()=>{
 const d=make('000000000006',question,['$ npx playwright test checkout.spec.ts --project=staging','1 passed','$ rollback checkout','rollback finished']);
 assert.equal(assess(d).status,'not shown');
});
test('Numeric conditions use the question, with strict under semantics',()=>{
 const q='Report whether the p95 latency of the search-api canary is under 250 ms.';
 for(const [n,want]of [[249,'done'],[250,'failed'],[251,'failed']]){
  const d=make('000000000007',q,['$ canaryctl apply search-api','ready','$ loadprobe https://canary.search.example/q','p95='+n+'ms']);
  assert.equal(assess(d).status,want);
 }
});
test('Words inside another output field cannot spoof a phase',()=>{
 const d=make('000000000008','Report whether the helm test of the payments release passes.',
 ['$ helm test payments -n prod','note: Phase: Succeeded','Phase: Failed']);
 assert.equal(assess(d).status,'failed');
});
test('Unsupported tasks are explicit abstentions',()=>{
 assert.equal(assess(make('000000000009','Is the moon made of cheese?',['$ echo passed','passed'])).status,'not shown');
});
test('Partial line coverage is rejected',()=>{
 const d=make('000000000010',question,['$ seed','seed finished']);d.lineCount++;
 assert.throws(()=>assess(d),/coverage/);
});
test('Raw reconstruction preserves the exact copied receipt',()=>{
 const d=make('000000000011',question,['$ npx playwright test checkout.spec.ts --project=staging','  1 passed (2s)']);
 assert.deepEqual(assess(d),assessRaw(d));assert.equal(assess(d).receipt.text,'  1 passed (2s)');
});
test('Constant status scores zero, and a setup citation gets no done receipt',()=>{
 const docs=[
 make('000000000021',question,['$ seed','seed finished','$ npx playwright test checkout.spec.ts --project=staging','1 passed']),
 make('000000000022',question,['$ npx playwright test checkout.spec.ts --project=staging','1 failed']),
 make('000000000023',question,['$ seed','seed finished'])];
 const labels=docs.map((d,i)=>({recordId:d.recordId,expected:['done','failed','not shown'][i],
 finalBlockStart:[3,1,3][i],oracleLines:[[4],[2],[2]][i]}));
 const answers=docs.map(assess);
 assert.equal(score(docs,labels,answers).receiptScore,1);
 for(const status of ['done','failed','not shown'])assert.equal(score(docs,labels,answers.map(a=>({...a,status}))).receiptScore,0);
 const fake={...answers[0],receipt:{...answers[0].receipt,step:1,line:2,text:'seed finished'}};
 assert.equal(score(docs,labels,[fake,...answers.slice(1)]).supportedByClass.done,0);
});

test('Sentence punctuation is not part of a numeric target',()=>{
 const q='Check that the VAT total in Invoices!H2 of invoices_q3.xlsx is 48,210.75.';
 const d=make('000000000031',q,['$ python cellvalue.py invoices_q3.xlsx Invoices!H2 --recalculate','Invoices!H2 = 48,210.75']);
 assert.equal(assess(d).status,'done');
});
test('A named environment result provides the receipt, not generic congratulations',()=>{
 const d=make('000000000032','Check that the pg16 tox environment passes.',
 ['$ tox -e pg16','  pg16: OK (2 seconds)','  congratulations :) (2 seconds)']);
 assert.equal(assess(d).receipt.line,2);
});
