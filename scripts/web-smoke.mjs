import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_PATH);
const [url, app] = process.argv.slice(2);
for (let retry = 0;; retry++) {
 try { assert.equal((await fetch(`${url}/healthz`)).status, 200); break; }
 catch (error) { if (retry === 20) throw error; await new Promise(r => setTimeout(r, 1000)); }
}
assert.equal((await fetch(`${url}/missing-file.wasm`)).status, 404);
const browser = await chromium.launch({args:['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--enable-webgl']});
try {
 const page = await browser.newPage(); const errors = []; const failed = [];
 page.on('pageerror', e => errors.push(e.message));
 page.on('response', r => { if (r.status() >= 400 && !/favicon|fonts\/manifest/.test(r.url())) failed.push(`${r.status()} ${r.url()}`); });
 await page.goto(`${url}/?webgl`, {waitUntil:'networkidle', timeout:120000});
 await page.waitForSelector('canvas', {state:'visible', timeout:120000});
 await page.waitForTimeout(5000);
 assert.equal(errors.length, 0, errors.join('\n'));
 assert.equal(failed.length, 0, failed.join('\n'));
 const canvas = await page.locator('canvas').first().boundingBox(); assert.ok(canvas.width > 100 && canvas.height > 100);
 await page.screenshot({path:`${app}-smoke.png`});
 console.log(`${app}: page, assets and WebAssembly canvas loaded`);
} finally { await browser.close(); }
