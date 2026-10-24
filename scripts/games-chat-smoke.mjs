// Real containers with isolated synthetic data on disposable CI runners.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createConnection,createServer} from 'node:net';
import {createSocket} from 'node:dgram';
const app=process.argv[2];
const services={'minecraft-java':'minecraft','minecraft-bedrock':'bedrock',valheim:'valheim',terraria:'terraria',satisfactory:'satisfactory',palworld:'palworld',firefox:'firefox','matrix-element':'matrix',mattermost:'mattermost'};
assert.ok(app in services);
const main=services[app],username='catalogtest',password=`Aa1!${randomBytes(18).toString('hex')}`;
const temp=mkdtempSync(join(tmpdir(),`${app}-catalog-`)),project=`catalog-${randomBytes(6).toString('hex')}`;
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',timeout:1800000,maxBuffer:8*1024*1024});
const compose=(...args)=>docker('compose','-p',project,'-f',join(temp,'compose.json'),...args);
const config=JSON.parse(docker('compose','-f',`${app}/compose.yaml`,'config','--no-interpolate','--format','json'));
const binds=new Map(),ports=new Map();
async function freePort(){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p}
for(const service of Object.values(config.services)){
 assert.ok(!service.container_name&&!service.privileged&&!service.network_mode&&!service.devices);
 for(const mount of service.volumes??[])if(mount.type==='bind'){
  if(!binds.has(mount.source)){const path=join(temp,`data-${binds.size}`);mkdirSync(path,{mode:0o755});binds.set(mount.source,path)}mount.source=binds.get(mount.source);
 }
 for(const port of service.ports??[]){if(!ports.has(port.target))ports.set(port.target,await freePort());port.published=String(ports.get(port.target));port.host_ip='127.0.0.1'}
 for(const [key,value] of Object.entries(service.environment??{})){
  if(/PASSWORD|SECRET|SERVER_PASS|TMOD_PASS/.test(key))service.environment[key]=password;
  if(['UID','PUID','USER_ID','USER_UID'].includes(key))service.environment[key]=String(process.getuid());
  if(['GID','PGID','GROUP_ID','USER_GID'].includes(key))service.environment[key]=String(process.getgid());
  if(key==='TZ')service.environment[key]='Europe/Berlin';
 }
}
for(const value of Object.values(config.volumes??{}))delete value.name;
const env=config.services[main].environment??={};
if(app.startsWith('minecraft-'))env.EULA='TRUE';
if(app==='minecraft-bedrock'){env.SERVER_UDP_PORTS='127.0.0.1:19140-19155:19140-19155';for(const p of config.services.bedrock.ports)if(p.protocol==='udp')p.published=String(p.target)} // Explicitly accepted only for this disposable test.
if(app==='firefox')env.WEB_AUTHENTICATION_USERNAME=username;
if(app==='matrix-element'){
 Object.assign(config.services.init.environment,{MATRIX_SERVER_NAME:'catalog.test',MATRIX_PUBLIC_URL:`https://127.0.0.1:${ports.get(8448)}`});
 Object.assign(config.services['admin-init'].environment,{MATRIX_ADMIN_USER:username});
}
if(app==='mattermost')env.MM_SERVICESETTINGS_SITEURL=`http://127.0.0.1:${ports.get(8065)}`;
function save(){writeFileSync(join(temp,'compose.json'),JSON.stringify({services:config.services,volumes:config.volumes}),{mode:0o600})}save();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(check,label,ms=900000){let last;const end=Date.now()+ms;while(Date.now()<end){try{const r=await check();if(r)return r}catch(e){last=e}await pause(2000)}throw new Error(`Timeout ${label}: ${last?.message??'not ready'}`)}
function endpoint(target,protocol='tcp'){return compose('port','--protocol',protocol,main,String(target)).trim()}
const baseFor=(target,https=false)=>`${https?'https':'http'}://${endpoint(target)}`;
const request=(base,path,options={})=>fetch(base+path,{...options,signal:AbortSignal.timeout(10000)});
const post=(base,path,body,headers={})=>request(base,path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const logs=()=>compose('logs','--no-color','--tail','1000',main);
function files(root){return readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(root,e.name)):[join(root,e.name)])}
function tcp(port,body){return new Promise((resolve,reject)=>{const socket=createConnection({host:'127.0.0.1',port});let received=Buffer.alloc(0);socket.setTimeout(8000,()=>socket.destroy(new Error('TCP timeout')));socket.on('connect',()=>{if(body)socket.write(body);else{socket.end();resolve(true)}});socket.on('data',chunk=>{received=Buffer.concat([received,chunk]);socket.end();resolve(received)});socket.on('error',reject);socket.on('close',()=>{if(body&&!received.length)reject(new Error('Server closed before response'))})})}
function udp(port,body){return new Promise((resolve,reject)=>{const socket=createSocket('udp4');const timer=setTimeout(()=>{socket.close();reject(new Error('UDP response timeout'))},8000);socket.once('message',data=>{clearTimeout(timer);socket.close();resolve(data)});socket.once('error',error=>{clearTimeout(timer);socket.close();reject(error)});socket.send(body,port,'127.0.0.1')})}
function portNumber(target,protocol='tcp'){return Number(endpoint(target,protocol).split(':').at(-1))}
function varint(n){const bytes=[];do{let b=n&127;n>>>=7;if(n)b|=128;bytes.push(b)}while(n);return Buffer.from(bytes)}
function packet(body){return Buffer.concat([varint(body.length),body])}
async function javaPing(){const host=Buffer.from('localhost'),port=Buffer.alloc(2);port.writeUInt16BE(25565);const handshake=packet(Buffer.concat([Buffer.from([0]),varint(767),varint(host.length),host,port,Buffer.from([1])]));const response=await tcp(portNumber(25565),Buffer.concat([handshake,Buffer.from([1,0])]));assert.ok(response.includes(Buffer.from('"players"')));assert.ok(response.includes(Buffer.from('"version"')));return true}
async function bedrockPing(){const r=await request(baseFor(19132),'/v1/join');assert.equal(r.status,200);const info=await r.json();assert.ok(Object.keys(info).length>0);return true}

function recreate(){compose('stop');compose('up','-d','--force-recreate')}
let browser;
try{
 compose('up','-d');
 console.log(`Started ${app}; waiting for actual service readiness.`);
 if(app==='minecraft-java'){
  await waitFor(javaPing,'Minecraft Java server-list handshake');compose('exec','-T',main,'rcon-cli','save-all','flush');
  const world=await waitFor(()=>files(temp).find(p=>p.endsWith('/world/level.dat')),'Java world');const before=readFileSync(world);assert.ok(before.length>100);
  recreate();await waitFor(javaPing,'Minecraft Java after recreation');assert.ok(existsSync(world));assert.match(compose('exec','-T',main,'rcon-cli','list'),/players/i);
 }else if(app==='minecraft-bedrock'){
  await waitFor(bedrockPing,'Bedrock NetherNet signaling');const world=await waitFor(()=>files(temp).find(p=>p.endsWith('/TitanOS/level.dat')),'Bedrock world');assert.ok(readFileSync(world).length>100);
  recreate();await waitFor(bedrockPing,'Bedrock after recreation');assert.ok(existsSync(world));
 }else if(app==='terraria'){
  await waitFor(()=>{compose('exec','--user','tml:tml','-T',main,'healthcheck');return true},'tModLoader game readiness');
  compose('exec','--user','tml:tml','-T',main,'inject','save');const world='/data/tModLoader/Worlds/TitanOS.wld';await waitFor(()=>{compose('exec','--user','tml:tml','-T',main,'test','-s',world);return true},'tModLoader world');
  recreate();await waitFor(()=>{compose('exec','--user','tml:tml','-T',main,'healthcheck');return true},'tModLoader after recreation');compose('exec','--user','tml:tml','-T',main,'test','-s',world);
 }else if(app==='valheim'){
  const valheimReady=()=>{compose('exec','-T',main,'sh','-ec',"pidof valheim_server.x86_64 >/dev/null; cat /proc/net/udp /proc/net/udp6 | grep -E ':099[89A] '");return true};
  await waitFor(valheimReady,'Valheim private server process and UDP socket');
  compose('stop');const world=await waitFor(()=>files(temp).find(p=>/\.fwl2?$/.test(p)),'Valheim saved world');assert.ok(readFileSync(world).length>0);
  compose('up','-d','--force-recreate');await waitFor(valheimReady,'Valheim after recreation');assert.ok(existsSync(world));
 }else if(app==='satisfactory'){
  const base=baseFor(7777,true),api=async(name,data={},token)=>{const r=await post(base,'/api/v1/',{function:name,data},token?{Authorization:`Bearer ${token}`}:{ });const b=await r.json();assert.ok(!b.error,JSON.stringify(b));assert.equal(r.status,200,JSON.stringify(b));return b.data};
  await waitFor(()=>api('HealthCheck',{ClientCustomData:'catalog'}),'Satisfactory HTTPS API');
  const initial=await api('PasswordlessLogin',{MinimumPrivilegeLevel:'Administrator'});assert.ok((initial.authenticationToken??initial.AuthenticationToken));
  await api('ClaimServer',{ServerName:'TitanOS isolated test',AdminPassword:password},(initial.authenticationToken??initial.AuthenticationToken));
  let login=await api('PasswordLogin',{MinimumPrivilegeLevel:'Administrator',Password:password});assert.ok((login.authenticationToken??login.AuthenticationToken));
  await api('QueryServerState',{},(login.authenticationToken??login.AuthenticationToken));
  recreate();await waitFor(()=>api('HealthCheck',{ClientCustomData:'catalog'}),'Satisfactory after recreation');login=await api('PasswordLogin',{MinimumPrivilegeLevel:'Administrator',Password:password});assert.ok((login.authenticationToken??login.AuthenticationToken));await api('QueryServerState',{},(login.authenticationToken??login.AuthenticationToken));
 }else if(app==='palworld'){
  const api=path=>JSON.parse(compose('exec','-T',main,'curl','--fail','--silent','--max-time','10','--user',`admin:${password}`,`http://127.0.0.1:8212/v1/api/${path}`));
  const info=await waitFor(()=>api('info'),'Palworld authenticated REST API');assert.ok(info.version||info.servername||info.serverName);
  const metrics=await waitFor(()=>api('metrics'),'Palworld metrics');assert.ok(metrics);const wrong=compose('exec','-T',main,'curl','--silent','--output','/dev/null','--write-out','%{http_code}','--user','admin:wrong','http://127.0.0.1:8212/v1/api/info');assert.equal(wrong,'401');
  await waitFor(()=>{compose('exec','-T',main,'curl','--fail','--silent','--show-error','--user',`admin:${password}`,'-H','Content-Type: application/json','--data','{}','http://127.0.0.1:8212/v1/api/save');return true},'Palworld save request',180000);
  const saveFile=await waitFor(()=>files(temp).find(p=>p.endsWith('Level.sav')),'Palworld world save');assert.ok(readFileSync(saveFile).length>100);const worldguid=api('info').worldguid;assert.equal(typeof worldguid,'string');assert.ok(worldguid.length>0);
  recreate();await waitFor(()=>api('info'),'Palworld after recreation');assert.equal(api('info').worldguid,worldguid);assert.ok(existsSync(saveFile));
 }else if(app==='firefox'){
  const {chromium}=await import(process.env.PLAYWRIGHT_PATH);browser=await chromium.launch({channel:'chrome'});
  async function checkLogin(){const context=await browser.newContext({ignoreHTTPSErrors:true});const page=await context.newPage();let frames=0;page.on('websocket',ws=>ws.on('framereceived',()=>frames++));
   await waitFor(async()=>{await page.goto(baseFor(5800,true),{timeout:10000});return await page.locator('#usernameInput').isVisible()},'Firefox login',180000);
   assert.match(page.url(),/\/login/);await page.locator('#usernameInput').fill(username);await page.locator('#passwordInput').fill('wrong');await page.locator('#loginButton').click();await page.locator('#loginStatus:not(.d-none)').waitFor();assert.match(page.url(),/\/login/);
   await page.locator('#usernameInput').fill(username);await page.locator('#passwordInput').fill(password);await page.locator('#loginButton').click();await page.waitForURL(u=>!u.pathname.includes('/login'));await page.locator('canvas').first().waitFor({state:'visible',timeout:90000});await waitFor(()=>frames>=5,'Firefox desktop frames',90000);compose('exec','-T',main,'pidof','firefox');await page.screenshot({path:'firefox-catalog-smoke.png'});await context.close();}
  await checkLogin();const profile=await waitFor(()=>files(temp).find(p=>p.endsWith('/profile/prefs.js')),'Firefox profile');const marker=join(profile.slice(0,-'prefs.js'.length),'catalog-marker');writeFileSync(marker,'synthetic');recreate();await checkLogin();assert.equal(readFileSync(marker,'utf8'),'synthetic');
 }else if(app==='matrix-element'){
  const base=baseFor(8448,true);
  await waitFor(async()=>(await request(base,'/_matrix/client/versions')).ok,'Matrix HTTPS API');
  const login=async(pass)=>post(base,'/_matrix/client/v3/login',{type:'m.login.password',identifier:{type:'m.id.user',user:username},password:pass});
  let account=await waitFor(async()=>{const r=await login(password);if(!r.ok)return false;return r.json()},'initial Matrix administrator');assert.ok(account.access_token);
  assert.equal((await login('wrong')).status,403);const headers={Authorization:`Bearer ${account.access_token}`};
  assert.equal((await post(base,'/_matrix/client/v3/register',{username:'unauthorized',password})).status,403);
  const roomResponse=await post(base,'/_matrix/client/v3/createRoom',{name:'Catalog persistence',preset:'private_chat'},headers);assert.equal(roomResponse.status,200);const room=(await roomResponse.json()).room_id;
  let response=await request(base,`/_matrix/client/v3/rooms/${encodeURIComponent(room)}/send/m.room.message/test`,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({msgtype:'m.text',body:'Synthetic persistent Matrix message'})});assert.equal(response.status,200);
  const cert=await request(base,'/titanos-matrix.crt');assert.equal(cert.status,200);assert.match(await cert.text(),/BEGIN CERTIFICATE/);assert.match(compose('logs','--no-color','init'),/Matrix HTTPS certificate SHA-256 fingerprint: (?:[0-9a-f]{2}:){31}[0-9a-f]{2}/);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==','base64');
  const uploaded=await request(base,'/_matrix/media/v3/upload?filename=catalog.png',{method:'POST',headers:{...headers,'Content-Type':'image/png'},body:png});assert.equal(uploaded.status,200);const media=(await uploaded.json()).content_uri;assert.match(media,/^mxc:/);
  response=await request(base,`/_matrix/client/v3/rooms/${encodeURIComponent(room)}/send/m.room.message/image`,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({msgtype:'m.image',body:'catalog.png',url:media,info:{mimetype:'image/png',w:1,h:1,size:png.length}})});assert.equal(response.status,200);
  const client=await (await request(base,'/config.json')).json();assert.equal(client.default_server_config['m.homeserver'].base_url,base);
  const {chromium}=await import(process.env.PLAYWRIGHT_PATH);browser=await chromium.launch({channel:'chrome',args:['--ignore-certificate-errors']});const context=await browser.newContext({ignoreHTTPSErrors:true});const page=await context.newPage();await page.goto(base);await page.getByRole('link',{name:/sign in/i}).first().click();await page.locator('input[type="text"]').first().fill(username);await page.locator('input[type="password"]').fill(password);await page.getByRole('button',{name:/sign in/i}).last().click();await page.getByText(/catalog persistence/i).first().waitFor({timeout:90000});await page.evaluate(()=>Promise.race([navigator.serviceWorker.ready.then(()=>true),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Element service worker did not become ready')),60000))]));assert.equal(await page.getByText('Failed to load service worker',{exact:true}).count(),0);const dismiss=page.getByRole('button',{name:'Dismiss',exact:true});await dismiss.waitFor({state:'visible',timeout:15000}).catch(()=>{});if(await dismiss.isVisible())await dismiss.click();await page.getByText('Catalog persistence',{exact:true}).first().click();await page.locator('img[alt="catalog.png"]').first().waitFor({timeout:90000});await page.waitForFunction(()=>Array.from(document.querySelectorAll('img[alt="catalog.png"]')).some(i=>i.complete&&i.naturalWidth>0));await page.screenshot({path:'matrix-element-catalog-smoke.png'});await context.close();
  recreate();await waitFor(async()=>(await request(base,'/_matrix/client/versions')).ok,'Matrix after recreation');assert.equal((await login(password)).status,200);response=await request(base,`/_matrix/client/v3/rooms/${encodeURIComponent(room)}/messages?dir=b`,{headers});assert.equal(response.status,200);assert.ok((await response.json()).chunk.some(e=>e.content?.body==='Synthetic persistent Matrix message'));
 }else if(app==='mattermost'){
  const base=baseFor(8065);await waitFor(async()=>(await request(base,'/api/v4/system/ping')).ok,'Mattermost API');
  const home=await request(base,'/');assert.equal(home.status,200);assert.match(await home.text(),/mattermost/i);
  const userResponse=await post(base,'/api/v4/users',{email:'catalog@example.test',username,password});assert.equal(userResponse.status,201,await userResponse.clone().text());const user=await userResponse.json();assert.ok(user.roles.includes('system_admin'));
  assert.equal((await post(base,'/api/v4/users/login',{login_id:username,password:'wrong'})).status,401);
  let response=await post(base,'/api/v4/users/login',{login_id:username,password});assert.equal(response.status,200);const token=response.headers.get('token');assert.ok(token);const headers={Authorization:`Bearer ${token}`};
  response=await post(base,'/api/v4/teams',{name:'catalogtest',display_name:'Catalog test',type:'I'},headers);assert.equal(response.status,201);const team=await response.json();
  response=await post(base,'/api/v4/channels',{team_id:team.id,name:'catalogchannel',display_name:'Catalog persistence',type:'P'},headers);assert.equal(response.status,201);const channel=await response.json();
  response=await post(base,'/api/v4/posts',{channel_id:channel.id,message:'Synthetic persistent Mattermost message'},headers);assert.equal(response.status,201);const message=await response.json();
  const form=new FormData();form.set('channel_id',channel.id);form.set('files',new Blob(['Synthetic persistent upload\n'],{type:'text/plain'}),'catalog.txt');response=await request(base,'/api/v4/files',{method:'POST',headers,body:form});assert.equal(response.status,201);const file=(await response.json()).file_infos[0];
  recreate();const again=baseFor(8065);await waitFor(async()=>(await request(again,'/api/v4/system/ping')).ok,'Mattermost after recreation');assert.equal((await post(again,'/api/v4/users/login',{login_id:username,password})).status,200);response=await request(again,`/api/v4/posts/${message.id}`,{headers});assert.equal(response.status,200);assert.equal((await response.json()).message,message.message);response=await request(again,`/api/v4/files/${file.id}`,{headers});assert.equal(response.status,200);assert.equal(await response.text(),'Synthetic persistent upload\n');
 }
 console.log(`PASS ${app}: real service startup, functional check and persistent state after container recreation. Game-client play sessions, Internet routing and host hardware are outside this smoke test.`);
}catch(error){try{console.error(compose('logs','--no-color','--tail','100').replaceAll(password,'[test secret]'))}catch{}if(browser)for(const context of browser.contexts())for(const page of context.pages()){console.error('Browser:',page.url(),(await page.locator('body').innerText().catch(()=>'' )).slice(0,2500));await page.screenshot({path:`${app}-catalog-smoke.png`}).catch(()=>{})}throw error}
finally{await browser?.close();try{compose('down','--volumes')}finally{try{rmSync(temp,{recursive:true,force:true})}catch{execFileSync('sudo',['rm','-rf','--',temp])}}}
