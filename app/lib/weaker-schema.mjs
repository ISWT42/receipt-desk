export function schemaMatches(value,schema){
 if(schema.enum&&!schema.enum.includes(value))return false;
 if(schema.type==='object'){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const fields=schema.properties??{};
  if((schema.required??[]).some(k=>!Object.hasOwn(value,k)))return false;
  if(schema.additionalProperties===false&&Object.keys(value).some(k=>!Object.hasOwn(fields,k)))return false;
  return Object.entries(value).every(([k,v])=>!Object.hasOwn(fields,k)||schemaMatches(v,fields[k]));
 }
 if(schema.type==='integer')return typeof value==='number'&&Number.isInteger(value);
 if(schema.type==='string')return typeof value==='string';
 if(schema.type==='boolean')return typeof value==='boolean';
 return false;
}
