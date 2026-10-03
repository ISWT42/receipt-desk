import {defineType,defineField} from 'sanity'
const line=defineType({name:'receiptLine',title:'Source line',type:'object',fields:[
 defineField({name:'number',type:'number',validation:r=>r.required().integer().min(1)}),
 defineField({name:'text',type:'text',validation:r=>r.required()})
]})
const step=defineType({name:'receiptStep',title:'Command step',type:'object',fields:[
 defineField({name:'order',type:'number',validation:r=>r.required().integer().min(1)}),
 defineField({name:'command',type:'receiptLine'}),
 defineField({name:'output',type:'array',of:[{type:'receiptLine'}]})
]})
const record=defineType({name:'receiptRecord',title:'Engineering record',type:'document',fields:[
 defineField({name:'recordId',type:'string',validation:r=>r.required().regex(/^record-[a-f0-9]{12}$/)}),
 defineField({name:'question',type:'text',validation:r=>r.required()}),
 defineField({name:'sourceTitle',type:'string'}),defineField({name:'sourceUrl',type:'url'}),
 defineField({name:'license',type:'string'}),defineField({name:'sourceDigest',type:'string'}),
 defineField({name:'lineCount',type:'number',validation:r=>r.required().integer().min(1)}),
 defineField({name:'steps',type:'array',of:[{type:'receiptStep'}],validation:r=>r.required()})
],preview:{select:{title:'recordId',subtitle:'question'}}})
const reply=defineType({name:'modelReply',title:'Historical model reply',type:'object',fields:[
 defineField({name:'runId',type:'string'}),defineField({name:'model',type:'string'}),
 defineField({name:'arm',type:'string'}),defineField({name:'recordedAt',type:'datetime'}),
 defineField({name:'text',type:'text'})
]})
const claims=defineType({name:'claimBundle',title:'Working agent claims',type:'document',fields:[
 defineField({name:'recordId',type:'string'}),
 defineField({name:'record',type:'reference',to:[{type:'receiptRecord'}]}),
 defineField({name:'sourceTitle',type:'string'}),defineField({name:'sourceUrl',type:'url'}),
 defineField({name:'license',type:'string'}),
 defineField({name:'replies',type:'array',of:[{type:'modelReply'}]})
],preview:{select:{title:'recordId'},prepare:({title})=>({title,subtitle:'Historical claims, not verification'})}})
export const schemaTypes=[line,step,record,reply,claims]
