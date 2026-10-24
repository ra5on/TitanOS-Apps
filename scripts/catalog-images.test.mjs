// Verify catalog defaults and real image editing against an unchanged TitanOS checkout.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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
    for (const [name, service] of Object.entries(source.services)) {
      services++;
      assert.ok(service.image && !service.image.includes('${') && !service.image.includes('@'), `${name}: image selection must not depend on an unsaved container variable or digest`);
      const colon = service.image.lastIndexOf(':');
      const repository = service.image.slice(0, colon);
      assert.equal(service.image, `${repository}:${exceptions[repository] ?? 'latest'}`);
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
    for (const field of form.vars) assert.ok(!['NODE_RED_IMAGE_TAG', 'BAMBU_STUDIO_VERSION', 'NEXTCLOUD_VERSION', 'MARIADB_VERSION'].includes(field.name), 'Ineffective image-version fields must not be offered');
  });
}
test('the complete catalog was covered', () => {
  assert.ok(apps >= 50);
  assert.ok(services >= apps);
  console.log(`Checked ${apps} apps and ${services} services using the unchanged TitanOS install builder and editor.`);
});
