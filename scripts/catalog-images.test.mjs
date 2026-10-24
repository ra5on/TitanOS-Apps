// Verify catalog defaults and real image editing against an unchanged TitanOS checkout.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';

const titanos = process.env.TITANOS_DIR;
assert.ok(titanos, 'TITANOS_DIR must point at an unchanged TitanOS checkout');
const { parse, parseDocument } = await import(`${titanos}/web/node_modules/yaml/dist/index.js`);
const { readTemplate, build } = await import(`${titanos}/web/src/lib/compose/template.ts`);
const { readService, writeService } = await import(`${titanos}/web/src/lib/compose/service.ts`);
const root = resolve(import.meta.dirname, '..');
const exceptions = {
  'ghcr.io/blakeblackshear/frigate': 'stable',
  'ghcr.io/immich-app/immich-server': 'release',
  'ghcr.io/immich-app/immich-machine-learning': 'release',
  'ghcr.io/tensorchord/vchord-suite': 'pg18-latest'
};
let apps = 0, services = 0;
for (const app of readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))) {
  let compose;
  try { compose = readFileSync(resolve(root, app.name, 'compose.yaml'), 'utf8'); } catch { continue; }
  apps++;
  test(`${app.name}: current channels survive installation and each service accepts a chosen image version`, () => {
    const template = { compose, timezone: 'Europe/Berlin', uid: 1000, gid: 100, appdata: '/mnt/test/appdata', listening: [], missingDevices: [] };
    const form = readTemplate(template, app.name, [], new Map());
    const installed = build(template, form);
    const source = parse(compose);
    const before = parse(installed.compose);
    const choices = {};
    for (const [name, service] of Object.entries(source.services)) {
      services++;
      const match = /^(.*):\$\{([A-Z][A-Z0-9_]*):-([^}]+)\}$/.exec(service.image);
      assert.ok(match, `${name}: each service needs an explicit Compose image-tag variable and default`);
      const [, repository, variable, fallback] = match;
      assert.equal(fallback, exceptions[repository] ?? 'latest');
      assert.equal(variable, `${app.name}_${name}_IMAGE_TAG`.toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
      choices[name] = { repository, variable, fallback, selected: `test-version-${Object.keys(choices).length}` };
      assert.equal(before.services[name].image, service.image, 'Install builder preserves the image choice');
      for (const tag of ['latest', '1.2.3-test']) {
        const document = parseDocument(installed.compose);
        const editable = readService(document, name);
        editable.image = `${repository}:${tag}`;
        writeService(document, name, editable);
        const after = parse(document.toString());
        assert.equal(after.services[name].image, `${repository}:${tag}`);
        after.services[name].image = before.services[name].image;
        assert.deepEqual(after, before, 'Changing one image must preserve other services, data paths and settings');
      }
    }
    // Exercise actual Compose interpolation: defaults and a different selected tag
    // for every container, supplied through the same --env-file mechanism as TitanOS.
    const directory = mkdtempSync(resolve(tmpdir(), 'catalog-image-tags-'));
    try {
      const file = resolve(directory, 'compose.yaml'), envFile = resolve(directory, '.env');
      writeFileSync(file, installed.compose, { mode: 0o600 });
      const env = Object.entries(installed.env).map(([name, value]) => `${name}='${value}'`).join('\n') + '\n';
      const render = () => JSON.parse(execFileSync(process.env.COMPOSE_BIN ?? 'docker', [
        ...(process.env.COMPOSE_BIN ? [] : ['compose']), '--project-directory', directory,
        '--env-file', envFile, '-f', file, 'config', '--format', 'json'
      ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
      writeFileSync(envFile, env, { mode: 0o600 });
      const defaults = render();
      const example = readFileSync(resolve(root, app.name, '.env.example'), 'utf8');
      for (const [name, choice] of Object.entries(choices)) {
        assert.equal(defaults.services[name].image, `${choice.repository}:${choice.fallback}`);
        assert.ok(example.split('\n').includes(`${choice.variable}=${choice.fallback}`));
      }
      writeFileSync(envFile, env + Object.values(choices).map(choice => `${choice.variable}=${choice.selected}`).join('\n') + '\n', { mode: 0o600 });
      const selected = render();
      for (const [name, choice] of Object.entries(choices)) assert.equal(selected.services[name].image, `${choice.repository}:${choice.selected}`, 'Compose uses the selected per-container version');
    } finally { rmSync(directory, { recursive: true, force: true }); }
    for (const field of form.vars) assert.ok(!['NODE_RED_IMAGE_TAG', 'BAMBU_STUDIO_VERSION', 'NEXTCLOUD_VERSION', 'MARIADB_VERSION'].includes(field.name), 'Ineffective image-version fields must not be offered');
  });
}
test('the complete catalog was covered', () => {
  assert.ok(apps >= 50);
  assert.ok(services >= apps);
  console.log(`Checked ${apps} apps and ${services} services using unchanged TitanOS, real Compose tag interpolation and independent version selection.`);
});
