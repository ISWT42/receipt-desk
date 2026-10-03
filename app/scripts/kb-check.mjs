import {contextFromEnv,SafeError} from '../lib/context.mjs';
import {fresh,stamp} from '../lib/files.mjs';
if(process.env.RECEIPT_DESK_ALLOW_CONTEXT!=='yes')throw new SafeError('CONTEXT_READ_APPROVAL_REQUIRED');
const [id,...paths]=process.argv.slice(2);
const c=contextFromEnv('kb');
try{
 const outline=await c.connect();
 const entries=await c.readKnowledgeBase(id,paths);
 fresh('results/knowledge-base-'+stamp()+'/receipt.json',{status:'done',provider:'sanity-context-knowledge-base',
  knowledgeBaseId:id,paths,outline,entries,toolReceipts:c.trace,
  note:'Retrieval verified. Knowledge Base build quality and issue review still need human review.'});
 console.log('KNOWLEDGE BASE READ PASSED: outline and selected entries returned through Context.');
}catch(e){
 const code=e instanceof SafeError?e.code:'KNOWLEDGE_BASE_READ_FAILED';
 fresh('results/knowledge-base-'+stamp()+'/failure.json',{status:'failed',error:code,toolReceipts:c.trace});
 console.log('KNOWLEDGE BASE READ FAILED: '+code);process.exitCode=1;
}
