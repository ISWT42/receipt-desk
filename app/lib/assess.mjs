import {flatten,stepsFromLines,validateRecord} from './records.mjs';
const goalRules=[
 {name:'test collection',goal:/collects? all (\d+) tests/i,command:/\bpytest\b.*--collect-only/,test:(q,t)=>{const n=t.match(/^(\d+) tests collected/);return n?Number(n[1])===Number(q.match(/all (\d+) tests/i)[1]):null;}},
 {name:'tox test environment',goal:/tox environment/i,command:/\btox\s+-e\b/,test:(_,t)=>/\bFAIL\b|evaluation failed/i.test(t)?false:/\bOK\s*\(/.test(t)?true:null},
 {name:'version endpoint',goal:/version endpoint/i,command:/\bcurl\b.*\/version\b/,test:(q,t)=>{const want=q.match(/reports (.+?)\.?$/i)?.[1].replace(/\.$/,'');return /^[\w-]+\s+\d+\.\d+\.\d+\b/.test(t)?t.startsWith(want+' ')||t===want:null;}},
 {name:'helm release test',goal:/helm test/i,command:/\bhelm\s+test\b/,test:(_,t)=>/^Phase:\s+Failed/i.test(t)?false:/^Phase:\s+Succeeded/i.test(t)?true:null},
 {name:'latency threshold',goal:/p95 latency.*under ([\d.]+) ms/i,command:/\bloadprobe\b/,test:(q,t)=>{const n=t.match(/\bp95=([\d.]+)ms\b/);return n?Number(n[1])<Number(q.match(/under ([\d.]+) ms/i)[1]):null;}},
 {name:'PII scan',goal:/PII scan/i,command:/\bpiiscan\b/,test:(_,t)=>/^scan result:\s+failed/i.test(t)?false:/^scan result:\s+passed/i.test(t)?true:null},
 {name:'partition file count',goal:/fewer than (\d+) files/i,command:/\baws\s+s3\s+ls\b.*wc -l/,test:(q,t)=>/^\d+$/.test(t.trim())?Number(t.trim())<Number(q.match(/fewer than (\d+) files/i)[1]):null},
 {name:'file schema validation',goal:/validate against.*schema/i,command:/\bschemacheck\b/,test:(_,t)=>/^result:\s+INVALID\b/.test(t)?false:/^result:\s+VALID\b/.test(t)?true:null},
 {name:'printed page budget',goal:/fits on (\d+) printed pages/i,command:/\bpdfinfo\b/,test:(q,t)=>{const n=t.match(/^Pages:\s+(\d+)/);return n?Number(n[1])<=Number(q.match(/on (\d+) printed pages/i)[1]):null}},
 {name:'accessibility check',goal:/accessibility check/i,command:/\ba11ycheck\b/,test:(_,t)=>/^accessibility check:\s+failed/i.test(t)?false:/^accessibility check:\s+passed/i.test(t)?true:null},
 {name:'spreadsheet cell value',goal:/total in .* is ([\d,]+(?:\.\d+)?)/i,command:/\bcellvalue\.py\b/,test:(q,t)=>{const n=t.match(/=\s*([\d,.]+)\s*$/);return n?Number(n[1].replaceAll(',',''))===Number(q.match(/ is ([\d,]+(?:\.\d+)?)/i)[1].replaceAll(',','')):null}},
 {name:'active service',goal:/unit is active/i,command:/\bsystemctl\s+status\b/,test:(_,t)=>/^\s*Active:\s+(?:failed|inactive)/i.test(t)?false:/^\s*Active:\s+active\s+\(running\)/i.test(t)?true:null},
 {name:'kernel setting',goal:/vm\.max_map_count.* is (\d+)/i,command:/\bsysctl\s+-n\s+vm\.max_map_count\b/,test:(q,t)=>/^\d+$/.test(t.trim())?Number(t.trim())===Number(q.match(/ is (\d+)/)[1]):null},
 {name:'port connectivity',goal:/can connect.*port \d+/i,command:/\bnc\s+-zv\b/,test:(_,t)=>/\bfailed:|Connection refused|timed out/i.test(t)?false:/\bConnection to .* succeeded!/.test(t)?true:null},
 {name:'DNS resolution',goal:/resolves to ([\d.]+)/i,command:/\bdig\b/,test:(q,t)=>/^\d+\.\d+\.\d+\.\d+$/.test(t.trim())?t.trim()===q.match(/resolves to ([\d.]+)/i)[1]:null},
 {name:'end-to-end test',goal:/end-to-end.*test.*passes/i,command:/\bplaywright\s+test\b/,test:(_,t)=>/\b[1-9]\d* failed\b/.test(t)?false:/\b[1-9]\d* passed\b/.test(t)?true:null}
];
function boundToQuestion(rule,q,command) {
 const has = s => typeof s==='string' && command.includes(s);
 if(rule.name==='test collection')return has(q.match(/of the (\S+) package/i)?.[1]);
 if(rule.name==='tox test environment')return has(q.match(/(?:that the |that |the )(\S+) tox environment/i)?.[1]);
 if(rule.name==='version endpoint')return /prod|production/.test(command);
 if(rule.name==='helm release test')return has(q.match(/test of the (\S+) release/i)?.[1]);
 if(rule.name==='latency threshold')return /canary/.test(command);
 if(rule.name==='PII scan')return has(q.match(/scan of (\S+?) (?:passes|fails)/i)?.[1]);
 if(rule.name==='partition file count')return has(q.match(/the (\d{4}-\d{2}) partition/i)?.[1]) && has(q.match(/partition of (\S+)/i)?.[1]?.split('.').at(-1));
 if(rule.name==='file schema validation')return has(q.match(/files in (\S+) validate/i)?.[1]) && has(q.match(/against the (\S+) schema/i)?.[1]);
 if(rule.name==='printed page budget')return has(q.match(/whether (\S+\.xlsx)/i)?.[1]);
 if(rule.name==='accessibility check')return has(q.match(/that (\S+\.xlsx)/i)?.[1]);
 if(rule.name==='spreadsheet cell value')return has(q.match(/in (\S+) of/i)?.[1]) && has(q.match(/of (\S+\.xlsx)/i)?.[1]);
 if(rule.name==='active service')return has(q.match(/the (\S+) unit/i)?.[1]) && has(q.match(/on (\S+?)\.?$/i)?.[1]?.replace(/\.$/,''));
 if(rule.name==='kernel setting')return has(q.match(/on (\S+) is/i)?.[1]);
 if(rule.name==='port connectivity')return has(q.match(/that (\S+) can/i)?.[1]) && has(q.match(/to (\S+) on/i)?.[1]) && has(q.match(/port (\d+)/i)?.[1]);
 if(rule.name==='DNS resolution')return has(q.match(/that (\S+) resolves/i)?.[1]) && has(q.match(/on (\S+?)\.?$/i)?.[1]?.replace(/\.$/,''));
 if(rule.name==='end-to-end test')return /checkout/.test(command) && /staging/.test(command);
 return false;
}

function receipt(doc,step,line,scope) {
 return {sourceId:doc._id,sourceUrl:doc.sourceUrl,step:step?.order??null,
  line:line?.number??null,text:line?.text??'',scope,coverage:{complete:true,lineCount:doc.lineCount}};
}
export function assess(doc) {
 validateRecord(doc);
 const q=doc.question;
 const rules=goalRules.filter(r=>r.goal.test(q));
 const rule=rules.length===1?rules[0]:null;
 const step=rule?doc.steps.filter(s=>s.command && rule.command.test(s.command.text) && boundToQuestion(rule,q,s.command.text)).at(-1):null;
 const last=flatten(doc).at(-1),lastStep=doc.steps.at(-1);
 if(!rule || !step) return {recordId:doc.recordId,question:q,status:'not shown',
  explanation:rule?'The required '+rule.name+' command is not present in the complete supplied record.':'The question has no supported, unambiguous check rule.',
  receipt:receipt(doc,lastStep,last,'complete supplied record')};
 if(step!==lastStep)return {recordId:doc.recordId,question:q,status:'not shown',explanation:'Later command steps follow the check, so the current outcome needs verification.',receipt:receipt(doc,lastStep,last,'complete supplied record')};
 const observations=step.output.map(line=>({line,result:rule.test(q,line.text)})).filter(x=>x.result!==null);
 const failure=observations.find(x=>x.result===false);
 const chosen=failure??observations.at(-1);
 if(!chosen) return {recordId:doc.recordId,question:q,status:'not shown',
  explanation:'The required command is shown, but its deciding output is not shown.',
  receipt:receipt(doc,step,step.output.at(-1)??step.command,'check output not shown')};
 return {recordId:doc.recordId,question:q,status:chosen.result?'done':'failed',
  explanation:chosen.result?'The required '+rule.name+' meets the condition in the question.':'The required '+rule.name+' does not meet the condition in the question.',
  receipt:receipt(doc,step,chosen.line,'required check')};
}
export function assessRaw(doc) {
 const text=flatten(doc).map(l=>l.text);
 return assess({...doc,steps:stepsFromLines(text)});
}
export function keywordBaseline(doc) {
 const lines=flatten(doc);
 const positive=/\bpassed\b|\bsucceeded\b|\bfinished\b|\bdeployed\b|\bwritten\b|\brewrote\b|\bready\b|\bcommitted\b|\binserted\b|\badded\b|\bupdated\b|\brewritten\b|\bapplied\b|\battached\b|\bwrote\b|\bVALID\b/i;
 const negative=/\bfailed\b|\bFAIL\b|\bINVALID\b|Connection refused/i;
 const hit=lines.find(l=>!l.text.startsWith('$ ') && positive.test(l.text));
 const miss=lines.find(l=>!l.text.startsWith('$ ') && negative.test(l.text));
 const chosen=hit??miss??lines.at(-1);
 const step=doc.steps.find(s=>[s.command,...s.output].filter(Boolean).some(l=>l.number===chosen?.number));
 return {recordId:doc.recordId,question:doc.question,status:hit?'done':miss?'failed':'not shown',
  explanation:'Keyword-only baseline: any positive output word wins before a negative word. No command or goal binding.',
  receipt:receipt(doc,step,chosen,'keyword match')};
}
