import fs from 'node:fs';
import path from 'node:path';
import {root,fresh,sha} from '../lib/files.mjs';
const allowed=['package.json','package-lock.json','tsconfig.json','sanity.config.ts','sanity.cli.ts','sanity.public.json',
 '.gitignore','DESIGN.md','EVAL-PLAN.md','PREDICTIONS.md','SOURCE-NOTICE.md','REVIEW-NOTES.md','RULES-FINDINGS.md','AGENT-INSTRUCTIONS.md','NUMBERS.md'];
function walk(dir){const files=[];for(const d of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
 if(d.isSymbolicLink())throw new Error('Links are not allowed in the public export');
 const rel=dir+'/'+d.name;
 if(/(?:^|\/)(?:\.env(?:\.|$)|inputs|scoring|node_modules)|auth|token|key|secret|credential|confidential/i.test(rel))throw new Error('Sensitive path in public export');
 if(d.isDirectory())files.push(...walk(rel));else files.push(rel);
}return files;}
allowed.push(...walk('app'),...walk('public/content'),'public/results/summary.json','public/results/structured.jsonl','public/results/orderedRaw.jsonl','public/results/lexical.jsonl','public/demo.html');
for(const run of ['local-2026-10-02T19-36-14-132Z','local-2026-10-02T19-36-52-112Z'])for(const file of ['REPORT.md','summary.json','run-manifest.json','structured.jsonl','orderedRaw.jsonl'])allowed.push('results/'+run+'/'+file);
const manifest=[];
for(const rel of allowed){
 const bytes=fs.readFileSync(path.join(root,rel));
 const dest='work/repository-candidate/'+rel;
 const actual=path.join(root,dest);
 fs.mkdirSync(path.dirname(actual),{recursive:true});
 if(fs.existsSync(actual)&&!fs.readFileSync(actual).equals(bytes))throw new Error('Export already exists with different bytes');
 if(!fs.existsSync(actual))fs.writeFileSync(actual,bytes,{flag:'wx'});
 manifest.push({path:rel,bytes:bytes.length,sha256:sha(bytes)});
}
fresh('work/repository-candidate/README.md',fs.readFileSync(path.join(root,'REPOSITORY-README.md'),'utf8'));
manifest.push({path:'README.md',bytes:fs.statSync(path.join(root,'work/repository-candidate/README.md')).size,
 sha256:sha(fs.readFileSync(path.join(root,'work/repository-candidate/README.md')))});
fresh('PUBLIC-FILE-MANIFEST.json',{status:'done',files:manifest,exclusions:['original inputs','local labels','private scorer outcomes','secrets','node_modules','scratch','owner setup instructions'],
 note:'Prepared for review only. Nothing was pushed or published.'});
console.log('PUBLIC EXPORT PREPARED: '+manifest.length+' files; inputs, labels, secrets, and private scoring excluded.');
