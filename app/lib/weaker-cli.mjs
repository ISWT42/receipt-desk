export function parseCliReply(text){
 const trimmed=String(text).trim();
 const framed=trimmed.match(/^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i);
 const json=framed?framed[1]:trimmed;
 try{const value=JSON.parse(json);return value&&typeof value==='object'&&!Array.isArray(value)?value:null;}catch{return null;}
}
