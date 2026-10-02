// Facts about the published documentation that the landing page links to, read at build time.
// Commands run from the project root.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const catalogue = JSON.parse(readFileSync(join(process.cwd(), 'versions.json'), 'utf-8'));
if (!catalogue.versions.includes(catalogue.latest)) {
	throw new Error('"latest" in versions.json must be one of the listed versions');
}

/** The latest release, as listed in versions.json. */
export const latest = catalogue.latest;

const versionDir = join(process.cwd(), 'versions', latest);

/** First page of the page map of the latest release: where the documentation starts. */
function firstPage(items) {
	for (const item of items) {
		if (item.path) return item.path;
		if (item.items) {
			const found = firstPage(item.items);
			if (found) return found;
		}
	}
	return null;
}
const pages = JSON.parse(readFileSync(join(versionDir, 'pages.json'), 'utf-8'));
const start = firstPage(pages.groups);
if (!start) throw new Error(`versions/${latest}/pages.json has no page`);

/** Languages of the landing page: Italian only when the latest release has an Italian manual. */
export const languages = existsSync(join(versionDir, 'manual.it.md')) ? ['en', 'it'] : ['en'];

/** Address of a page of the landing in one language. */
export const landingUrl = (lang) => (lang === 'en' ? '/' : `/${lang}/`);

/** External and documentation links of the landing page. */
export const links = (lang) => ({
	docs: `/${latest}/${lang === 'en' ? '' : `${lang}/`}${start}/`,
	javadoc: `https://javadoc.io/doc/cloud.baldilorenzo/sheetsmith-core/${latest}`,
	maven: `https://central.sonatype.com/artifact/cloud.baldilorenzo/sheetsmith-spring-boot-starter/${latest}`,
	github: 'https://github.com/BaldiLore/sheetsmith',
	author: 'https://baldilorenzo.it',
});
