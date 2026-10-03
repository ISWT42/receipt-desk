import test from 'node:test';
import assert from 'node:assert/strict';
import {ContextClient} from '../lib/context.mjs';
import {sha} from '../lib/files.mjs';
const recordId='record-123456abcdef',documentId='receipt-'+recordId;
const steps=[{order:1,command:{number:1,text:'$ synthetic check'},output:[{number:2,text:'synthetic result'}]}];
const metadata={_id:documentId,_type:'receiptRecord',recordId,question:'Report the synthetic check.',
 sourceTitle:'Synthetic fixture',sourceUrl:'https://example.com/fixture',license:'Test fixture',
 sourceDigest:sha('$ synthetic check\nsynthetic result'),lineCount:2,stepCount:1};
function page(blocks,start=0,total=blocks.length){
 return {mode:'range',documentId,field:'steps',totalBlocks:total,returnedBlockCount:blocks.length,
 truncated:false,startIndex:start,endIndex:start+blocks.length,
 returnedBlocks:blocks.map((block,i)=>({index:start+i,block,cropped:false}))};
}
function client(){return new ContextClient('https://api.sanity.io/v1/context/organizations/org/mcp/desk','synthetic-placeholder');}
test('Original record uses canonical array blocks and preserves its line digest',async()=>{
 const c=client(),calls=[];
 c.call=async(name,args)=>{calls.push({name,args});return {structuredContent:name==='groq_query'?{meta:{resultCount:1,returnedCount:1},result:structuredClone(metadata)}:page(structuredClone(steps))};};
 const doc=await c.record(recordId);
 assert.deepEqual(doc.steps,steps);
 assert.equal(doc.sourceDigest,metadata.sourceDigest);
 assert.equal(calls[0].name,'groq_query');
 assert.match(calls[0].args.query,/"stepCount":count\(steps\)/);
 assert.equal(calls[1].name,'array_field_reader');
});
test('Canonical arrays request consecutive bounded pages',async()=>{
 const c=client(),seen=[];const blocks=Array.from({length:31},(_,i)=>({order:i+1}));
 c.call=async(name,args)=>{seen.push(args.range);return {structuredContent:page(blocks.slice(args.range.startIndex,args.range.endIndex),args.range.startIndex,31)};};
 assert.deepEqual(await c.readCanonicalArray(documentId,'steps',31),blocks);
 assert.deepEqual(seen,[{startIndex:0,endIndex:30},{startIndex:30,endIndex:31}]);
});
for(const [name,mutate]of [
 ['cropped block',v=>{v.returnedBlocks[0].cropped=true;}],
 ['continuation needed',v=>{v.returnedBlocks[0].continuationToken={blockIndex:0,offsetBytes:5000};}],
 ['different record',v=>{v.documentId='receipt-record-fedcba654321';}],
 ['missing block',v=>{v.returnedBlocks=[];}],
 ['wrong block index',v=>{v.returnedBlocks[0].index=1;}],
 ['changed declared count',v=>{v.totalBlocks=2;}]
]){
 test('Canonical reader rejects '+name,async()=>{const c=client();c.call=async()=>{const v=page(structuredClone(steps));mutate(v);return {structuredContent:v};};await assert.rejects(()=>c.readCanonicalArray(documentId,'steps',1),/CONTEXT_ARRAY_INCOMPLETE/);});
}
test('A canonical block with changed source text still fails the digest check',async()=>{
 const c=client();c.call=async(name)=>{if(name==='groq_query')return {structuredContent:{result:structuredClone(metadata)}};
 const changed=structuredClone(steps);changed[0].output[0].text='changed source';return {structuredContent:page(changed)};};
 await assert.rejects(()=>c.record(recordId),/CONTEXT_SOURCE_DIGEST_MISMATCH/);
});
