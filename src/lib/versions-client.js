// Browser-side helpers shared by the version selector and the version notice.

let pending;
/**
 * Fetches the published version catalogue once per page. Returns null when it is not
 * available (for example in `astro dev`, where only one version is served).
 */
export function loadCatalogue() {
	pending ??= fetch('/versions.json')
		.then((r) => (r.ok ? r.json() : null))
		.catch(() => null);
	return pending;
}

const exists = async (url) => {
	try {
		return (await fetch(url, { method: 'HEAD' })).ok;
	} catch {
		return false;
	}
};

/**
 * Best page of `version` for a reader currently on `page` (path inside the version, e.g.
 * "/guides/presets/") in the language `lang` ("" for English, "it" for Italian), trying in order:
 * the same page in the same language, the same page in English, the home page in the same
 * language, the home page in English. A version without Italian has no "/it/" pages.
 */
export async function resolvePage(version, lang, page) {
	const prefix = lang ? `/${lang}` : '';
	const candidates = [`/${version}${prefix}${page}`, `/${version}${page}`, `/${version}${prefix}/`, `/${version}/`];
	for (const url of [...new Set(candidates)]) {
		if (url === `/${version}/` || (await exists(url))) return url;
	}
	return `/${version}/`;
}

/** Splits the current location into version, language prefix and page inside the version. */
export function currentLocation(version, lang) {
	let rest = location.pathname.slice(`/${version}`.length) || '/';
	if (lang && (rest === `/${lang}` || rest.startsWith(`/${lang}/`))) rest = rest.slice(lang.length + 1) || '/';
	return rest;
}
