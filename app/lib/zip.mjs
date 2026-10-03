import {inflateRawSync} from 'node:zlib';
// Read public JSON members in memory. Do not extract or execute archive code.
export function zipMembers(bytes) {
  let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--) if(bytes.readUInt32LE(i)===0x06054b50){end=i;break;}
  if(end<0) throw new Error('Missing ZIP end record');
  const count=bytes.readUInt16LE(end+10),result=new Map();
  let at=bytes.readUInt32LE(end+16);
  for(let i=0;i<count;i++){
    if(bytes.readUInt32LE(at)!==0x02014b50) throw new Error('Bad ZIP directory');
    const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10);
    const packed=bytes.readUInt32LE(at+20),expanded=bytes.readUInt32LE(at+24);
    const nl=bytes.readUInt16LE(at+28),el=bytes.readUInt16LE(at+30),cl=bytes.readUInt16LE(at+32);
    const local=bytes.readUInt32LE(at+42),name=bytes.subarray(at+46,at+46+nl).toString('utf8');
    if(name.startsWith('/') || name.includes('\\') || name.split('/').includes('..') || flags&1 || expanded>20000000)
      throw new Error('Unsafe ZIP member');
    if(result.has(name)) throw new Error('Duplicate ZIP member');
    if(!/auth|token|key|secret|credential|confidential/i.test(name) && name.endsWith('.json')){
      if(bytes.readUInt32LE(local)!==0x04034b50) throw new Error('Bad ZIP local record');
      const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
      const data=bytes.subarray(start,start+packed);
      const raw=method===0?data:method===8?inflateRawSync(data):null;
      if(!raw || raw.length!==expanded) throw new Error('Bad ZIP member length');
      result.set(name,raw);
    }
    at+=46+nl+el+cl;
  }
  return result;
}
