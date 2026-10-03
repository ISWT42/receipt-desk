import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh,sha,stamp} from '../lib/files.mjs';
import {score} from '../lib/score.mjs';
import {assess,assessRaw,keywordBaseline} from '../lib/assess.mjs';
import {contextFromEnv,SafeError} from '../lib/context.mjs';
const live=process.argv.includes('--context');
if(live&&process.env.RECEIPT_DESK_ALLOW_CONTEXT!=='yes')throw new SafeError('CONTEXT_READ_APPROVAL_REQUIRED');
const records=readJSON(live?readJSON('sanity.public.json').liveRecordsFile:'work/content/records.json');
const labels=fs.readFileSync(path.join(root,'scoring/labels.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const run=stamp(),dir='results/'+(live?'context-':'local-')+run;
const frozen={plan:sha(fs.readFileSync(path.join(root,'EVAL-PLAN.md'))),questions:sha(fs.readFileSync(path.join(root,'work/eval/questions.jsonl'))),
 scorer:sha(fs.readFileSync(path.join(root,'app/lib/score.mjs'))),predictions:sha(fs.readFileSync(path.join(root,'PREDICTIONS.md'))),
 policy:sha(fs.readFileSync(path.join(root,'app/lib/assess.mjs'))),sealed:false};
fresh(dir+'/run-manifest.json',{startedAt:new Date().toISOString(),provider:live?'sanity-context':'local-fixture',frozen});
const systems={structured:[],keyword:records.map(keywordBaseline),orderedRaw:records.map(assessRaw)};
const problems=[];
let client;
if(live){
 try{client=contextFromEnv();await client.connect();await client.call('schema_explorer',{type:'receiptRecord'});}
 catch(e){problems.push({phase:'connect',error:e instanceof SafeError?e.code:'CONTEXT_RUN_FAILED'});}
}
for(const doc of records){
 if(!live)systems.structured.push(assess(doc));
 else if(client?.tools){
  try{
   const cloud=await client.record(doc.recordId);
   if(cloud.sourceDigest!==doc.sourceDigest)throw new SafeError('FROZEN_SOURCE_MISMATCH');
   systems.structured.push(assess(cloud));
  }catch(e){problems.push({recordId:doc.recordId,error:e instanceof SafeError?e.code:'CONTEXT_RUN_FAILED'});systems.structured.push({recordId:doc.recordId,status:null,receipt:null,error:'retrieval failed'});}
 }else systems.structured.push({recordId:doc.recordId,status:null,receipt:null,error:'connection failed'});
}
const summaries={};
for(const [name,predictions]of Object.entries(systems)){
 const fileName=name==='keyword'?'lexical':name;
 fresh(dir+'/'+fileName+'.jsonl',predictions.map(p=>JSON.stringify(p)).join('\n')+'\n');
 const s=score(records,labels,predictions);
 fresh(dir+'/'+fileName+'-case-scores.json',s.outcomes);
 const {outcomes,...aggregate}=s;summaries[name]=aggregate;
}
fresh(dir+'/summary.json',{provider:live?'sanity-context':'local-fixture',systems:summaries,retrievalFailures:problems.length,
 status:problems.length?'failed':'done',sealed:false,aiHarness:'not run'});
if(live){fresh(dir+'/context-tool-receipts.json',client?.trace??[]);fresh(dir+'/retrieval-failures.json',problems);}
const rows=['# '+(live?'Context':'Local')+' evaluation','',
 'Provider: '+(live?'Sanity Context':'local fixtures')+'. AI harness: not run. No seal.','',
 '| System | Correct | False done, failed | False done, not shown | Receipt score |','| --- | --- | --- | --- | --- |'];
for(const [name,s]of Object.entries(summaries))rows.push('| '+name+' | '+s.correctTotal+'/'+s.total+' | '+s.falseDoneFailed+'/'+s.classTotals.failed+' | '+s.falseDoneNotShown+'/'+s.classTotals['not shown']+' | '+s.receiptScore.toFixed(6)+' |');
rows.push('','Receipt factors are supportedByClass divided by classTotals in summary.json.',
 'Per-record status and source receipts are in each prediction file. Misses and hits are in each case-scores file.',
 'The keyword baseline is deliberately simple. The ordered raw comparator is the identical policy after text parsing.',
 'These are development-corpus results. They do not show generalization or an independent AI result.',
 '','## Doubts considered and dismissed',
 '- Local fixtures might be mistaken for Context. The provider is printed above and stored in the manifest.',
 '- A constant cautious answer might score well. Each receipt factor is required, so a constant status scores zero.');
fresh(dir+'/REPORT.md',rows.join('\n')+'\n');
console.log('EVALUATION '+(problems.length?'FAILED':'COMPLETE')+': '+dir);
for(const [name,s]of Object.entries(summaries))console.log(name+': '+s.correctTotal+'/'+s.total+' correct; false done '+s.falseDoneFailed+' failed, '+s.falseDoneNotShown+' not shown; receipt score '+s.receiptScore.toFixed(6));
if(problems.length)process.exitCode=1;
