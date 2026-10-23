// Disposable CI stacks only. No NAS data, physical radios, USB devices or external accounts.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
const apps={ 'joplin-server':['joplin',22300],zigbee2mqtt:['zigbee2mqtt',8080],esphome:['esphome',6052],n8n:['n8n',5678],mealie:['mealie',9000],grocy:['grocy',80] };
const app=process.argv[2];assert.ok(apps[app]);const [main,port]=apps[app];
const temp=mkdtempSync(join(tmpdir(),`${app}-catalog-`));
const project=`catalog-${randomBytes(6).toString('hex')}`;
const password=`Aa1!${randomBytes(24).toString('hex')}`;
const dbPassword=randomBytes(24).toString('hex');
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',timeout:600000});
const compose=(...args)=>docker('compose','-p',project,'-f',join(temp,'compose.json'),...args);
const config=JSON.parse(docker('compose','-f',`${app}/compose.yaml`,'config','--format','json'));
const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const hostPort=server.address().port;await new Promise(resolve=>server.close(resolve));
const base=`http://127.0.0.1:${hostPort}`;
for(const [name,service] of Object.entries(config.services)){
 assert.ok(!service.container_name&&!service.privileged&&!service.devices&&!service.network_mode);
 if(name!==main)assert.ok(!service.ports?.length,'Dependencies must not publish ports');
 for(const mount of service.volumes??[]){
  if(mount.type!=='bind')continue;
  mount.source=join(temp,name,mount.target.replaceAll('/','_'));mkdirSync(mount.source,{recursive:true});
 }
 for(const [key] of Object.entries(service.environment??{})){
  if(['PUID','USERMAP_UID'].includes(key))service.environment[key]=String(process.getuid());
  if(['PGID','USERMAP_GID'].includes(key))service.environment[key]=String(process.getgid());
  if(['TZ','GENERIC_TIMEZONE'].includes(key))service.environment[key]='Europe/Berlin';
 }
}
config.services[main].ports=[{target:port,published:String(hostPort),host_ip:'127.0.0.1',protocol:'tcp'}];
const env=config.services[main].environment??={};
if(app==='joplin-server'){
 Object.assign(env,{APP_BASE_URL:base,JOPLIN_DBPASS:dbPassword,POSTGRES_PASSWORD:dbPassword});
 config.services.db.environment.POSTGRES_PASSWORD=dbPassword;
}
if(app==='esphome')Object.assign(env,{ESPHOME_USERNAME:'catalog-test',ESPHOME_PASSWORD:password});
if(app==='zigbee2mqtt')env.ZIGBEE2MQTT_CONFIG_FRONTEND_AUTH_TOKEN=password;
if(app==='n8n')env.N8N_ENCRYPTION_KEY=password;
if(app==='mealie')env.BASE_URL=base;
// Compose's normalized names belong to the source directory. Let this project's
// random name own every test volume/config instead of retaining global names.
const volumes=Object.fromEntries(Object.keys(config.volumes??{}).map(key=>[key,{}]));
const configs=Object.fromEntries(Object.entries(config.configs??{}).map(([key,value])=>{const {name,...rest}=value;return [key,rest]}));
writeFileSync(join(temp,'compose.json'),JSON.stringify({services:config.services,volumes,configs}),{mode:0o600});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(check,label){
 const deadline=Date.now()+300000;let last;
 while(Date.now()<deadline){try{const value=await check();if(value)return value}catch(error){last=error}await pause(1500)}
 throw new Error(`Timeout: ${label}${last?` (${last.message})`:''}`);
}
async function req(path,{method='GET',body,headers={}}={}){
 return fetch(base+path,{method,headers:{...(body&&typeof body!=='string'?{'Content-Type':'application/json'}:{}),...headers},body:body?(typeof body==='string'?body:JSON.stringify(body)):undefined,signal:AbortSignal.timeout(10000)});
}
async function ready(){await waitFor(async()=>{
 const response=await req(app==='n8n'?'/healthz/readiness':app==='joplin-server'?'/api/ping':app==='mealie'?'/api/app/about':'/');return response.ok;
},`${app} startup`)}
async function esphomeAuth(){
 const ws=new WebSocket(base.replace('http:','ws:')+'/ws');const queue=[];let notify;
 ws.addEventListener('message',event=>{queue.push(JSON.parse(event.data));notify?.()});
 const take=async()=>waitFor(async()=>{if(queue.length)return queue.shift();await new Promise(resolve=>{notify=resolve;setTimeout(resolve,500)});return queue.shift()},'ESPHome WebSocket response');
 let seq=0;
 const command=async(command,args={})=>{const id=String(++seq);ws.send(JSON.stringify({command,message_id:id,args}));for(;;){const response=await take();if(response.message_id===id)return response}};
 try{
  const info=await take();assert.equal(info.requires_auth,true);
  assert.equal((await command('devices/list')).error_code,'not_authenticated');
  assert.ok((await command('auth/login',{username:'catalog-test',password:'wrong'})).error_code);
  const login=await command('auth/login',{username:'catalog-test',password});assert.equal(typeof login.result?.token,'string');
  assert.ok(!(await command('devices/list')).error_code);
 }finally{ws.close()}
}
let browser;
try{
 compose('up','-d');await ready();console.log(`${app}: HTTP startup passed`);
 if(app==='joplin-server'){
  const response=await req('/api/sessions',{method:'POST',body:{email:'admin@localhost',password:'admin'}});
  assert.equal(response.status,200);assert.equal(typeof (await response.json()).id,'string');
  compose('exec','-T','db','psql','-U','joplin','-d','joplin','-c',"CREATE TABLE titanos_catalog_check (value text); INSERT INTO titanos_catalog_check VALUES ('persistent');");
 }
 if(app==='esphome')await esphomeAuth();
 if(app==='zigbee2mqtt'){
  assert.match(await (await req('/')).text(),/zigbee2mqtt/i);
  compose('exec','-T','broker','mosquitto_pub','-h','127.0.0.1','-t','catalog/test','-m','persistent','-r');
  assert.equal(compose('exec','-T','broker','mosquitto_sub','-h','127.0.0.1','-t','catalog/test','-C','1','-W','5').trim(),'persistent');
 }
 if(app==='n8n'){
  const response=await req('/rest/owner/setup',{method:'POST',body:{email:'catalog@example.test',firstName:'Catalog',lastName:'Test',password}});
  assert.equal(response.status,200);
 }
 async function mealieLogin(){
  const response=await req('/api/auth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username:'changeme@example.com',password:'MyPassword'}).toString()});
  assert.equal(response.status,200);const token=(await response.json()).access_token;assert.equal(typeof token,'string');return {Authorization:`Bearer ${token}`};
 }
 if(app==='mealie')assert.equal((await req('/api/users/self',{headers:await mealieLogin()})).status,200);
 // A marker is confined to this new stack's own application data.
 const dataPath=app==='joplin-server'?null:app==='zigbee2mqtt'?'/app/data':app==='esphome'?'/config':app==='n8n'?'/home/node/.n8n':app==='mealie'?'/app/data':'/config';
 if(dataPath)compose('exec','-T',main,'sh','-c','printf persistent > "$1/.catalog-check"','sh',dataPath);
 compose('up','-d','--force-recreate');await ready();
 if(dataPath)assert.equal(compose('exec','-T',main,'cat',`${dataPath}/.catalog-check`).trim(),'persistent');
 if(app==='joplin-server')assert.equal(compose('exec','-T','db','psql','-U','joplin','-d','joplin','-Atc','SELECT value FROM titanos_catalog_check;').trim(),'persistent');
 if(app==='esphome')await esphomeAuth();
 if(app==='n8n')assert.equal((await req('/rest/login',{method:'POST',body:{emailOrLdapLoginId:'catalog@example.test',password}})).status,200);
 if(app==='mealie')assert.equal((await req('/api/users/self',{headers:await mealieLogin()})).status,200);
 const {chromium}=await import(process.env.PLAYWRIGHT_PATH);browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage();await page.goto(base,{waitUntil:'networkidle',timeout:60000});
 if(app==='grocy'){
  await page.locator('input[name="username"]').fill('admin');await page.locator('input[name="password"]').fill('admin');
  await page.locator('button[type="submit"]').click();await page.waitForURL(url=>!url.pathname.includes('login'),{timeout:30000});
 }
 await page.screenshot({path:`${app}-selected-smoke.png`});
 console.log(`${app}: startup, supported authentication checks, browser page and isolated data persistence passed. Hardware and external services not tested.`);
}catch(error){
 try{let logs=compose('logs','--no-color','--tail','60',main);for(const value of [password,dbPassword])logs=logs.replaceAll(value,'[test secret]');console.error(logs)}catch{}
 throw error;
}finally{
 await browser?.close();
 try{compose('down','--volumes')}finally{try{rmSync(temp,{recursive:true,force:true})}catch(error){if(!process.env.GITHUB_ACTIONS)throw error;execFileSync('sudo',['rm','-rf','--',temp])}}
}
