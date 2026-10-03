import fs from 'node:fs';import path from 'node:path';
import {root,readJSON,fresh,sha,stamp} from '../lib/files.mjs';
import {score} from '../lib/score.mjs';
import {assessWeakPredictions} from '../lib/weaker-predictions.mjs';
const run=process.argv[2];
if(!/^results\/weaker-models-[0-9TZ-]+$/.test(run??''))throw new Error('WEAKER_RUN_PATH_REQUIRED');
const completion=readJSON(run+'/completion.json'),inputs=readJSON(completion.inputsManifest),config=readJSON('sanity.public.json');
if(sha(fs.readFileSync(path.join(root,'app/lib/score.mjs')))!==inputs.frozen.scorer||sha(fs.readFileSync(path.join(root,config.liveRecordsFile)))!==inputs.frozen.records)throw new Error('FROZEN_SCORER_OR_RECORDS_CHANGED');
if(sha(fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS.md')))!==inputs.sealedPredictionsSha256)throw new Error('SEALED_PREDICTIONS_CHANGED');
const records=readJSON(config.liveRecordsFile),labels=fs.readFileSync(path.join(root,'scoring/labels.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const dir='results/weaker-comparison-'+stamp(),systems={};
for(const name of ['gemini-raw','gemini-context','nano-raw','nano-context']){
 const predictions=fs.readFileSync(path.join(root,run,name,'predictions.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
 const {outcomes,...aggregate}=score(records,labels,predictions);systems[name]=aggregate;
 fresh(dir+'/'+name+'-case-scores.json',outcomes);
}
const p=assessWeakPredictions({raw:systems['gemini-raw'],context:systems['gemini-context']},{raw:systems['nano-raw'],context:systems['nano-context']});
const testComplete=completion.totalAttempted===192&&completion.arms.every(a=>a.complete);
const results=p.map(x=>({...x,evaluableAsCompletedTest:testComplete}));
fresh(dir+'/summary.json',{status:testComplete?'done':'partial',provider:'Owner broker, OpenRouter',models:['google/gemini-3.7-flash','openai/gpt-5.4-nano'],runDirectory:run,systems,predictions:results,totalAttempted:completion.totalAttempted,reportedCostUsd:completion.totalReturnedCostUsd,capUsd:2,budgetWithinCap:completion.budgetWithinCap,stopReason:completion.stopReason,arms:completion.arms,frozen:completion.frozen,sealedPredictionsSha256:inputs.sealedPredictionsSha256,correctionSha256:inputs.correctionSha256,otsSha256:inputs.otsSha256,externalTimestampVerified:false,headline:'Original GPT-6.1 comparison tied; this addition is secondary.'});
const report=['# Pre-registered weaker-model comparison','',
'Status: '+(testComplete?'done':'partial, incomplete')+'. The original GPT-6.1 tie stays the headline.','',
'One run per model per arm. Same original user prompts, source records, and unchanged scorer. Provider default sampling. No selective retry. See the pre-call transport note for how the response schema was supplied.','',
'| Arm | Correct status | False done on failed | False done on missing | Credited receipts: done, failed, missing | Receipt score |',
'| --- | --- | --- | --- | --- | --- |'];
for(const [name,s]of Object.entries(systems))report.push('| '+name+' | '+s.correctTotal+'/48 | '+s.falseDoneFailed+'/16 | '+s.falseDoneNotShown+'/16 | '+s.supportedByClass.done+'/16, '+s.supportedByClass.failed+'/16, '+s.supportedByClass['not shown']+'/16 | '+s.receiptScore+' |');
report.push('','| Prediction | Result | Observation |','| --- | --- | --- |');
for(const row of results)report.push('| '+row.id+' | '+row.result.toUpperCase()+(row.vacuous?' (vacuous)':'')+(testComplete?'':' (incomplete test)')+' | '+JSON.stringify(row.observed??row.qualifyingModels??row.models)+' |');
report.push('','Reported costUsd total, rounded upward by the budget guard: '+completion.totalReturnedCostUsd+'. Cap: 2 USD. Stop reason: '+(completion.stopReason??'none')+'.',
'The predictions fingerprint matches the supplied sealed digest. The correction and proof sidecar are retained. No external calendar was contacted to verify the timestamp chain.',
'','## Doubts considered and dismissed',
'- A P3 hit without qualifying cases proves error reduction. It is a vacuous conditional hit and provides no such evidence.',
'- This addition can replace the strong-model tie. The original comparison remains the headline.',
'- Missing or invalid replies can be omitted. All 48 records per arm remain in the unchanged scorer; coverage and invalid counts are reported separately.',
'- An interrupted test proves its predictions. Incomplete status is kept beside any mechanically calculated hit or miss.');
fresh(dir+'/REPORT.md',report.join('\n')+'\n');
console.log('WEAKER MODEL COMPARISONS SCORED: two model pairs; unchanged scorer; P1 to P5 assessed; '+dir);
for(const [name,s]of Object.entries(systems))console.log(name+': '+s.correctTotal+'/48; false done '+s.falseDoneFailed+' failed, '+s.falseDoneNotShown+' missing; receipt score '+s.receiptScore);
for(const row of results)console.log(row.id+': '+row.result.toUpperCase()+(row.vacuous?' (vacuous, zero qualifying models)':'')+(testComplete?'':' (incomplete test)'));
