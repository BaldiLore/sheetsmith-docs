// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { version, base, generatedDir } from './src/lib/version.mjs';
import { satteri } from '@astrojs/markdown-satteri';
import baseLinks from './src/lib/base-links.mjs';

// In `astro dev` only one version is served, under its base: "/" and "/latest/..."
// redirect to it, as _redirects does in production. The handler is inserted after
// Astro's own middlewares are in place, so it sees the original URL first.
const devRootRedirect = {
	name: 'sheetsmith-dev-root-redirect',
	enforce: 'post',
	configureServer(server) {
		return () => {
			server.middlewares.stack.unshift({
				route: '',
				handle: (req, res, next) => {
					const path = (req.url ?? '/').split('?')[0];
					if (path === '/' || path === '/index.html' || path === '/latest' || path.startsWith('/latest/')) {
						const rest = path.startsWith('/latest') ? path.slice('/latest'.length) || '/' : '/';
						res.writeHead(302, { Location: base + rest });
						res.end();
						return;
					}
					next();
				},
			});
		};
	},
};

// Each documentation version is a separate build, published under /<version>/.
const sidebar = JSON.parse(readFileSync(`${generatedDir}/sidebar.json`, 'utf-8'));
// Languages of this version, as generated: English always, Italian when manual.it.md exists.
// With English only, no language selector is shown.
const languages = JSON.parse(readFileSync(`${generatedDir}/languages.json`, 'utf-8'));
const LABELS = { en: 'English', it: 'Italiano' };
const locales =
	languages.length > 1
		? Object.fromEntries(languages.map((l) => [l === 'en' ? 'root' : l, { label: LABELS[l], lang: l }]))
		: undefined;

export default defineConfig({
	site: 'https://sheetsmith.baldilorenzo.cloud',
	base,
	outDir: `./dist/${version}`,
	markdown: { processor: satteri({ hastPlugins: [baseLinks(base)] }) },
	vite: { plugins: [devRootRedirect] },
	integrations: [
		starlight({
			title: 'sheetsmith',
			description: 'Generate styled Excel files from annotated Java classes.',
			logo: { src: './src/assets/logo.svg' },
			favicon: '/favicon.svg',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/BaldiLore/sheetsmith' }],
			customCss: [
				'@fontsource-variable/schibsted-grotesk',
				'@fontsource-variable/jetbrains-mono',
				'./src/styles/theme.css',
			],
			components: {
				Hero: './src/components/Hero.astro',
				SiteTitle: './src/components/SiteTitle.astro',
				Banner: './src/components/Banner.astro',
			},
			// Content is generated in versions/<id>/.generated/docs instead of src/content/docs.
			markdown: { processedDirs: ['./versions/'] },
			...(locales && { locales, defaultLocale: 'root' }),
			sidebar,
		}),
	],
});
