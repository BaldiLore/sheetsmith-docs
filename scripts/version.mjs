// Development server for one version: npm run dev [-- <version>]   (default: latest)
// Pages are regenerated whenever manual.md, pages.json or the home template change.
import { readFileSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { generate } from './generate.mjs';

const catalogue = JSON.parse(readFileSync('versions.json', 'utf-8'));
const version = process.argv[2] ?? catalogue.latest;
if (!version) {
	console.error('error: versions.json lists no version yet: see "Adding a version" in README.md');
	process.exit(1);
}

const regenerate = () => {
	try {
		generate(version);
		return true;
	} catch (e) {
		console.error(`error: ${e.message}`);
		return false;
	}
};
if (!regenerate()) process.exit(1);

let timer;
for (const file of [`versions/${version}/manual.md`, `versions/${version}/pages.json`, 'templates/home.mdx']) {
	watch(file, () => {
		clearTimeout(timer);
		timer = setTimeout(regenerate, 200);
	});
}

spawn('npx', ['astro', 'dev'], {
	stdio: 'inherit',
	env: { ...process.env, DOCS_VERSION: version },
	shell: process.platform === 'win32',
});
