import {isDeepStrictEqual} from 'node:util';
import {readJSON,sha,assertPublic,fresh,stamp} from '../lib/files.mjs';
import {validateRecord,flatten} from '../lib/records.mjs';
import {SafeError} from '../lib/context.mjs';
const c=readJSON('sanity.public.json'),manifest=readJSON(c.uploadManifestFile);
const query='*[_id in path("*") && _type in ["receiptRecord","claimBundle"]]{_id,_type,recordId,question,sourceTitle,sourceUrl,license,sourceDigest,lineCount,steps,replies,record}';
let receipt={projectId:c.projectId,dataset:c.dataset,provider:'Sanity Content Lake, not Context',publicRead:true,checkedAt:new Date().toISOString(),status:'unknown'};
try{
 const response=await fetch('https://'+c.projectId+'.api.sanity.io/v'+c.apiVersion+'/data/query/'+c.dataset+'?query='+encodeURIComponent(query),{redirect:'error',signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new SafeError('DATASET_VERIFY_HTTP_'+response.status);
 const docs=(await response.json()).result;docs.forEach(assertPublic);
 const records=docs.filter(d=>d._type==='receiptRecord'),claims=docs.filter(d=>d._type==='claimBundle');
 receipt={...receipt,records:records.length,claimBundles:claims.length,historicalReplies:claims.reduce((a,d)=>a+d.replies.length,0)};
 const frozen=readJSON(manifest.recordsFile),bundles=readJSON(manifest.claimsFile);
 for(const d of records){validateRecord(d);if(sha(flatten(d).map(l=>l.text).join('\n'))!==d.sourceDigest)throw new SafeError('DATASET_DIGEST_MISMATCH');}
 if(records.length!==48||claims.length!==48||receipt.historicalReplies!==2592||records.some(d=>!frozen.some(x=>x._id===d._id&&x.sourceDigest===d.sourceDigest))||claims.some(d=>!bundles.some(x=>x._id===d._id&&isDeepStrictEqual(x.replies,d.replies))))throw new SafeError('DATASET_CONTENT_MISMATCH');
 receipt.status='done';receipt.allRecordDigestsAndClaimBytesMatch=true;
 console.log('PUBLIC DATASET VERIFIED: 48 records, 48 claim bundles, 2592 historical replies; record digests and claim bytes match.');
}catch(e){receipt.status='failed';receipt.errorCode=e.code??'DATASET_VERIFY_FAILED';console.log('PUBLIC DATASET CHECK FAILED: '+receipt.errorCode);process.exitCode=1;}
fresh('results/dataset-read-'+stamp()+'.json',receipt);
