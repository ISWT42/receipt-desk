export function parseReply(text) {
 let source=text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
 try { const x=JSON.parse(source);return {status:x.status,claims:Array.isArray(x.claims)?x.claims:[]};}
 catch{return {status:null,claims:[]};}
}
export function conflicts(answer,replies) {
 return replies.map(r=>{
   const parsed=parseReply(r.text);
   const assertsDone=parsed.status==='done';
   return {runId:r.runId,arm:r.arm,model:r.model,claimedStatus:parsed.status,
      recordStatus:answer.status,conflict:assertsDone&&answer.status!=='done',replyText:r.text};
 }).filter(r=>r.conflict);
}
