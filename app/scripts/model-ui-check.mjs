import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {root,readJSON,fresh,stamp} from '../lib/files.mjs';
const file=process.argv[2],rawRun=process.argv[3];
if(!/^public\/model-demo-[0-9TZ-]+-raw\.html$/.test(file??''))throw new Error('Model review file required');
const records=readJSON('work/content/public-records.json');
const predictions=fs.readFileSync(path.join(root,rawRun,'predictions.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const first=predictions.find(p=>p.recordId===records[0].recordId),dir='work/model-ui-'+stamp();
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-background-networking','--disable-component-update','--no-first-run']});
let result={status:'unknown',headless:true,modelScoresRead:false};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 await page.route(/^https?:/,route=>route.abort());page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,file)).href);
 if(await page.locator('.record-button').count()!==48)throw new Error('UI record count');
 if(await page.locator('#status').innerText()!==first.status)throw new Error('UI model status mismatch');
 if(await page.locator('#receipt').innerText()!==first.receipt.text)throw new Error('UI copied answer mismatch');
 if(await page.locator('#accuracy').innerText()!=='Unscored')throw new Error('UI published an interim score');
 await page.locator('#system').selectOption('contextModel');
 if(await page.locator('#status').innerText()!=='Awaiting run'||await page.locator('#receipt-link').isVisible())throw new Error('UI invented a missing arm');
 await page.locator('#system').selectOption('rawModel');
 await page.screenshot({path:path.join(root,dir+'-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('UI mobile overflow');
 await page.screenshot({path:path.join(root,dir+'-mobile.png'),fullPage:true});
 if(errors.length)throw new Error('UI page error');
 result={...result,status:'done',records:48,rawModelCopied:true,contextAwaitingRun:true,interimScoresPublished:false,mobileOverflow:false};
 console.log('MODEL VIEWER CHECK PASSED: 48 recorded answers; exact model text; Context awaiting run; unscored; no page errors or mobile overflow.');
}catch(e){result.status='failed';result.error=e.message;console.log('MODEL VIEWER CHECK FAILED: '+e.message);process.exitCode=1;}
finally{await browser.close();}
fresh(dir+'-receipt.json',result);
