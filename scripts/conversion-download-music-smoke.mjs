// Runs only on disposable CI runners, with new data and synthetic accounts/files.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const app = process.argv[2];
const mains = { convertx: 'convertx', 'jdownloader-2': 'jdownloader', 'music-assistant': 'music-assistant' };
assert.ok(Object.hasOwn(mains, app));
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Host-network runtime checks require a disposable GitHub runner');
const main = mains[app];
const temp = mkdtempSync(join(tmpdir(), `${app}-smoke-`));
const project = `catalog-${randomBytes(6).toString('hex')}`;
const password = `Aa1!${randomBytes(24).toString('hex')}`;
const secrets = [password];
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 600000 });
const compose = (...args) => docker('compose', '-p', project, '-f', join(temp, 'compose.json'), ...args);
const spec = JSON.parse(docker('compose', '-f', `${app}/compose.yaml`, 'config', '--format', 'json'));
const service = spec.services[main];
assert.ok(!service.container_name && !service.privileged && !service.cap_add && !service.devices);
assert.ok(!service.security_opt?.includes('apparmor:unconfined'));
const locations = new Map();
for (const mount of service.volumes) {
  assert.equal(mount.type, 'bind');
  mount.source = join(temp, mount.target.replaceAll('/', '_'));
  mkdirSync(mount.source, { mode: 0o755 });
  locations.set(mount.target, mount.source);
}
const env = service.environment ??= {};
for (const name of ['PUID', 'USER_ID']) if (name in env) env[name] = String(process.getuid());
for (const name of ['PGID', 'GROUP_ID']) if (name in env) env[name] = String(process.getgid());
env.TZ = 'Europe/Berlin';
const dataPath = app === 'convertx' ? '/app/data' : app === 'music-assistant' ? '/data' : '/config';
if (app === 'convertx') env.JWT_SECRET = password;
if (app === 'jdownloader-2') {
  assert.equal(env.SECURE_CONNECTION, '1');
  assert.equal(env.WEB_AUTHENTICATION, '1');
  assert.equal(env.VNC_LISTENING_PORT, '-1');
  assert.equal(env.WEB_TERMINAL, '0');
  assert.equal(env.WEB_FILE_MANAGER_ALLOWED_PATHS, '/output');
  env.WEB_AUTHENTICATION_USERNAME = 'catalog-test';
  env.WEB_AUTHENTICATION_PASSWORD = password;
}
let base;
const targetPort = app === 'convertx' ? 3000 : 5800;
if (app === 'music-assistant') {
  assert.equal(service.network_mode, 'host');
  assert.ok(!service.ports?.length);
  assert.ok(service.volumes.find(mount => mount.target === '/media').read_only);
  writeFileSync(join(locations.get('/media'), 'catalog-music.txt'), 'isolated read-only library');
  base = 'http://127.0.0.1:8095';
} else {
  assert.ok(!service.network_mode);
  assert.equal(service.ports.length, 1);
  service.ports = [{ target: targetPort, published: '0', host_ip: '127.0.0.1', protocol: 'tcp' }];
}
writeFileSync(join(temp, 'compose.json'), JSON.stringify({ services: { [main]: service } }), { mode: 0o600 });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, label, timeout = 360000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try { const result = await check(); if (result) return result; } catch (error) { last = error; }
    await pause(1500);
  }
  throw new Error(`Timeout: ${label}${last ? ` (${last.message})` : ''}`);
}
let browser, context, page;
async function ready() {
  if (app !== 'music-assistant') base = `${app === 'jdownloader-2' ? 'https' : 'http'}://${compose('port', main, String(targetPort)).trim()}`;
  await waitFor(async () => {
    const response = await context.request.get(base + (app === 'music-assistant' ? '/info' : '/'), { timeout: 10000 });
    return response.ok();
  }, `${app} HTTP startup`);
}
async function musicLogin(pass = password) {
  return context.request.post(base + '/auth/login', { data: { provider_id: 'builtin', credentials: { username: 'catalog-test', password: pass } } });
}
async function rpc(command, token) {
  const response = await context.request.post(base + '/api', { data: { message_id: 'catalog', command, args: {} }, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  assert.equal(response.status(), token ? 200 : 401, `${command} authorization`);
  return token ? response.json() : null;
}
let convertedPath, convertedBytes;
async function convertxLogin() {
  await page.goto(base + '/login');
  await page.locator('input[name=email]').fill('catalog@example.test');
  await page.locator('input[name=password]').fill(password);
  await page.locator('input[type=submit]').click();
  await page.waitForURL(url => url.pathname === '/');
}
async function jdownloaderLogin() {
  await page.goto(base);
  await page.locator('#usernameInput').waitFor({ timeout: 60000 });
  await page.locator('#usernameInput').fill('catalog-test');
  await page.locator('#passwordInput').fill('intentionally-wrong');
  await page.locator('#loginButton').click();
  await page.locator('#loginStatus:not(.d-none)').waitFor();
  assert.ok(page.url().includes('/login'));
  await page.locator('#usernameInput').fill('catalog-test');
  await page.locator('#passwordInput').fill(password);
  await page.locator('#loginButton').click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 });
  await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 90000 });
  await waitFor(() => {
    compose('exec', '-T', main, 'sh', '-c', 'pgrep -f "[J]Downloader.jar" && test -s /config/cfg/org.jdownloader.settings.GeneralSettings.json');
    return true;
  }, 'JDownloader running with initialized settings', 480000);
}
try {
  compose('up', '-d');
  const { chromium } = await import(process.env.PLAYWRIGHT_PATH);
  browser = await chromium.launch({ channel: 'chrome' });
  context = await browser.newContext({ ignoreHTTPSErrors: true });
  page = await context.newPage();
  await ready();
  if (app === 'convertx') {
    await page.goto(base);
    await page.locator('input[name=email]').fill('catalog@example.test');
    await page.locator('input[name=password]').fill(password);
    await page.locator('input[type=submit]').click();
    await page.waitForURL(url => url.pathname === '/');
    const converter = await page.locator('select[name=convert_to] option').evaluateAll(options => options.map(option => option.value).find(value => /^png,/i.test(value) && /resvg/i.test(value)));
    assert.ok(converter, 'SVG-to-PNG converter must be available');
    const upload = await context.request.post(base + '/upload', { multipart: { file: { name: 'catalog.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#00aaff"/></svg>') } } });
    assert.equal(upload.status(), 200);
    const converted = await context.request.post(base + '/convert', { form: { file_names: JSON.stringify(['catalog.svg']), convert_to: converter } });
    assert.match(converted.url(), /\/results\//);
    await page.goto(converted.url());
    convertedPath = await waitFor(async () => {
      await page.reload();
      return page.locator('a[href*="/download/"]').first().getAttribute('href', { timeout: 3000 });
    }, 'completed conversion');
    const download = await context.request.get(new URL(convertedPath, base).href);
    assert.equal(download.status(), 200);
    convertedBytes = await download.body();
    assert.equal(convertedBytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(convertedBytes.readUInt32BE(16), 16);
    assert.equal(convertedBytes.readUInt32BE(20), 16);
    const anonymous = await browser.newContext();
    try {
      const response = await anonymous.request.get(new URL(convertedPath, base).href, { maxRedirects: 0 });
      assert.ok([301, 302, 303, 401, 403].includes(response.status()), 'Downloads must require authentication');
      const invalid = await anonymous.request.post(base + '/login', { form: { email: 'catalog@example.test', password: 'wrong' } });
      assert.equal(invalid.status(), 403);
    } finally { await anonymous.close(); }
  } else if (app === 'jdownloader-2') {
    await jdownloaderLogin();
    compose('exec', '-T', main, 'test', '-d', '/output');
  } else {
    await page.goto(base);
    const setup = await context.request.post(base + '/setup', { data: { username: 'catalog-test', password } });
    assert.equal(setup.status(), 200);
    const created = await setup.json();
    assert.equal(created.success, true);
    assert.equal(created.user.role, 'admin');
    secrets.push(created.token);
    assert.equal((await musicLogin('wrong')).status(), 401);
    const login = await musicLogin();
    assert.equal(login.status(), 200);
    const auth = await login.json();
    secrets.push(auth.token);
    await rpc('config/providers');
    assert.ok(Array.isArray(await rpc('config/providers', auth.token)));
    const me = await context.request.get(base + '/auth/me', { headers: { Authorization: `Bearer ${auth.token}` } });
    assert.equal(me.status(), 200);
    assert.equal(compose('exec', '-T', main, 'cat', '/media/catalog-music.txt').trim(), 'isolated read-only library');
    assert.throws(() => compose('exec', '-T', main, 'touch', '/media/must-not-write'));
  }
  await page.screenshot({ path: `${app}-first-smoke.png` });
  compose('exec', '-T', main, 'sh', '-c', 'printf persistent > "$1/.catalog-check"', 'sh', dataPath);
  compose('up', '-d', '--force-recreate');
  await context.close();
  context = await browser.newContext({ ignoreHTTPSErrors: true });
  page = await context.newPage();
  await ready();
  if (app === 'convertx') {
    await convertxLogin();
    const downloaded = await context.request.get(new URL(convertedPath, base).href);
    assert.equal(downloaded.status(), 200);
    assert.deepEqual(await downloaded.body(), convertedBytes);
    assert.ok(!(await (await context.request.get(base + '/setup')).text()).includes('Create your account'));
  } else if (app === 'jdownloader-2') await jdownloaderLogin();
  else {
    const login = await musicLogin();
    assert.equal(login.status(), 200);
    const auth = await login.json();
    secrets.push(auth.token);
    assert.equal(auth.user.username, 'catalog-test');
    assert.ok(Array.isArray(await rpc('config/providers', auth.token)));
    assert.ok([400, 409].includes((await context.request.post(base + '/setup', { data: { username: 'other', password } })).status()));
    await page.goto(base + '/login');
  }
  assert.equal(compose('exec', '-T', main, 'cat', `${dataPath}/.catalog-check`).trim(), 'persistent');
  await page.screenshot({ path: `${app}-recreated-smoke.png` });
  const image = JSON.parse(docker('image', 'inspect', service.image))[0];
  writeFileSync(`${app}-smoke-report.json`, JSON.stringify({ app, checkedAt: new Date().toISOString(), image: service.image, digests: image.RepoDigests, passed: true, checks: app === 'convertx' ? ['account setup', 'SVG to PNG conversion (16x16)', 'authenticated byte-identical download after recreation', 'anonymous download rejection', 'invalid login rejection'] : app === 'jdownloader-2' ? ['HTTPS login', 'invalid login rejection', 'browser desktop', 'running JDownloader and initialized settings', 'persistent appdata after recreation'] : ['host network startup', 'owner setup', 'invalid login rejection', 'authenticated configuration API', 'read-only music mount', 'account persistence after recreation'], limits: app === 'convertx' ? 'One synthetic format pair; no full converter matrix or GPU tests.' : app === 'jdownloader-2' ? 'No external hoster accounts, MyJDownloader or complete download/extraction tested.' : 'No physical speakers, multicast discovery, playback or external music service accounts tested.' }, null, 2) + '\n');
  console.log(`${app}: runtime, authentication and recreation/persistence checks passed`);
} catch (error) {
  try { let logs = compose('logs', '--no-color', '--tail', '90'); for (const secret of secrets) logs = logs.replaceAll(secret, '[test secret]'); console.error(logs); } catch {}
  throw error;
} finally {
  await browser?.close();
  try { compose('down', '--volumes'); }
  finally { execFileSync('sudo', ['rm', '-rf', '--', temp]); }
}
