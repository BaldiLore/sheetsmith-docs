// Sätteri hast plugin: prefixes root-relative links written in the content
// ("/guides/presets/") with the version base ("/1.0.0/guides/presets/"),
// so pages never hard-code the version they belong to.
export default function baseLinks(base) {
	return {
		name: 'sheetsmith-base-links',
		element: [
			{
				filter: ['a'],
				visit(node, ctx) {
					const href = node.properties?.href;
					if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(base + '/')) {
						ctx.setProperty(node, 'href', base + href);
					}
				},
			},
		],
	};
}
