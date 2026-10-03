export const PRICES=Object.freeze({'google/gemini-3.7-flash':{input:0.75,output:3.75},'openai/gpt-5.4-nano':{input:0.20,output:1.25}});
export const CAP_NANO_USD=2_000_000_000;
export const OUTPUT_CAP=4000;
export function reserveCall(model,system,prompt,spentNanoUsd){
 const price=PRICES[model];if(!price)throw new Error('UNAPPROVED_MODEL');
 if(!Number.isSafeInteger(spentNanoUsd)||spentNanoUsd<0)throw new Error('INVALID_SPEND');
 // One token per UTF-8 byte is a conservative text bound; 4096 more cover message framing.
 const inputTokenUpperBound=Buffer.byteLength(system,'utf8')+Buffer.byteLength(prompt,'utf8')+4096;
 const worstNanoUsd=Math.ceil(inputTokenUpperBound*price.input*1000)+Math.ceil(OUTPUT_CAP*price.output*1000);
 return {inputTokenUpperBound,outputTokenCap:OUTPUT_CAP,pricesUsdPerMillion:price,worstNanoUsd,worstCaseUsd:worstNanoUsd/1e9,spentUsd:spentNanoUsd/1e9,permitted:spentNanoUsd<CAP_NANO_USD&&spentNanoUsd+worstNanoUsd<=CAP_NANO_USD};
}
export function costNanoUsd(costUsd){if(typeof costUsd!=='number'||!Number.isFinite(costUsd)||costUsd<0)throw new Error('BROKER_COST_UNKNOWN');return Math.ceil(costUsd*1e9);}
export function brokerCost(value){
 if(value&&typeof value==='object'&&typeof value.costUsd==='number')return value.costUsd;
 if(value&&typeof value==='object')for(const key of ['receipt','metrics','usage','result','billing']){
  if(value[key]&&typeof value[key].costUsd==='number')return value[key].costUsd;
 }
 throw new Error('BROKER_COST_UNKNOWN');
}
export function brokerReply(value){
 if(typeof value==='string')return value;
 if(!value||typeof value!=='object')return null;
 for(const key of ['text','reply','output','responseText','content','answer','response']){
  if(typeof value[key]==='string')return value[key];
  if(value[key]&&typeof value[key]==='object'){const text=brokerReply(value[key]);if(text!==null)return text;}
 }
 const choice=value.choices?.[0]?.message?.content;if(typeof choice==='string')return choice;
 if(value.result)return brokerReply(value.result);
 if(typeof value.recordId==='string'&&value.receipt)return JSON.stringify(value);
 return null;
}
export function redact(value){return String(value).replace(/file:[/][/][/][A-Z]:[/]Users[/][^\r\n"'<>]+/gi,'[local path]').replace(/sk-(?:or-v1-)?[A-Za-z0-9_-]{12,}/g,'[secret]').replace(/Bearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,'Bearer [secret]').replace(/[A-Z]:\\Users\\[^\r\n"'<>]+/gi,'[local path]');}
export function creditOrKeyLimit(text){return /insufficient.?credits?|credit.?limit|credits?.{0,40}(?:exhausted|gone|depleted)|key.{0,40}(?:limit|exhausted)|(?:limit|exhausted).{0,40}key|payment required|\b402\b/i.test(text);}
