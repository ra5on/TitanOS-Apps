// Disposable runner only: synthetic credentials and newly created test directories.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const temp = mkdtempSync(join(tmpdir(), 'nextcloud-latest-'));
const project = `nextcloud-test-${randomBytes(6).toString('hex')}`;
const password = `Aa1!${randomBytes(24).toString('hex')}`;
const dbPassword = randomBytes(24).toString('hex');
const rootPassword = randomBytes(24).toString('hex');
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024 });
const compose = (...args) => docker('compose', '-p', project, '-f', join(temp, 'compose.json'), ...args);
const config = JSON.parse(docker('compose', '-f', 'nextcloud/compose.yaml', 'config', '--format', 'json'));
const paths = new Map();
for (const [name, service] of Object.entries(config.services)) {
  assert.ok(!service.privileged && !service.devices && !service.network_mode);
  if (name !== 'nextcloud') assert.ok(!service.ports?.length);
  for (const mount of service.volumes ?? []) {
    assert.equal(mount.type, 'bind');
    if (!paths.has(mount.source)) paths.set(mount.source, join(temp, `data-${paths.size}`));
    mount.source = paths.get(mount.source);
    mkdirSync(mount.source, { recursive: true });
  }
  for (const key of Object.keys(service.environment ?? {})) {
    if (key === 'MYSQL_PASSWORD') service.environment[key] = dbPassword;
    if (key === 'TZ') service.environment[key] = 'Europe/Berlin';
  }
}
assert.equal(config.services.nextcloud.image, 'nextcloud:latest');
assert.equal(config.services['nextcloud-cron'].image, 'nextcloud:latest');
assert.equal(config.services.mariadb.image, 'mariadb:latest');
config.services.mariadb.environment.MARIADB_ROOT_PASSWORD = rootPassword;
Object.assign(config.services.nextcloud.environment, {
  NEXTCLOUD_ADMIN_USER: 'catalogtest', NEXTCLOUD_ADMIN_PASSWORD: password,
  NEXTCLOUD_TRUSTED_DOMAINS: '127.0.0.1 localhost'
});
config.services.nextcloud.ports = [{ target: 80, published: '0', host_ip: '127.0.0.1', protocol: 'tcp' }];
writeFileSync(join(temp, 'compose.json'), JSON.stringify({ services: config.services }), { mode: 0o600 });
let base;
const auth = `Basic ${Buffer.from(`catalogtest:${password}`).toString('base64')}`;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(path, method = 'GET', body, authenticated = false) {
  return fetch(base + path, { method, headers: { ...(body ? { 'Content-Type': 'text/plain' } : {}), ...(authenticated ? { Authorization: auth } : {}) }, body, signal: AbortSignal.timeout(15000) });
}
async function ready() {
  base = `http://${compose('port', 'nextcloud', '80').trim()}`;
  const deadline = Date.now() + 600000;
  let last;
  while (Date.now() < deadline) {
    try {
      const response = await request('/status.php');
      if (response.ok) {
        const status = await response.json();
        if (status.installed && !status.maintenance && !status.needsDbUpgrade) return status;
      }
    } catch (error) { last = error; }
    await pause(3000);
  }
  throw new Error(`Nextcloud installation did not finish: ${last?.message ?? 'status not ready'}`);
}
try {
  compose('--parallel', '1', 'pull');
  compose('up', '-d');
  const status = await ready();
  const path = '/remote.php/dav/files/catalogtest/titanos-latest.txt';
  const content = 'TitanOS synthetic latest-stack validation\n';
  assert.equal((await request(path)).status, 401, 'WebDAV requires authentication');
  assert.equal((await request(path, 'PUT', content, true)).status, 201, 'Authenticated WebDAV upload');
  assert.equal(await (await request(path, 'GET', undefined, true)).text(), content);
  const databaseVersion = compose('exec', '-T', 'mariadb', 'sh', '-c', 'MYSQL_PWD="$MYSQL_PASSWORD" exec mariadb -u nextcloud --database=nextcloud -Nse "SELECT VERSION()"').trim();
  const cron = JSON.parse(docker('inspect', compose('ps', '-q', 'nextcloud-cron').trim()))[0];
  assert.equal(cron.State.Running, true);
  const server = JSON.parse(docker('inspect', compose('ps', '-q', 'nextcloud').trim()))[0];
  assert.equal(cron.Image, server.Image, 'Web and cron run the same exact image');
  compose('up', '-d', '--force-recreate');
  const persisted = await ready();
  assert.equal(persisted.version, status.version);
  assert.equal(await (await request(path, 'GET', undefined, true)).text(), content);
  console.log(`PASS: Nextcloud ${status.versionstring}, MariaDB ${databaseVersion}, cron, authentication, WebDAV and preserved data after container recreation.`);
  console.log('Existing Nextcloud/MariaDB upgrade paths and real user data were not tested.');
} catch (error) {
  try { console.error(compose('logs', '--no-color', '--tail', '45').replaceAll(password, '[test secret]').replaceAll(dbPassword, '[test secret]').replaceAll(rootPassword, '[test secret]')); } catch {}
  throw error;
} finally {
  try { compose('down', '--volumes', '--remove-orphans'); }
  finally { try { rmSync(temp, { recursive: true, force: true }); } catch { execFileSync('sudo', ['rm', '-rf', '--', temp]); } }
}
