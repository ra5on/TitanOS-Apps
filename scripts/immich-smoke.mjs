// Run only on disposable CI runners: fresh data and synthetic accounts, no NAS paths.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const temp = mkdtempSync(join(tmpdir(), 'immich-catalog-'));
const project = `immich-smoke-${randomBytes(6).toString('hex')}`;
const password = randomBytes(24).toString('hex');
const dbPassword = randomBytes(24).toString('hex');
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024 });
const compose = (...args) => docker('compose', '-p', project, '-f', join(temp, 'compose.json'), ...args);
const config = JSON.parse(docker('compose', '-f', 'immich/compose.yaml', 'config', '--format', 'json'));
const expected = {
  'immich-server': 'ghcr.io/immich-app/immich-server:release',
  'immich-machine-learning': 'ghcr.io/immich-app/immich-machine-learning:release',
  redis: 'docker.io/valkey/valkey:latest',
  database: 'ghcr.io/tensorchord/vchord-suite:pg18-latest'
};
for (const [name, service] of Object.entries(config.services)) {
  assert.equal(service.image, expected[name]);
  assert.ok(!service.container_name && !service.privileged && !service.devices && !service.network_mode);
  if (name !== 'immich-server') assert.ok(!service.ports?.length);
  for (const mount of service.volumes ?? []) {
    assert.equal(mount.type, 'bind');
    mount.source = join(temp, name, mount.target.replaceAll('/', '_'));
    mkdirSync(mount.source, { recursive: true });
  }
}
assert.ok(config.services.database.volumes.some(mount => mount.target === '/var/lib/postgresql'));
config.services['immich-server'].ports = [{ target: 2283, published: '0', host_ip: '127.0.0.1', protocol: 'tcp' }];
config.services['immich-server'].environment.DB_PASSWORD = dbPassword;
config.services.database.environment.POSTGRES_PASSWORD = dbPassword;
for (const name of ['immich-server', 'immich-machine-learning']) config.services[name].environment.TZ = 'Europe/Berlin';
writeFileSync(join(temp, 'compose.json'), JSON.stringify({ services: config.services }), { mode: 0o600 });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, label) {
  const deadline = Date.now() + 300000;
  let last;
  while (Date.now() < deadline) {
    try { const result = await check(); if (result) return result; } catch (error) { last = error; }
    await pause(2000);
  }
  throw new Error(`Timeout: ${label}${last ? ` (${last.message})` : ''}`);
}
let base;
async function request(path, method = 'GET', body, token) {
  return fetch(base + path, {
    method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000)
  });
}
async function ready() {
  base = `http://${compose('port', 'immich-server', '2283').trim()}`;
  await waitFor(async () => (await request('/api/server/ping')).ok, 'Immich server startup');
  await waitFor(() => Object.keys(expected).every(name => {
    const id = compose('ps', '-q', name).trim();
    if (!id) return false;
    const state = JSON.parse(docker('inspect', id))[0].State;
    return state.Running && (!state.Health || state.Health.Status === 'healthy');
  }), 'all four services healthy');
}
async function login() {
  const response = await request('/api/auth/login', 'POST', { email: 'catalog@example.org', password });
  assert.equal(response.status, 201, 'Administrator login');
  const data = await response.json();
  assert.ok(data.accessToken);
  return data.accessToken;
}
try {
  compose('pull');
  compose('up', '-d');
  await ready();
  assert.equal((await request('/api/albums')).status, 401, 'Albums require authentication');
  assert.equal((await request('/api/auth/admin-sign-up', 'POST', { email: 'catalog@example.org', name: 'Catalog test', password })).status, 201);
  assert.equal((await request('/api/auth/login', 'POST', { email: 'catalog@example.org', password: 'incorrect' })).status, 401);
  let token = await login();
  const created = await request('/api/albums', 'POST', { albumName: 'TitanOS synthetic test' }, token);
  assert.equal(created.status, 201);
  const album = await created.json();
  const pgVersion = compose('exec', '-T', 'database', 'psql', '-U', 'postgres', '-d', 'immich', '-Atc', 'SHOW server_version;').trim();
  assert.match(pgVersion, /^18\./);
  const extensions = compose('exec', '-T', 'database', 'psql', '-U', 'postgres', '-d', 'immich', '-Atc', "SELECT extname FROM pg_extension WHERE extname IN ('vector','vchord') ORDER BY extname;").trim();
  assert.equal(extensions, 'vchord\nvector');
  assert.ok((await request('/')).ok, 'Immich WebUI served');
  compose('up', '-d', '--force-recreate');
  await ready();
  token = await login();
  const persisted = await request('/api/albums', 'GET', undefined, token);
  assert.equal(persisted.status, 200);
  assert.ok((await persisted.json()).some(item => item.id === album.id && item.albumName === 'TitanOS synthetic test'));
  console.log(`PASS: all four rolling images healthy; PostgreSQL ${pgVersion}, vector/vchord, authentication and album persisted after recreation.`);
  console.log('No PostgreSQL-14 migration, photo/ML processing, GPU or real NAS data tested.');
} catch (error) {
  try { console.error(compose('logs', '--no-color', '--tail', '50').replaceAll(password, '[test secret]').replaceAll(dbPassword, '[test secret]')); } catch {}
  throw error;
} finally {
  // Remove the unique project and only its own disposable data, including root-owned DB files.
  try { compose('down', '--volumes', '--remove-orphans'); }
  finally {
    try { docker('run', '--rm', '-v', `${temp}:/cleanup`, 'alpine:3', 'sh', '-c', 'rm -rf /cleanup/*'); }
    finally { rmSync(temp, { recursive: true, force: true }); }
  }
}
