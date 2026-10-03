import {flatten} from './records.mjs';
// Only the evaluation process imports this module or loads local labels.
export function score(records,labels,predictions) {
 const pred=new Map(predictions.map(p=>[p.recordId,p]));
 if(pred.size!==predictions.length)throw new Error('Duplicate predictions');
 const docs=new Map(records.map(d=>[d.recordId,d]));
 const classes=['done','failed','not shown'];
 const totals=Object.fromEntries(classes.map(c=>[c,0]));
 const correct=Object.fromEntries(classes.map(c=>[c,0]));
 const supported=Object.fromEntries(classes.map(c=>[c,0]));
 const confusion=Object.fromEntries(classes.map(c=>[c,Object.fromEntries([...classes,'invalid'].map(c=>[c,0]))]));
 let falseDoneFailed=0,falseDoneNotShown=0,invalid=0;
 const outcomes=[];
 for(const label of labels){
   const d=docs.get(label.recordId),p=pred.get(label.recordId);
   if(!d)throw new Error('Missing record for scorer');
   const observed=classes.includes(p?.status)?p.status:'invalid';
   totals[label.expected]++;confusion[label.expected][observed]++;
   const right=observed===label.expected;
   if(right)correct[label.expected]++;
   if(observed==='invalid')invalid++;
   if(observed==='done'&&label.expected==='failed')falseDoneFailed++;
   if(observed==='done'&&label.expected==='not shown')falseDoneNotShown++;
   const r=p?.receipt;
   const cited=flatten(d).find(l=>l.number===r?.line && l.text===r?.text);
   const inStep=d.steps.find(s=>[s.command,...s.output].filter(Boolean).some(l=>l.number===r?.line))?.order===r?.step;
   const source=r?.sourceId===d._id && r?.sourceUrl===d.sourceUrl;
   const coverage=r?.coverage?.complete===true && r?.coverage?.lineCount===d.lineCount;
   const decisive=label.expected==='not shown'?coverage:(label.oracleLines.includes(r?.line) && r?.line>=label.finalBlockStart && !cited?.text.startsWith('$ '));
   const hasReceipt=Boolean(right&&cited&&inStep&&source&&coverage&&decisive);
   if(hasReceipt)supported[label.expected]++;
   outcomes.push({recordId:label.recordId,correct:right,receiptSupported:hasReceipt});
 }
 if(pred.size!==labels.length)throw new Error('Prediction coverage does not equal local labels');
 const receiptScore=classes.reduce((s,c)=>s*(totals[c]?supported[c]/totals[c]:0),1);
 return {total:labels.length,classTotals:totals,correctByClass:correct,correctTotal:Object.values(correct).reduce((a,b)=>a+b,0),
  supportedByClass:supported,receiptScore,falseDoneFailed,falseDoneNotShown,invalid,confusion,outcomes};
}
