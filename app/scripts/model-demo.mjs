import fs from 'node:fs';
import path from 'node:path';
import {root,readJSON,fresh} from '../lib/files.mjs';
const [rawRun,contextRun,pairRun]=process.argv.slice(2);
function load(run,arm){
 if(!run)return [];
 if(!new RegExp('^results/model-'+arm+'-[0-9TZ-]+$').test(run))throw new Error('Invalid model run path');
 const c=readJSON(run+'/completion.json');if(c.status!=='done'||c.records!==48||c.arm!==arm)throw new Error('A complete 48-record arm is required');
 return fs.readFileSync(path.join(root,run,'predictions.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
}
const raw=load(rawRun,'raw'),context=load(contextRun,'context');if(raw.length!==48)throw new Error('Raw arm required');
const records=readJSON('work/content/public-records.json'),claims=readJSON('work/content/public-claims.json');
const summary=pairRun?readJSON(pairRun+'/summary.json'):null;
const evaluation=pairRun?Object.fromEntries(['rawModel','contextModel'].map(name=>[name,readJSON(pairRun+'/'+name+'-case-scores.json')])):null;
const data={records,claims,systems:{rawModel:raw,contextModel:context},summary,evaluation,initialRecord:records[0].recordId};
const json=JSON.stringify(data).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026');
const label=context.length?'Recorded answers · both model arms':'Recorded answers · raw arm complete';
const html=fs.readFileSync(path.join(root,'app/ui/model.template.html'),'utf8').replace('__DESK_DATA__',json).replace('__MODEL_PROVIDER__',label);
const file='public/model-demo-'+rawRun.split('model-raw-')[1]+(context.length?'-paired':'-raw')+'.html';
fresh(file,html);
console.log('MODEL REVIEW VIEWER BUILT: '+raw.length+' raw answers; '+context.length+' Context answers; '+(summary?'paired scores':'unscored')+'; '+file);
