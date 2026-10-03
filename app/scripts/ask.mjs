import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh,stamp} from '../lib/files.mjs';
import {contextFromEnv,SafeError} from '../lib/context.mjs';
import {ModelSession} from '../lib/model-session.mjs';
import {modelEvidence,modelPrompt,modelPrediction} from '../lib/model-evidence.mjs';
import {conflicts} from '../lib/claims.mjs';
if(process.env.RECEIPT_DESK_ALLOW_MODEL!=='yes'||process.env.RECEIPT_DESK_ALLOW_CONTEXT!=='yes')throw new SafeError('MODEL_AND_CONTEXT_APPROVAL_REQUIRED');
const id=process.argv[2];if(!/^record-[a-f0-9]{12}$/.test(id??''))throw new SafeError('NEUTRAL_RECORD_ID_REQUIRED');
const client=contextFromEnv(),session=new ModelSession(),dir='results/agent-answer-'+stamp();
let receipt={recordId:id,status:'unknown',provider:'ChatGPT plan with hosted Sanity Context evidence'};
try{
 await client.connect();await client.call('schema_explorer',{type:'receiptRecord'});const doc=await client.record(id);
 await session.open();const data=modelEvidence(doc,'context',readJSON('sanity.public.json'));
 const result=await session.run({recordId:id,instructions:fs.readFileSync(path.join(root,'AI-PROMPT.txt'),'utf8'),prompt:modelPrompt(data),outputSchema:readJSON('app/answer-schema.json')});
 const answer=modelPrediction(result,id);if(!answer.status)throw new SafeError('MODEL_ANSWER_INVALID');
 const replies=await client.claims(id);
 receipt={...receipt,status:'done',answer,conflictingClaims:conflicts(answer,replies),modelReceipt:result,contextReceipts:client.trace};
 console.log(JSON.stringify({answer,conflictingClaims:receipt.conflictingClaims},null,2));
 console.log('LIVE AGENT ANSWER RETAINED: '+id+'; complete source record through Sanity Context.');
}catch(e){receipt.status='failed';receipt.errorCode=e.code??'LIVE_AGENT_FAILED';console.log('LIVE AGENT CHECK FAILED: '+receipt.errorCode);process.exitCode=1;}
finally{await session.close();}
fresh(dir+'/receipt.json',receipt);
