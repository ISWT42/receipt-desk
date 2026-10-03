import {ModelSession} from '../lib/model-session.mjs';
import {fresh,stamp} from '../lib/files.mjs';
import {SafeError} from '../lib/context.mjs';
if(process.env.RECEIPT_DESK_ALLOW_MODEL!=='yes')throw new SafeError('MODEL_PLAN_APPROVAL_REQUIRED');
const session=new ModelSession();let receipt={status:'unknown',checkedAt:new Date().toISOString(),synthetic:true,notBenchmark:true};
try{
 const settings=await session.open();console.log('MODEL PLAN VERIFIED: '+settings.loginMethod+'; '+settings.model+'; '+settings.effort+'.');
 const result=await session.run({recordId:'record-000000000000',
  instructions:'You are checking an evidence-only model interface. You have no workspace access. Follow the user prompt.',
  prompt:'First list every available tool name in the tools array. Call read_record for record-000000000000. Return the message from that tool exactly in echoed. State in hasWorkspace whether any filesystem or environment is available. Do not perform other actions.',
  outputSchema:{type:'object',properties:{tools:{type:'array',items:{type:'string'}},echoed:{type:'string'},hasWorkspace:{type:'boolean'}},required:['tools','echoed','hasWorkspace'],additionalProperties:false},
  retrieve:async()=>({message:'Evidence-only synthetic interface check.'})});
 const answer=JSON.parse(result.messages.at(-1)??'null');
 receipt={...receipt,settings,result,answer};
 if(result.status!=='completed'||result.calls.length!==1||answer.echoed!=='Evidence-only synthetic interface check.'||answer.hasWorkspace!==false||answer.tools.length!==1||answer.tools[0]!=='read_record')throw new SafeError('MODEL_EVIDENCE_ONLY_CHECK_FAILED');
 receipt.status='done';console.log('MODEL INTERFACE CHECK PASSED: ChatGPT plan; one evidence tool; no workspace; no labels; synthetic only.');
}catch(e){receipt.status='failed';receipt.errorCode=e.code??'MODEL_CHECK_FAILED';console.log('MODEL INTERFACE CHECK FAILED: '+receipt.errorCode);process.exitCode=1;}
finally{await session.close();}
fresh('results/model-interface-'+stamp()+'.json',receipt);
