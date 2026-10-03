import test from 'node:test';
import assert from 'node:assert/strict';
import {ContextClient,endpoint,decodeRPC,decodeTool} from '../lib/context.mjs';
import {parseCSV} from '../lib/csv.mjs';
test('Context sends only to the explicit Sanity endpoint',()=>{
 const url='https://api.sanity.io/v1/context/organizations/org/mcp/desk?embeddings=false';
 assert.equal(endpoint(url),url);
 for(const u of ['http://api.sanity.io/v1/context/organizations/org/mcp/desk','https://evil.example/v1/context/organizations/org/mcp/desk',
 'https://api.sanity.io/v1/context/organizations/org/mcp/desk?token=x',
 'https://user:pass@api.sanity.io/v1/context/organizations/org/mcp/desk'])assert.throws(()=>endpoint(u));
});
test('SSE extraction handles notifications and a matching RPC id',()=>{
 const t='data: {"jsonrpc":"2.0","method":"ping"}\n\ndata: {"jsonrpc":"2.0","id":2,"result":{"tools":[]}}\n\n';
 assert.deepEqual(decodeRPC(t,'text/event-stream',2),{tools:[]});
});
test('Cropped Context content cannot silently become a status',()=>{
 assert.throws(()=>decodeTool({structuredContent:{meta:{warnings:['cropped']},result:{}}}),/INCOMPLETE/);
 assert.throws(()=>decodeTool({structuredContent:{meta:{resultCount:5,returnedCount:1},result:{}}}),/INCOMPLETE/);
 assert.throws(()=>decodeTool({isError:true}),/TOOL_FAILED/);
});
test('Context initialization and tool calls work against an in-process mock',async()=>{
 const seen=[];
 const fetchImpl=async(url,init)=>{
   const body=JSON.parse(init.body);seen.push(body.method);
   const result=body.method==='tools/list'?{tools:[{name:'initial_context'}]}:
     body.method==='initialize'?{protocolVersion:'2025-03-26'}:{content:[{type:'text',text:'Fixture schema'}]};
   return new Response(body.id?JSON.stringify({jsonrpc:'2.0',id:body.id,result}):'',{status:body.id?200:202,headers:{'content-type':'application/json'}});
 };
 const c=new ContextClient('https://api.sanity.io/v1/context/organizations/org/mcp/desk','mock-not-a-token',{fetchImpl});
 await c.connect();
 assert.deepEqual(seen,['initialize','notifications/initialized','tools/list','tools/call']);
 assert.equal(JSON.stringify(c.trace).includes('mock-not-a-token'),false);
});
test('HTTP error bodies and credentials are never forwarded',async()=>{
 const c=new ContextClient('https://api.sanity.io/v1/context/organizations/org/mcp/desk','mock-value',
 {fetchImpl:async()=>new Response('Sensitive response',{status:403})});
 await assert.rejects(()=>c.connect(),/^Error: CONTEXT_HTTP_403$/);
 assert.deepEqual(c.trace,[]);
});
test('CSV quotes preserve commas and empty noncounted fields',()=>{
 const rows=parseCSV('a,b,c\r\n1,"note, with comma",\r\n');
 assert.deepEqual(rows,[{a:'1',b:'note, with comma',c:''}]);
});
