// Development server for one version (default: latest):
//
//   npm run dev [-- <version>] [--allow-incomplete-translation]
//
// Pages are regenerated whenever a manual, pages.json or a home template change.
import { readFileSync, watch, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { generate, LANGUAGES, ALLOW_INCOMPLETE_FLAG } from './generate.mjs';

const catalogue = JSON.parse(readFileSync('versions.json', 'utf-8'));
const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('--')) ?? catalogue.latest;
const allowIncompleteTranslation = args.includes(ALLOW_INCOMPLETE_FLAG);
if (!version) {
	console.error('error: versions.json lists no version yet: see "Adding a version" in README.md');
	process.exit(1);
}

const regenerate = () => {
	try {
		generate(version, { allowIncompleteTranslation });
		return true;
	} catch (e) {
		console.error(`error: ${e.message}`);
		return false;
	}
};
if (!regenerate()) process.exit(1);

let timer;
const watched = [
	`versions/${version}/pages.json`,
	...LANGUAGES.flatMap((l) => [`versions/${version}/${l.manual}`, `templates/${l.home}`]),
];
// A language added while the server runs (a new manual.it.md) needs a restart.
for (const file of watched.filter((f) => existsSync(f))) {
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
