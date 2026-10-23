// Isolated container/browser check: never connects to a real mail account.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_PATH);
const temp = mkdtempSync(join(tmpdir(), 'thunderbird-smoke-'));
const project = `thunderbird-smoke-${randomBytes(5).toString('hex')}`;
const password = randomBytes(24).toString('hex');
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 300000 });
const compose = (...args) => docker('compose', '-p', project, '-f', join(temp, 'compose.json'), ...args);
const config = JSON.parse(docker('compose', '-f', 'thunderbird/compose.yaml', 'config', '--format', 'json'));
const service = config.services.thunderbird;
assert.equal(service.environment.SECURE_CONNECTION, '1');
assert.equal(service.environment.WEB_AUTHENTICATION, '1');
assert.equal(service.environment.VNC_LISTENING_PORT, '-1');
assert.equal(service.ports.length, 1);
assert.equal(service.ports[0].target, 5800);
assert.ok(!service.container_name, 'Multiple installations must have independent names');
service.environment.USER_ID = String(process.getuid());
service.environment.GROUP_ID = String(process.getgid());
service.environment.TZ = 'Europe/Berlin';
service.environment.WEB_AUTHENTICATION_USERNAME = 'smoke-user';
service.environment.WEB_AUTHENTICATION_PASSWORD = password;
for (const mount of service.volumes) {
  assert.equal(mount.type, 'bind');
  assert.ok(['/config', '/storage'].includes(mount.target));
  mount.source = join(temp, mount.target.slice(1));
  mkdirSync(mount.source, { mode: 0o700 });
}
service.ports = [{ target: 5800, published: '0', host_ip: '127.0.0.1', protocol: 'tcp' }];
writeFileSync(join(temp, 'compose.json'), JSON.stringify({ services: { thunderbird: service } }), { mode: 0o600 });
let browser;
try {
  compose('up', '-d');
  browser = await chromium.launch();
  async function checkLogin(screenshot) {
    const endpoint = compose('port', 'thunderbird', '5800').trim();
    const url = `https://${endpoint}`;
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    try {
      const page = await context.newPage();
      let receivedFrames = 0;
      page.on('websocket', ws => ws.on('framereceived', () => receivedFrames++));
      for (let attempt = 0;; attempt++) {
        try {
          await page.goto(url, { timeout: 10000, waitUntil: 'domcontentloaded' });
          await page.locator('#usernameInput').waitFor({ timeout: 5000 });
          break;
        } catch (error) {
          if (attempt === 35) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      assert.ok(page.url().includes('/login/'), 'Anonymous access must require a login');
      await page.locator('#usernameInput').fill('smoke-user');
      await page.locator('#passwordInput').fill('intentionally-wrong');
      await page.locator('#loginButton').click();
      await page.locator('#loginStatus:not(.d-none)').waitFor();
      assert.ok(page.url().includes('/login/'), 'Incorrect password must not grant access');
      // A rejected form submission reloads the page and clears both inputs.
      await page.locator('#usernameInput').fill('smoke-user');
      await page.locator('#passwordInput').fill(password);
      await page.locator('#loginButton').click();
      await page.waitForURL(current => !current.pathname.includes('/login'), { timeout: 30000 });
      await page.locator('canvas').first().waitFor({ state: 'visible', timeout: 90000 });
      await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas');
        return canvas?.width > 100 && canvas?.height > 100;
      }, null, { timeout: 60000 });
      for (let attempt = 0; receivedFrames < 5 && attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      assert.ok(receivedFrames >= 5, 'The desktop must deliver actual WebSocket frames');
      compose('exec', '-T', 'thunderbird', 'pidof', 'thunderbird');
      await page.screenshot({ path: screenshot });
    } finally {
      await context.close();
    }
  }
  await checkLogin('thunderbird-first-smoke.png');
  const marker = join(temp, 'config', 'profile', 'titanos-smoke-marker');
  writeFileSync(marker, 'isolated-profile');
  compose('up', '-d', '--force-recreate');
  await checkLogin('thunderbird-recreated-smoke.png');
  assert.equal(readFileSync(marker, 'utf8'), 'isolated-profile');
  compose('exec', '-T', 'thunderbird', 'test', '-s', '/config/profile/prefs.js');
  console.log('Thunderbird: HTTPS, rejected invalid login, authenticated desktop, running process and persistent profile passed. No real mail accounts tested.');
} finally {
  await browser?.close();
  try { compose('down', '--volumes'); }
  finally { rmSync(temp, { recursive: true, force: true }); }
}
