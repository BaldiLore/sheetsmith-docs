// Generates the pages and the sidebar of one documentation version from its sources:
//
//   versions/<id>/manual.md      the English user manual (source of truth)
//   versions/<id>/manual.it.md   the Italian translation (optional)
//   versions/<id>/pages.json     which manual sections go to which page, and the sidebar
//   templates/home.mdx           the English home page, shared by every version
//   templates/home.it.mdx        the Italian home page, shared by every version
//
// <id> is the library release the manual documents, as listed in versions.json.
//
// Output: versions/<id>/.generated/ (never edit it: it is rewritten at every run).
//
//   npm run generate -- 1.0.0 [--allow-incomplete-translation]
//
// The run fails, writing nothing, when a manual section is not assigned to any page,
// is assigned twice, or when pages.json names a section the manual does not have.
// It also fails when the Italian manual does not have exactly the sections of the
// English one, unless --allow-incomplete-translation is given: then the Italian pages
// with missing sections are not generated, and the site shows them in English.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- manual parsing

// Appendices: "## Appendix A: ..." in English, "## Appendice A: ..." in Italian.
const H2 = /^## (?:(\d+)\. |(?:Appendix|Appendice) ([A-Z]): )(.*)$/;
const H3 = /^### (?:(\d+\.\d+|[A-Z]\.\d+) )?(.*)$/;
const H4 = /^#### (?:([\dA-Z]+\.\d+\.\d+) )?(.*)$/;

/** GitHub-style heading slug, as used by the manual's own anchors and by Starlight. */
function slugger() {
	const seen = new Map();
	return (text) => {
		const base = text.trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '').replace(/ /g, '-');
		const n = seen.get(base) ?? 0;
		seen.set(base, n + 1);
		return n === 0 ? base : `${base}-${n}`;
	};
}

/**
 * Splits the manual into chapters ("## 3. Concepts", "## Appendix A: ...") and sections
 * ("### 3.1 ..."). Everything before the first chapter (title, metadata, table of contents)
 * is ignored, and so are "---" separators.
 */
function parseManual(text) {
	const chapters = new Map();
	const headings = []; // { key, anchor, text, level }
	const slug = slugger();
	let chapter = null;
	let section = null;
	let inCode = false;

	for (const line of text.split(/\r?\n/)) {
		if (line.startsWith('```')) inCode = !inCode;
		if (!inCode) {
			const h2 = line.match(H2);
			if (line.startsWith('## ') && !h2) {
				slug(line.slice(3));
				chapter = null;
				continue;
			}
			if (h2) {
				const key = h2[1] ?? h2[2];
				chapter = { key, title: h2[3], intro: [], sections: new Map() };
				section = null;
				chapters.set(key, chapter);
				headings.push({ key: `${key}:intro`, anchor: slug(line.slice(3)), level: 2 });
				continue;
			}
			const h3 = chapter && line.match(H3);
			if (h3) {
				const key = h3[1] ?? `${chapter.key}.${chapter.sections.size + 1}`;
				section = [{ heading: 2, text: h3[2] }];
				chapter.sections.set(key, section);
				headings.push({ key, anchor: slug(line.slice(4)), text: h3[2], level: 3 });
				continue;
			}
			const h4 = chapter && section && line.match(H4);
			if (h4) {
				section.push({ heading: 3, text: h4[2] });
				headings.push({ key: [...chapter.sections.keys()].at(-1), anchor: slug(line.slice(5)), text: h4[2], level: 4 });
				continue;
			}
			if (line.trim() === '---') continue;
		}
		if (!chapter) continue;
		(section ?? chapter.intro).push({ line });
	}
	return { chapters, headings };
}

// ---------------------------------------------------------------- pages.json

/** Flattens the groups of pages.json into the list of pages, in sidebar order. */
function collectPages(items, out = []) {
	for (const item of items) {
		if (item.path) out.push(item);
		else if (item.items) collectPages(item.items, out);
	}
	return out;
}

/** "6" means the whole chapter, "6:intro" its introduction only, "6.2" one section. */
function expandKeys(keys, chapters) {
	const out = [];
	for (const k of keys) {
		if (!k.includes(':') && !k.includes('.') && chapters.has(k)) {
			out.push(`${k}:intro`, ...chapters.get(k).sections.keys());
		} else out.push(k);
	}
	return out;
}

function sectionItems(key, chapters) {
	if (key.endsWith(':intro')) return chapters.get(key.split(':')[0])?.intro;
	return chapters.get(key.split('.')[0])?.sections.get(key);
}

const isBlank = (items) => items.every((i) => i.line !== undefined && i.line.trim() === '');

function validate(pages, chapters) {
	const errors = [];
	const owner = new Map();
	for (const page of pages) {
		if (!page.title) errors.push(`page "${page.path}" has no title`);
		for (const key of expandKeys(page.sections ?? [], chapters)) {
			if (!sectionItems(key, chapters)) errors.push(`page "${page.path}" names section "${key}", which the manual does not have`);
			else if (owner.has(key)) errors.push(`section "${key}" is assigned to both "${owner.get(key)}" and "${page.path}"`);
			else owner.set(key, page.path);
		}
	}
	for (const [ck, chapter] of chapters) {
		const intro = `${ck}:intro`;
		if (!owner.has(intro) && !isBlank(chapter.intro)) {
			errors.push(`introduction of chapter ${ck} ("${chapter.title}") is not assigned to any page`);
		}
		for (const [sk, items] of chapter.sections) {
			if (!owner.has(sk)) errors.push(`section ${sk} ("${items[0].text}") is not assigned to any page`);
		}
	}
	return errors;
}

// ---------------------------------------------------------------- languages

/** Languages of the site. English is the root language, published without prefix. */
export const LANGUAGES = [
	{ id: 'en', manual: 'manual.md', home: 'home.mdx', prefix: '' },
	{ id: 'it', manual: 'manual.it.md', home: 'home.it.mdx', prefix: 'it' },
];
export const ALLOW_INCOMPLETE_FLAG = '--allow-incomplete-translation';

/** Every key of a manual that carries content: non-empty chapter introductions and sections. */
function contentKeys(chapters) {
	const keys = new Set();
	for (const [ck, chapter] of chapters) {
		if (!isBlank(chapter.intro)) keys.add(`${ck}:intro`);
		for (const sk of chapter.sections.keys()) keys.add(sk);
	}
	return keys;
}

/** Text of a page in one language: the language block of pages.json, or English. */
function localized(item, lang, field) {
	return (lang !== 'en' && item[lang]?.[field]) || item[field];
}

// ---------------------------------------------------------------- output

/**
 * @param {string} version release listed in versions.json
 * @param {{ allowIncompleteTranslation?: boolean }} [options]
 */
export function generate(version, { allowIncompleteTranslation = false } = {}) {
	const catalogue = JSON.parse(readFileSync(join(ROOT, 'versions.json'), 'utf-8'));
	if (!catalogue.versions.includes(version)) throw new Error(`version "${version}" is not listed in versions.json`);

	const dir = join(ROOT, 'versions', version);
	for (const f of ['manual.md', 'pages.json']) {
		if (!existsSync(join(dir, f))) throw new Error(`versions/${version}/${f} is missing`);
	}
	// {{release}} in pages.json and in the home templates: the release documented by this version.
	const fill = (s) => s.replaceAll('{{release}}', version);

	const config = JSON.parse(fill(readFileSync(join(dir, 'pages.json'), 'utf-8')));
	const pages = collectPages(config.groups);

	// English: the page map must match the manual exactly.
	const manuals = new Map();
	for (const lang of LANGUAGES) {
		if (existsSync(join(dir, lang.manual))) manuals.set(lang.id, parseManual(readFileSync(join(dir, lang.manual), 'utf-8')));
	}
	const en = manuals.get('en');
	const errors = validate(pages, en.chapters);
	if (errors.length) {
		throw new Error(`versions/${version}/pages.json does not match manual.md:\n  - ${errors.join('\n  - ')}`);
	}

	// Translations: same sections as English, unless explicitly allowed otherwise.
	const reference = contentKeys(en.chapters);
	const warnings = [];
	for (const lang of LANGUAGES.filter((l) => l.id !== 'en' && manuals.has(l.id))) {
		const keys = contentKeys(manuals.get(lang.id).chapters);
		const missing = [...reference].filter((k) => !keys.has(k));
		const extra = [...keys].filter((k) => !reference.has(k));
		if (!missing.length && !extra.length) continue;
		const list = [
			...missing.map((k) => `section ${k} of manual.md is missing`),
			...extra.map((k) => `section ${k} is not in manual.md`),
		];
		if (!allowIncompleteTranslation) {
			throw new Error(
				`versions/${version}/${lang.manual} does not have the sections of manual.md:\n  - ${list.join('\n  - ')}\n` +
					`Use ${ALLOW_INCOMPLETE_FLAG} to publish it anyway: pages with missing sections are shown in English.`,
			);
		}
		warnings.push(`${lang.manual} is incomplete, its pages with missing sections are shown in English:\n    - ${list.join('\n    - ')}`);
	}
	if (!existsSync(join(ROOT, 'templates', 'home.mdx'))) throw new Error('templates/home.mdx is missing');

	const out = join(dir, '.generated');
	rmSync(out, { recursive: true, force: true });

	const languages = [];
	const summary = [];
	for (const lang of LANGUAGES) {
		const manual = manuals.get(lang.id);
		if (!manual) continue;
		const home = join(ROOT, 'templates', lang.home);
		if (!existsSync(home)) throw new Error(`templates/${lang.home} is missing`);
		const result = writeLanguage(lang, manual, pages, en.chapters, join(out, 'docs', lang.prefix));
		writeFileSync(join(out, 'docs', lang.prefix, 'index.mdx'), fill(readFileSync(home, 'utf-8')));
		languages.push(lang.id);
		summary.push(`${lang.id} ${result.written}/${pages.length}`);
		if (result.unresolved.size) {
			warnings.push(`${lang.manual}: links to unknown anchors left as they are: ${[...result.unresolved].join(', ')}`);
		}
	}

	writeFileSync(join(out, 'sidebar.json'), JSON.stringify(toSidebar(config.groups), null, '\t'));
	writeFileSync(join(out, 'languages.json'), JSON.stringify(languages));

	const sections = [...en.chapters.values()].reduce((n, c) => n + c.sections.size, 0);
	console.log(`docs ${version}: ${pages.length} pages from ${en.chapters.size} chapters and ${sections} sections (pages per language: ${summary.join(', ')})`);
	for (const w of warnings) console.warn(`  warning: ${w}`);
}

/**
 * Writes the pages of one language. The structure (which sections make up each page,
 * single-section pages, folder indexes) always follows the English manual; the content
 * comes from the manual of the language. A page with sections missing in that manual
 * is not written, and Starlight shows the English page in its place.
 */
function writeLanguage(lang, manual, pages, reference, outDir) {
	const { chapters, headings } = manual;
	const prefix = lang.prefix ? `/${lang.prefix}` : '';

	// A page that is also the parent of other pages becomes the index of its folder.
	const parents = new Set(pages.flatMap((p) => p.path.split('/').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('/'))));
	const keysOf = new Map(pages.map((p) => [p.path, expandKeys(p.sections, reference)]));
	const single = (page) => {
		const keys = keysOf.get(page.path);
		return keys.length === 1 && !keys[0].includes(':');
	};
	const complete = (page) => keysOf.get(page.path).every((k) => sectionItems(k, chapters));
	const pageOf = new Map();
	for (const page of pages) for (const k of keysOf.get(page.path)) pageOf.set(k, page);

	// Anchors of this manual -> site URLs (without version: the build adds it).
	const anchors = new Map();
	const pageSlugs = new Map(pages.map((p) => [p.path, slugger()]));
	for (const h of headings) {
		const ch = chapters.get(h.key.split(':')[0]);
		const page = pageOf.get(h.key) ?? (ch && pageOf.get([...ch.sections.keys()][0]));
		if (!page) continue;
		let url = `${prefix}/${page.path}/`;
		const dropped = single(page) && h.level === 3;
		if (h.level > 2 && !dropped) url += '#' + pageSlugs.get(page.path)(h.text);
		anchors.set(h.anchor, url);
	}
	const unresolved = new Set();
	const fixLinks = (text) =>
		text.replace(/\]\(#([^)]+)\)/g, (m, a) => {
			if (anchors.has(a)) return `](${anchors.get(a)})`;
			unresolved.add(a);
			return m;
		});

	let written = 0;
	for (const page of pages) {
		if (!complete(page)) continue;
		const drop = single(page);
		const body = [];
		for (const key of keysOf.get(page.path)) {
			for (const item of sectionItems(key, chapters)) {
				if (item.heading) {
					if (drop && item.heading === 2) continue;
					body.push('', '#'.repeat(drop ? item.heading - 1 : item.heading) + ' ' + item.text);
				} else body.push(item.line);
			}
		}
		let text = fixLinks(body.join('\n')).trim().replace(/\n{3,}/g, '\n\n') + '\n';

		const title = localized(page, lang.id, 'title');
		const description = localized(page, lang.id, 'description') ?? '';
		let head = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\n---\n\n`;
		const mdx = page.mdx;
		if (mdx) {
			head += (mdx.imports ?? []).join('\n') + '\n\n';
			const r = lang.id === 'en' ? mdx.replaceSection : page[lang.id]?.mdx?.replaceSection;
			if (mdx.replaceSection && !r) {
				throw new Error(`page "${page.path}": "${lang.id}.mdx.replaceSection" is missing in pages.json`);
			}
			if (r) {
				const start = text.indexOf(`## ${r.heading}\n`);
				if (start < 0) throw new Error(`page "${page.path}" (${lang.manual}): section "${r.heading}" to replace not found`);
				const after = text.indexOf('\n## ', start + 1);
				text = text.slice(0, start) + `## ${r.heading}\n\n${r.content}\n` + (after < 0 ? '' : text.slice(after));
			}
		}
		const file = join(outDir, page.path + (parents.has(page.path) ? '/index' : '') + (mdx ? '.mdx' : '.md'));
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, head + text);
		written++;
	}
	mkdirSync(outDir, { recursive: true });
	return { written, unresolved };
}

/** pages.json groups -> Starlight sidebar configuration, with the Italian labels. */
function toSidebar(items) {
	const translations = (item, field) => {
		const out = {};
		for (const lang of LANGUAGES) if (lang.id !== 'en' && item[lang.id]?.[field]) out[lang.id] = item[lang.id][field];
		return Object.keys(out).length ? { translations: out } : {};
	};
	const badge = (item) => {
		if (!item.badge) return {};
		const texts = { en: item.badge.text };
		for (const lang of LANGUAGES) if (lang.id !== 'en' && item[lang.id]?.badge) texts[lang.id] = item[lang.id].badge;
		return { badge: { ...item.badge, text: Object.keys(texts).length > 1 ? texts : item.badge.text } };
	};
	return items.map((item) => {
		if (item.path) {
			if (!item.sidebarLabel && !item.badge) return item.path;
			// An explicit label replaces the page title in every language: translate it too.
			const label = item.sidebarLabel
				? { label: item.sidebarLabel, ...translations(item, item.it?.sidebarLabel ? 'sidebarLabel' : 'title') }
				: {};
			return { slug: item.path, ...label, ...badge(item) };
		}
		if (item.link) return { label: item.label, ...translations(item, 'label'), link: item.link, ...(item.newTab && { attrs: { target: '_blank' } }) };
		return { label: item.label, ...translations(item, 'label'), items: toSidebar(item.items) };
	});
}

// CLI: node scripts/generate.mjs <version> [--allow-incomplete-translation]
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	const args = process.argv.slice(2);
	const version = args.find((a) => !a.startsWith('--'));
	if (!version) {
		console.error(`usage: npm run generate -- <version> [${ALLOW_INCOMPLETE_FLAG}]`);
		process.exit(1);
	}
	try {
		generate(version, { allowIncompleteTranslation: args.includes(ALLOW_INCOMPLETE_FLAG) });
	} catch (e) {
		console.error(`error: ${e.message}`);
		process.exit(1);
	}
}
