import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const root = fileURLToPath(new URL('../../', import.meta.url));
export const sha = b => createHash('sha256').update(b).digest('hex');
export const readJSON = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
export function fresh(p, data) {
  const dest = path.join(root,p);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  const text = typeof data === 'string' ? data : JSON.stringify(data,null,2)+'\n';
  if(fs.existsSync(dest)) {
    if(fs.readFileSync(dest,'utf8')===text) return;
    throw new Error('Refusing to replace existing file: '+p);
  }
  fs.writeFileSync(dest,text,{flag:'wx'});
}
export function stamp() { return new Date().toISOString().replace(/[:.]/g,'-'); }
export const forbidden = new Set(['truth','kind','trap','oracle','tag','block_start','fail_style','slot','report_form']);
export function assertPublic(value) {
  if(Array.isArray(value)) { value.forEach(assertPublic); return; }
  if(value && typeof value==='object') for(const [name,v] of Object.entries(value)) {
    if(forbidden.has(name)) throw new Error('Label field in public content: '+name);
    assertPublic(v);
  }
}
export function verifyInputs() {
  const rows=fs.readFileSync(path.join(root,'inputs.sha256'),'utf8').trim().split(/\r?\n/);
  return rows.map(row=>{
    const [expected,name]=row.split(' *');
    if(!/^[a-zA-Z0-9_.-]+$/.test(name)) throw new Error('Invalid input path');
    const actual=sha(fs.readFileSync(path.join(root,'inputs',name)));
    if(actual!==expected) throw new Error('Input digest mismatch: '+name);
    return {file:name,sha256:actual};
  });
}
