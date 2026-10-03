import fs from 'node:fs';
import path from 'node:path';
import {inflateRawSync} from 'node:zlib';
import {root,readJSON,sha,fresh,stamp} from '../lib/files.mjs';
const manifest=readJSON('PUBLIC-FILE-MANIFEST.json');
const zip=fs.readFileSync(path.join(root,'public/receipt-desk-review.zip'));
let e=-1;
for(let i=zip.length-22;i>=Math.max(0,zip.length-65557);i--)if(zip.readUInt32LE(i)===0x06054b50){e=i;break;}
if(e<0)throw new Error('Package ZIP end marker missing');
const n=zip.readUInt16LE(e+10),entries=new Map();let p=zip.readUInt32LE(e+16);
for(let i=0;i<n;i++){
 if(zip.readUInt32LE(p)!==0x02014b50)throw new Error('Invalid package ZIP directory');
 const method=zip.readUInt16LE(p+10),size=zip.readUInt32LE(p+20),expanded=zip.readUInt32LE(p+24);
 const nl=zip.readUInt16LE(p+28),el=zip.readUInt16LE(p+30),cl=zip.readUInt16LE(p+32),at=zip.readUInt32LE(p+42);
 const name=zip.subarray(p+46,p+46+nl).toString().replaceAll('\\','/');
 if(name.split('/').includes('..')||name.startsWith('/')||/auth|token|key|secret|credential|confidential|(?:^|\/)\.env/i.test(name))throw new Error('Forbidden package path');
 if(!name.endsWith('/')){
  const start=at+30+zip.readUInt16LE(at+26)+zip.readUInt16LE(at+28);
  const data=zip.subarray(start,start+size),out=method===0?data:method===8?inflateRawSync(data):null;
  if(!out||out.length!==expanded||entries.has(name))throw new Error('Invalid package member');
  entries.set(name,out);
 }
 p+=46+nl+el+cl;
}
if(entries.size!==manifest.files.length)throw new Error('Package file count differs from manifest');
for(const item of manifest.files){
 const b=entries.get(item.path);
 if(!b||sha(b)!==item.sha256)throw new Error('Package digest differs from public manifest');
}
const first=readJSON('results/local-2026-10-02T19-36-14-132Z/run-manifest.json');
const revised=readJSON('results/local-2026-10-02T19-36-52-112Z/run-manifest.json');
if(first.frozen.scorer!==revised.frozen.scorer)throw new Error('Scorer changed after first local evaluation');
const required=['STATUS.md','JOSHUA-STEPS.md','DESIGN.md','RULES-FINDINGS.md','POST-DRAFT.md','NUMBERS.md','REVIEW-NOTES.md'];
for(const name of required)if(!fs.existsSync(path.join(root,name)))throw new Error('Required review file missing');
fresh('results/package-'+stamp()+'.json',{status:'done',files:entries.size,zipSha256:sha(zip),manifest:'PUBLIC-FILE-MANIFEST.json',
 firstScorerDigest:first.frozen.scorer,revisedScorerDigest:revised.frozen.scorer,scorerUnchanged:true,
 originalInputsExcluded:true,labelsExcluded:true,secretsExcluded:true,published:false});
console.log('PACKAGE CHECK PASSED: '+entries.size+' files match the public manifest; scorer unchanged; all required review files present.');
console.log('PACKAGE ONLY: no upload, push, post, hosted deployment, sign-in, or external seal performed.');
