import {flatten,validateRecord} from './records.mjs';
import {assertPublic} from './files.mjs';
export function modelEvidence(doc,arm,config){
 validateRecord(doc);assertPublic(doc);
 const common={_id:doc._id,recordId:doc.recordId,question:doc.question,sourceUrl:doc.sourceUrl,
  documentUrl:'https://'+config.projectId+'.api.sanity.io/v'+config.apiVersion+'/data/doc/'+config.dataset+'/'+doc._id,
  sourceDigest:doc.sourceDigest,lineCount:doc.lineCount};
 const data=arm==='raw'?{...common,log:flatten(doc).map(l=>String(l.number)+': '+l.text).join('\n')}:{...common,steps:doc.steps};
 assertPublic(data);return data;
}
export function modelPrompt(evidence){
 return 'Assess this record. The evidence below includes the complete supplied log.\n'+JSON.stringify(evidence);
}
export function modelPrediction(result,recordId){
 let answer;
 try{answer=JSON.parse(result.messages.at(-1)??'null');}catch{}
 if(result.status!=='completed'||result.calls.length!==0||result.errors.length||!answer||answer.recordId!==recordId)
  return {recordId,status:null,receipt:null,error:'invalid model response'};
 return answer;
}
