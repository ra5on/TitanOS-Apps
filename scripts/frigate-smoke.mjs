// Disposable CI data only: no cameras, host devices or existing NAS files.
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {request} from 'node:https';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const temp=mkdtempSync(join(tmpdir(),'frigate-catalog-'));
const project=`frigate-smoke-${randomBytes(6).toString('hex')}`;
const password=randomBytes(24).toString('hex');
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',timeout:600000,maxBuffer:16*1024*1024});
const compose=(...args)=>docker('compose','-p',project,'-f',join(temp,'compose.json'),...args);
const config=JSON.parse(docker('compose','-f','frigate/compose.yaml','config','--format','json'));
const service=config.services.frigate;
assert.deepEqual(service.cap_drop,['ALL']);
assert.ok(!service.privileged&&!service.devices&&!service.network_mode&&!service.user);
assert.ok(service.security_opt.includes('no-new-privileges:true'));
service.ports=[{target:8971,published:'0',host_ip:'127.0.0.1',protocol:'tcp'}];
for(const mount of service.volumes){
 if(mount.type!=='bind')continue;
 assert.ok(['/config','/media/frigate'].includes(mount.target));
 mount.source=join(temp,mount.target.replaceAll('/','_'));
 mkdirSync(mount.source,{recursive:true});
 if(mount.target==='/config')writeFileSync(join(mount.source,'config.yml'),'mqtt:\n  enabled: false\ncameras: {}\ndetect:\n  enabled: false\n');
}
writeFileSync(join(temp,'compose.json'),JSON.stringify({services:{frigate:service}}),{mode:0o600});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(check,label){
 const deadline=Date.now()+300000;let last;
 while(Date.now()<deadline){try{const result=await check();if(result)return result}catch(error){last=error}await pause(1500)}
 throw new Error(`Timed out: ${label}${last?` (${last.message})`:''}`);
}
let base;
function req(path,method='GET',body,cookie){
 return new Promise((resolve,reject)=>{
  const bytes=body?JSON.stringify(body):null;
  const req=request(base+path,{method,rejectUnauthorized:false,headers:{...(bytes?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(bytes)}:{}),...(cookie?{Cookie:cookie}:{})}},response=>{
   const parts=[];response.on('data',part=>parts.push(part));response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,body:Buffer.concat(parts).toString()}));
  });
  req.setTimeout(10000,()=>req.destroy(new Error('HTTPS timeout')));req.on('error',reject);req.end(bytes);
 });
}
async function ready(){
 base=`https://${compose('port','frigate','8971').trim()}`;
 await waitFor(async()=>(await req('/api/version')).status===200,'Frigate HTTPS API startup');
 assert.equal((await req('/login')).status,200);
}
function checkLogs(){
 const logs=compose('logs','--no-color','frigate');
 assert.ok(!/Operation not permitted|unable to start service log-prepare|setgid.*failed|setuid.*failed/.test(logs),'No startup permission errors');
}
async function login(user,password){
 const result=await req('/api/login','POST',{user,password});assert.equal(result.status,200);
 assert.ok(result.headers['set-cookie']?.length,'Authenticated session cookie');
 return result.headers['set-cookie'].map(value=>value.split(';',1)[0]).join('; ');
}
try{
 compose('pull');
 // Reproduce the original failure using the same image and actual s6 script.
 const broken=spawnSync('docker',['run','--rm','--cap-drop','ALL','--entrypoint','/bin/bash',service.image,'/etc/s6-overlay/s6-rc.d/log-prepare/run'],{encoding:'utf8',timeout:60000});
 assert.equal(broken.error,undefined);assert.notEqual(broken.status,0);
 assert.match(broken.stderr,/chown:.*Operation not permitted/);
 console.log('Original cap_drop ALL reproduces the reported log-prepare failure.');
 compose('up','-d');await ready();checkLogs();
 for(const name of ['frigate','go2rtc','nginx','certsync']){
  assert.equal(compose('exec','-T','frigate','stat','-c','%U:%G %a',`/dev/shm/logs/${name}`).trim(),'nobody:nogroup 2755');
 }
 assert.equal((await req('/api/stats')).status,401,'Stats must require authentication');
 assert.equal((await req('/api/login','POST',{user:'admin',password:'incorrect-test-password'})).status,401);
 const initial=await waitFor(()=>compose('logs','--no-color','frigate').match(/Password:\s+([a-f0-9]{32})\s+\*\*\*/)?.[1],'generated initial administrator');
 const adminCookie=await login('admin',initial);
 assert.equal((await req('/api/stats','GET',undefined,adminCookie)).status,200);
 assert.equal((await req('/api/users','POST',{username:'catalogtest',password,role:'admin'},adminCookie)).status,200);
 compose('up','-d','--force-recreate');await ready();checkLogs();
 const cookie=await login('catalogtest',password);
 assert.equal((await req('/api/stats','GET',undefined,cookie)).status,200);
 assert.match((await req('/api/users','GET',undefined,cookie)).body,/catalogtest/);
 compose('stop','-t','30');checkLogs();
 const id=compose('ps','-a','-q','frigate').trim();
 const state=JSON.parse(docker('inspect',id))[0];
 assert.equal(state.HostConfig.Privileged,false);
 assert.equal(state.State.ExitCode,0,'Frigate must shut down cleanly');
 console.log('Corrected template: log ownership, HTTPS, authentication, account persistence and clean shutdown passed. Cameras/recording/GPU not tested.');
}catch(error){
 try{console.error(compose('logs','--no-color','--tail','100','frigate').replace(/Password:[^\n]*/g,'Password: [test secret]').replaceAll(password,'[test secret]'))}catch{}
 throw error;
}finally{
 try{compose('down','--volumes')}finally{
  try{rmSync(temp,{recursive:true,force:true})}catch(error){if(!process.env.GITHUB_ACTIONS)throw error;execFileSync('sudo',['rm','-rf','--',temp])}
 }
}
