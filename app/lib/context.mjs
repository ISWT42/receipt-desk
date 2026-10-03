import {sha,readJSON} from './files.mjs';
import {flatten,validateRecord} from './records.mjs';
export class SafeError extends Error { constructor(code){super(code);this.code=code;} }
export function endpoint(url) {
 let u;try{u=new URL(url);}catch{throw new SafeError('INVALID_CONTEXT_URL');}
 if(u.protocol!=='https:'||u.hostname!=='api.sanity.io'||u.username||u.password||
   !/^\/v1\/context\/organizations\/[a-zA-Z0-9_-]+\/mcp\/[a-z0-9-]+$/.test(u.pathname))
   throw new SafeError('CONTEXT_URL_NOT_ALLOWED');
 if([...u.searchParams.keys()].some(k=>!['embeddings','tools','mode','knowledgeBases','perspective'].includes(k)))
   throw new SafeError('CONTEXT_PARAMETER_NOT_ALLOWED');
 if(u.searchParams.get('perspective')&&!['published'].includes(u.searchParams.get('perspective')))
   throw new SafeError('CONTEXT_PERSPECTIVE_NOT_ALLOWED');
 return u.toString();
}
export function decodeRPC(text,type,id) {
 let values=[];
 if(type.includes('text/event-stream')) {
   for(const event of text.split(/\r?\n\r?\n/)){
     const data=event.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');
     if(data && data!=='[DONE]') {try{values.push(JSON.parse(data));}catch{}}
   }
 }else {try{values=[JSON.parse(text)];}catch{throw new SafeError('INVALID_MCP_RESPONSE');}}
 const value=values.find(x=>x.id===id);
 if(!value || value.error)throw new SafeError('MCP_RPC_FAILED');
 return value.result;
}
export function decodeTool(result) {
 if(result?.isError)throw new SafeError('CONTEXT_TOOL_FAILED');
 let value=result?.structuredContent;
 if(!value) {
   const txt=result?.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n')??'';
   try{value=JSON.parse(txt);}catch{throw new SafeError('CONTEXT_TOOL_NOT_JSON');}
 }
 const meta=value.meta??{};
 if(meta.warnings?.length || meta.hint || (meta.resultCount!=null&&meta.returnedCount!=null&&meta.resultCount>meta.returnedCount))
   throw new SafeError('CONTEXT_RETRIEVAL_INCOMPLETE');
 return value.result??value;
}
export class ContextClient {
 constructor(url,token,{fetchImpl=fetch}={}) {
   this.url=endpoint(url);this.token=token;this.fetch=fetchImpl;this.id=0;this.session=null;this.trace=[];
   if(!token)throw new SafeError('CONTEXT_TOKEN_MISSING');
 }
 async rpc(method,params,notification=false) {
   const id=++this.id;
   const body=JSON.stringify({jsonrpc:'2.0',...(notification?{}:{id}),method,...(params?{params}:{})});
   const headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream',
     Authorization:'Bearer '+this.token,'MCP-Protocol-Version':'2025-03-26'};
   if(this.session)headers['Mcp-Session-Id']=this.session;
   let r;
   try {r=await this.fetch(this.url,{method:'POST',headers,body,redirect:'error',signal:AbortSignal.timeout(25000)});}
   catch{throw new SafeError('CONTEXT_REQUEST_FAILED');}
   if(!r.ok)throw new SafeError('CONTEXT_HTTP_'+r.status);
   if(r.headers.get('mcp-session-id'))this.session=r.headers.get('mcp-session-id');
   if(notification)return null;
   const text=await r.text();
   if(text.length>4000000)throw new SafeError('CONTEXT_RESPONSE_TOO_LARGE');
   const result=decodeRPC(text,r.headers.get('content-type')??'',id);
   // Keep successful data receipts. Never save tokens, request headers, or session ids.
   this.trace.push({method,...(method==='tools/call'?{tool:params.name,arguments:params.arguments}:{}),result,at:new Date().toISOString()});
   return result;
 }
 async connect(){
   await this.rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'receipt-desk',version:'0.1.0'}});
   await this.rpc('notifications/initialized',{},true);
   const list=await this.rpc('tools/list',{});
   this.tools=new Set(list.tools?.map(t=>t.name)??[]);
   if(!this.tools.has('initial_context'))throw new SafeError('CONTEXT_INITIAL_TOOL_MISSING');
   return this.call('initial_context',{});
 }
 async call(name,args) {
   if(!this.tools?.has(name))throw new SafeError('CONTEXT_REQUIRED_TOOL_MISSING');
   const result=await this.rpc('tools/call',{name,arguments:args});
   if(result?.isError)throw new SafeError('CONTEXT_TOOL_FAILED');
   return result;
 }
 async readCanonicalArray(documentId,field,total) {
   if(!/^(receipt|claims)-record-[a-f0-9]{12}$/.test(documentId)||
     !['steps','replies'].includes(field)||!Number.isInteger(total)||total<1||total>1000)
     throw new SafeError('CONTEXT_ARRAY_REQUEST_INVALID');
   const blocks=[];
   for(let start=0;start<total;start+=30) {
     const end=Math.min(start+30,total);
     const value=decodeTool(await this.call('array_field_reader',{mode:'range',documentId,field,
       range:{startIndex:start,endIndex:end}}));
     if(value.mode!=='range'||value.documentId!==documentId||value.field!==field||
       value.totalBlocks!==total||value.startIndex!==start||value.endIndex!==end||
       value.truncated||!Array.isArray(value.returnedBlocks)||
       value.returnedBlockCount!==end-start||value.returnedBlocks.length!==end-start)
       throw new SafeError('CONTEXT_ARRAY_INCOMPLETE');
     for(let i=0;i<value.returnedBlocks.length;i++) {
       const item=value.returnedBlocks[i];
       if(item.index!==start+i||item.cropped!==false||item.continuationToken||
         !item.block||typeof item.block!=='object'||Array.isArray(item.block))
         throw new SafeError('CONTEXT_ARRAY_INCOMPLETE');
       blocks.push(item.block);
     }
   }
   if(blocks.length!==total)throw new SafeError('CONTEXT_ARRAY_INCOMPLETE');
   return blocks;
 }
 async record(recordId) {
   if(!/^record-[a-f0-9]{12}$/.test(recordId))throw new SafeError('INVALID_RECORD_ID');
   const query='*[_type == "receiptRecord" && _id == "receipt-'+recordId+'"][0]{_id,_type,recordId,question,sourceTitle,sourceUrl,license,sourceDigest,lineCount,"stepCount":count(steps)}';
   const value=decodeTool(await this.call('groq_query',{query}));
   const doc=Array.isArray(value)?value[0]:value;
   if(!doc || doc.recordId!==recordId)throw new SafeError('CONTEXT_RECORD_MISSING');
   doc.steps=await this.readCanonicalArray(doc._id,'steps',doc.stepCount);
   try{validateRecord(doc);}catch{throw new SafeError('CONTEXT_RECORD_INCOMPLETE');}
   if(sha(flatten(doc).map(l=>l.text).join('\n'))!==doc.sourceDigest)throw new SafeError('CONTEXT_SOURCE_DIGEST_MISMATCH');
   return doc;
 }
 async claims(recordId) {
   if(!/^record-[a-f0-9]{12}$/.test(recordId))throw new SafeError('INVALID_RECORD_ID');
   const replies=[];
   for(let start=0;start<1000;start+=10) {
     const query='*[_type == "claimBundle" && _id == "claims-'+recordId+'"][0].replies['+start+'...'+(start+10)+']';
     const value=decodeTool(await this.call('groq_query',{query}));
     if(!Array.isArray(value))throw new SafeError('CONTEXT_CLAIMS_MISSING');
     replies.push(...value);
     if(value.length<10)return replies;
   }
   throw new SafeError('CONTEXT_CLAIMS_LIMIT');
 }
 async readKnowledgeBase(id,paths) {
   if(!/^kb[a-zA-Z0-9_-]+$/.test(id)||!Array.isArray(paths)||!paths.length||paths.length>20)
     throw new SafeError('INVALID_KNOWLEDGE_BASE_REQUEST');
   return this.call('knowledge_base_read',{knowledgeBase:id,paths});
 }
}
export function contextFromEnv(mode='groq') {
 const name=mode==='groq'?'SANITY_CONTEXT_URL':'SANITY_KB_CONTEXT_URL';
 const config=readJSON('sanity.public.json');
 const configured=mode==='groq'?config.contextUrl:config.knowledgeBaseContextUrl;
 return new ContextClient(process.env[name]||configured,process.env.SANITY_CONTEXT_TOKEN);
}
