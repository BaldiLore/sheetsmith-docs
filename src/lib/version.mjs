// Resolves the documentation version being built. Commands run from the project root.
// DOCS_VERSION selects the version; without it, the latest one in versions.json is used.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// versions.json: { "latest": "1.0.1", "versions": ["1.0.1", "1.0.0"] }, one entry per release.
export const catalogue = JSON.parse(readFileSync(join(process.cwd(), 'versions.json'), 'utf-8'));
if (!catalogue.versions.every((v) => typeof v === 'string')) {
	throw new Error('versions.json: "versions" must be an array of strings, for example ["1.0.0"]');
}
if (!catalogue.versions.length) {
	throw new Error('No documentation version yet: see "Adding a version" in README.md');
}
export const version = process.env.DOCS_VERSION ?? catalogue.latest;
if (!catalogue.versions.includes(version)) throw new Error(`Unknown documentation version "${version}": add it to versions.json`);
export const base = `/${version}`;
/** Generated pages and sidebar of this version (see scripts/generate.mjs). */
export const generatedDir = `./versions/${version}/.generated`;
