// Run only on disposable CI runners: fresh data and synthetic accounts, no NAS paths.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, deflateSync } from 'node:zlib';

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
async function waitFor(check, label, timeout = 300000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try { const result = await check(); if (result) return result; } catch (error) { last = error; }
    await pause(2000);
  }
  throw new Error(`Timeout: ${label}${last ? ` (${last.message})` : ''}`);
}
let base;
async function request(path, method = 'GET', body, token, timeout = 10000) {
  const multipart = body instanceof FormData;
  return fetch(base + path, {
    method, headers: { ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: multipart ? body : body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeout)
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
function testPicture() {
  // Original deterministic RGB fixture; no personal or downloaded photos.
  const side = 128;
  const pixels = Buffer.alloc(side * (1 + side * 3));
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const offset = y * (1 + side * 3) + 1 + x * 3;
    pixels[offset] = x * 2; pixels[offset + 1] = y * 2; pixels[offset + 2] = 100;
  }
  const chunk = (name, data) => {
    const type = Buffer.from(name);
    const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
    return Buffer.concat([length, type, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(side); header.writeUInt32BE(side, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function original(id, token) {
  const response = await request(`/api/assets/${id}/original`, 'GET', undefined, token);
  assert.equal(response.status, 200);
  return Buffer.from(await response.arrayBuffer());
}
async function smartSearch(id, token) {
  await waitFor(async () => {
    const response = await request('/api/search/smart', 'POST', { query: 'a colorful abstract image', size: 10 }, token, 120000);
    if (!response.ok) throw new Error(`Smart search HTTP ${response.status}: ${await response.text()}`);
    return (await response.json()).assets.items.some(item => item.id === id);
  }, 'actual image/text ML inference and VectorChord search result', 600000);
}
try {
  // Only retry registry throttling, before any container or database mutation.
  // Serialize services so concurrent large image downloads do not amplify it.
  for (let attempt = 0; ; attempt++) {
    try { compose('--parallel', '1', 'pull'); break; }
    catch (error) {
      if (attempt >= 2 || !/toomanyrequests|too many requests|\b429\b/i.test(String(error.stderr ?? error.message))) throw error;
      const delay = (attempt + 1) * 20000;
      console.log(`Registry throttled image download; retrying in ${delay / 1000}s.`);
      await pause(delay);
    }
  }
  compose('up', '-d');
  await ready();
  const serverVersion = await (await request('/api/server/version')).json();
  const imageReport = Object.fromEntries(Object.keys(expected).map(name => {
    const container = JSON.parse(docker('inspect', compose('ps', '-q', name).trim()))[0];
    const image = JSON.parse(docker('image', 'inspect', container.Image))[0];
    return [name, { channel: expected[name], imageId: image.Id, digests: image.RepoDigests, version: image.Config.Labels?.['org.opencontainers.image.version'] ?? null }];
  }));
  console.log('IMAGE_REPORT', JSON.stringify(imageReport));
  assert.equal((await request('/api/albums')).status, 401, 'Albums require authentication');
  assert.equal((await request('/api/auth/admin-sign-up', 'POST', { email: 'catalog@example.org', name: 'Catalog test', password })).status, 201);
  assert.equal((await request('/api/auth/login', 'POST', { email: 'catalog@example.org', password: 'incorrect' })).status, 401);
  let token = await login();
  const created = await request('/api/albums', 'POST', { albumName: 'TitanOS synthetic test' }, token);
  assert.equal(created.status, 201);
  const album = await created.json();
  const picture = testPicture();
  const upload = new FormData();
  upload.set('assetData', new Blob([picture], { type: 'image/png' }), 'titanos-synthetic.png');
  upload.set('fileCreatedAt', '2026-10-25T00:00:00.000Z');
  upload.set('fileModifiedAt', '2026-10-25T00:00:00.000Z');
  const uploaded = await request('/api/assets', 'POST', upload, token);
  assert.equal(uploaded.status, 201, `Upload: ${uploaded.status}`);
  const asset = await uploaded.json();
  assert.equal(sha256(await original(asset.id, token)), sha256(picture));
  await waitFor(async () => {
    const response = await request(`/api/assets/${asset.id}/thumbnail?size=thumbnail`, 'GET', undefined, token);
    return response.ok && response.headers.get('content-type')?.startsWith('image/') && (await response.arrayBuffer()).byteLength > 0;
  }, 'background thumbnail generation through the queue');
  await smartSearch(asset.id, token);
  console.log('PASS: synthetic PNG upload, exact original download, generated thumbnail and real ML-backed smart search.');
  const pgVersion = compose('exec', '-T', 'database', 'psql', '-U', 'postgres', '-d', 'immich', '-Atc', 'SHOW server_version;').trim();
  assert.match(pgVersion, /^18\./);
  const extensions = compose('exec', '-T', 'database', 'psql', '-U', 'postgres', '-d', 'immich', '-Atc', "SELECT extname FROM pg_extension WHERE extname IN ('vector','vchord') ORDER BY extname;").trim();
  assert.equal(extensions, 'vchord\nvector');
  const extensionVersions = compose('exec', '-T', 'database', 'psql', '-U', 'postgres', '-d', 'immich', '-Atc', "SELECT extname || ':' || extversion FROM pg_extension WHERE extname IN ('vector','vchord') ORDER BY extname;").trim();
  const valkeyInfo = compose('exec', '-T', 'redis', 'valkey-cli', 'INFO', 'server');
  const valkeyVersion = Object.fromEntries(valkeyInfo.split(/\r?\n/).filter(line => /^(redis_version|valkey_version):/.test(line)).map(line => line.split(':')));
  assert.ok(valkeyVersion.valkey_version || valkeyVersion.redis_version);
  console.log('VERSION_REPORT', JSON.stringify({ immich: serverVersion, valkey: valkeyVersion, postgres: pgVersion, extensions: extensionVersions }));
  assert.ok((await request('/')).ok, 'Immich WebUI served');
  compose('up', '-d', '--force-recreate');
  await ready();
  token = await login();
  const persisted = await request('/api/albums', 'GET', undefined, token);
  assert.equal(persisted.status, 200);
  assert.ok((await persisted.json()).some(item => item.id === album.id && item.albumName === 'TitanOS synthetic test'));
  assert.equal(sha256(await original(asset.id, token)), sha256(picture));
  await smartSearch(asset.id, token);
  for (const name of ['thumbnailGeneration', 'metadataExtraction', 'smartSearch']) {
    const response = await request(`/api/queues/${name}`, 'GET', undefined, token);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).statistics.failed, 0, `${name} has no failed jobs`);
  }
  console.log(`PASS: all four rolling images healthy; PostgreSQL ${pgVersion}, vector/vchord, authentication and album persisted after recreation.`);
  console.log('PASS: original image and ML search result persisted after all containers were recreated; relevant queues have no failed jobs.');
  console.log('No PostgreSQL-14 migration, video transcoding, face-recognition quality, GPU or real NAS data tested.');
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
