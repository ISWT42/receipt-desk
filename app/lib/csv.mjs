export function parseCSV(text) {
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&text[i+1]==='\n')i++;
   row.push(field);if(row.some(v=>v!==''))rows.push(row);row=[];field='';
  }else field+=c;
 }
 if(quoted)throw new Error('Unclosed CSV quote');
 if(field.length||row.length){row.push(field);rows.push(row);}
 const header=rows.shift()??[];
 return rows.map(values=>{if(values.length!==header.length)throw new Error('CSV width mismatch');
 return Object.fromEntries(header.map((h,i)=>[h,values[i]]));});
}
