// Only synthetic documents/media and newly created bind mounts on an isolated runner.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const app = process.argv[2];
assert.ok(['paperless-ngx', 'jellyfin'].includes(app));
const main = app === 'jellyfin' ? 'jellyfin' : 'paperless';
const port = app === 'jellyfin' ? '8096' : '8000';
const temp = mkdtempSync(join(tmpdir(), `${app}-smoke-`));
const project = `catalog-smoke-${randomBytes(6).toString('hex')}`;
const password = randomBytes(24).toString('hex');
const dbPassword = randomBytes(24).toString('hex');
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 600000 });
const compose = (...args) => docker('compose', '-p', project, '-f', join(temp, 'compose.json'), ...args);
const config = JSON.parse(docker('compose', '-f', `${app}/compose.yaml`, 'config', '--format', 'json'));
const locations = new Map();
for (const [name, service] of Object.entries(config.services)) {
  assert.ok(!service.container_name && !service.privileged && !service.devices);
  assert.ok(!service.network_mode, 'The template must use its isolated Compose network');
  for (const mount of service.volumes ?? []) {
    assert.equal(mount.type, 'bind');
    mount.source = join(temp, name, mount.target.replaceAll('/', '_'));
    mkdirSync(mount.source, { recursive: true });
    locations.set(`${name}:${mount.target}`, mount.source);
  }
  if (name !== main) assert.ok(!service.ports?.length, 'Database and broker must not publish ports');
  service.environment ??= {};
}
config.services[main].ports = [{ target: Number(port), published: '0', host_ip: '127.0.0.1', protocol: 'tcp' }];
if (app === 'paperless-ngx') {
  Object.assign(config.services.paperless.environment, {
    PAPERLESS_ADMIN_USER: 'catalog-test', PAPERLESS_ADMIN_PASSWORD: password,
    PAPERLESS_SECRET_KEY: randomBytes(48).toString('hex'), PAPERLESS_DBPASS: dbPassword,
    PAPERLESS_TIME_ZONE: 'Europe/Berlin', USERMAP_UID: String(process.getuid()), USERMAP_GID: String(process.getgid())
  });
  // The install form omits optional empty fields, including PAPERLESS_URL.
  delete config.services.paperless.environment.PAPERLESS_URL;
  config.services.db.environment.POSTGRES_PASSWORD = dbPassword;
} else {
  assert.ok(config.services.jellyfin.volumes.find(mount => mount.target === '/media').read_only);
  config.services.jellyfin.environment.TZ = 'Europe/Berlin';
  const samples = 16000;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(16000, 24); wav.writeUInt32LE(32000, 28); wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(4000 * Math.sin(i * Math.PI * 880 / 16000)), 44 + i * 2);
  const album = join(locations.get('jellyfin:/media'), 'TitanOS Artist', 'TitanOS Album');
  mkdirSync(album, { recursive: true });
  writeFileSync(join(album, '01 - TitanOS Test.wav'), wav);
}
writeFileSync(join(temp, 'compose.json'), JSON.stringify({ services: config.services }), { mode: 0o600 });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let base;
async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(base + path, {
    method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000)
  });
  return response;
}
async function waitFor(check, label, attempts = 120) {
  for (let i = 0;; i++) {
    try { const result = await check(); if (result) return result; } catch (error) { if (i === attempts) throw error; }
    if (i === attempts) throw new Error(`Timeout: ${label}`);
    await pause(2000);
  }
}
async function ready() {
  base = `http://${compose('port', main, port).trim()}`;
  // Jellyfin's health route can answer before startup middleware permits API calls.
  await waitFor(async () => (await request(app === 'jellyfin' ? '/System/Info/Public' : '/accounts/login/')).ok, 'server startup');
}
async function paperlessLogin() {
  const response = await request('/api/token/', { method: 'POST', body: { username: 'catalog-test', password } });
  assert.equal(response.status, 200, 'Paperless login must succeed');
  return { Authorization: `Token ${(await response.json()).token}` };
}
const jellyfinClient = 'MediaBrowser Client="TitanOS Catalog Test", Device="CI", DeviceId="catalog-test", Version="1"';
async function jellyfinLogin() {
  const response = await waitFor(async () => {
    const response = await request('/Users/AuthenticateByName', {
      method: 'POST', headers: { Authorization: jellyfinClient }, body: { Username: 'catalog-test', Pw: password }
    });
    return response.status === 503 ? false : response;
  }, 'Jellyfin authentication API startup');
  assert.equal(response.status, 200, 'Jellyfin login must succeed');
  const token = (await response.json()).AccessToken;
  assert.equal(typeof token, 'string');
  // Jellyfin 12 disables legacy X-Emby-Token authorization by default.
  return { Authorization: `${jellyfinClient}, Token="${token}"` };
}
try {
  compose('up', '-d');
  await ready();
  console.log(`${app}: server API ready`);
  if (app === 'paperless-ngx') {
    assert.ok([401, 403].includes((await request('/api/documents/')).status));
    assert.equal((await request('/api/token/', { method: 'POST', body: { username: 'catalog-test', password: 'wrong' } })).status, 400);
    const headers = await paperlessLogin();
    console.log('Paperless: administrator login passed; importing synthetic raster document');
    // A generated raster image exercises actual OCR, not just PDF text extraction.
    compose('exec', '-T', 'paperless', 'python3', '-c',
      "from PIL import Image,ImageDraw,ImageFont; im=Image.new('RGB',(1800,1000),'white'); d=ImageDraw.Draw(im); d.text((100,150),'TITANOS DOCUMENT 2026',font=ImageFont.load_default(size=64),fill='black'); im.save('/usr/src/paperless/consume/catalog-test.png')");
    await waitFor(async () => {
      const response = await request('/api/documents/', { headers });
      if (!response.ok) return false;
      const data = await response.json();
      return data.count === 1 && /TITANOS/i.test(data.results[0].content) && /2026/.test(data.results[0].content);
    }, 'OCR document import');
    console.log('Paperless: OCR document imported; recreating stack');
    compose('up', '-d', '--force-recreate');
    await ready();
    const persisted = await request('/api/documents/', { headers: await paperlessLogin() });
    assert.equal((await persisted.json()).count, 1, 'Document and database must survive recreation');
    console.log('Paperless: protected API, login, raster OCR import and database/document persistence passed.');
  } else {
    await waitFor(async () => {
      const response = await request('/Startup/User');
      if (!response.ok) console.log(`Jellyfin startup: ${response.status} ${(await response.text()).slice(0, 200)}`);
      return response.status === 200;
    }, 'Jellyfin startup user API');
    assert.equal((await request('/Startup/User', { method: 'POST', body: { Name: 'catalog-test', Password: password } })).status, 204);
    assert.equal((await request('/Startup/Complete', { method: 'POST' })).status, 204);
    assert.equal((await request('/Users')).status, 401);
    assert.equal((await request('/Users/AuthenticateByName', {
      method: 'POST', headers: { Authorization: jellyfinClient }, body: { Username: 'catalog-test', Pw: 'wrong' }
    })).status, 401);
    const headers = await jellyfinLogin();
    console.log('Jellyfin: setup and login passed; scanning synthetic media');
    assert.equal((await request('/Library/VirtualFolders?name=CatalogMusic&collectionType=music&paths=%2Fmedia&refreshLibrary=true', {
      method: 'POST', headers, body: { LibraryOptions: { PathInfos: [{ Path: '/media' }], EnableRealtimeMonitor: false,
        TypeOptions: ['MusicAlbum', 'MusicArtist', 'Audio'].map(Type => ({ Type, MetadataFetchers: [], ImageFetchers: [] })) } }
    })).status, 204);
    const folders = await request('/Library/VirtualFolders', { headers });
    assert.equal(folders.status, 200);
    assert.ok((await folders.json()).some(folder => folder.Name === 'CatalogMusic' && folder.Locations?.includes('/media')), 'The actual media path is registered');
    assert.equal((await request('/Library/Refresh', { method: 'POST', headers })).status, 204);
    const audio = await waitFor(async () => {
      const response = await request('/Items?Recursive=true&IncludeItemTypes=Audio', { headers });
      if (!response.ok) return false;
      return (await response.json()).Items?.[0];
    }, 'media library scan');
    const stream = await request(`/Audio/${audio.Id}/stream?static=true`, { headers });
    assert.equal(stream.status, 200);
    assert.equal(Buffer.from(await stream.arrayBuffer()).subarray(0, 4).toString(), 'RIFF');
    compose('up', '-d', '--force-recreate');
    await ready();
    const persisted = await request('/Items?Recursive=true&IncludeItemTypes=Audio', { headers: await jellyfinLogin() });
    assert.equal((await persisted.json()).Items.length, 1, 'Account and media library must survive recreation');
    console.log('Jellyfin: setup, protected API, login, read-only media scan, direct audio stream and persistence passed.');
  }
  const { chromium } = await import(process.env.PLAYWRIGHT_PATH);
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.goto(base + (app === 'jellyfin' ? '/web/index.html#!/login.html' : '/accounts/login/'), { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('input[type="password"]').first().waitFor({ state: 'visible', timeout: 30000 });
    await page.screenshot({ path: `${app}-login-smoke.png` });
  } finally { await browser.close(); }
} catch (error) {
  if (app === 'jellyfin') {
    // Jellyfin has only synthetic credentials in this disposable stack.
    const logs = compose('logs', '--no-color', '--tail', '100', 'jellyfin');
    console.error(logs.replaceAll(password, '[test password]'));
  }
  throw error;
} finally {
  try { compose('down', '--volumes'); }
  finally {
    // Database bind mounts belong to container UIDs. On GitHub's disposable
    // runner sudo can remove only this newly created test directory.
    try { rmSync(temp, { recursive: true, force: true }); }
    catch (error) {
      if (!process.env.GITHUB_ACTIONS) throw error;
      execFileSync('sudo', ['rm', '-rf', '--', temp]);
    }
  }
}
