// What TitanOS shows of each template and each skill: checked here, before
// a push reaches every NAS within a day.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const titanos = process.env.TITANOS_DIR;
assert.ok(titanos, 'TITANOS_DIR must point at a TitanOS checkout');
const { parse } = await import(`${titanos}/web/node_modules/yaml/dist/index.js`);
const root = resolve(import.meta.dirname, '..');

// The categories the app store of TitanOS has a name for (routes/apps/+page.svelte).
const CATEGORIES = ['media', 'photos', 'backup', 'security', 'productivity', 'development', 'network', 'home', 'ai', 'finance', 'social', 'games'];
const icons = JSON.parse(readFileSync(resolve(root, 'icons.json'), 'utf8'));

const both = (value, what) => {
	assert.equal(typeof value, 'object', `${what}: German and English text`);
	for (const lang of ['de', 'en']) {
		assert.ok(typeof value?.[lang] === 'string' && value[lang].trim() !== '', `${what}: ${lang} is missing`);
	}
};
const label = (value, what) => {
	if (typeof value === 'string') assert.ok(value.trim() !== '', `${what}: empty label`);
	else both(value, what);
};
// Every way a Compose service names a port of the host or of the container.
const servicePorts = (services) => {
	const found = new Set();
	for (const service of Object.values(services)) {
		for (const entry of service.ports ?? []) {
			const text = typeof entry === 'object' ? `${entry.published ?? ''}:${entry.target ?? ''}` : String(entry);
			for (const number of text.replace(/\/(tcp|udp)$/, '').match(/\d+/g) ?? []) found.add(number);
			for (const variable of text.match(/\$\{([A-Z0-9_]+)/g) ?? []) found.add(variable.slice(2));
		}
		if (service.network_mode === 'host') found.add('*');
	}
	return found;
};

const apps = readdirSync(root, { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && existsSync(resolve(root, entry.name, 'compose.yaml')))
	.map((entry) => entry.name);

for (const app of apps) {
	test(`${app}: metadata`, () => {
		const doc = parse(readFileSync(resolve(root, app, 'compose.yaml'), 'utf8'));
		const meta = doc['x-titanos'];
		assert.equal(typeof meta, 'object', 'x-titanos is missing');
		assert.ok(typeof meta.name === 'string' && meta.name.trim() !== '', 'name');
		assert.ok(CATEGORIES.includes(meta.category), `category ${meta.category} has no name in TitanOS`);
		// One service needs no main; several do.
		if (meta.main !== undefined || Object.keys(doc.services).length > 1) assert.ok(Object.hasOwn(doc.services, meta.main), `main names no service: ${meta.main}`);
		both(meta.description, 'description');
		if (meta.tips !== undefined) both(meta.tips, 'tips');
		assert.match(String(meta.icon), /^https:\/\/\S+$/, 'icon is an https address');
		assert.equal(icons[app], meta.icon, 'icons.json and the template name the same icon');

		for (const [name, variable] of Object.entries(meta.variables ?? {})) {
			assert.match(name, /^[A-Za-z_][A-Za-z0-9_]*$/, `variable ${name}`);
			// A variable that takes its value from another one has no field.
			if (variable?.from !== undefined) continue;
			label(variable?.label, `variable ${name}`);
			if (variable.secret !== undefined) {
				assert.ok(variable.secret === true || variable.secret === 'generate', `variable ${name}: secret is true or generate`);
				assert.equal(variable.default, undefined, `variable ${name}: a secret has no preset value`);
			}
		}
		for (const [path, entry] of Object.entries(meta.paths ?? {})) {
			assert.ok(path.startsWith('/'), `path ${path} is absolute`);
			label(entry?.label, `path ${path}`);
		}
		const known = servicePorts(doc.services);
		for (const [port, entry] of Object.entries(meta.ports ?? {})) {
			label(entry?.label, `port ${port}`);
			assert.ok(known.has('*') || known.has(String(port).replace(/\/(tcp|udp)$/, '')), `port ${port} is described, but no service publishes it`);
		}
	});
}

test('icons.json names only templates that exist', () => {
	for (const name of Object.keys(icons)) assert.ok(apps.includes(name), `${name} has an icon and no template`);
});

// Skills: the rules of backend/internal/catalog/skills.go in TitanOS; a
// skill that breaks one is dropped there without a word.
const skillsDir = resolve(root, 'skills');
for (const entry of readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
	test(`skill ${entry.name}`, () => {
		assert.match(entry.name, /^[a-z0-9][a-z0-9-]{0,63}$/, 'folder name');
		const skill = parse(readFileSync(resolve(skillsDir, entry.name, 'skill.yaml'), 'utf8'));
		const bytes = (text) => Buffer.byteLength(String(text ?? '').trim());
		assert.ok(bytes(skill.name) > 0 && bytes(skill.name) <= 80, 'name: 1 to 80 bytes');
		assert.ok(bytes(skill.description) > 0 && bytes(skill.description) <= 300, 'description: 1 to 300 bytes');
		assert.equal(skill.author, 'ra5on', 'author');
		assert.ok(bytes(skill.when) > 0 && bytes(skill.steps) > 0, 'when and steps');
		assert.ok(bytes(skill.when) + bytes(skill.steps) <= 4000, 'when and steps together: at most 4000 bytes');
		assert.ok(Array.isArray(skill.tools) && skill.tools.length > 0 && skill.tools.length <= 40, 'tools: 1 to 40');
		for (const tool of skill.tools) assert.match(tool, /^[a-z][a-z0-9_]{1,63}$/, `tool ${tool}`);
		// TitanOS reads every word with an underscore in the steps as a tool.
		for (const word of new Set(String(skill.steps).match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? [])) {
			assert.ok(skill.tools.includes(word), `steps name ${word}, tools do not`);
		}
	});
}
