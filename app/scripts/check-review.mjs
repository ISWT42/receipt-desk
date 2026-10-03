import fs from 'node:fs';
import path from 'node:path';
import {inflateRawSync} from 'node:zlib';
import {root,readJSON,sha,fresh,stamp} from '../lib/files.mjs';
const [manifestName,zipName]=process.argv.slice(2);
if(!/^PUBLIC-FILE-MANIFEST-[0-9TZ-]+\.json$/.test(manifestName??'')||!/^public\/receipt-desk-review-[0-9TZ-]+\.zip$/.test(zipName??''))throw new Error('Review paths required');
const manifest=readJSON(manifestName),zip=fs.readFileSync(path.join(root,zipName));
let e=-1;for(let i=zip.length-22;i>=Math.max(0,zip.length-65557);i--)if(zip.readUInt32LE(i)===0x06054b50){e=i;break;}
if(e<0)throw new Error('ZIP end marker missing');
const n=zip.readUInt16LE(e+10),entries=new Map();let p=zip.readUInt32LE(e+16);
for(let i=0;i<n;i++){
 if(zip.readUInt32LE(p)!==0x02014b50)throw new Error('Invalid ZIP directory');
 const method=zip.readUInt16LE(p+10),size=zip.readUInt32LE(p+20),expanded=zip.readUInt32LE(p+24),nl=zip.readUInt16LE(p+28),el=zip.readUInt16LE(p+30),cl=zip.readUInt16LE(p+32),at=zip.readUInt32LE(p+42);
 const name=zip.subarray(p+46,p+46+nl).toString().replaceAll('\\','/');
 if(name.split('/').includes('..')||name.startsWith('/')||/auth|token|key|secret|credential|confidential|(?:^|\/)\.env|(?:^|\/)(inputs|scoring|node_modules)\//i.test(name))throw new Error('Forbidden review path');
 if(!name.endsWith('/')){
  const start=at+30+zip.readUInt16LE(at+26)+zip.readUInt16LE(at+28),data=zip.subarray(start,start+size),out=method===0?data:method===8?inflateRawSync(data):null;
  if(!out||out.length!==expanded||entries.has(name))throw new Error('Invalid member');entries.set(name,out);
 }
 p+=46+nl+el+cl;
}
if(entries.size!==manifest.files.length+1)throw new Error('Manifest count mismatch');
for(const item of manifest.files){const b=entries.get(item.path);if(!b||b.length!==item.bytes||sha(b)!==item.sha256)throw new Error('Review digest mismatch');}
if(!entries.get('PUBLIC-FILE-MANIFEST.json')?.equals(fs.readFileSync(path.join(root,manifestName))))throw new Error('Embedded manifest mismatch');
const first=readJSON('results/local-2026-10-02T19-36-14-132Z/run-manifest.json');
if(sha(fs.readFileSync(path.join(root,'app/lib/score.mjs')))!==first.frozen.scorer)throw new Error('Scorer changed');
fresh('results/review-package-'+stamp()+'.json',{status:'done',files:manifest.files.length,archiveFiles:entries.size,zip:zipName,zipSha256:sha(zip),manifest:manifestName,scorerUnchanged:true,originalInputsExcluded:true,labelsExcluded:true,secretsExcluded:true,published:false});
console.log('REFRESHED REVIEW PACKAGE VERIFIED: '+manifest.files.length+' files plus manifest; every digest matches; scorer unchanged; no inputs, labels, or secrets.');
