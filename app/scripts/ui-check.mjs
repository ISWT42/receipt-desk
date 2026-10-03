import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {root,fresh,stamp} from '../lib/files.mjs';
const dir='results/ui-'+stamp();
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-background-networking','--disable-component-update','--disable-sync','--disable-default-apps','--no-first-run']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:/,route=>route.abort());
 await page.goto(pathToFileURL(path.join(root,'public/demo.html')).toString());
 await page.waitForFunction(()=>document.getElementById('status').textContent.length>0);
 if(await page.locator('.record-button').count()!==48)throw new Error('Expected 48 record choices');
 if(!['done','failed','not shown'].includes(await page.locator('#status').textContent()))throw new Error('Invalid displayed status');
 await page.screenshot({path:path.join(root,dir.replace('results/','work/')+'-desktop.png'),fullPage:true}).catch(async()=>{const fs=await import('node:fs');fs.mkdirSync(path.join(root,'work'),{recursive:true});await page.screenshot({path:path.join(root,dir.replace('results/','work/')+'-desktop.png'),fullPage:true});});
 await page.locator('#system').selectOption('keyword');
 const baseline=await page.locator('#accuracy').textContent();
 if(baseline!=='17/48')throw new Error('Baseline comparison did not update');
 await page.locator('#system').selectOption('orderedRaw');
 if(await page.locator('#accuracy').textContent()!=='48/48')throw new Error('Raw control did not update');
 await page.locator('#system').selectOption('structured');
 await page.locator('#search').fill('VAT total');
 if(await page.locator('.record-button').count()!==3)throw new Error('Question filter failed');
 await page.locator('.record-button').first().click();
 await page.locator('#search').fill('');
 await page.setViewportSize({width:390,height:844});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile horizontal overflow');
 await page.screenshot({path:path.join(root,dir.replace('results/','work/')+'-mobile.png'),fullPage:true});
 if(errors.length)throw new Error('Browser script errors');
 fresh(dir+'/receipt.json',{status:'done',headless:true,records:48,filter:'passed',comparisons:'passed',mobileOverflow:false,
 desktopScreenshot:dir.replace('results/','work/')+'-desktop.png',mobileScreenshot:dir.replace('results/','work/')+'-mobile.png'});
 console.log('UI CHECK PASSED: 48 record choices; search, receipts, comparisons, and mobile layout; no external requests allowed.');
 console.log('SCREENSHOTS: '+dir.replace('results/','work/')+'-desktop.png and -mobile.png');
}catch(e){fresh(dir+'/receipt.json',{status:'failed',error:e.message.slice(0,160)});console.log('UI CHECK FAILED: '+e.message.slice(0,160));process.exitCode=1;}
finally{await browser?.close();}
