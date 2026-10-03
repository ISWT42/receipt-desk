import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh,sha,stamp} from '../lib/files.mjs';
const version=stamp(),candidate='work/review-'+version;
const files=new Map();
function add(source,destination=source){files.set(destination,source);}
const allowed=['package.json','package-lock.json','tsconfig.json','sanity.config.ts','sanity.cli.ts','sanity.public.json','.gitignore',
 'DESIGN.md','EVAL-PLAN.md','PREDICTIONS.md','AI-EVAL-PLAN.md','AI-PREDICTIONS.md','AI-PROMPT.txt','SOURCE-NOTICE.md','REVIEW-NOTES.md',
 'RULES-FINDINGS.md','AGENT-INSTRUCTIONS.md','NUMBERS.md','STATUS.md','JOSHUA-STEPS.md','POST-DRAFT.md'];
for(const p of allowed)add(p);add('REPOSITORY-README.md','README.md');
for(const p of ['CURRENT-HANDOFF.md','SETUP-CHECK-REPORT.md','STUDIO-DEPLOY-PREVIEW.md',
 'CONTEXT-PROTOCOL-ADDENDUM-2026-10-02.md','CONTEXT-PROTOCOL-FINDING-2026-10-02.md','CONTEXT-RETRIEVAL-NOTE-2026-10-02.md',
 'KB-QUALITY-FINDING-2026-10-03.md','RECORDED-VIEWER-PUBLISH-PREVIEW.md',
 'PREDICTIONS-WEAKER-MODELS.md','PREDICTIONS-WEAKER-MODELS-CORRECTION.md','PREDICTIONS-WEAKER-MODELS.md.ots','WEAKER-MODEL-PREPARATION-PROTOCOL-2026-10-03.md','WEAKER-MODEL-SETUP-REPORT.md'])add(p);
for(const p of ['results/schema-read-2026-10-02T22-28-23-682Z.json',
 'results/studio-candidate-2026-10-02T22-39-00-675Z/deployment-manifest.json',
 'results/studio-deploy-2026-10-02T23-32-50-661Z/approval.json',
 'results/studio-deploy-2026-10-02T23-32-50-661Z/registration.json',
 'results/studio-deploy-2026-10-02T23-32-50-661Z/provider-receipt.json',
 'results/studio-inspect-2026-10-02T23-33-52-430Z/public-files.json',
 'results/kb-outline-2026-10-02T23-34-22-346Z/receipt.json',
 'results/knowledge-base-2026-10-02T23-34-49-452Z/receipt.json',
 'results/kb-example-source-2026-10-02T23-36-23-420Z.json'])add(p);
const checkpoints=fs.readdirSync(path.join(root,'results'));
for(const prefix of ['context-policy-','context-policy-refinement-','context-array-tests-','model-context-protocol-','kb-issues-owner-report-','studio-owner-ready-','context-live-check-','kb-reply-count-','context-claims-','model-paired-ui-','viewer-local-review-','review-boundary-','weaker-precall-','weaker-unit-check-','weaker-system-candidate-'])
 for(const p of checkpoints.filter(p=>p.startsWith(prefix)&&p.endsWith('.json')))add('results/'+p);
const currentSetup=checkpoints.filter(p=>/^setup-check-\d.*\.json$/.test(p)).sort().at(-1);if(currentSetup)add('results/'+currentSetup);
for(const run of checkpoints.filter(p=>/^model-pair-\d/.test(p)))
 for(const file of ['summary.json','REPORT.md','rawModel.jsonl','contextModel.jsonl','rawModel-case-scores.json','contextModel-case-scores.json','receipt-miss-note.json'])
  if(fs.existsSync(path.join(root,'results',run,file)))add('results/'+run+'/'+file);
if(fs.existsSync(path.join(root,'results/ai-harness-summary.json')))add('results/ai-harness-summary.json');

function walk(dir){
 for(const d of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  if(d.isSymbolicLink())throw new Error('Review links forbidden');
  const p=dir+'/'+d.name;
  if(['app/scripts/deploy-studio-checked.mjs','app/scripts/publish-recorded-viewer.mjs'].includes(p))continue;
  if(/auth|token|key|secret|credential|confidential|(?:^|\/)\.env/i.test(p))throw new Error('Sensitive review path');
  if(d.isDirectory())walk(p);else add(p);
 }
}
walk('app');
for(const p of ['public/content/public-records.json','public/content/public-claims.json','public/content/public-sanity.ndjson','public/content/public-manifest.json',
 'public/results/summary.json','public/results/structured.jsonl','public/results/orderedRaw.jsonl','public/results/lexical.jsonl','public/demo.html'])add(p);
for(const p of fs.readdirSync(path.join(root,'public')).filter(p=>/^model-demo-[0-9TZ-]+-(raw|paired)\.html$/.test(p)))add('public/'+p);
for(const run of ['local-2026-10-02T19-36-14-132Z','local-2026-10-02T19-36-52-112Z'])
 for(const file of ['REPORT.md','summary.json','run-manifest.json','structured.jsonl','orderedRaw.jsonl'])add('results/'+run+'/'+file);
for(const p of ['results/upload-preview-2026-10-02T21-12-15-434Z.json','results/upload-2026-10-02T21-12-35-373Z/receipts.json',
 'results/dataset-read-2026-10-02T21-14-30-090Z.json','results/model-interface-2026-10-02T21-14-12-831Z.json',
 'results/model-text-interface-2026-10-02T21-16-16-920Z.json'])add(p);
for(const run of fs.readdirSync(path.join(root,'results')).filter(p=>/^model-(raw|context)-\d/.test(p))){
 const base='results/'+run;
 if(fs.existsSync(path.join(root,base,'completion.json'))){
  for(const file of ['run-manifest.json','completion.json','plan-provider-receipt.json','predictions.jsonl'])add(base+'/'+file);
  walk(base+'/answers');
  for(const n of fs.readdirSync(path.join(root,base,'inputs')))add(base+'/inputs/'+n,base+'/evidence/'+n);
  if(fs.existsSync(path.join(root,base,'context-setup-receipt.json')))add(base+'/context-setup-receipt.json');
  if(fs.existsSync(path.join(root,base,'context')))walk(base+'/context');
 }
}
for(const file of ['REPORT.md','summary.json','run-manifest.json','structured.jsonl','orderedRaw.jsonl','lexical.jsonl','retrieval-failures.json'])
 add('results/context-2026-10-02T23-55-32-803Z/'+file);
for(const run of checkpoints.filter(p=>/^context-check-\d/.test(p)&&fs.statSync(path.join(root,'results',p)).isDirectory()))
 for(const file of ['failure.json','answer.json','tool-receipts.json'])
  if(fs.existsSync(path.join(root,'results',run,file)))add('results/'+run+'/'+file);
const currentReadiness=checkpoints.filter(p=>/^readiness-\d.*\.json$/.test(p)).sort().at(-1);if(currentReadiness)add('results/'+currentReadiness);

for(const file of ['inputs-manifest.json','preparation-manifest.json','context-setup-receipt.json'])add('work/weaker-inputs-2026-10-03T00-21-25-484Z/'+file,'weaker-preparation/'+file);
for(const folder of ['raw','context','evidence/raw','evidence/context','context-receipts'])
 for(const file of fs.readdirSync(path.join(root,'work/weaker-inputs-2026-10-03T00-21-25-484Z',folder)))add('work/weaker-inputs-2026-10-03T00-21-25-484Z/'+folder+'/'+file,'weaker-preparation/'+folder+'/'+file);
add('work/weaker-system-candidate-2026-10-03T00-27-28-065Z.txt','weaker-preparation/system-candidate.txt');

const manifest=[];
for(const [dest,source]of files){
 const bytes=fs.readFileSync(path.join(root,source));
 const output=path.join(root,candidate,dest);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,bytes,{flag:'wx'});
 manifest.push({path:dest,bytes:bytes.length,sha256:sha(bytes)});
}
const relativeManifest='PUBLIC-FILE-MANIFEST-'+version+'.json';
const data={status:'partial',files:manifest,candidate,exclusions:['original inputs','local labels','private scoring outcomes','secrets','node_modules','scratch','unapproved private account data','two machine-specific hosting helpers'],
 note:'Local review snapshot. Nothing pushed or published. Includes owner setup notes and a review draft; exclude those from a final public repository if unnecessary.'};
fresh(relativeManifest,data);fresh(candidate+'/PUBLIC-FILE-MANIFEST.json',data);
fresh('work/review-export-'+version+'.json',{candidate,manifest:relativeManifest,files:manifest.length});
console.log('REVIEW SNAPSHOT PREPARED: '+manifest.length+' files; '+candidate+'; '+relativeManifest);
