import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh,sha,stamp} from '../lib/files.mjs';
import {score} from '../lib/score.mjs';
import {SafeError} from '../lib/context.mjs';
const [rawDir,contextDir]=process.argv.slice(2);
for(const [dir,arm] of [[rawDir,'raw'],[contextDir,'context']]){
 if(!dir||!/^results\/model-(raw|context)-[0-9TZ-]+$/.test(dir))throw new SafeError('MODEL_RUN_PATH_INVALID');
 const c=readJSON(dir+'/completion.json');if(c.arm!==arm||c.status!=='done'||c.records!==48)throw new SafeError('MODEL_PAIR_INCOMPLETE');
}
const a=readJSON(rawDir+'/completion.json'),b=readJSON(contextDir+'/completion.json');
if(JSON.stringify(a.frozen)!==JSON.stringify(b.frozen)||JSON.stringify(a.settings)!==JSON.stringify(b.settings))throw new SafeError('MODEL_PAIR_CONTRACT_CHANGED');
if(sha(fs.readFileSync(path.join(root,'app/lib/score.mjs')))!==a.frozen.scorer)throw new SafeError('SCORER_CHANGED');
const config=readJSON('sanity.public.json'),records=readJSON(config.liveRecordsFile);
if(sha(fs.readFileSync(path.join(root,config.liveRecordsFile)))!==a.frozen.records)throw new SafeError('MODEL_RECORDS_CHANGED');
const labels=fs.readFileSync(path.join(root,'scoring/labels.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
function predictions(dir){return fs.readFileSync(path.join(root,dir,'predictions.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);}
const systems={rawModel:predictions(rawDir),contextModel:predictions(contextDir)},dir='results/model-pair-'+stamp(),summaries={},outcomes={};
for(const [name,p]of Object.entries(systems)){
 const s=score(records,labels,p);outcomes[name]=s.outcomes;const {outcomes:cases,...aggregate}=s;summaries[name]=aggregate;
 fresh(dir+'/'+name+'.jsonl',p.map(x=>JSON.stringify(x)).join('\n')+'\n');fresh(dir+'/'+name+'-case-scores.json',cases);
}
const paired={bothCorrect:0,rawOnlyCorrect:0,contextOnlyCorrect:0,bothIncorrect:0};
for(const r of outcomes.rawModel){const c=outcomes.contextModel.find(x=>x.recordId===r.recordId);paired[r.correct?(c.correct?'bothCorrect':'rawOnlyCorrect'):(c.correct?'contextOnlyCorrect':'bothIncorrect')]++;}
fresh(dir+'/summary.json',{status:'done',provider:'ChatGPT/Codex plan, same model, raw versus Sanity Context evidence',records:48,settings:a.settings,frozen:a.frozen,rawRun:rawDir,contextRun:contextDir,systems:summaries,paired,sealed:false});
const report=['# Same-model comparison','',
 'Model: '+a.settings.model+'. Reasoning effort: '+a.settings.effort+'. Provider: existing ChatGPT/Codex plan. No paid API.','',
 'The application retrieves the structured arm through hosted Sanity Context before inference. The model uses no tools. Every answer comes from a fresh ephemeral session.','',
 '| Arm | Correct status | False done on failed | False done on not shown | Supported receipts: done, failed, not shown | Receipt score |',
 '| --- | --- | --- | --- | --- | --- |'];
for(const [name,s]of Object.entries(summaries))report.push('| '+name+' | '+s.correctTotal+'/48 | '+s.falseDoneFailed+'/16 | '+s.falseDoneNotShown+'/16 | '+s.supportedByClass.done+'/16, '+s.supportedByClass.failed+'/16, '+s.supportedByClass['not shown']+'/16 | '+s.receiptScore.toFixed(6)+' |');
report.push('','Paired counts: '+JSON.stringify(paired)+'.','',
 'This is one run on a known development corpus. The builder saw the labels. No external seal, blind holdout, or unseen-performance claim is made.',
 'The original scorer is unchanged. Invalid replies earn no credit. All answers and receipt misses are retained.',
 '','## Doubts considered and dismissed',
 '- A tie could be concealed by emphasizing the weak baseline. These two model arms are the main comparison.',
 '- A copied line alone could prove completion. The scorer also requires the correct status, source, step, complete coverage, and canonical final-check output.',
 '- Context could secretly fall back to local evidence. Its saved provider receipts and input digests identify every fetched record.');
fresh(dir+'/REPORT.md',report.join('\n')+'\n');
fresh('results/ai-harness-summary.json',{status:'done',records:48,provider:'ChatGPT plan with hosted Sanity Context evidence',receiptFile:contextDir+'/context-setup-receipt.json',comparisonFile:dir+'/summary.json',model:a.settings.model,effort:a.settings.effort,sealed:false});
console.log('SAME-MODEL COMPARISON SCORED: 48 raw and 48 Context answers; unchanged scorer; '+dir);
for(const [name,s]of Object.entries(summaries))console.log(name+': '+s.correctTotal+'/48 correct; false done '+s.falseDoneFailed+' failed, '+s.falseDoneNotShown+' not shown; receipt score '+s.receiptScore.toFixed(6));
