// Generates and builds every version listed in versions.json into dist/<version>/, then builds
// the landing page at the root of dist/ and adds the shared root files: version catalogue,
// redirects of /latest/..., 404 page.
//
//   npm run build [-- --allow-incomplete-translation]
import { readFileSync, writeFileSync, rmSync, copyFileSync, cpSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { generate, ALLOW_INCOMPLETE_FLAG } from './generate.mjs';

const allowIncompleteTranslation = process.argv.includes(ALLOW_INCOMPLETE_FLAG);

const catalogue = JSON.parse(readFileSync('versions.json', 'utf-8'));
if (!catalogue.versions.length) {
	console.error('error: versions.json lists no version yet: see "Adding a version" in README.md');
	process.exit(1);
}
if (!catalogue.versions.every((v) => typeof v === 'string')) {
	console.error('error: "versions" in versions.json must be an array of strings, for example ["1.0.0"]');
	process.exit(1);
}
if (!catalogue.versions.includes(catalogue.latest)) {
	console.error(`error: "latest" in versions.json must be one of the listed versions`);
	process.exit(1);
}

rmSync('dist', { recursive: true, force: true });
for (const id of catalogue.versions) {
	console.log(`\n=== Documentation ${id} ===`);
	try {
		generate(id, { allowIncompleteTranslation });
	} catch (e) {
		console.error(`error: ${e.message}`);
		process.exit(1);
	}
	// The content cache belongs to one version: clear it so versions never mix.
	for (const dir of ['.astro', 'node_modules/.astro']) rmSync(dir, { recursive: true, force: true });
	execSync('npx astro build', { stdio: 'inherit', env: { ...process.env, DOCS_VERSION: id } });
}

// Landing page: a separate Astro build (astro.landing.config.mjs), copied to the root of dist/.
console.log('\n=== Landing page ===');
for (const dir of ['.astro', 'node_modules/.astro', '.landing-dist']) rmSync(dir, { recursive: true, force: true });
execSync('npx astro build --config astro.landing.config.mjs', { stdio: 'inherit' });
cpSync('.landing-dist', 'dist', { recursive: true });
rmSync('.landing-dist', { recursive: true, force: true });

const latest = `/${catalogue.latest}/`;
writeFileSync('dist/versions.json', JSON.stringify(catalogue, null, '\t'));
// Cloudflare: "/latest/..." always leads to the newest version. "/" is the landing page.
writeFileSync('dist/_redirects', `/latest/* ${latest}:splat 302\n`);
copyFileSync(`dist/${catalogue.latest}/404.html`, 'dist/404.html');
copyFileSync('public/favicon.svg', 'dist/favicon.svg');
console.log(`\nBuilt ${catalogue.versions.length} version(s), latest ${catalogue.latest}.`);
