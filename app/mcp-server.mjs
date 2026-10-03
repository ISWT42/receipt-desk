import readline from 'node:readline';
import {contextFromEnv,SafeError} from './lib/context.mjs';
import {assess} from './lib/assess.mjs';
import {conflicts} from './lib/claims.mjs';
// A model harness can call these bounded tools. No local input, labels, or scorer can be read here.
const tools=[
 {name:'assess_record',description:'Read an engineering record only through Sanity Context. Check its required final command and return done, failed, or not shown, with a copied source receipt and conflicting historical claims.',
  inputSchema:{type:'object',properties:{recordId:{type:'string',pattern:'^record-[a-f0-9]{12}$'}},required:['recordId'],additionalProperties:false}},
 {name:'read_knowledge_base',description:'Read selected exact outline paths through a Knowledge Base Context endpoint. Returns Sanity citations. These summaries are discovery, never deciding completion evidence.',
  inputSchema:{type:'object',properties:{knowledgeBase:{type:'string'},paths:{type:'array',items:{type:'string'},minItems:1,maxItems:20}},required:['knowledgeBase','paths'],additionalProperties:false}},
 {name:'knowledge_base_outline',description:'Read the Knowledge Base initial_context to choose entry paths.',
  inputSchema:{type:'object',properties:{},additionalProperties:false}}
];
async function handle(m){
 if(!('id' in m))return;
 if(m.method==='initialize')return {protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'receipt-desk',version:'0.1.0'}};
 if(m.method==='tools/list')return {tools};
 if(m.method==='ping')return {};
 if(m.method!=='tools/call')throw new SafeError('UNKNOWN_MCP_METHOD');
 if(process.env.RECEIPT_DESK_ALLOW_CONTEXT!=='yes')throw new SafeError('CONTEXT_READ_APPROVAL_REQUIRED');
 const name=m.params?.name,a=m.params?.arguments??{};
 if(!tools.some(t=>t.name===name))throw new SafeError('UNKNOWN_TOOL');
 const client=contextFromEnv(name==='assess_record'?'groq':'kb');
 const initial=await client.connect();
 let result;
 if(name==='assess_record'){
   const doc=await client.record(a.recordId),answer=assess(doc);
   result={...answer,claimConflicts:conflicts(answer,await client.claims(a.recordId)),
     provider:'sanity-context',toolReceipts:client.trace};
 }else if(name==='read_knowledge_base')result=await client.readKnowledgeBase(a.knowledgeBase,a.paths);
 else result=initial;
 return {content:[{type:'text',text:JSON.stringify(result)}]};
}
const stream=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
let queue=Promise.resolve();
stream.on('line',line=>{queue=queue.then(async()=>{
 let m;try{m=JSON.parse(line);}catch{return;}
 try{const result=await handle(m);if('id'in m)process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:m.id,result})+'\n');}
 catch(e){if('id'in m)process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:m.id,result:{isError:true,content:[{type:'text',text:e instanceof SafeError?e.code:'RECEIPT_DESK_FAILED'}]}})+'\n');}
});});
