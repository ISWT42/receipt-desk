import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {schemaMatches} from '../lib/weaker-schema.mjs';
import {root,readJSON,fresh,sha,stamp} from '../lib/files.mjs';
import {reserveCall,costNanoUsd,brokerCost,brokerReply,redact,creditOrKeyLimit,CAP_NANO_USD} from '../lib/weaker-broker.mjs';
const argument=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const jobFile=argument('--job'),broker=argument('--broker'),limit=Number(argument('--max-calls')??192);
if(process.env.RECEIPT_DESK_ALLOW_WEAK_MODEL!=='yes')throw new Error('WEAKER_MODEL_APPROVAL_REQUIRED');
if(!/^work\/weaker-job-[0-9TZ-]+\.json$/.test(jobFile??''))throw new Error('JOB_PATH_INVALID');
if(!broker||!broker.replaceAll('\\','/').endsWith('/ai-broker/broker.mjs'))throw new Error('BROKER_PATH_REQUIRED');
const job=readJSON(jobFile),inputs=readJSON(job.inputsManifest),system=fs.readFileSync(path.join(root,job.systemFile),'utf8');
if(job.schemaTransportApproved!==true||job.budgetRuleApproved!==true)throw new Error('TRANSPORT_AND_BUDGET_APPROVAL_REQUIRED');
if(sha(system)!==job.systemSha256||sha(fs.readFileSync(path.join(root,'PREDICTIONS-WEAKER-MODELS.md')))!==inputs.sealedPredictionsSha256)throw new Error('IMMUTABLE_INPUT_CHANGED');
if(sha(fs.readFileSync(path.join(root,'app/lib/score.mjs')))!==inputs.frozen.scorer)throw new Error('SCORER_CHANGED');
const validate=value=>schemaMatches(value,readJSON('app/answer-schema.json')),base=job.resultDirectory;
if(fs.existsSync(path.join(root,base,'completion.json')))throw new Error('RUN_ALREADY_FINISHED_OR_STOPPED');
const order=[['gemini-raw','google/gemini-3.7-flash','raw'],['gemini-context','google/gemini-3.7-flash','context'],['nano-raw','openai/gpt-5.4-nano','raw'],['nano-context','openai/gpt-5.4-nano','context']];
let spentNano=0,newCalls=0,stopReason=null,active=null;
function halt(){if(active&&!active.killed)active.kill();}process.once('SIGINT',halt);process.once('SIGTERM',halt);
const childEnv={...process.env};for(const name of Object.keys(childEnv))if(name.startsWith('SANITY_'))delete childEnv[name];
async function runBroker(args){return new Promise(resolve=>{
 const child=spawn(process.execPath,[broker,'run',...args],{cwd:root,env:childEnv,windowsHide:true,stdio:['ignore','pipe','pipe']});active=child;
 let stdout='',stderr='',timedOut=false;const timer=setTimeout(()=>{timedOut=true;child.kill();},180000);
 child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
 child.stdout.on('data',chunk=>{stdout+=chunk;if(stdout.length>1000000)child.kill();});child.stderr.on('data',chunk=>{stderr+=chunk;if(stderr.length>1000000)child.kill();});
 child.on('error',()=>{stderr+=' BROKER_PROCESS_ERROR';});
 child.on('close',(code,signal)=>{clearTimeout(timer);active=null;resolve({exitCode:code,signal,timedOut,stdout:redact(stdout),stderr:redact(stderr)});});
});}
for(const [name,model,arm]of order){
 fresh(base+'/'+name+'/run-manifest.json',{model,arm,provider:'openrouter',lane:'sanity-weak',inputsManifest:job.inputsManifest,systemFile:job.systemFile,systemSha256:job.systemSha256,frozen:inputs.frozen,sampling:'provider default',tools:false,controllerSuppliesHistory:false,selectiveRetries:false});
 for(const row of inputs.rows){
  const answerPath=base+'/'+name+'/answers/'+row.recordId+'.json',requestPath=base+'/'+name+'/requests/'+row.recordId+'.json';
  if(fs.existsSync(path.join(root,answerPath))){const prior=readJSON(answerPath);if(prior.costUsd===null){stopReason='PREVIOUS_COST_UNKNOWN';break;}spentNano+=costNanoUsd(prior.costUsd);continue;}
  if(fs.existsSync(path.join(root,requestPath))){stopReason='UNRESOLVED_BROKER_ATTEMPT';break;}
  if(newCalls>=limit){stopReason='RECEIPT_REVIEW_PAUSE';break;}
  const promptFile=row.arms[arm].file,prompt=fs.readFileSync(path.join(root,promptFile),'utf8');
  if(sha(prompt)!==row.arms[arm].inputSha256)throw new Error('PREPARED_PROMPT_CHANGED');
  const reservation=reserveCall(model,system,prompt,spentNano);
  if(!reservation.permitted){stopReason='SPEND_CAP_RESERVATION';break;}
  fresh(requestPath,{model,arm,recordId:row.recordId,promptFile,promptSha256:sha(prompt),systemSha256:sha(system),reservation,startedAt:new Date().toISOString()});
  const result=await runBroker(['--provider','openrouter','--model',model,'--prompt-file',path.join(root,promptFile),'--system-file',path.join(root,job.systemFile),'--lane','sanity-weak']);
  newCalls++;let envelope=null,costUsd=null,text=null,prediction={recordId:row.recordId,status:null,receipt:null,error:'missing or invalid model reply'};
  try{envelope=JSON.parse(result.stdout);}catch{}
  try{costUsd=brokerCost(envelope);spentNano+=costNanoUsd(costUsd);}catch{stopReason='BROKER_COST_UNKNOWN';}
  text=brokerReply(envelope);
  if(result.exitCode===0&&text!==null){try{const p=JSON.parse(text);if(validate(p)&&p.recordId===row.recordId)prediction=p;}catch{}}
  const limitError=result.exitCode===5||creditOrKeyLimit(result.stdout+'\n'+result.stderr);
  if(limitError)stopReason='BROKER_CREDIT_OR_KEY_LIMIT';
  if(result.timedOut)stopReason='BROKER_TIMEOUT_COST_UNCERTAIN';
  if(costUsd!==null&&costNanoUsd(costUsd)>reservation.worstNanoUsd)stopReason='BROKER_COST_EXCEEDED_RESERVATION';
  if(spentNano>CAP_NANO_USD)stopReason='SPEND_CAP_EXCEEDED';
  fresh(answerPath,{recordId:row.recordId,model,arm,inputSha256:sha(prompt),costUsd,cumulativeCostUsd:spentNano/1e9,exitCode:result.exitCode,signal:result.signal,timedOut:result.timedOut,reply:text,prediction,brokerStdout:result.stdout,brokerStderr:result.stderr,stopReason,completedAt:new Date().toISOString()});
  console.log('WEAKER '+name+' PROGRESS: '+inputs.rows.filter(r=>fs.existsSync(path.join(root,base+'/'+name+'/answers/'+r.recordId+'.json'))).length+'/48 attempts; total returned costUsd '+(spentNano/1e9).toFixed(8)+'; no scores read.');
  if(stopReason)break;
 }
 if(stopReason)break;
}
halt();
const summary=[];
for(const [name,model,arm]of order){
 const predictions=[],attempted=[];let invalid=0;
 for(const row of inputs.rows){
  const file=base+'/'+name+'/answers/'+row.recordId+'.json';
  if(fs.existsSync(path.join(root,file))){const data=readJSON(file);predictions.push(data.prediction);attempted.push(row.recordId);if(data.prediction.status===null)invalid++;}
  else {predictions.push({recordId:row.recordId,status:null,receipt:null,error:'not attempted: '+(stopReason??'unknown')});invalid++;}
 }
 summary.push({name,model,arm,attempted:attempted.length,missingOrInvalid:invalid,complete:attempted.length===48&&invalid<=4});
 if(stopReason!=='RECEIPT_REVIEW_PAUSE'){fresh(base+'/'+name+'/predictions.jsonl',predictions.map(p=>JSON.stringify(p)).join('\n')+'\n');fresh(base+'/'+name+'/completion.json',summary.at(-1));}
}
const total=summary.reduce((n,s)=>n+s.attempted,0),done=total===192&&summary.every(s=>s.complete);
fresh(base+'/checkpoint-'+stamp()+'.json',{status:done?'done':'partial',arms:summary,totalAttempted:total,newCalls,totalReturnedCostUsd:spentNano/1e9,capUsd:2,budgetWithinCap:spentNano<=CAP_NANO_USD,actualTotalKnown:stopReason!=='BROKER_COST_UNKNOWN'&&stopReason!=='PREVIOUS_COST_UNKNOWN'&&stopReason!=='BROKER_TIMEOUT_COST_UNCERTAIN',stopReason,sealedPredictionsSha256:inputs.sealedPredictionsSha256,scored:false,selectiveRetries:false});
if(stopReason==='RECEIPT_REVIEW_PAUSE'){console.log('WEAKER MODEL RECEIPT REVIEW PAUSE: '+total+' attempts retained; no retry; '+base);process.exitCode=0;}
else{fresh(base+'/completion.json',{status:done?'done':'partial',arms:summary,totalAttempted:total,totalReturnedCostUsd:spentNano/1e9,capUsd:2,budgetWithinCap:spentNano<=CAP_NANO_USD,stopReason,sealedPredictionsSha256:inputs.sealedPredictionsSha256,frozen:inputs.frozen,inputsManifest:job.inputsManifest,systemSha256:job.systemSha256,scored:false});console.log(done?'WEAKER MODEL TEST COMPLETE: 192 retained attempts; four 48-record arms; no selective retries.':'WEAKER MODEL TEST INCOMPLETE: '+total+'/192 attempts; '+(stopReason??'more than four invalid replies in an arm')+'.');console.log('WEAKER MODEL BUDGET '+(spentNano<=CAP_NANO_USD?'VERIFIED':'FAILED')+': returned costUsd '+(spentNano/1e9).toFixed(8)+'; cap 2 USD; '+base);}
