import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh,sha,assertPublic,verifyInputs} from '../lib/files.mjs';
verifyInputs();
const prior=readJSON('work/content/manifest.json');
const records=readJSON('work/content/records.json').map(d=>({...d,_id:'receipt-'+d.recordId}));
const claims=readJSON('work/content/claims.json').map(d=>({...d,_id:'claims-'+d.recordId,record:{...d.record,_ref:'receipt-'+d.recordId}}));
const docs=[...records,...claims];
docs.forEach(assertPublic);
if(records.length!==48||claims.length!==48||docs.some(d=>d._id.includes('.')))throw new Error('PUBLIC_ROOT_IDS_INVALID');
const text=docs.map(d=>JSON.stringify(d)).join('\n')+'\n';
const manifest={...prior,uploadFile:'work/content/public-sanity.ndjson',uploadSha256:sha(text),
 recordsFile:'work/content/public-records.json',claimsFile:'work/content/public-claims.json',
 documentIdPolicy:'Root IDs without dots; neutral record IDs and original log bytes unchanged.',
 priorUploadFile:prior.uploadFile,priorUploadSha256:prior.uploadSha256,
 knowledgeBaseFilter:'_id in path("*") && _type in ["receiptRecord","claimBundle"]'};
fresh(manifest.recordsFile,records);fresh(manifest.claimsFile,claims);fresh(manifest.uploadFile,text);
fresh('work/content/public-manifest.json',manifest);
for(const [file,data] of [['public-records.json',records],['public-claims.json',claims],['public-sanity.ndjson',text],['public-manifest.json',manifest]])fresh('public/content/'+file,data);
console.log('PUBLIC CONTENT READY: 48 records and 48 claim bundles; 96 root IDs; original log digests unchanged.');
