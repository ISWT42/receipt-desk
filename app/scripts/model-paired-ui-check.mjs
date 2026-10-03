import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {root,readJSON,fresh,stamp,assertPublic} from '../lib/files.mjs';
const [file,rawRun,contextRun,pairRun]=process.argv.slice(2);
if(!/^public\/model-demo-[0-9TZ-]+-paired\.html$/.test(file??''))throw Error('PAIRED_VIEWER_REQUIRED');
const records=readJSON('work/content/public-records.json'),summary=readJSON(pairRun+'/summary.json');
const systems=Object.fromEntries([['rawModel',rawRun],['contextModel',contextRun]].map(([name,run])=>[name,new Map(fs.readFileSync(path.join(root,run,'predictions.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse).map(row=>[row.recordId,row]))]));
const grades=Object.fromEntries(['rawModel','contextModel'].map(name=>[name,readJSON(pairRun+'/'+name+'-case-scores.json')]));
const id=stamp(),out='work/model-paired-ui-'+id;
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-background-networking','--disable-component-update','--no-first-run']});
const errors=[],requests=[];let result={status:'unknown',file,headless:true};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort();});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,file)).href);
 const embedded=JSON.parse(await page.locator('#desk-data').textContent());
 assertPublic(embedded);
 if(embedded.records.length!==48||embedded.systems.rawModel.length!==48||embedded.systems.contextModel.length!==48)throw Error('PAIRED_UI_COVERAGE');
 if(await page.locator('.record-button').count()!==48)throw Error('PAIRED_UI_RECORD_COUNT');
 for(const name of ['rawModel','contextModel']){
  await page.locator('#system').selectOption(name);
  const s=summary.systems[name];
  if(await page.locator('#accuracy').innerText()!==s.correctTotal+'/'+s.total)throw Error('PAIRED_UI_AGGREGATE');
  if(await page.locator('#false-done').innerText()!==String(s.falseDoneFailed+s.falseDoneNotShown))throw Error('PAIRED_UI_FALSE_DONE');
  for(const doc of records){
   await page.locator('.record-button').filter({hasText:doc.recordId}).click();
   const expected=systems[name].get(doc.recordId),g=grades[name].find(row=>row.recordId===doc.recordId);
   if(await page.locator('#status').innerText()!==(expected.status||'Awaiting run'))throw Error('PAIRED_UI_MODEL_STATUS');
   if(await page.locator('#receipt').innerText()!==(expected.receipt?.text||'No model receipt is available.'))throw Error('PAIRED_UI_MODEL_RECEIPT');
   const label='Status: '+(g.correct?'matched the local key':'miss')+' · Receipt: '+(g.receiptSupported?'credited':'not credited');
   if(await page.locator('#case-score').innerText()!==label)throw Error('PAIRED_UI_CASE_CREDIT');
   if(expected.receipt&&await page.locator('#receipt-link').getAttribute('href')!=='#'+doc.recordId+'-line-'+expected.receipt.line)throw Error('PAIRED_UI_RECEIPT_LINK');
  }
  for(const [filter,count]of [['status-miss',grades[name].filter(r=>!r.correct).length],['receipt-miss',grades[name].filter(r=>!r.receiptSupported).length],['supported',grades[name].filter(r=>r.correct&&r.receiptSupported).length]]){
   await page.locator('#result-filter').selectOption(filter);
   if(await page.locator('.record-button').count()!==count)throw Error('PAIRED_UI_FILTER');
  }
  await page.locator('#result-filter').selectOption('all');
 }
 await page.locator('#system').selectOption('contextModel');
 await page.locator('#search').fill('record-9a8e24576364');
 if(await page.locator('.record-button').count()!==1)throw Error('PAIRED_UI_SEARCH');
 await page.locator('.record-button').click();
 await page.locator('#receipt-link').click();
 if(!page.url().includes('record-9a8e24576364-line-'))throw Error('PAIRED_UI_ANCHOR_NAVIGATION');
 await page.locator('#search').fill('');
 await page.screenshot({path:path.join(root,out+'-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('PAIRED_UI_MOBILE_OVERFLOW');
 await page.screenshot({path:path.join(root,out+'-mobile.png'),fullPage:true});
 if(errors.length||requests.length)throw Error('PAIRED_UI_UNEXPECTED_REQUEST_OR_ERROR');
 result={status:'done',file,records:48,answersCompared:96,exactRetainedAnswers:true,caseCreditVerified:true,missFiltersVerified:true,sourceAnchorVerified:true,mobileOverflow:false,externalRequests:0,pageErrors:0,headless:true,screenshots:[out+'-desktop.png',out+'-mobile.png']};
 console.log('PAIRED MODEL VIEWER CHECK PASSED: 96 retained answers; exact receipts; case scores and miss filters; source links; desktop and mobile; no external requests or page errors.');
}catch(e){result={...result,status:'failed',error:e.message};console.log('PAIRED MODEL VIEWER CHECK FAILED: '+e.message);process.exitCode=1;}
finally{await browser.close();}
fresh('results/model-paired-ui-'+id+'.json',result);
