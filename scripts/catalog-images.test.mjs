// Exercise the actual TitanOS 0.21 install and service editors, not a second renderer.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';

const titanos = process.env.TITANOS_DIR;
assert.ok(titanos, 'TITANOS_DIR must point at an unchanged TitanOS 0.21+ checkout');
const { parse, parseDocument } = await import(`${titanos}/web/node_modules/yaml/dist/index.js`);
const { readTemplate, build } = await import(`${titanos}/web/src/lib/compose/template.ts`);
const { readService, writeService } = await import(`${titanos}/web/src/lib/compose/service.ts`);
const { imageReference, withImageTag, validImage } = await import(`${titanos}/web/src/lib/compose/image.ts`);
const root = resolve(import.meta.dirname, '..');
const exceptions = {
  'ghcr.io/blakeblackshear/frigate': 'stable',
  'ghcr.io/immich-app/immich-server': 'release',
  'ghcr.io/immich-app/immich-machine-learning': 'release',
  'ghcr.io/tensorchord/vchord-suite': 'pg18-latest'
};
let apps = 0, services = 0, stacks = 0;
for (const app of readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))) {
  let compose;
  try { compose = readFileSync(resolve(root, app.name, 'compose.yaml'), 'utf8'); } catch { continue; }
  apps++;
  test(`${app.name}: direct tags, independent install/editor changes and Compose round trips`, () => {
    const template = { compose, timezone: 'Europe/Berlin', uid: 1000, gid: 100, appdata: '/mnt/test/appdata', listening: [], missingDevices: [] };
    const form = readTemplate(template, app.name, [], new Map());
    const installed = build(template, form);
    const source = parse(compose);
    const before = parse(installed.compose);
    const names = Object.keys(source.services);
    assert.equal(form.images.length, names.length, 'Every service has its own install image field');
    if (names.length > 1) stacks++;
    const choices = {};
    for (const [name, service] of Object.entries(source.services)) {
      services++;
      const ref = imageReference(service.image);
      assert.ok(ref.simple && validImage(service.image), `${name}: the dedicated tag field must be editable without replacing an expression`);
      assert.equal(ref.tag, exceptions[ref.repository] ?? 'latest');
      assert.equal(before.services[name].image, service.image);
      const field = form.images.find(field => field.service === name);
      assert.equal(field.image, service.image);
      choices[name] = { ...ref, selected: `test-version-${Object.keys(choices).length}` };
      for (const tag of ['latest', '1.2.3-test']) {
        // Exactly the helper used by ImageField.svelte in the installation panel.
        const selected = structuredClone(form);
        selected.images.find(field => field.service === name).image = withImageTag(field.image, tag);
        const result = build(template, selected);
        const after = parse(result.compose);
        assert.equal(after.services[name].image, `${ref.repository}:${tag}`);
        after.services[name].image = before.services[name].image;
        assert.deepEqual(after, before, 'Install: other services, paths, secrets and settings remain intact');
        assert.deepEqual(result.env, installed.env, 'Generated secrets remain unchanged');
        const reopened = readTemplate({ ...template, compose: result.compose }, app.name, [], new Map());
        assert.equal(reopened.images.find(field => field.service === name).image, `${ref.repository}:${tag}`);
        const document = parseDocument(installed.compose);
        const editable = readService(document, name);
        editable.image = withImageTag(editable.image, tag);
        writeService(document, name, editable);
        const saved = parse(document.toString());
        assert.equal(readService(parseDocument(document.toString()), name).image, `${ref.repository}:${tag}`);
        saved.services[name].image = before.services[name].image;
        assert.deepEqual(saved, before, 'Editor: changing one service must leave all other content intact');
      }
    }
    // Give every stack service a DIFFERENT tag, resolve it using real Compose,
    // switch back to the install form and reopen the existing service editor.
    const selected = structuredClone(form);
    for (const field of selected.images) field.image = withImageTag(field.image, choices[field.service].selected);
    const changed = build(template, selected);
    const reopened = readTemplate({ ...template, compose: changed.compose }, app.name, [], new Map());
    const directory = mkdtempSync(resolve(tmpdir(), 'catalog-direct-tags-'));
    try {
      const file = resolve(directory, 'compose.yaml'), envFile = resolve(directory, '.env');
      writeFileSync(envFile, Object.entries(installed.env).map(([name, value]) => `${name}='${value}'`).join('\n') + '\n', { mode: 0o600 });
      const render = text => {
        writeFileSync(file, text, { mode: 0o600 });
        return JSON.parse(execFileSync(process.env.COMPOSE_BIN ?? 'docker', [
          ...(process.env.COMPOSE_BIN ? [] : ['compose']), '--project-directory', directory,
          '--env-file', envFile, '-f', file, 'config', '--format', 'json'
        ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
      };
      const defaults = render(installed.compose), resolved = render(changed.compose);
      for (const [name, choice] of Object.entries(choices)) {
        assert.equal(defaults.services[name].image, before.services[name].image);
        assert.equal(resolved.services[name].image, `${choice.repository}:${choice.selected}`);
        assert.equal(reopened.images.find(field => field.service === name).image, resolved.services[name].image);
        assert.equal(readService(parseDocument(changed.compose), name).image, resolved.services[name].image);
      }
    } finally { rmSync(directory, { recursive: true, force: true }); }
    for (const field of form.vars) assert.ok(!field.name.endsWith('_IMAGE_TAG'), 'Image tags belong in the dedicated field, not container environment');
  });
}
test('the complete catalog and multi-service stacks were covered', () => {
  assert.equal(apps, 53);
  assert.equal(services, 70);
  assert.ok(stacks >= 7);
  console.log(`Checked ${apps} apps, ${services} services and ${stacks} stacks using released TitanOS helpers and real Compose.`);
});

test('new apps retain secrets, share permissions, editable tags and network requirements', () => {
  const shares = [{ name: 'Music', path: '/mnt/Test/Music' }];
  for (const app of ['convertx', 'jdownloader-2', 'music-assistant']) {
    const compose = readFileSync(resolve(root, app, 'compose.yaml'), 'utf8');
    const template = { compose, timezone: 'Europe/Berlin', uid: 1000, gid: 100, appdata: '/mnt/Test/appdata', listening: [], missingDevices: [] };
    const form = readTemplate(template, app, shares, new Map([['3010/tcp', 'occupied'], ['5810/tcp', 'occupied']]));
    for (const field of form.vars) if (field.name === 'WEB_AUTHENTICATION_USERNAME') field.value = 'catalog-user';
    const built = build(template, form);
    const doc = parse(built.compose);
    const service = Object.values(doc.services)[0];
    assert.ok(service.labels['titanos.icon'].startsWith('https://'));
    for (const path of form.paths) assert.ok(path.host.startsWith('/mnt/Test/'));
    for (const port of form.ports) assert.ok(!['3010', '5810'].includes(port.host), 'occupied mapped ports are reassigned');
    if (app === 'music-assistant') {
      assert.ok(form.risks.includes('hostNetwork'));
      assert.equal(service.network_mode, 'host');
      assert.equal(form.ports.length, 0);
      assert.equal(service.labels['titanos.webui'], 'http://[host]:8095');
      assert.ok(service.volumes.includes('/mnt/Test/Music:/media:ro'));
      assert.ok(!service.cap_add && !service.privileged && !service.devices);
    } else {
      const secretName = app === 'convertx' ? 'JWT_SECRET' : 'WEB_AUTHENTICATION_PASSWORD';
      assert.ok(built.env[secretName].length >= 24);
      assert.equal(service.environment[secretName], '${' + secretName + '}');
      assert.ok(!built.compose.includes(built.env[secretName]));
      const reloaded = readTemplate({ ...template, compose: built.compose }, app, shares, new Map(), built.env);
      assert.equal(reloaded.vars.find(field => field.name === secretName).value, built.env[secretName]);
      if (app === 'jdownloader-2') assert.ok(service.volumes.includes('/mnt/Test/Music:/output'));
    }
  }
});
