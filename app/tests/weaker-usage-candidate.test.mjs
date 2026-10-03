import test from 'node:test';import assert from 'node:assert/strict';import {conservativeUsageCost} from '../lib/weaker-usage-candidate.mjs';
test('first returned token receipt gives a conservative 0.0040335 USD bound, without claiming actual cost',()=>{
 const r=conservativeUsageCost('google/gemini-3.7-flash','[broker] model: google/gemini-3.7-flash\n[broker] tokens in/out/reasoning: 1078/565/295; cost estimate unknown');
 assert.equal(r.costUpperBoundUsd,0.0040335);assert.equal(r.actualCostUsd,null);assert.equal(r.outputTokensChargedForBound,860);
});
test('missing counts or a different model cannot authorize further spending',()=>{
 assert.throws(()=>conservativeUsageCost('google/gemini-3.7-flash','[broker] model: google/gemini-3.7-flash\ncost estimate unknown'),/BROKER_TOKEN_USAGE_UNKNOWN/);
 assert.throws(()=>conservativeUsageCost('google/gemini-3.7-flash','[broker] model: openai/gpt-5.4-nano\ntokens in/out/reasoning: 1/1/0'),/BROKER_MODEL_METADATA_MISMATCH/);
});
