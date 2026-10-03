import path from 'node:path';
import {spawn} from 'node:child_process';
import {root,readJSON,fresh,stamp,verifyInputs} from '../lib/files.mjs';
import {SafeError} from '../lib/context.mjs';
const help=process.argv.includes('--help');
if(!help && process.env.RECEIPT_DESK_ALLOW_SCHEMA!=='yes')throw new SafeError('SCHEMA_DEPLOY_APPROVAL_REQUIRED');
const c=readJSON('sanity.public.json');
if(c.projectId!=='ixoe9uvf'||c.dataset!=='production')throw new SafeError('SCHEMA_TARGET_MISMATCH');
if(!help)verifyInputs();
const env={...process.env,DO_NOT_TRACK:'1',NO_UPDATE_NOTIFIER:'1',CI:'true',
 XDG_CONFIG_HOME:path.join(root,'work','sanity-cli'),SANITY_AUTH_TOKEN:process.env.SANITY_SCHEMA_TOKEN??process.env.SANITY_WRITE_TOKEN??''};
delete env.DEBUG;
if(!help&&!env.SANITY_AUTH_TOKEN)throw new SafeError('PROJECT_WRITE_TOKEN_MISSING');
const child=spawn(process.execPath,[path.join(root,'node_modules','@sanity','cli','bin','sanity'),'schema','deploy',...(help?['--help']:[])],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='';
function safe(chunk){let s=String(chunk);for(const v of [env.SANITY_AUTH_TOKEN,process.env.SANITY_CONTEXT_TOKEN])if(v)s=s.split(v).join('[secret]');return s;}
for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{const s=safe(chunk);output+=s;process.stdout.write(s);});
const code=await new Promise((resolve,reject)=>{child.on('error',()=>reject(new SafeError('SCHEMA_CLI_START_FAILED')));child.on('close',resolve);});
if(!help)fresh('results/schema-'+stamp()+'.json',{projectId:c.projectId,dataset:c.dataset,exitCode:code,output,checkedAt:new Date().toISOString(),note:'CLI receipt; validate live Context separately.'});
process.exitCode=code??1;
