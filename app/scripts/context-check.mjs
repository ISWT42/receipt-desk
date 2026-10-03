import {contextFromEnv,SafeError} from '../lib/context.mjs';
import {assess} from '../lib/assess.mjs';
import {fresh,stamp} from '../lib/files.mjs';
if(process.env.RECEIPT_DESK_ALLOW_CONTEXT!=='yes')throw new SafeError('CONTEXT_READ_APPROVAL_REQUIRED');
const id=process.argv[2];
const client=contextFromEnv();
try{
 await client.connect();
 await client.call('schema_explorer',{type:'receiptRecord'});
 const answer=assess(await client.record(id));
 const dir='results/context-check-'+stamp();
 fresh(dir+'/answer.json',answer);fresh(dir+'/tool-receipts.json',client.trace);
 console.log('CONTEXT CHECK PASSED: '+id+' -> '+answer.status+'; copied line '+answer.receipt.line+'.');
}catch(e){
 const code=e instanceof SafeError?e.code:'CONTEXT_CHECK_FAILED';
 fresh('results/context-check-'+stamp()+'/failure.json',{status:'failed',error:code,receipts:client.trace});
 console.log('CONTEXT CHECK FAILED: '+code);process.exitCode=1;
}
