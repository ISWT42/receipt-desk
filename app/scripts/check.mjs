import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {parse,evaluate} from 'groq-js';
import {root,readJSON,verifyInputs,assertPublic,fresh,stamp} from '../lib/files.mjs';
import {validateRecord} from '../lib/records.mjs';
const manifest=readJSON('work/content/manifest.json'),records=readJSON('work/content/records.json'),bundles=readJSON('work/content/claims.json');
verifyInputs();
if(manifest.records!==48 || manifest.allRunHashes!==58 || manifest.countedRuns!==54 || records.length+bundles.length!==96)
 throw new Error('Content counts are inconsistent with the fixed inputs');
for(const doc of [...records,...bundles])assertPublic(doc);
for(const doc of records)validateRecord(doc);
const docs=[...records,...bundles];
const one=records[0].recordId;
const query='*[_type=="receiptRecord" && recordId=="'+one+'"][0]{_id,recordId,question,lineCount,steps}';
const value=await (await evaluate(parse(query),{dataset:docs})).get();
if(value.recordId!==one || value.steps.length!==records[0].steps.length)throw new Error('GROQ record projection failed');
const joined=await (await evaluate(parse('*[_type=="claimBundle"][0]{"id":record->recordId}'),{dataset:docs})).get();
if(!joined.id)throw new Error('GROQ claim reference failed');
const t=spawnSync(process.execPath,['--test','--test-reporter=tap','app/tests/policy.test.mjs','app/tests/context.test.mjs'],{cwd:root,encoding:'utf8'});
const receipt={at:new Date().toISOString(),status:t.status===0?'done':'failed',
 check:'node app/scripts/check.mjs',sourceHashes:'matched',content:'48 neutral records and 48 claim bundles; no label fields',
 groq:'record projection and claim dereference passed',tests:t.stdout,errors:t.stderr};
fresh('results/check-'+stamp()+'.json',receipt);
if(t.status!==0){process.stdout.write(t.stdout);process.stderr.write(t.stderr);process.exit(t.status??1);}
console.log('LOCAL CHECK PASSED: inputs, run hashes, public-content boundary, GROQ projections, and policy/Context tests.');
console.log(t.stdout.split('\n').filter(l=>/^# (tests|pass|fail) /.test(l)).join('\n'));
console.log('NOT CHECKED: live Sanity upload, deployed schema, Knowledge Base, Context retrieval, AI harness, or public hosting.');
