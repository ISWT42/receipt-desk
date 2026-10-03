export function assessWeakPredictions(gemini,nano){
 const totals=s=>s.falseDoneFailed+s.falseDoneNotShown;
 const models=[{model:'google/gemini-3.7-flash',...gemini},{model:'openai/gpt-5.4-nano',...nano}];
 const qualifying=models.filter(m=>totals(m.raw)>=2);
 return [
 {id:'P1',hit:gemini.raw.falseDoneFailed>=2,criterion:'Gemini raw: at least 2 false done on failed checks',observed:gemini.raw.falseDoneFailed},
 {id:'P2',hit:nano.raw.falseDoneNotShown>=2,criterion:'Nano raw: at least 2 false done on missing checks',observed:nano.raw.falseDoneNotShown},
 {id:'P3',hit:qualifying.every(m=>totals(m.context)<=totals(m.raw)/2),criterion:'Every model with at least 2 raw false done has no more than half through Context',qualifyingModels:qualifying.map(m=>({model:m.model,raw:totals(m.raw),context:totals(m.context)})),vacuous:qualifying.length===0},
 {id:'P4',hit:models.every(m=>m.context.correctTotal>=m.raw.correctTotal),criterion:'For each model, Context correct status >= raw',models:models.map(m=>({model:m.model,raw:m.raw.correctTotal,context:m.context.correctTotal}))},
 {id:'P5',hit:models.every(m=>m.context.receiptScore>=m.raw.receiptScore),criterion:'For each model, Context receipt score >= raw',models:models.map(m=>({model:m.model,raw:m.raw.receiptScore,context:m.context.receiptScore}))}
 ].map(p=>({...p,result:p.hit?'hit':'miss'}));
}
