import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {schemaMatches} from '../lib/weaker-schema.mjs';
const schema=JSON.parse(fs.readFileSync(new URL('../answer-schema.json',import.meta.url),'utf8'));
const answer=()=>({recordId:'record-example',status:'failed',reason:'The check failed.',receipt:{sourceId:'receipt-record-example',sourceUrl:'https://example.test/source',documentUrl:'https://example.test/doc',step:2,line:7,text:'1 failed',coverage:{complete:true,lineCount:8}}});
test('complete frozen-schema response matches without modifying its receipt',()=>{const a=answer(),before=JSON.stringify(a);assert.equal(schemaMatches(a,schema),true);assert.equal(JSON.stringify(a),before);});
test('missing coverage and unexpected metadata fail the same frozen shape',()=>{const a=answer();delete a.receipt.coverage;assert.equal(schemaMatches(a,schema),false);const b=answer();b.extra='unrequested';assert.equal(schemaMatches(b,schema),false);});
test('unknown status and wrong primitive types are invalid replies',()=>{const a=answer();a.status='finished';assert.equal(schemaMatches(a,schema),false);const b=answer();b.receipt.line='7';assert.equal(schemaMatches(b,schema),false);assert.equal(schemaMatches(null,schema),false);});
