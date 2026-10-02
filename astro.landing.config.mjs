// @ts-check
// Astro configuration of the landing page, published at the root of the site ("/" and "/it/").
// It is a separate build from the documentation: no Starlight, no version base. The sources
// are in landing/; `npm run build` copies the result to the root of dist/.
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://sheetsmith.baldilorenzo.cloud',
	srcDir: './landing',
	publicDir: './public',
	outDir: './.landing-dist',
	trailingSlash: 'always',
	// Port of `npm run dev:landing`, so that it can run next to `npm run dev`.
	server: { port: 4322 },
	devToolbar: { enabled: false },
});
