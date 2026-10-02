# sheetsmith documentation site

Source of the documentation site of sheetsmith, published at
`https://sheetsmith.baldilorenzo.cloud`.

Every release of the library has its own documentation, published under its own path
(`/1.0.0/`, `/1.0.1/`, `/1.1.0/`, ...). The documentation of each release is generated from
the single-file user manual of that release: the manual is the only source of truth, and the
site pages are never edited by hand.

The site is in English, and optionally in Italian for the releases whose manual has been
translated. English pages are published without language prefix (`/1.0.0/guides/presets/`),
Italian pages under `it/` (`/1.0.0/it/guides/presets/`).

The root of the site (`/`, and `/it/` in Italian) is the landing page of the library: a page
of its own, not versioned, that presents sheetsmith and links to the documentation of the
latest release.

The documentation is built with [Astro](https://astro.build) and its documentation theme
[Starlight](https://starlight.astro.build); the landing page is built with Astro alone. The
whole site is published as static files on Cloudflare.

## Contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Commands](#commands)
- [How the site works](#how-the-site-works)
- [Project structure](#project-structure)
- [Adding a version](#adding-a-version)
- [Page map reference (`pages.json`)](#page-map-reference-pagesjson)
- [Languages](#languages)
- [Landing page](#landing-page)
- [Customising the site](#customising-the-site)
- [Deployment on Cloudflare](#deployment-on-cloudflare)
- [Troubleshooting](#troubleshooting)

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | 22.12 or later |
| npm | 9.6.5 or later (bundled with Node.js) |

No other tool is required: every script of the project is written in JavaScript for Node.js.

## Getting started

```bash
npm install
```

A fresh copy of the project contains no documentation version. Add the first one following
[Adding a version](#adding-a-version), then start the development server:

```bash
npm run dev
```

and open `http://localhost:4321`. The landing page has its own development server,
`npm run dev:landing` (see [Landing page](#landing-page)).

## Commands

All commands are run from the project root.

| Command | Purpose |
| --- | --- |
| `npm install` | Installs the dependencies. |
| `npm run generate -- <version>` | Generates the pages of one version and checks its page map against its manuals. |
| `npm run dev [-- <version>]` | Starts the development server for one version. |
| `npm run dev:landing` | Starts the development server for the landing page. |
| `npm run build` | Generates and builds every version, ready for publication. |
| `npm run serve` | Serves the built site with every version, as it will be published. |

The commands `generate`, `dev`, `build` and `serve` are scripts of this project, kept in
`scripts/`. They are described below. `dev:landing` runs Astro directly, with the
configuration of the landing page.

`generate`, `dev` and `build` accept the option `--allow-incomplete-translation`, described
in [Incomplete translations](#incomplete-translations). It is passed after `--`, for example
`npm run build -- --allow-incomplete-translation`.

### `npm run generate -- <version>`

Script: `scripts/generate.mjs`.

Turns the sources of one version into the pages read by Astro. It does not produce HTML.

1. Reads `versions/<version>/manual.md`, the Italian manual `manual.it.md` when present, and
   `versions/<version>/pages.json`, and replaces the `{{release}}` placeholder with the
   version.
2. Splits each manual into chapters and sections, using the numbering of its headings.
3. Checks the page map against the English manual. When a section of the manual is not
   assigned to any page, is assigned to two pages, or when the page map names a section the
   manual does not have, the command stops, lists every problem and writes nothing.
4. Checks that the Italian manual has exactly the sections of the English one. When it does
   not, the command stops and lists the differences, unless
   `--allow-incomplete-translation` is given (see [Languages](#languages)).
5. Composes each page, in each language, from the sections assigned to it, converts the
   internal links of the manual into site links, and applies the MDX replacements declared
   in the page map.
6. Writes the pages, the sidebar, the list of languages and the redirects of the root of the
   version to `versions/<version>/.generated/`, after deleting its previous content.

**When to use it.** It is a local check, mainly used when a version or a translation is
added: it tells in a few seconds whether the page map covers the whole manual and whether
the translation matches it, without building the site.
It never needs to be run before publishing, because `build` and `dev` run the same
generation, with the same checks, themselves.

### `npm run dev [-- <version>]`

Script: `scripts/dev.mjs`.

Generates the pages of one version and starts the Astro development server for it, at
`http://localhost:4321/<version>/`. Without an argument it uses the latest version.

- The pages are regenerated whenever a manual or `pages.json` change, and the browser
  refreshes. A manual added while the server runs, such as a new `manual.it.md`,
  requires a restart.
- Changes to the theme and the components in `src/` are applied immediately.
- `/` and `/latest/...` redirect to the version being served, as in production.

**When to use it.** While writing or reviewing a manual, a page map, the theme or the
components. It serves one version at a time: the version selector lists the versions of
`versions.json`, but switching to another version requires `build` and `serve`.

### `npm run build`

Script: `scripts/build-all.mjs`.

Builds the complete site into `dist/`:

1. Checks `versions.json`.
2. For each version, runs the generation (with the same checks as `generate`) and the Astro
   build, which writes the version to `dist/<version>/`. Every version is rebuilt from its
   sources at every run.
3. Builds the landing page (see [Landing page](#landing-page)) and copies it to the root of
   `dist/`: `index.html`, `it/index.html` when the latest version is in Italian, and its
   assets in `_astro/`.
4. Writes the files shared by all versions at the root of `dist/`: `versions.json`, the
   redirects (`_redirects`), the `404.html` page and the favicon.

The build stops at the first error, so an incomplete site is never published.

**When to use it.** It is the command run by Cloudflare at every publication. Locally, it is
used before `serve` to review the whole site.

### `npm run serve`

Script: `scripts/serve.mjs`.

Serves the content of `dist/` at `http://localhost:4321`, with the landing page, every
version, the redirects of `/latest/...`, and the 404 page, as Cloudflare does.

**When to use it.** After `build`, to review the site exactly as it will be published,
including the links from the landing page to the documentation and switching between
versions.

## How the site works

### From the manual to the published site

```
versions/<version>/manual.md      ─┐
versions/<version>/manual.it.md   ─┤
versions/<version>/pages.json     ─┼─ generate ─▶ versions/<version>/.generated/ ─ Astro ─▶ dist/<version>/
                                  ─┘
landing/                          ─── Astro ─▶ dist/ (index.html, it/index.html)
```

1. **Generation.** `scripts/generate.mjs` splits the manual into site pages following the
   page map, and produces the sidebar.
2. **Astro build.** Astro reads the generated pages, converts the Markdown into HTML,
   highlights the code blocks at build time, and composes every page with the Starlight
   layout: header with search and theme selector, sidebar, table of contents of the page,
   links to the previous and next pages.
3. **Search index.** At the end of each build, Pagefind indexes the generated HTML and writes
   a static search index. The search runs in the browser, without external services, and
   each version has its own index.

The result is a set of static files: HTML, CSS, a small amount of JavaScript, fonts and the
search index. No server-side code runs when the site is visited.

### Versions

- **One version per release.** The identifier of a version is the release it documents
  (`1.0.0`), and the version is published under `/<version>/`. A published version is never
  renamed or replaced, so its links remain valid.
- **`versions.json`** lists the versions and the latest one:

  ```json
  {
  	"latest": "1.0.1",
  	"versions": ["1.0.1", "1.0.0"]
  }
  ```

  `versions` is the order of the version selector, newest first. `latest` decides where `/`
  and `/latest/...` lead, which version is marked as latest in the selector, and which
  versions show the notice for older versions.
- **Separate builds.** Each version is built separately, with its own pages, sidebar and
  search index. The theme and the components in `src/` are shared: every version is rebuilt
  at every publication and always has the current look.
- **Links without version.** The links produced from the manual do not contain the version
  (`/guides/presets/`); the build adds it (`/1.0.0/guides/presets/`). A page map copied from
  one version to the next works without changes.

### Navigation between versions

- **Version selector.** Next to the site title. When another version is chosen, the selector
  opens, in order of preference: the same page in the same language, keeping the section;
  the same page in English, when that version is not in Italian; the root of that version,
  which leads to its first page.
- **Notice for older versions.** Every page of a version other than the latest shows a notice
  with a link to the root of the latest version, in the same language when available.
- **Always up to date.** `versions.json` is also published at the root of the site, and the
  selector and the notice read it when a page is opened. A version built in the past
  therefore lists the versions published after it, without being rebuilt.
- **Stable entry points.** `/` is the landing page, which links to the latest version, and
  `/latest/<page>` leads to the same page in the latest version. `/latest/` leads to the
  start of the latest documentation. These are the links to use in the README of the
  library, on Maven Central and anywhere a link must always lead to the current
  documentation.
- **Root of a version.** `/<version>/` has no page of its own: it redirects to the first page
  of the page map (`/<version>/getting-started/introduction/` with the page map of 1.0.0),
  and `/<version>/it/` to the same page in Italian.

### Generation rules

- **Chapters and sections** are recognised from the headings of the manual:
  `## 3. Concepts` and `## Appendix A: Class census` are chapters, `### 3.1 ...` and
  `### A.1 ...` are sections, `#### 3.1.1 ...` are subsections. Everything before the first
  chapter (title, metadata, table of contents) is ignored, and so are `---` separators.
- **Headings.** The numbering is removed from the headings. Sections become second-level
  headings and subsections third-level headings. When a page contains a single section, the
  title of the page replaces the heading of the section, and its subsections become
  second-level headings.
- **Internal links.** Every link to an anchor of the manual (`[...](#93-the-contract)`) is
  converted into a link to the page, and the section, where that content is published.
  Links to anchors that do not exist are left unchanged and reported as a warning.
- **Appendices** are written `## Appendix A: ...` in English and `## Appendice A: ...` in
  Italian.
- **Root of the version.** No page is generated for it: `redirects.json` records, for each
  language, the first page of the page map, and the Astro build turns it into a redirect.

## Project structure

```
.
├── versions.json            Published versions and latest version
├── versions/
│   └── <version>/
│       ├── manual.md        User manual of the release (source of truth)
│       ├── manual.it.md     Italian translation of the manual (optional)
│       ├── pages.json       Page map and sidebar of the version
│       └── .generated/      Generated pages and sidebar (not committed)
├── templates/
│   └── pages.json           Page map for the structure of manual 1.0.0
├── landing/                 Landing page of the site (see "Landing page")
├── scripts/
│   ├── generate.mjs         Generation of the pages of one version
│   ├── dev.mjs              Development server
│   ├── build-all.mjs        Build of every version
│   └── serve.mjs            Local server for the built site
├── src/
│   ├── assets/logo.svg      Logo
│   ├── components/          Astro components (see below)
│   ├── lib/                 Shared code (see below)
│   ├── styles/theme.css     Colours, fonts and table styles
│   └── content.config.ts    Loads the generated pages of the version being built
├── public/favicon.svg       Favicon
├── astro.config.mjs         Astro and Starlight configuration of the documentation
├── astro.landing.config.mjs Astro configuration of the landing page
└── package.json             Dependencies and commands
```

`dist/`, `.landing-dist/`, `.astro/`, `node_modules/` and `versions/*/.generated/` are
produced by the commands and are excluded from version control.

### Components (`src/components/`)

| Component | Role |
| --- | --- |
| `SiteTitle.astro` | Site title followed by the version selector. The title leads to the landing page (`/`, or `/it/` from the Italian pages when the latest version is in Italian). Replaces the Starlight component. |
| `VersionSelect.astro` | Version selector. |
| `Banner.astro` | Notice shown on versions other than the latest. Replaces the Starlight component. |
| `SheetPreview.astro` | Renders a sheet in HTML with the colours of a preset, as the library writes it. |
| `PresetGallery.astro` | Interactive gallery of the presets, with a choice of accent colour. Used by the Presets page. |

### Shared code (`src/lib/`)

| File | Role |
| --- | --- |
| `version.mjs` | Resolves the version being built from `versions.json` and the `DOCS_VERSION` variable. |
| `i18n.js` | Texts of the project's components in English and Italian. The texts of Starlight itself are built in. |
| `versions-client.js` | Browser-side helpers of the selector and the notice: reads the published `versions.json` and finds the best page of another version, in the current language when it exists. |
| `base-links.mjs` | Adds the version to the internal links of the pages during the build. |
| `preset.js` | Colour computation of the presets: the same rules as the library, including half-to-even rounding, so that the gallery shows exactly the colours of the generated files. Also used by the landing page. |

## Adding a version

Each version is generated from two files kept in `versions/<version>/`:

| File | Content | Written by |
| --- | --- | --- |
| `manual.md` | The single-file user manual of the release, in English. | the author |
| `manual.it.md` | The Italian translation of the manual (optional). | the author |
| `pages.json` | Which sections of the manual make up each page, and the sidebar. | the author |
| `.generated/` | Pages and sidebar produced from the two files above. | the commands |

Corrections always go into `manual.md` or `pages.json`, never into the generated pages, which
are rewritten at every run.

### Procedure

1. **Create the folder** `versions/<version>/`, named after the release (`1.0.1`).

2. **Add the manual** of the release as `versions/<version>/manual.md` and, when it is
   available, its Italian translation as `versions/<version>/manual.it.md`.

3. **Add the page map** as `versions/<version>/pages.json`:
   - first version: copy `templates/pages.json`, written for the structure of manual 1.0.0;
   - later versions: copy `pages.json` of the previous version.

4. **Register the version** in `versions.json`: add it at the top of `versions` and set
   `latest` to it.

   ```json
   {
   	"latest": "1.0.1",
   	"versions": ["1.0.1", "1.0.0"]
   }
   ```

5. **Check the page map** against the manual:

   ```bash
   npm run generate -- 1.0.1
   ```

   If the manual has new sections, or no longer has some, the command lists them. Update
   `pages.json`, assigning each new section to an existing page or to a new page (see
   [Page map reference](#page-map-reference-pagesjson)), until the command completes.
   A new page also needs its Italian texts in its `it` block (see [Languages](#languages)).
   If the Italian manual does not match the English one, the command lists the differences.

6. **Review the version** with `npm run dev -- 1.0.1`.

7. **Review the whole site** with `npm run build` followed by `npm run serve`, checking in
   particular the version selector and the notice on the previous versions.

8. **Publish** by committing and pushing: Cloudflare builds and publishes the site.

Previous versions require no action: they are rebuilt from their own sources at every
publication, with an identical result.

## Page map reference (`pages.json`)

`pages.json` contains a `groups` array, which is also the sidebar, in order. Each element of
`groups`, and of any `items` array, is one of the following.

**Group**, a sidebar section, which can contain sub-groups:

```json
{ "label": "Guides", "items": [ ... ], "it": { "label": "Guide" } }
```

**Page**:

```json
{
	"path": "guides/presets",
	"title": "Presets",
	"description": "Ready-made table styles generated from one accent colour.",
	"sections": ["7"]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `path` | yes | Address of the page, without version: `guides/presets` is published as `/<version>/guides/presets/`. |
| `title` | yes | Title of the page. |
| `description` | no | Description of the page, used by search engines and link previews. |
| `sections` | yes | Content of the page taken from the manual, in order (see the keys below). |
| `sidebarLabel` | no | Label in the sidebar, when it differs from the title. |
| `badge` | no | Badge next to the label in the sidebar, for example `{ "text": "New", "variant": "tip" }`. Variants: `note`, `tip`, `caution`, `danger`, `success`, `default`. |
| `mdx` | no | Components inside the page (see below). |
| `it` | no | Italian texts of the page: `title`, `description`, `sidebarLabel`, `badge` (the badge text), `mdx` (see [Languages](#languages)). |

A page whose `path` is also the parent of other pages (`reference/annotations` together with
`reference/annotations/excel-sheet`) is published as the index of that folder.

**External link**, with an optional `it` block holding its Italian `label`:

```json
{ "label": "Javadoc", "link": "https://javadoc.io/doc/cloud.baldilorenzo/sheetsmith-core/{{release}}", "newTab": true }
```

### Section keys

| Key | Content |
| --- | --- |
| `"7"` | The whole chapter 7: its introduction and all its sections, including sections added by later manuals. |
| `"7:intro"` | Only the introduction of chapter 7, the text before its first section. |
| `"7.2"` | Only section 7.2, with its subsections. |
| `"A"`, `"A:intro"`, `"A.1"` | The same keys for the appendices. |

A whole-chapter key automatically includes new sections of that chapter. A list of single
sections does not: the check reports the new section until it is assigned.

### Components inside a page (`mdx`)

A page can replace one of its sections with content that uses components:

```json
"mdx": {
	"imports": ["import PresetGallery from '@components/PresetGallery.astro';"],
	"replaceSection": {
		"heading": "Visual examples",
		"content": "Choose an accent to see how each preset colours the same table.\n\n<PresetGallery />"
	}
}
```

The section whose heading is `heading` is replaced by `content`, up to the next section of
the same level. A page with `mdx` is published as MDX, that is Markdown with components.

### Placeholder

`{{release}}` is replaced by the version in every text of `pages.json`, for example in the
links to the Javadoc of the release.

## Languages

English is the main language of the site and the reference for every translation. Italian is
optional, and is enabled for each version separately.

### How a version gets Italian

A version is published in Italian when its folder contains `manual.it.md`. Otherwise the
version is in English only, and its pages show no language selector.

When a version is in both languages:

- every page exists in English and in Italian, at the same address with and without the
  `it/` prefix;
- the language selector in the header opens the same page in the other language;
- the interface of Starlight (search, table of contents, navigation, theme selector) and
  the texts of the project's components are in the language of the page;
- each language has its own search index.

`/latest/...` always leads to the English pages. The landing page is in English at `/`,
and in Italian at `/it/` when the latest version is in Italian.

### The Italian manual

`manual.it.md` is a translation of `manual.md` with the same structure: the same chapters,
the same sections and the same numbering, so that the same page map applies to both.
The titles, the text and the internal links are translated; internal links point to the
anchors of the Italian headings (for example `#93-il-contratto`).

The check run by `generate`, `dev` and `build` compares the two manuals section by section,
and stops when the Italian manual has missing or extra sections.

### Incomplete translations

To publish a version whose Italian manual is not complete yet, add the option
`--allow-incomplete-translation`:

```bash
npm run generate -- 1.0.0 --allow-incomplete-translation
npm run dev -- 1.0.0 --allow-incomplete-translation
npm run build -- --allow-incomplete-translation
```

With the option, the differences are reported as warnings instead of errors, and every
Italian page that would include a missing section is not generated: at its Italian address
the site shows the English page, with a notice that the content is not yet available in
Italian. Sections present only in the Italian manual are ignored.

The option applies to every version of the build. To publish with it from Cloudflare, use
`npm run build -- --allow-incomplete-translation` as build command, and restore
`npm run build` when the translation is complete, so that new differences are caught again.

### Italian texts outside the manual

| Text | Where |
| --- | --- |
| Titles, descriptions and sidebar labels of the pages | `it` blocks in `pages.json` |
| Labels of the sidebar groups and links | `it` blocks in `pages.json` |
| Landing page | `landing/lib/strings.js` |
| Texts of the components (notice, version selector, preset gallery) | `src/lib/i18n.js` |

A missing `it` text falls back to English. The only required one is the replacement of a
page with components: a page with `mdx.replaceSection` needs `it.mdx.replaceSection`, with
the heading of the replaced section as written in the Italian manual:

```json
"it": {
	"title": "Preset",
	"mdx": {
		"replaceSection": {
			"heading": "Esempi visivi",
			"content": "Scegliere un colore di accento per vedere come ciascun preset colora la stessa tabella.\n\n<PresetGallery />"
		}
	}
}
```

The imports of `mdx.imports` are shared by both languages.

## Landing page

The landing page is the page at the root of the site. It is not part of any version: there
is one landing page, always pointing to the latest release, built from `landing/` with its
own configuration, `astro.landing.config.mjs`, without Starlight.

### What it reads at build time

| Source | Use |
| --- | --- |
| `versions.json` | The latest release: version badge, Maven dependency, and links to its documentation, Javadoc and Maven Central page. |
| `versions/<latest>/pages.json` | Checks that the page `getting-started/introduction`, target of the "Get started" buttons, exists: the build stops when it does not. |
| `versions/<latest>/manual.it.md` | Whether the Italian landing page (`/it/`) is published. |

A new release therefore needs no change to the landing page: `npm run build` publishes it
with the links of the new latest version.

### Files

| File | Content |
| --- | --- |
| `landing/pages/[...lang].astro` | The page, generated once per language. |
| `landing/components/Showcase.astro` | The annotated class next to the sheet it produces, with the choice of preset and accent colour, and the highlight of the part of the sheet controlled by each line of the class. |
| `landing/components/CodeBlock.astro` | A code sample with its file name, highlighted at build time. |
| `landing/lib/samples.js` | Every code sample of the page, and the data of the sample sheet. |
| `landing/lib/strings.js` | Texts of the page in English and Italian. |
| `landing/lib/sheet.js` | Colours of the sample sheet, from `src/lib/preset.js`. |
| `landing/lib/site.js` | Latest release, languages and links, read at build time. |
| `landing/styles/landing.css` | Styles of the page, with the colours of `src/styles/theme.css`. |

The code samples use the public API of the library as written in its sources. When the API
of a new release changes, update `landing/lib/samples.js`; when a line of the showcase class
is added or removed, update `showcaseRegions` in the same file, which maps each line to the
part of the sheet it controls.

The header has a theme menu (dark, light, auto) and, when the site is in more than one
language, a language menu, each showing the current choice. The theme menu shares its choice
with the theme menu of the documentation, saved by Starlight in the browser, so the theme
stays the same when moving between the landing page and the documentation.

The buttons to the documentation open in the same tab; those to Javadoc, Maven Central and
GitHub open in a new tab.

### Working on it

```bash
npm run dev:landing
```

starts the development server of the landing page at `http://localhost:4322`, next to the
one of the documentation (`npm run dev`, port 4321). Its links to the documentation lead to
the documentation server only in the built site: to check them, use `npm run build` and
`npm run serve`.

## Customising the site

| What | Where |
| --- | --- |
| Landing page: texts, code samples, styles | `landing/` (see [Landing page](#landing-page)) |
| Texts of the components | `src/lib/i18n.js` |
| Colours, fonts, tables | `src/styles/theme.css` |
| Logo and favicon | `src/assets/logo.svg`, `public/favicon.svg` |
| Site title, description, GitHub link | `astro.config.mjs` |
| Presets shown in the gallery | `src/components/PresetGallery.astro`, `src/lib/preset.js` |

The colours of the theme are Starlight CSS variables (`--sl-color-accent` and the gray
scale), defined in `theme.css` for the dark and the light theme. The fonts, Schibsted
Grotesk for the text and JetBrains Mono for the code, are dependencies of the project and
are served by the site itself.

Changes to these files apply to every version, and to the landing page, at the next
publication.

## Deployment on Cloudflare

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js version | 22.12 or later |
| Custom domain | `sheetsmith.baldilorenzo.cloud` |

The output directory must be `dist`, not the folder of a single version: the root of `dist`
holds the landing page, `_redirects`, `versions.json` and `404.html`, which are shared by
every version. `_redirects` sends `/latest/...` to the latest version with a temporary
redirect (302), because its target changes at every release.

## Troubleshooting

| Message or symptom | Cause and solution |
| --- | --- |
| `versions.json lists no version yet` | No version has been added: see [Adding a version](#adding-a-version). |
| `"versions" in versions.json must be an array of strings` | `versions` contains objects or numbers. Write the versions as strings: `["1.0.0"]`. |
| `"latest" in versions.json must be one of the listed versions` | `latest` names a version missing from `versions`. |
| `section ... is not assigned to any page` | The manual has a section the page map does not include. Add it to a page in `pages.json`. |
| `page ... names section ..., which the manual does not have` | The page map names a section the manual no longer has. Remove it or correct the key. |
| `section ... is assigned to both ...` | The same section is included in two pages. Keep it in one. |
| `links to unknown anchors left as they are` | A link of the manual points to an anchor that does not exist. Correct the link in the manual. The message names the manual concerned. |
| `manual.it.md does not have the sections of manual.md` | The Italian manual has missing or extra sections. Align it with the English manual, or use `--allow-incomplete-translation` (see [Incomplete translations](#incomplete-translations)). |
| `"it.mdx.replaceSection" is missing in pages.json` | A page with components has no Italian replacement. Add it (see [Italian texts outside the manual](#italian-texts-outside-the-manual)). |
| `section "..." to replace not found` | The heading in `replaceSection` does not match the heading of the section in the manual of that language. |
| `The collection "i18n" does not exist or is empty` | Informational warning of Starlight: the site has a single language. It can be ignored. |
| The selector does not open other versions with `npm run dev` | The development server serves one version. Use `npm run build` and `npm run serve`. |
| The buttons of the landing page lead to a missing page with `npm run dev:landing` | The development server of the landing page does not serve the documentation. Use `npm run build` and `npm run serve`. |
