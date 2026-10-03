import fs from 'node:fs';
import path from 'node:path';
import {root,sha,fresh,verifyInputs,assertPublic} from '../lib/files.mjs';
import {stepsFromLines,validateRecord} from '../lib/records.mjs';
import {zipMembers} from '../lib/zip.mjs';
import {parseCSV} from '../lib/csv.mjs';
const fingerprints=verifyInputs();
const sourceUrl='https://www.kaggle.com/datasets/iswt42/it-quoted-the-failure-evidence';
const sourceTitle='It Quoted the Failure: Benchmark Evidence';
const cases=fs.readFileSync(path.join(root,'inputs/the-48-logs.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const records=[],labels=[];
for(const item of cases){
  const lines=item.lines.map(l=>l.text),rawText=lines.join('\n');
  const recordId='record-'+sha(item.task+'\0'+rawText).slice(0,12);
  const doc={_id:'receipt.'+recordId,_type:'receiptRecord',recordId,question:item.task,sourceTitle,sourceUrl,
    license:'CC BY 4.0',sourceDigest:sha(rawText),lineCount:lines.length,steps:stepsFromLines(lines)};
  validateRecord(doc);assertPublic(doc);records.push(doc);
  labels.push({recordId,originalId:item.id,expected:item.truth==='unknown'?'not shown':item.truth,
    finalBlockStart:item.block_start+1,oracleLines:item.oracle.map(o=>o.line+1)});
}
records.sort((a,b)=>a.recordId.localeCompare(b.recordId));
if(new Set(records.map(r=>r.recordId)).size!==48) throw new Error('Expected 48 distinct records');
const rowMap=new Map(records.map(r=>[r.recordId,r]));
const textMap=new Map(cases.map((c,i)=>[c.lines.map(l=>l.text).join('\n'),labels[i].recordId]));
const rows=parseCSV(fs.readFileSync(path.join(root,'inputs/run-list.csv'),'utf8'));
const members=zipMembers(fs.readFileSync(path.join(root,'inputs/kaggle-runs.zip')));
const claims=new Map(records.map(r=>[r.recordId,[]]));
let countedRuns=0,allRunHashes=0,missingReplies=0,matchedReplies=0;
for(const row of rows){
  const bytes=members.get('runs/'+row.run_file);
  if(!bytes || sha(bytes)!==row.run_file_sha256) throw new Error('Run digest mismatch');
  allRunHashes++;
  const run=JSON.parse(bytes);
  if(run.taskVersion.name!==row.task || String(run.taskVersion.versionNumber)!==row.task_version ||
    !run.pyRunId.startsWith(row.task+'-Run #') || run.startTime!==row.start_utc) throw new Error('Run metadata mismatch');
  if(row.counted!=='True')continue;
  countedRuns++;
  const seen=new Set();
  for(const subrun of run.subruns??[]){
    const contents=(subrun.conversations??[]).flatMap(c=>(c.requests??[]).flatMap(q=>q.contents??[]));
    const requests=contents.filter(c=>c.role==='CONTENT_ROLE_USER').map(c=>c.parts?.map(p=>p.text??'').join('')??'');
    const replies=contents.filter(c=>c.role==='CONTENT_ROLE_ASSISTANT').map(c=>c.parts?.map(p=>p.text??'').join('')??'');
    const prompt=requests.at(0)??'';
    const marker=prompt.match(/<<<\r?\n([\s\S]*?)\r?\n>>>/);
    if(!marker) throw new Error('Run transcript could not be isolated');
    const recordId=textMap.get(marker[1].replace(/\r\n/g,'\n'));
    if(!recordId || seen.has(recordId)) throw new Error('Unmatched or duplicate run case');
    seen.add(recordId);
    const reply=replies.at(0);
    if(!reply?.trim()){missingReplies++;continue;}
    // Keep only model reply text. Definitions, task results, prompts, and labels stay local.
    const claim={_type:'modelReply',_key:'run'+row.run_id,runId:row.run_id,model:row.model,
      arm:row.arm,recordedAt:row.start_utc,text:reply};
    assertPublic(claim);
    claims.get(recordId).push(claim);matchedReplies++;
  }
}
const bundles=records.map(r=>({_id:'claims.'+r.recordId,_type:'claimBundle',recordId:r.recordId,
  record:{_type:'reference',_ref:r._id},sourceTitle,sourceUrl,license:'CC BY 4.0',
  replies:claims.get(r.recordId)}));
const docs=[...records,...bundles];
if(docs.length>150)throw new Error('Knowledge Base document budget exceeded');
docs.forEach(assertPublic);
fresh('scoring/labels.jsonl',labels.map(l=>JSON.stringify(l)).join('\n')+'\n');
fresh('work/content/records.json',records);
fresh('work/content/claims.json',bundles);
fresh('work/content/sanity.ndjson',docs.map(d=>JSON.stringify(d)).join('\n')+'\n');
fresh('work/eval/questions.jsonl',records.map(r=>JSON.stringify({recordId:r.recordId,question:r.question})).join('\n')+'\n');
for(const r of records){
  const out=['# '+r.recordId,'',r.question,'','## Ordered record',''];
  for(const s of r.steps){
    out.push('### Step '+s.order,'','```text',...[s.command,...s.output].filter(Boolean).map(l=>'L'+l.number+': '+l.text),'```','');
  }
  out.push('## Working agent replies','These are historical claims. They are not completion evidence.','');
  for(const c of claims.get(r.recordId))out.push('### '+c.arm+' / '+c.model+' / run '+c.runId,'','```text',c.text.replaceAll('```','~~~'),'```','');
  out.push('Source: '+sourceTitle,'Source URL: '+sourceUrl,'Licence: CC BY 4.0. Derived by separating command steps and extracting replies.');
  fresh('work/content/kb-files/'+r.recordId+'.md',out.join('\n')+'\n');
}
const manifest={status:'done',inputFingerprints:fingerprints,records:records.length,claimBundles:bundles.length,
  datasetDocuments:docs.length,kbFiles:records.length,documentBudget:150,allRunHashes,countedRuns,
  matchedReplies,missingReplies,labelsExcluded:true,neutralIds:true,
  uploadFile:'work/content/sanity.ndjson',uploadSha256:sha(fs.readFileSync(path.join(root,'work/content/sanity.ndjson'))),
  kbFileDigests:records.map(r=>({file:r.recordId+'.md',sha256:sha(fs.readFileSync(path.join(root,'work/content/kb-files/'+r.recordId+'.md')))}))};
fresh('work/content/manifest.json',manifest);
console.log('CONTENT READY: '+records.length+' neutral records; '+bundles.length+' claim bundles; '+matchedReplies+' historical replies; labels excluded.');
console.log('RUN FILES VERIFIED: '+allRunHashes+'; counted runs '+countedRuns+'; missing replies '+missingReplies+'.');
