import test from 'node:test';import assert from 'node:assert/strict';import {assessWeakPredictions} from '../lib/weaker-predictions.mjs';
const arm=(falseDoneFailed=0,falseDoneNotShown=0,correctTotal=48,receiptScore=1)=>({falseDoneFailed,falseDoneNotShown,correctTotal,receiptScore});
test('perfect ties miss P1/P2 and make P3 explicitly vacuous',()=>{
 const p=assessWeakPredictions({raw:arm(),context:arm()},{raw:arm(),context:arm()});
 assert.deepEqual(p.map(x=>x.result),['miss','miss','hit','hit','hit']);assert.equal(p[2].vacuous,true);assert.equal(p[2].qualifyingModels.length,0);
});
test('P3 requires half or less even for an odd number of raw errors',()=>{
 const p=assessWeakPredictions({raw:arm(3),context:arm(2)},{raw:arm(),context:arm()});
 assert.equal(p[2].result,'miss');assert.equal(p[2].vacuous,false);
 assert.equal(assessWeakPredictions({raw:arm(3),context:arm(1)},{raw:arm(),context:arm()})[2].result,'hit');
});
test('P4/P5 fail if either model declines; ties meet non-decrease conditions',()=>{
 const p=assessWeakPredictions({raw:arm(),context:arm(0,0,47,1)},{raw:arm(),context:arm(0,0,48,0.9)});
 assert.equal(p[3].result,'miss');assert.equal(p[4].result,'miss');
});
