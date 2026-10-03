import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh,sha,stamp,verifyInputs} from '../lib/files.mjs';
import {reserveCall,costNanoUsd,CAP_NANO_USD} from '../lib/weaker-broker.mjs';
import {conservativeUsageCost} from '../lib/weaker-usage-candidate.mjs';
import {modelPrompt} from '../lib/model-evidence.mjs';

const jobName=process.argv[2];
if(!/^work\/weaker-continuation-[0-9TZ-]+\.json$/.test(jobName??''))throw new Error('CONTINUATION_JOB_REQUIRED');
const job=readJSON(jobName),run=job.resultDirectory,completion=readJSON(run+'/completion.json'),inputs=readJSON(job.inputsManifest);
const original=readJSON('results/model-raw-2026-10-02T21-18-17-071Z/run-manifest.json').frozen,config=readJSON('sanity.public.json');
const originalFiles={plan:'AI-EVAL-PLAN.md',predictions:'AI-PREDICTIONS.md',prompt:'AI-PROMPT.txt',questions:'work/eval/questions.jsonl',scorer:'app/lib/score.mjs',records:config.liveRecordsFile,modelSession:'app/lib/model-session.mjs',modelEvidence:'app/lib/model-evidence.mjs'};
for(const [name,file]of Object.entries(originalFiles))if(sha(fs.readFileSync(path.join(root,file)))!==original[name])throw new Error('ORIGINAL_FROZEN_FILE_CHANGED');
if(sha(JSON.stringify(readJSON('app/answer-schema.json')))!==original.responseSchema)throw new Error('ORIGINAL_SCHEMA_CHANGED');
if(JSON.stringify(completion.frozen)!==JSON.stringify(original)||JSON.stringify(inputs.frozen)!==JSON.stringify(original))throw new Error('FROZEN_MANIFEST_MISMATCH');
verifyInputs();
if(sha(fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS.md')))!==inputs.sealedPredictionsSha256||inputs.sealedPredictionsSha256!=='a72239f4cafe21e9402fbbc1dd161875548f0f6f20f64c56e2c4b3155f93409f')throw new Error('SEALED_PREDICTIONS_CHANGED');
if(sha(fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS-CORRECTION.md')))!==inputs.correctionSha256||sha(fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS.md.ots')))!==inputs.otsSha256)throw new Error('CORRECTION_OR_PROOF_CHANGED');
const system=fs.readFileSync(path.join(root,job.systemFile),'utf8');
if(sha(system)!==job.systemSha256||system!==fs.readFileSync(path.join(root,'AI-PROMPT.txt'),'utf8')+'\n\nResponse schema:\n'+fs.readFileSync(path.join(root,'app/answer-schema.json'),'utf8'))throw new Error('SYSTEM_COPY_CHANGED');
if(sha(fs.readFileSync(path.join(root,job.seedCase.answerFile)))!==job.seedCase.answerSha256)throw new Error('ORIGINAL_FIRST_REPLY_CHANGED');
let spentNano=0,newCalls=0,attempted=0,seeds=0,clipped=0,fallbacks=0;
const rows=[],order=[['gemini-raw','google/gemini-3.7-flash','raw'],['gemini-context','google/gemini-3.7-flash','context'],['nano-raw','openai/gpt-5.4-nano','raw'],['nano-context','openai/gpt-5.4-nano','context']];
for(const [name,model,arm]of order){
 for(const row of inputs.rows){
  const prompt=fs.readFileSync(path.join(root,row.arms[arm].file),'utf8');
  if(sha(prompt)!==row.arms[arm].inputSha256)throw new Error('PROMPT_CHANGED');
  const baseline=readJSON((arm==='raw'?'results/model-raw-2026-10-02T21-18-17-071Z':'results/model-context-2026-10-02T23-44-47-730Z')+'/inputs/'+row.recordId+'.json');
  if(prompt!==modelPrompt(baseline))throw new Error('ORIGINAL_PROMPT_BYTES_DIFFER');
  const answerName=run+'/'+name+'/answers/'+row.recordId+'.json',requestName=run+'/'+name+'/requests/'+row.recordId+'.json';
  if(!fs.existsSync(path.join(root,answerName))){if(fs.existsSync(path.join(root,requestName)))throw new Error('REQUEST_WITHOUT_RETAINED_RESULT');continue;}
  const answer=readJSON(answerName),reservation=reserveCall(model,system,prompt,spentNano);
  if(!reservation.permitted)throw new Error('REQUEST_EXCEEDED_PRECALL_CAP');
  if(answer.recordId!==row.recordId||answer.model!==model||answer.arm!==arm||answer.inputSha256!==sha(prompt))throw new Error('ANSWER_REQUEST_IDENTITY_MISMATCH');
  if(answer.seedFromOriginalCall){
   if(seeds!==0||name!=='gemini-raw'||row.recordId!==job.seedCase.recordId||fs.existsSync(path.join(root,requestName)))throw new Error('DUPLICATE_SEED_OR_NEW_SEED_REQUEST');
   const originalAnswer=readJSON(job.seedCase.answerFile);
   if(answer.brokerStdout!==originalAnswer.brokerStdout||answer.brokerStderr!==originalAnswer.brokerStderr||answer.exitCode!==originalAnswer.exitCode)throw new Error('SEED_REPLY_CHANGED');
   seeds++;
  }else{
   const request=readJSON(requestName);
   if(request.recordId!==row.recordId||request.model!==model||request.arm!==arm||request.promptSha256!==sha(prompt)||request.systemSha256!==job.systemSha256||JSON.stringify(request.reservation)!==JSON.stringify(reservation))throw new Error('PRECALL_RESERVATION_MISMATCH');
   newCalls++;
  }
  let debitNano;
  try{const usage=conservativeUsageCost(model,answer.brokerStderr);debitNano=Math.min(costNanoUsd(usage.costUpperBoundUsd),reservation.worstNanoUsd);if(costNanoUsd(usage.costUpperBoundUsd)>reservation.worstNanoUsd)clipped++;}
  catch{debitNano=reservation.worstNanoUsd;fallbacks++;}
  if(costNanoUsd(answer.accounting.costUpperBoundUsd)!==debitNano)throw new Error('COST_DEBIT_MISMATCH');
  spentNano+=debitNano;if(spentNano>CAP_NANO_USD||answer.cumulativeCostUpperBoundUsd!==spentNano/1e9)throw new Error('CUMULATIVE_BOUND_MISMATCH');
  attempted++;rows.push({model,arm,recordId:row.recordId,seed:answer.seedFromOriginalCall,preCallMaximumUsd:reservation.worstCaseUsd,costUpperBoundUsd:debitNano/1e9,cumulativeCostUpperBoundUsd:spentNano/1e9});
 }
}
if(attempted!==completion.totalAttempted||newCalls!==completion.newCalls||seeds!==completion.originalSeedCalls||spentNano/1e9!==completion.totalCostUpperBoundUsd||completion.budgetWithinCap!==true)throw new Error('COMPLETION_ACCOUNTING_MISMATCH');
const receipt='results/weaker-continuation-check-'+stamp()+'.json';
fresh(receipt,{status:'done',runDirectory:run,attempted,newCalls,originalSeedCalls:seeds,costUpperBoundUsd:spentNano/1e9,capUsd:2,actualTotalCostKnown:false,preCallReservationsVerified:true,originalFirstReplyUnchanged:true,originalPromptBytesMatch:true,nineOriginalFrozenFilesUnchanged:true,originalInputsUnchanged:true,sealedPredictionsCorrectionAndProofUnchanged:true,reportedBoundsClippedToPreCallMaximum:clipped,missingUsageDebitedAtFullMaximum:fallbacks,rows,labelsRead:false,modelsScored:false,externalTimestampVerified:false});
console.log('WEAKER RUN INTEGRITY VERIFIED: '+attempted+'/192 retained attempts; '+newCalls+' new calls; first reply unchanged; every pre-call reservation within 2 USD; original inputs, 96 prompts, nine frozen files, predictions, correction, and proof unchanged; '+receipt);
