import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh,sha,stamp,verifyInputs} from '../lib/files.mjs';
import {modelEvidence,modelPrompt,modelPrediction} from '../lib/model-evidence.mjs';
import {ModelSession,modelSettings} from '../lib/model-session.mjs';
import {contextFromEnv,SafeError} from '../lib/context.mjs';
const arm=process.argv[process.argv.indexOf('--arm')+1];
if(!['raw','context'].includes(arm))throw new SafeError('MODEL_ARM_REQUIRED');
if(process.env.RECEIPT_DESK_ALLOW_MODEL!=='yes')throw new SafeError('MODEL_PLAN_APPROVAL_REQUIRED');
if(arm==='context'&&process.env.RECEIPT_DESK_ALLOW_CONTEXT!=='yes')throw new SafeError('CONTEXT_READ_APPROVAL_REQUIRED');
verifyInputs();
const config=readJSON('sanity.public.json');
const records=readJSON(config.liveRecordsFile).sort((a,b)=>a.recordId.localeCompare(b.recordId));
if(records.length!==48)throw new SafeError('MODEL_CORPUS_COUNT_MISMATCH');
const instructions=fs.readFileSync(path.join(root,'AI-PROMPT.txt'),'utf8'),schema=readJSON('app/answer-schema.json');
const frozen={plan:sha(fs.readFileSync(path.join(root,'AI-EVAL-PLAN.md'))),predictions:sha(fs.readFileSync(path.join(root,'AI-PREDICTIONS.md'))),
 prompt:sha(instructions),responseSchema:sha(JSON.stringify(schema)),questions:sha(fs.readFileSync(path.join(root,'work/eval/questions.jsonl'))),
 scorer:sha(fs.readFileSync(path.join(root,'app/lib/score.mjs'))),records:sha(fs.readFileSync(path.join(root,config.liveRecordsFile))),
 modelSession:sha(fs.readFileSync(path.join(root,'app/lib/model-session.mjs'))),modelEvidence:sha(fs.readFileSync(path.join(root,'app/lib/model-evidence.mjs'))),sealed:false};
const dir='results/model-'+arm+'-'+stamp();
fresh(dir+'/run-manifest.json',{arm,startedAt:new Date().toISOString(),frozen,settings:modelSettings,contextRetrieval:arm==='context'?'Application fetches each full record through hosted Sanity Context before inference.':'No Sanity request in this arm.',labelsAccessibleToModel:false});
const session=new ModelSession(),predictions=[];let client,status='unknown',problem=null;
try{
 const settings=await session.open();fresh(dir+'/plan-provider-receipt.json',settings);
 if(arm==='context'){
  client=contextFromEnv();await client.connect();await client.call('schema_explorer',{type:'receiptRecord'});
  fresh(dir+'/context-setup-receipt.json',client.trace);client.trace=[];
 }
 for(const local of records){
  let result=null,error=null;
  try{
   const doc=arm==='context'?await client.record(local.recordId):local;
   if(doc._id!==local._id||doc.sourceDigest!==local.sourceDigest)throw new SafeError('MODEL_FROZEN_RECORD_MISMATCH');
   if(client){fresh(dir+'/context/'+local.recordId+'.json',client.trace);client.trace=[];}
   const supplied=modelEvidence(doc,arm,config),text=modelPrompt(supplied);
   fresh(dir+'/inputs/'+local.recordId+'.json',supplied);
   result=await session.run({recordId:doc.recordId,prompt:text,instructions,outputSchema:schema});
   const prediction=modelPrediction(result,local.recordId);predictions.push(prediction);
   fresh(dir+'/answers/'+local.recordId+'.json',{recordId:local.recordId,inputSha256:sha(text),prediction,result});
  }catch(e){
   error=e.code??'MODEL_CASE_FAILED';
   const prediction={recordId:local.recordId,status:null,receipt:null,error};predictions.push(prediction);
   fresh(dir+'/answers/'+local.recordId+'.json',{recordId:local.recordId,prediction,error,result});
   throw new SafeError(error);
  }
  console.log('MODEL '+arm.toUpperCase()+' PROGRESS: '+predictions.length+'/48 responses retained; no scores read.');
 }
 status='done';
}catch(e){problem=e.code??'MODEL_RUN_FAILED';status=predictions.length?'partial':'failed';console.log('MODEL '+arm.toUpperCase()+' STOPPED: '+problem+'; no paid API fallback.');process.exitCode=1;}
finally{await session.close();}
fresh(dir+'/predictions.jsonl',predictions.map(p=>JSON.stringify(p)).join('\n')+'\n');
fresh(dir+'/completion.json',{status,arm,records:predictions.length,problem,completedAt:new Date().toISOString(),frozen,settings:modelSettings,scored:false,scoringProcess:'Only score-model.mjs reads local labels.'});
console.log('MODEL '+arm.toUpperCase()+' '+(status==='done'?'COMPLETE':'INCOMPLETE')+': '+predictions.length+'/48; '+dir);
