// This module receives only the question and raw log lines. It never sees labels.
export function stepsFromLines(lines) {
  const steps=[];
  for(let i=0;i<lines.length;i++){
    const line={_type:'receiptLine',_key:'line'+(i+1),number:i+1,text:lines[i]};
    if(lines[i].startsWith('$ ')) {
      steps.push({_type:'receiptStep',_key:'step'+(steps.length+1),order:steps.length+1,command:line,output:[]});
    } else {
      if(!steps.length) steps.push({_type:'receiptStep',_key:'step1',order:1,command:null,output:[]});
      steps.at(-1).output.push(line);
    }
  }
  return steps;
}
export function flatten(doc) {
  return doc.steps.flatMap(s=>s.command?[s.command,...s.output]:s.output).sort((a,b)=>a.number-b.number);
}
export function validateRecord(doc) {
  if(!doc || !/^record-[a-f0-9]{12}$/.test(doc.recordId) || typeof doc.question!=='string' || !Array.isArray(doc.steps))
    throw new Error('Invalid record');
  const lines=flatten(doc);
  if(lines.length!==doc.lineCount || lines.some((l,i)=>l.number!==i+1 || typeof l.text!=='string'))
    throw new Error('Incomplete or inconsistent line coverage');
  const parsed=stepsFromLines(lines.map(l=>l.text));
  const normalise = steps => steps.map(s=>({order:s.order,command:s.command?{number:s.command.number,text:s.command.text}:null,output:s.output.map(l=>({number:l.number,text:l.text}))}));
  if(JSON.stringify(normalise(parsed))!==JSON.stringify(normalise(doc.steps))) throw new Error('Step boundaries differ from command markers');
  return doc;
}
