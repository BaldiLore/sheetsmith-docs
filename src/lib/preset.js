// Same colour maths as the sheetsmith presets (manual, chapter "Presets"):
// channels use half-to-even rounding, matching the computed colours table.
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
// Half-to-even rounding: x.5 goes to the nearest even integer, as in the library.
const rint = (v) => {
	const f = Math.floor(v), d = v - f;
	if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
	return Math.round(v);
};
const toHex = (rgb) => '#' + rgb.map((v) => rint(v).toString(16).padStart(2, '0')).join('').toUpperCase();

export const tint = (a, f) => toHex(hex(a).map((c) => c * (1 - f) + 255 * f));
export const shade = (a, f) => toHex(hex(a).map((c) => c * (1 - f)));

const luminance = (a) => {
	const [r, g, b] = hex(a).map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a) => {
	const l = luminance(a);
	return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#000000' : '#FFFFFF';
};

/** CSS custom properties describing one preset for one accent. */
export function presetVars(preset, a) {
	const v = {
		'--title-fg': shade(a, 0.25),
		'--head-bg': 'transparent', '--head-fg': shade(a, 0.25), '--head-line': 'transparent',
		'--row-line': 'transparent', '--grid': 'transparent',
		'--odd-bg': 'transparent', '--odd-fg': '#000000',
		'--even-bg': 'transparent', '--even-fg': '#000000',
	};
	if (preset === 'LIGHT') {
		Object.assign(v, { '--head-line': a, '--row-line': tint(a, 0.75), '--odd-bg': tint(a, 0.85) });
	} else if (preset === 'MEDIUM') {
		Object.assign(v, { '--head-bg': a, '--head-fg': contrast(a), '--grid': tint(a, 0.6), '--odd-bg': tint(a, 0.8) });
	} else if (preset === 'DARK') {
		const h = shade(a, 0.5), e = shade(a, 0.25);
		Object.assign(v, { '--head-bg': h, '--head-fg': contrast(h), '--odd-bg': a, '--odd-fg': contrast(a), '--even-bg': e, '--even-fg': contrast(e) });
	}
	return v;
}

export const styleString = (vars) => Object.entries(vars).map(([k, val]) => `${k}:${val}`).join(';');

export const ACCENTS = [
	{ name: 'Default blue', value: '#4472C4' },
	{ name: 'Dark blue', value: '#1F4E79' },
	{ name: 'Green', value: '#70AD47' },
	{ name: 'Amber', value: '#FFC000' },
	{ name: 'Red', value: '#C00000' },
];
