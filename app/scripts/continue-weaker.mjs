import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';
import {root,readJSON,fresh,sha,stamp} from '../lib/files.mjs';
import {reserveCall,costNanoUsd,redact,creditOrKeyLimit,CAP_NANO_USD} from '../lib/weaker-broker.mjs';
import {conservativeUsageCost} from '../lib/weaker-usage-candidate.mjs';
import {parseCliReply} from '../lib/weaker-cli.mjs';import {schemaMatches} from '../lib/weaker-schema.mjs';
const arg=n=>{const i=process.argv.indexOf(n);return i<0?null:process.argv[i+1];};
const jobFile=arg('--job'),broker=arg('--broker');
if(process.env.RECEIPT_DESK_ALLOW_WEAK_MODEL!=='yes')throw new Error('WEAKER_MODEL_APPROVAL_REQUIRED');
if(!/^work\/weaker-continuation-[0-9TZ-]+\.json$/.test(jobFile??''))throw new Error('JOB_PATH_INVALID');
if(!broker||!broker.replaceAll('\\','/').endsWith('/ai-broker/broker.mjs'))throw new Error('BROKER_PATH_REQUIRED');
const job=readJSON(jobFile),inputs=readJSON(job.inputsManifest),base=job.resultDirectory,system=fs.readFileSync(path.join(root,job.systemFile),'utf8'),schema=readJSON('app/answer-schema.json');
if(job.tokenAccountingApproved!==true||job.schemaTransportApproved!==true)throw new Error('ACCOUNTING_AND_SCHEMA_APPROVAL_REQUIRED');
if(fs.existsSync(path.join(root,base,'completion.json')))throw new Error('RUN_ALREADY_FINISHED_OR_STOPPED');
if(sha(system)!==job.systemSha256||sha(fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS.md')))!==inputs.sealedPredictionsSha256||sha(fs.readFileSync(path.join(root,'app/lib/score.mjs')))!==inputs.frozen.scorer)throw new Error('FROZEN_INPUT_CHANGED');
const order=[['gemini-raw','google/gemini-3.7-flash','raw'],['gemini-context','google/gemini-3.7-flash','context'],['nano-raw','openai/gpt-5.4-nano','raw'],['nano-context','openai/gpt-5.4-nano','context']];
let spentNano=0,newCalls=0,stopReason=null,active=null;
const childEnv={...process.env};for(const k of Object.keys(childEnv))if(k.startsWith('SANITY_'))delete childEnv[k];
const halt=()=>{if(active&&!active.killed)active.kill();};process.once('SIGINT',halt);process.once('SIGTERM',halt);
function prediction(recordId,text,exitCode){
 const parsed=exitCode===0?parseCliReply(text):null;
 return parsed&&schemaMatches(parsed,schema)&&parsed.recordId===recordId?parsed:{recordId,status:null,receipt:null,error:'missing or invalid model reply'};
}
function accounting(model,result,reservation){
 try{
  const usage=conservativeUsageCost(model,result.stderr),nano=Math.min(costNanoUsd(usage.costUpperBoundUsd),reservation.worstNanoUsd);
  return {...usage,costUpperBoundUsd:nano/1e9,boundClippedToPreCallMaximum:costNanoUsd(usage.costUpperBoundUsd)>reservation.worstNanoUsd,costSource:'reported tokens at owner list prices, including reasoning again'};
 }catch(error){
  if(error.message==='BROKER_MODEL_METADATA_MISMATCH'&&/\[broker\] model:/.test(result.stderr))throw error;
  return {costUpperBoundUsd:reservation.worstCaseUsd,actualCostUsd:null,costSource:'full pre-call maximum reserved because token counts were unavailable',usageKnown:false};
 }
}
async function callBroker(args){return new Promise(resolve=>{
 active=spawn(process.execPath,[broker,'run',...args],{cwd:root,env:childEnv,windowsHide:true,stdio:['ignore','pipe','pipe']});const child=active;
 let stdout='',stderr='',timedOut=false;const timer=setTimeout(()=>{timedOut=true;child.kill();},180000);
 child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
 child.stdout.on('data',s=>{stdout+=s;if(stdout.length>1000000)child.kill();});child.stderr.on('data',s=>{stderr+=s;if(stderr.length>1000000)child.kill();});
 child.on('error',()=>{stderr+=' BROKER_PROCESS_ERROR';});child.on('close',(exitCode,signal)=>{clearTimeout(timer);active=null;resolve({stdout:redact(stdout),stderr:redact(stderr),exitCode,signal,timedOut});});
});}
for(const [name,model,arm]of order){
 fresh(base+'/'+name+'/run-manifest.json',{model,arm,provider:'openrouter',lane:'sanity-weak',inputsManifest:job.inputsManifest,systemFile:job.systemFile,systemSha256:job.systemSha256,frozen:inputs.frozen,sampling:'provider default',tools:false,controllerSuppliesHistory:false,selectiveRetries:false,accountingMode:'conservative upper bound, actual charge unknown',seedCase:job.seedCase});
 let armCount=0;
 for(const row of inputs.rows){
  const answerFile=base+'/'+name+'/answers/'+row.recordId+'.json',requestFile=base+'/'+name+'/requests/'+row.recordId+'.json',promptFile=row.arms[arm].file,prompt=fs.readFileSync(path.join(root,promptFile),'utf8');
  if(fs.existsSync(path.join(root,answerFile))||fs.existsSync(path.join(root,requestFile)))throw new Error('ATTEMPT_ALREADY_EXISTS_NO_RETRY');
  if(sha(prompt)!==row.arms[arm].inputSha256)throw new Error('PROMPT_CHANGED');
  const reservation=reserveCall(model,system,prompt,spentNano);
  if(!reservation.permitted){stopReason='SPEND_CAP_RESERVATION';break;}
  let result,seed=false;
  if(name==='gemini-raw'&&row.recordId===job.seedCase.recordId){
   const original=readJSON(job.seedCase.answerFile),originalRequest=readJSON(job.seedCase.requestFile);
   if(original.inputSha256!==sha(prompt)||originalRequest.systemSha256!==job.systemSha256||sha(fs.readFileSync(path.join(root,job.seedCase.answerFile)))!==job.seedCase.answerSha256)throw new Error('SEED_CASE_CHANGED');
   result={stdout:original.brokerStdout,stderr:original.brokerStderr,exitCode:original.exitCode,signal:original.signal,timedOut:original.timedOut};seed=true;
  }else{
   fresh(requestFile,{recordId:row.recordId,model,arm,promptFile,promptSha256:sha(prompt),systemSha256:job.systemSha256,reservation,startedAt:new Date().toISOString()});
   result=await callBroker(['--provider','openrouter','--model',model,'--prompt-file',path.join(root,promptFile),'--system-file',path.join(root,job.systemFile),'--lane','sanity-weak']);newCalls++;
  }
  let money;
  try{money=accounting(model,result,reservation);}catch{money={costUpperBoundUsd:reservation.worstCaseUsd,actualCostUsd:null,costSource:'pre-call maximum, inconsistent broker model metadata'};stopReason='BROKER_MODEL_METADATA_MISMATCH';}
  spentNano+=costNanoUsd(money.costUpperBoundUsd);
  if(result.exitCode===5||creditOrKeyLimit(result.stdout+'\n'+result.stderr))stopReason='BROKER_CREDIT_OR_KEY_LIMIT';
  if(result.timedOut)stopReason='BROKER_TIMEOUT';
  if(spentNano>CAP_NANO_USD)stopReason='SPEND_CAP_EXCEEDED';
  const p=prediction(row.recordId,result.stdout,result.exitCode);
  fresh(answerFile,{recordId:row.recordId,model,arm,inputSha256:sha(prompt),seedFromOriginalCall:seed,originalSeedSource:seed?job.seedCase.answerFile:null,accounting:money,cumulativeCostUpperBoundUsd:spentNano/1e9,prediction:p,brokerStdout:result.stdout,brokerStderr:result.stderr,exitCode:result.exitCode,signal:result.signal,timedOut:result.timedOut,stopReason,completedAt:new Date().toISOString()});
  armCount++;console.log('WEAKER '+name+' PROGRESS: '+armCount+'/48 retained; cost upper bound '+(spentNano/1e9).toFixed(8)+' USD; no scores read; '+(seed?'original call reused, no retry':'new case'));
  if(stopReason)break;
 }
 if(stopReason)break;
}
halt();
const arms=[];
for(const [name,model,arm]of order){
 const predictions=[];let attempted=0,invalid=0;
 for(const row of inputs.rows){const file=base+'/'+name+'/answers/'+row.recordId+'.json';
  if(fs.existsSync(path.join(root,file))){const data=readJSON(file);predictions.push(data.prediction);attempted++;if(data.prediction.status===null)invalid++;}
  else {predictions.push({recordId:row.recordId,status:null,receipt:null,error:'not attempted: '+(stopReason??'unknown')});invalid++;}
 }
 const complete=attempted===48&&invalid<=4;arms.push({name,model,arm,attempted,missingOrInvalid:invalid,complete});
 fresh(base+'/'+name+'/predictions.jsonl',predictions.map(p=>JSON.stringify(p)).join('\n')+'\n');fresh(base+'/'+name+'/completion.json',arms.at(-1));
}
const total=arms.reduce((n,a)=>n+a.attempted,0),done=total===192&&arms.every(a=>a.complete);
fresh(base+'/completion.json',{status:done?'done':'partial',arms,totalAttempted:total,newCalls,originalSeedCalls:1,all192AttemptsMade:total===192,totalCostUpperBoundUsd:spentNano/1e9,totalReturnedCostUsd:null,actualTotalCostKnown:false,capUsd:2,budgetWithinCap:spentNano<=CAP_NANO_USD,stopReason,sealedPredictionsSha256:inputs.sealedPredictionsSha256,frozen:inputs.frozen,inputsManifest:job.inputsManifest,systemSha256:job.systemSha256,scored:false,selectiveRetries:false});
console.log(total===192?'WEAKER MODEL TEST ATTEMPTS COMPLETE: 192 retained attempts; four 48-record arms; no selective retries.':'WEAKER MODEL TEST INCOMPLETE: '+total+'/192 attempts; '+stopReason+'.');
console.log('WEAKER MODEL BUDGET '+(spentNano<=CAP_NANO_USD?'VERIFIED':'FAILED')+': conservative cost upper bound '+(spentNano/1e9).toFixed(8)+' USD; cap 2 USD; actual charge unknown; '+base);
