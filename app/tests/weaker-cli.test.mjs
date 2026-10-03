import test from 'node:test';import assert from 'node:assert/strict';import {parseCliReply} from '../lib/weaker-cli.mjs';
test('bare JSON and a single JSON block preserve the exact answer fields',()=>{
 const json='{"recordId":"r","status":"failed","receipt":{"text":"  1 failed"}}';
 const fence=String.fromCharCode(96).repeat(3);
 assert.deepEqual(parseCliReply(json),parseCliReply(fence+'json\n'+json+'\n'+fence));
 assert.equal(parseCliReply(fence+'json\n'+json+'\n'+fence).receipt.text,'  1 failed');
});
test('prose, multiple answers, malformed JSON, and arrays are not repaired',()=>{
 assert.equal(parseCliReply('Here is the answer: {"status":"failed"}'),null);
 assert.equal(parseCliReply('{"status":"failed"}\n{"status":"done"}'),null);
 assert.equal(parseCliReply('{"status":"failed",}'),null);assert.equal(parseCliReply('[]'),null);
});
