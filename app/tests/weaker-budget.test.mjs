import test from 'node:test';import assert from 'node:assert/strict';
import {reserveCall,costNanoUsd,brokerCost,brokerReply,creditOrKeyLimit,redact,CAP_NANO_USD} from '../lib/weaker-broker.mjs';
test('reserve includes all text bytes, framing reserve, and 4000 output tokens at owner prices',()=>{
 const r=reserveCall('google/gemini-3.7-flash','é','x',0);
 assert.equal(r.inputTokenUpperBound,4099);assert.equal(r.worstNanoUsd,18074250);assert.equal(r.outputTokenCap,4000);assert.equal(r.permitted,true);
});
test('exact cap reservation is allowed; a one-nanodollar excess is stopped',()=>{
 const r=reserveCall('openai/gpt-5.4-nano','','',0);
 assert.equal(reserveCall('openai/gpt-5.4-nano','','',CAP_NANO_USD-r.worstNanoUsd).permitted,true);
 assert.equal(reserveCall('openai/gpt-5.4-nano','','',CAP_NANO_USD-r.worstNanoUsd+1).permitted,false);
 assert.equal(reserveCall('openai/gpt-5.4-nano','','',CAP_NANO_USD).permitted,false);
});
test('unknown or negative reported cost cannot become zero spend',()=>{
 for(const v of [null,undefined,'0',NaN,-1])assert.throws(()=>costNanoUsd(v),/BROKER_COST_UNKNOWN/);
 assert.equal(costNanoUsd(0.0000000001),1);assert.throws(()=>brokerCost({usage:{tokens:100}}),/BROKER_COST_UNKNOWN/);
});
test('broker envelope preserves exact reply rather than fixing model JSON',()=>{
 const text='\n{"recordId":"r","status":"failed"}\n';
 assert.equal(brokerReply({costUsd:0.001,text}),text);assert.equal(brokerCost({costUsd:0.001,text}),0.001);
 assert.equal(brokerReply({costUsd:0.001,result:{choices:[{message:{content:text}}]}}),text);
});
test('credit and key limit messages stop the batch and sensitive text is redacted',()=>{
 assert.equal(creditOrKeyLimit('insufficient credits'),true);assert.equal(creditOrKeyLimit('API key spending limit exceeded'),true);
 assert.equal(creditOrKeyLimit('model invalid JSON'),false);
 assert.equal(redact('Bearer abcdefghijklmnop'),'Bearer [secret]');
});
