// Colours of the sample sheet of the landing page, for one preset and one accent colour.
// The tones come from src/lib/preset.js, the computation shared with the preset gallery of
// the documentation. This file only adds what a spreadsheet shows on screen: white where a
// preset has no fill, and the Excel gridlines where a preset draws no line.
import { presetVars, styleString } from '../../src/lib/preset.js';

const GRIDLINE = '#E1E1E1';
const isSet = (value) => Boolean(value) && value !== 'transparent';

/** CSS custom properties of the sample sheet. */
export function sheetVars(preset, accent) {
	const v = presetVars(preset, accent);
	const grid = isSet(v['--grid']) ? v['--grid'] : null;
	// A filled cell hides the gridlines, as in Excel; an empty one shows them.
	const side = (fill) => grid ?? (isSet(fill) ? fill : GRIDLINE);
	const fill = (value) => (isSet(value) ? value : '#FFFFFF');
	const bottom = (rowFill) => (isSet(v['--row-line']) ? v['--row-line'] : side(rowFill));
	return {
		'--title-fg': v['--title-fg'],
		'--head-bg': fill(v['--head-bg']),
		'--head-fg': v['--head-fg'],
		'--head-side': side(v['--head-bg']),
		'--head-bottom': isSet(v['--head-line']) ? `2px solid ${v['--head-line']}` : `1px solid ${side(v['--head-bg'])}`,
		'--odd-bg': fill(v['--odd-bg']),
		'--odd-fg': v['--odd-fg'],
		'--odd-side': side(v['--odd-bg']),
		'--odd-bottom': bottom(v['--odd-bg']),
		'--even-bg': fill(v['--even-bg']),
		'--even-fg': v['--even-fg'],
		'--even-side': side(v['--even-bg']),
		'--even-bottom': bottom(v['--even-bg']),
	};
}

export const sheetStyle = (preset, accent) => styleString(sheetVars(preset, accent));
