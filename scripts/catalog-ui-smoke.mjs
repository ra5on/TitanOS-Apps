// Real catalog + real WebUI; every API response is an isolated fixture, no NAS access.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const titanos = process.env.TITANOS_DIR;
assert.ok(titanos, 'Set TITANOS_DIR to the released TitanOS checkout');
const { fixtureFactory } = await import(`${titanos}/scripts/test-ui-fixtures.mjs`);
const { parse } = await import(`${titanos}/web/node_modules/yaml/dist/index.js`);
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = resolve(import.meta.dirname, '..');
const base = process.env.UI_URL || 'http://127.0.0.1:5291';
const output = process.env.UI_OUTPUT || '/tmp/titanos-catalog-direct-ui';
mkdirSync(output, { recursive: true });
const apps = [];
for (const directory of readdirSync(root, { withFileTypes: true })) {
  if (!directory.isDirectory() || directory.name.startsWith('.')) continue;
  let compose;
  try { compose = readFileSync(resolve(root, directory.name, 'compose.yaml'), 'utf8'); } catch { continue; }
  const doc = parse(compose);
  apps.push({ id: directory.name, name: doc['x-titanos'].name, source: 'fixture', image: Object.values(doc.services)[0].image, category: doc['x-titanos'].category, compose });
}
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
const errors = [];
try {
  const { ctx, page } = await fixtureFactory(browser, errors)();
  // Block external icons; all content comes from the local app and isolated fixtures.
  await ctx.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.fallback() : route.abort());
  await ctx.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname.slice('/api/v1'.length);
    if (path === '/apps') return route.fulfill({ json: { sources: [{ id: 'fixture', name: 'Catalog Test', count: apps.length }], apps } });
    const match = /^\/apps\/sources\/fixture\/apps\/([^/]+)$/.exec(path);
    if (match) return route.fulfill({ json: { compose: apps.find(app => app.id === match[1]).compose, timezone: 'Europe/Berlin', uid: 1000, gid: 100, appdata: '/mnt/Data/appdata', missingDevices: [], listening: [] } });
    return route.fallback();
  });
  let count = 0;
  for (const app of apps) {
    await page.goto(base + '/apps');
    const search = page.getByRole('searchbox');
    if (await search.count()) await search.fill(app.name);
    await page.getByRole('button', { name: new RegExp(app.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first().click();
    const panel = page.getByRole('complementary');
    const original = parse(app.compose);
    const selected = {};
    let index = 0;
    for (const [service, spec] of Object.entries(original.services)) {
      const group = panel.getByRole('group', { name: service, exact: true });
      const tag = group.getByLabel('Image-Tag', { exact: true });
      assert.equal(await tag.isDisabled(), false, `${app.id}/${service}: tag is directly editable`);
      assert.equal(await tag.inputValue(), spec.image.slice(spec.image.lastIndexOf(':') + 1));
      selected[service] = spec.image.slice(0, spec.image.lastIndexOf(':') + 1) + `catalog-test-${index}`;
      await tag.fill(`catalog-test-${index++}`);
      count++;
    }
    await panel.getByRole('button', { name: 'Als Compose bearbeiten', exact: true }).click();
    const yaml = panel.getByRole('textbox', { name: 'Als Compose bearbeiten', exact: true });
    const edited = parse(await yaml.inputValue());
    for (const [service, image] of Object.entries(selected)) assert.equal(edited.services[service].image, image);
    await panel.getByRole('button', { name: 'Zurück zum Formular', exact: true }).click();
    for (const [service, image] of Object.entries(selected)) assert.equal(await panel.getByRole('group', { name: service, exact: true }).getByLabel('Image-Tag', { exact: true }).inputValue(), image.slice(image.lastIndexOf(':') + 1));
    if (app.id === 'nextcloud') {
      await page.screenshot({ path: `${output}/nextcloud-tags-desktop.png`, fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Mobile panel has no horizontal overflow');
      await page.screenshot({ path: `${output}/nextcloud-tags-mobile.png`, fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    console.log(`PASS ${app.id}: ${index} independent editable tags and YAML round trip`);
  }
  assert.equal(apps.length, 50);
  assert.equal(count, 66);
  assert.deepEqual(errors, []);
  console.log(`PASS: actual catalog UI for ${apps.length} apps and ${count} services; desktop/mobile, no NAS mutations.`);
} finally { await browser.close(); }
