import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh,sha,stamp,verifyInputs} from '../lib/files.mjs';
import {modelEvidence,modelPrompt} from '../lib/model-evidence.mjs';
import {contextFromEnv,SafeError} from '../lib/context.mjs';
if(process.env.RECEIPT_DESK_ALLOW_CONTEXT!=='yes')throw new SafeError('CONTEXT_READ_APPROVAL_REQUIRED');
const sealed='a72239f4cafe21e9402fbbc1dd161875548f0f6f20f64c56e2c4b3155f93409f';
if(sha(fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS.md')))!==sealed)throw new SafeError('SEALED_PREDICTIONS_CHANGED');
verifyInputs();
const config=readJSON('sanity.public.json'),rawDir='results/model-raw-2026-10-02T21-18-17-071Z',ctxDir='results/model-context-2026-10-02T23-44-47-730Z';
const original=readJSON(rawDir+'/run-manifest.json').frozen;
const files={plan:'AI-EVAL-PLAN.md',predictions:'AI-PREDICTIONS.md',prompt:'AI-PROMPT.txt',questions:'work/eval/questions.jsonl',scorer:'app/lib/score.mjs',records:config.liveRecordsFile,modelSession:'app/lib/model-session.mjs',modelEvidence:'app/lib/model-evidence.mjs'};
for(const [name,file]of Object.entries(files))if(sha(fs.readFileSync(path.join(root,file)))!==original[name])throw new SafeError('FROZEN_INPUT_CHANGED');
const schema=readJSON('app/answer-schema.json');
if(sha(JSON.stringify(schema))!==original.responseSchema)throw new SafeError('FROZEN_SCHEMA_CHANGED');
const proof=fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS.md.ots'));
const correction=fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS-CORRECTION.md'));
const dir='work/weaker-inputs-'+stamp(),rows=[],client=contextFromEnv();
fresh(dir+'/preparation-manifest.json',{status:'partial',startedAt:new Date().toISOString(),sealedPredictionsSha256:sealed,correctionSha256:sha(correction),otsSha256:sha(proof),otsBytes:proof.length,externalTimestampVerified:false,frozen:original,models:['google/gemini-3.7-flash','openai/gpt-5.4-nano'],recordOrder:'neutral ID ascending',paidCalls:0,scored:false});
await client.connect();await client.call('schema_explorer',{type:'receiptRecord'});fresh(dir+'/context-setup-receipt.json',client.trace);client.trace=[];
for(const local of readJSON(config.liveRecordsFile).sort((a,b)=>a.recordId.localeCompare(b.recordId))){
 const doc=await client.record(local.recordId);
 if(doc._id!==local._id||doc.sourceDigest!==local.sourceDigest)throw new SafeError('FROZEN_RECORD_MISMATCH');
 fresh(dir+'/context-receipts/'+local.recordId+'.json',client.trace);client.trace=[];
 const row={recordId:local.recordId,sourceDigest:doc.sourceDigest,arms:{}};
 for(const arm of ['raw','context']){
  const evidence=modelEvidence(arm==='raw'?local:doc,arm,config),prompt=modelPrompt(evidence);
  const baseline=readJSON((arm==='raw'?rawDir:ctxDir)+'/inputs/'+local.recordId+'.json');
  if(prompt!==modelPrompt(baseline))throw new SafeError('ORIGINAL_PROMPT_BYTES_DIFFER');
  const file=dir+'/'+arm+'/'+local.recordId+'.txt';fresh(file,prompt);fresh(dir+'/evidence/'+arm+'/'+local.recordId+'.json',evidence);
  row.arms[arm]={file,inputSha256:sha(prompt)};
 }
 rows.push(row);
 console.log('WEAKER INPUT PROGRESS: '+rows.length+'/48; both prompt paths byte-identical to original; no model call or score.');
}
fresh(dir+'/inputs-manifest.json',{status:'done',directory:dir,records:48,promptFiles:96,systemFile:'AI-PROMPT.txt',responseSchemaFile:'app/answer-schema.json',schemaTransportPending:true,budgetEnforcementPending:true,models:['google/gemini-3.7-flash','openai/gpt-5.4-nano'],rows,paidCalls:0,frozen:original,sealedPredictionsSha256:sealed,correctionSha256:sha(correction),otsSha256:sha(proof),externalTimestampVerified:false,originalPromptBytesMatch:true,noLabelsRead:true,noHistoricalClaimsSupplied:true,noKnowledgeBaseContentSupplied:true});
console.log('WEAKER INPUTS VERIFIED: 96 prompt files; all 48 Context records canonical and original; prompt bytes match GPT-6.1 arms; no paid call; '+dir);
