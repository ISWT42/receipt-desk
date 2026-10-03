import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,sha,assertPublic,fresh,stamp,verifyInputs} from '../lib/files.mjs';
import {SafeError} from '../lib/context.mjs';
verifyInputs();
const config=readJSON('sanity.public.json'),manifest=readJSON(config.uploadManifestFile??'work/content/manifest.json');
const dataset=process.env.SANITY_DATASET??config.dataset;
if(config.projectId!=='ixoe9uvf'||!dataset||!/^[a-z0-9_-]+$/.test(dataset))throw new SafeError('PROJECT_OR_DATASET_NOT_CONFIGURED');
const bytes=fs.readFileSync(path.join(root,manifest.uploadFile));
if(sha(bytes)!==manifest.uploadSha256)throw new SafeError('UPLOAD_DIGEST_MISMATCH');
const docs=bytes.toString().trim().split(/\r?\n/).map(JSON.parse);
docs.forEach(assertPublic);
if(docs.length!==manifest.datasetDocuments||docs.length>150)throw new SafeError('UPLOAD_COUNT_MISMATCH');
if(!process.argv.includes('--send')) {
 console.log('UPLOAD PREVIEW: '+docs.length+' new documents to project '+config.projectId+', dataset '+dataset+'.');
 console.log('FILE: '+manifest.uploadFile+'; SHA256: '+manifest.uploadSha256);
 console.log('No request sent. Use --send only after project setup and the approved public upload are ready.');
 process.exit(0);
}
if(process.env.RECEIPT_DESK_ALLOW_UPLOAD!=='yes')throw new SafeError('UPLOAD_APPROVAL_REQUIRED');
const token=process.env.SANITY_WRITE_TOKEN;
if(!token)throw new SafeError('PROJECT_WRITE_TOKEN_MISSING');
const prefix='https://'+config.projectId+'.api.sanity.io/v'+config.apiVersion+'/data/';
const receipts=[];
for(let start=0;start<docs.length;start+=12){
 const batch=docs.slice(start,start+12);
 // createIfNotExists never overwrites existing content. No secrets enter a document.
 const response=await fetch(prefix+'mutate/'+dataset,{method:'POST',redirect:'error',signal:AbortSignal.timeout(25000),
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify({mutations:batch.map(document=>({createIfNotExists:document})),returnIds:true})}).catch(()=>{throw new SafeError('UPLOAD_REQUEST_FAILED');});
 if(!response.ok)throw new SafeError('UPLOAD_HTTP_'+response.status);
 const result=await response.json();
 receipts.push({batchStart:start,documents:batch.length,transactionId:result.transactionId??null,
  returnedIds:result.results?.map(r=>r.id).filter(Boolean)??[],at:new Date().toISOString()});
}
const dir='results/upload-'+stamp();
fresh(dir+'/receipts.json',{projectId:config.projectId,dataset,fileSha256:manifest.uploadSha256,receipts,
 status:'partial',note:'Mutation requests accepted. Content and Context retrieval need separate verification.'});
console.log('UPLOAD REQUESTS ACCEPTED: '+docs.length+' create-if-absent documents. Verify Context content next.');
