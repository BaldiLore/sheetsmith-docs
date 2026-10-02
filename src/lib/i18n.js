// Texts of the site's own components, in every language of the site.
// The texts of Starlight itself (search, table of contents, navigation) are built in.
const STRINGS = {
	en: {
		'hero.classCaption': 'You write the class',
		'hero.fileCaption': 'sheetsmith writes the file',
		'notice.reading': 'You are reading the documentation of sheetsmith',
		'notice.latest': 'See the latest version ({version})',
		'version.label': 'Documentation version',
		'version.latest': 'latest',
		'gallery.accent': 'Accent colour',
		'gallery.custom': 'Your colour',
		'gallery.customLabel': 'Custom accent colour',
		'gallery.LIGHT': 'Thin accent lines and a very light zebra. Suited to printed reports and dense tables.',
		'gallery.MEDIUM': 'Filled header and a light grid. The most spreadsheet-like preset, for operational exports.',
		'gallery.DARK': 'Dark header and strong alternating fills. For dashboards and short summary tables.',
		'accent.#4472C4': 'Default blue',
		'accent.#1F4E79': 'Dark blue',
		'accent.#70AD47': 'Green',
		'accent.#FFC000': 'Amber',
		'accent.#C00000': 'Red',
		'sheet.label': 'Excel sheet "{title}" generated with the {preset} preset',
	},
	it: {
		'hero.classCaption': 'La classe annotata',
		'hero.fileCaption': 'Il file generato da sheetsmith',
		'notice.reading': 'Questa è la documentazione di sheetsmith',
		'notice.latest': 'Consulta la versione più recente ({version})',
		'version.label': 'Versione della documentazione',
		'version.latest': 'più recente',
		'gallery.accent': 'Colore di accento',
		'gallery.custom': 'Colore personalizzato',
		'gallery.customLabel': 'Colore di accento personalizzato',
		'gallery.LIGHT': 'Linee sottili nel colore di accento e righe alternate molto chiare. Adatto ai report stampati e alle tabelle dense.',
		'gallery.MEDIUM': 'Intestazione piena e griglia chiara. Il preset più vicino a un foglio di calcolo, per le esportazioni operative.',
		'gallery.DARK': 'Intestazione scura e righe alternate marcate. Per cruscotti e brevi tabelle di sintesi.',
		'accent.#4472C4': 'Blu predefinito',
		'accent.#1F4E79': 'Blu scuro',
		'accent.#70AD47': 'Verde',
		'accent.#FFC000': 'Ambra',
		'accent.#C00000': 'Rosso',
		'sheet.label': 'Foglio Excel "{title}" generato con il preset {preset}',
	},
};

/** Returns the text for `key` in `lang` (English when missing), with {placeholders} filled. */
export function t(lang, key, values = {}) {
	const text = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
	return text.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m);
}

/** Language of the page being rendered, from Starlight's route data. */
export const pageLang = (astro) => astro.locals.starlightRoute?.lang ?? 'en';
