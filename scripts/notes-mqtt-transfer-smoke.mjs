// Real images and synthetic content on disposable CI runners only.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, createConnection } from 'node:net';
const app=process.argv[2];
assert.ok(['trilium','mosquitto','pairdrop'].includes(app));
const temp=mkdtempSync(join(tmpdir(),`${app}-catalog-`));
const project=`catalog-${randomBytes(6).toString('hex')}`;
const password=`Aa1!${randomBytes(24).toString('hex')}`;
const username='catalog_test';
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',timeout:600000});
const compose=(...args)=>docker('compose','-p',project,'-f',join(temp,'compose.json'),...args);
// Preserve $$ in shell commands until the actual isolated stack is started.
const config=JSON.parse(docker('compose','-f',`${app}/compose.yaml`,'config','--no-interpolate','--format','json'));
assert.equal(Object.keys(config.services).length,1);
const service=config.services[app];
assert.ok(!service.container_name&&!service.privileged&&!service.devices&&!service.network_mode);
const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const hostPort=server.address().port;await new Promise(resolve=>server.close(resolve));
const port={trilium:8080,mosquitto:1883,pairdrop:3000}[app];
service.ports=[{target:port,published:String(hostPort),host_ip:'127.0.0.1',protocol:'tcp'}];
for(const mount of service.volumes??[]){
 assert.equal(mount.type,'bind');
 mount.source=join(temp,mount.target.replaceAll('/','_'));mkdirSync(mount.source,{recursive:true});
}
const env=service.environment??={};
for(const key of ['USER_UID','PUID'])if(key in env)env[key]=String(process.getuid());
for(const key of ['USER_GID','PGID'])if(key in env)env[key]=String(process.getgid());
if('TZ' in env)env.TZ='Europe/Berlin';
if(app==='mosquitto')Object.assign(env,{MQTT_USERNAME:username,MQTT_PASSWORD:password});
const configs=Object.fromEntries(Object.entries(config.configs??{}).map(([key,value])=>{const {name,...rest}=value;return[key,rest]}));
writeFileSync(join(temp,'compose.json'),JSON.stringify({services:config.services,configs}),{mode:0o600});
const base=`http://127.0.0.1:${hostPort}`;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(check,label){
 const deadline=Date.now()+240000;let last;
 while(Date.now()<deadline){try{const result=await check();if(result)return result}catch(e){last=e}await pause(1000)}
 throw new Error(`Timeout: ${label}${last?` (${last.message})`:''}`);
}
const req=(path,options={})=>fetch(base+path,{...options,signal:AbortSignal.timeout(10000)});
const jsonPost=(path,body,headers={})=>req(path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
async function ready(){
 if(app==='mosquitto')return waitFor(()=>{
  try{return compose('exec','-T',app,'mosquitto_pub','-h','127.0.0.1','-u',username,'-P',password,'-t','catalog/ready','-m','ready')!==undefined}catch{return false}
 },'MQTT authenticated startup');
 await waitFor(async()=>(await req('/')).ok,`${app} HTTP startup`);
}
async function mqttConnect(user,pass){
 const str=value=>{const text=Buffer.from(value);const size=Buffer.alloc(2);size.writeUInt16BE(text.length);return Buffer.concat([size,text])};
 const payload=Buffer.concat([str(`test-${randomBytes(4).toString('hex')}`),...(user===undefined?[]:[str(user),str(pass)])]);
 const body=Buffer.concat([str('MQTT'),Buffer.from([4,user===undefined?2:194,0,30]),payload]);
 assert.ok(body.length<128);
 return new Promise((resolve,reject)=>{
  const socket=createConnection({host:'127.0.0.1',port:hostPort});let chunks=Buffer.alloc(0);
  socket.setTimeout(8000,()=>socket.destroy(new Error('MQTT timeout')));
  socket.on('connect',()=>socket.write(Buffer.concat([Buffer.from([16,body.length]),body])));
  socket.on('data',chunk=>{chunks=Buffer.concat([chunks,chunk]);if(chunks.length>=4){socket.end();resolve(chunks.subarray(0,4))}});
  socket.on('error',reject);
 });
}
let browser;
try{
 compose('up','-d');await ready();
 if(app==='mosquitto'){
  assert.deepEqual(await mqttConnect(username,password),Buffer.from([32,2,0,0]));
  for(const credentials of [[undefined,undefined],[username,'wrong']]){
   const ack=await mqttConnect(...credentials);assert.equal(ack[0],32);assert.notEqual(ack[3],0,'Unauthorized MQTT connection accepted');
  }
  compose('exec','-T',app,'mosquitto_pub','-h','127.0.0.1','-u',username,'-P',password,'-t','catalog/persistence','-m','retained-value','-r');
  const retained=()=>compose('exec','-T',app,'mosquitto_sub','-h','127.0.0.1','-u',username,'-P',password,'-t','catalog/persistence','-C','1','-W','10').trim();
  assert.equal(retained(),'retained-value');
  compose('stop');compose('up','-d','--force-recreate');await ready();assert.equal(retained(),'retained-value');
  assert.deepEqual(await mqttConnect(username,password),Buffer.from([32,2,0,0]));
  const ack=await mqttConnect();assert.notEqual(ack[3],0);
  console.log('Mosquitto: mapped-port authentication, anonymous/wrong-password rejection, publish/subscribe and retained-message persistence passed.');
 }else{
  const {chromium}=await import(process.env.PLAYWRIGHT_PATH);browser=await chromium.launch({channel:'chrome'});
  if(app==='trilium'){
   let page=await browser.newPage({locale:'en-US'});await page.goto(base);
   await page.locator('.select-language button').click();
   await page.locator('.setup-options-container .setup-option-card').first().click();
   await page.locator('.create-new-document-options .setup-option-card').last().click();
   await page.locator('input[name="password1"]').fill(password,{timeout:120000});
   await page.locator('input[name="password2"]').fill(password);
   await page.locator('form[action="set-password"] button').click();
   await page.waitForURL('**/login');
   await page.locator('input[type="password"]').fill(password);
   await page.locator('form button[type="submit"], form button.btn-primary').first().click();
   await page.waitForURL(url=>!url.pathname.includes('login'));
   const wrong=await jsonPost('/etapi/auth/login',{password:'wrong'});assert.equal(wrong.status,401);
   assert.equal((await req('/etapi/notes/root')).status,401);
   const login=await jsonPost('/etapi/auth/login',{password,tokenName:'Isolated catalog test'});assert.equal(login.status,201);
   const token=(await login.json()).authToken;assert.equal(typeof token,'string');
   const headers={Authorization:token};
   const created=await jsonPost('/etapi/create-note',{parentNoteId:'root',title:'Catalog persistence test',type:'text',content:'<p>Synthetic persistent note</p>'},headers);
   assert.equal(created.status,201,await created.clone().text());const note=(await created.json()).note;assert.ok(note.noteId);
   compose('stop');compose('up','-d','--force-recreate');await ready();
   assert.equal((await req('/etapi/notes/root')).status,401);
   const noteResponse=await req(`/etapi/notes/${note.noteId}`,{headers});assert.equal(noteResponse.status,200);assert.equal((await noteResponse.json()).title,'Catalog persistence test');
   assert.match(await (await req(`/etapi/notes/${note.noteId}/content`,{headers})).text(),/Synthetic persistent note/);
   const again=await jsonPost('/etapi/auth/login',{password});assert.equal(again.status,201);
   await page.context().close();page=await browser.newPage({locale:'en-US'});
   await page.goto(base);await page.locator('input[type="password"]').fill(password);
   await page.locator('form button[type="submit"], form button.btn-primary').first().click();
   await page.waitForURL(url=>!url.pathname.includes('login'));await page.screenshot({path:'trilium-catalog-smoke.png'});
   console.log('Trilium: browser setup/password/login, rejected anonymous/wrong credentials, actual note creation and persistence after recreation passed.');
  }else{
   const senderContext=await browser.newContext({locale:'en-US'}),receiverContext=await browser.newContext({locale:'en-US',acceptDownloads:true});
   const sender=await senderContext.newPage(),receiver=await receiverContext.newPage();
   await sender.goto(base);await receiver.goto(base);
   await sender.locator('x-peer input[type="file"]').first().waitFor({state:'attached',timeout:60000});
   await receiver.locator('x-peer').first().waitFor({timeout:60000});
   const bytes=Buffer.from('TitanOS isolated PairDrop file transfer\n');
   const downloaded=receiver.waitForEvent('download',{timeout:60000});
   await sender.locator('x-peer input[type="file"]').first().setInputFiles({name:'catalog-transfer.txt',mimeType:'text/plain',buffer:bytes});
   await receiver.locator('#accept-request').click({timeout:60000});
   const download=await downloaded;assert.equal(download.suggestedFilename(),'catalog-transfer.txt');
   assert.deepEqual(readFileSync(await download.path()),bytes);
   await receiver.screenshot({path:'pairdrop-catalog-smoke.png'});
   assert.ok(!service.volumes?.length,'PairDrop should not pretend to store transferred files on the NAS');
   await senderContext.close();await receiverContext.close();
   compose('up','-d','--force-recreate');await ready();
   console.log('PairDrop: two isolated browser clients, discovery, accepted file transfer with exact downloaded bytes and restart passed.');
  }
 }
}catch(error){
 try{console.error(compose('logs','--no-color','--tail','60').replaceAll(password,'[test secret]'))}catch{}
 if(browser)for(const context of browser.contexts())for(const page of context.pages()){
  console.error('Browser at',page.url(),(await page.locator('body').innerText().catch(()=>'' )).slice(0,1800));
  await page.screenshot({path:`${app}-catalog-smoke.png`}).catch(()=>{});
 }
 throw error;
}finally{
 await browser?.close();
 try{compose('down','--volumes')}finally{try{rmSync(temp,{recursive:true,force:true})}catch(error){if(!process.env.GITHUB_ACTIONS)throw error;execFileSync('sudo',['rm','-rf','--',temp])}}
}
