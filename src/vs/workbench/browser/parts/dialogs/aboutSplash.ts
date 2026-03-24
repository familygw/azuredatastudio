/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Carlos A. Leguizamón. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from 'vs/base/browser/dom';
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { Dialog } from 'vs/base/browser/ui/dialog/dialog';
import { Color } from 'vs/base/common/color';
import { DisposableStore } from 'vs/base/common/lifecycle';
import { editorBackground, foreground } from 'vs/platform/theme/common/colorRegistry';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { ResultKind } from 'vs/platform/keybinding/common/keybindingResolver';
import { ILayoutService } from 'vs/platform/layout/browser/layoutService';
import { defaultButtonStyles, defaultCheckboxStyles, defaultInputBoxStyles } from 'vs/platform/theme/browser/defaultStyles';
import { IColorTheme } from 'vs/platform/theme/common/themeService';
import * as workbenchTheme from 'vs/workbench/common/theme';
import 'vs/css!vs/workbench/browser/parts/dialogs/media/aboutSplash';

const ADS_BRAND_LOGO_SVG = `
<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="adsBrandCloud" x1="42.639" y1="30.974" x2="42.639" y2="0" gradientUnits="userSpaceOnUse">
			<stop offset="0" stop-color="#27B2D7"></stop>
			<stop offset="0.185" stop-color="#32C0E2"></stop>
			<stop offset="0.605" stop-color="#48DCF7"></stop>
			<stop offset="0.85" stop-color="#50E6FF"></stop>
		</linearGradient>
		<linearGradient id="adsBrandBase" x1="0" y1="42.437" x2="37.647" y2="42.437" gradientUnits="userSpaceOnUse">
			<stop offset="0" stop-color="#005BA1"></stop>
			<stop offset="0.517" stop-color="#0078D4"></stop>
			<stop offset="1" stop-color="#005BA1"></stop>
		</linearGradient>
		<linearGradient id="adsBrandGear" x1="44.676" y1="64" x2="44.676" y2="34.253" gradientUnits="userSpaceOnUse">
			<stop offset="0.049" stop-color="#27B2D7"></stop>
			<stop offset="0.305" stop-color="#31BFE1"></stop>
			<stop offset="0.773" stop-color="#4BE0FA"></stop>
			<stop offset="0.85" stop-color="#50E6FF"></stop>
		</linearGradient>
	</defs>
	<path d="M55.669 11.835A12.218 12.218 0 0 0 43.208 0 12.512 12.512 0 0 0 31.284 8.28 11.557 11.557 0 0 0 21.277 19.547c0 6.311 5.386 11.427 12.03 11.427h21.054A9.931 9.931 0 0 0 64 21.273a9.741 9.741 0 0 0-8.331-9.438Z" fill="url(#adsBrandCloud)"></path>
	<path d="M18.824 27.712C8.428 27.712 0 24.66 0 20.9v36.261c0 3.734 8.289 6.767 18.565 6.817h.259c10.4 0 18.823-3.051 18.823-6.817V20.9c0 3.76-8.428 6.812-18.823 6.812Z" fill="url(#adsBrandBase)"></path>
	<path d="M37.647 20.9c0 3.765-8.428 6.817-18.823 6.817S0 24.66 0 20.9s8.428-6.817 18.824-6.817 18.823 3.047 18.823 6.817Z" fill="#F2F2F2"></path>
	<path d="M33.252 20.343c0 2.395-6.46 4.334-14.429 4.334S4.394 22.738 4.394 20.343s6.461-4.334 14.429-4.334 14.429 1.94 14.429 4.334Z" fill="#50E6FF"></path>
	<path d="M23.086 43.485h-.1L19.738 48.5 14.445 33.183l-5.2 9.5C3.72 41.494 0 39.33 0 36.836v3.752c0 2.791 4.646 5.179 11.28 6.232l.008.009 2.379-4.406 5.075 14.449 6.433-9.894c7.255-.946 12.472-3.436 12.472-6.39v-3.752c0 3.234-6.22 5.938-14.561 6.649Z" fill="#E6E6E6"></path>
	<path d="m46.808 63.815 1.112-3.661L50.1 58.9l3.753 1.668 2.409-2.456v-.278l-1.714-3.289 1.019-2.317 3.753-1.344h.417v-3.379h-.463l-3.707-1.112-1.2-2.132 1.622-3.8-2.456-2.364h-.278l-3.29 1.668-2.27-1.39-1.483-4.124h-3.428v.51l-1.112 3.66L39.3 39.443l-4.03-1.854-2.363 2.456.232.463L34.9 43.937 33.973 46.3l-4.356 1.344v3.429h.51l3.661 1.112 1.019 2.363L33 58.532l2.456 2.41.417-.232L39.3 58.95l2.364.926L43.24 64h3.382Zm-5.56-10.935a4.931 4.931 0 1 1 6.9-7.043 4.931 4.931 0 0 1-6.9 7.043Z" fill="url(#adsBrandGear)"></path>
</svg>
`;

const ALLOWABLE_COMMANDS = [
	'copy',
	'cut',
	'editor.action.selectAll',
	'editor.action.clipboardCopyAction',
	'editor.action.clipboardCutAction',
	'editor.action.clipboardPasteAction'
];

interface IBrandPalette {
	background: string;
	ink: string;
	muted: string;
	border: string;
	accent: string;
	accentAlt: string;
	panel: string;
	panelAlt: string;
	chip: string;
	entry: string;
	hairline: string;
	shadow: string;
	glow: string;
	glowAlt: string;
}

export interface IBrandSurfaceChip {
	readonly label: string;
	readonly value: string;
}

export interface IBrandSurfaceEntry {
	readonly label: string;
	readonly value: string;
}

export interface IBrandSurfaceData {
	readonly eyebrow: string;
	readonly title: string;
	readonly subtitle: string;
	readonly chips: readonly IBrandSurfaceChip[];
	readonly entries: readonly IBrandSurfaceEntry[];
}

export interface IBrandDialogOptions {
	readonly buttons: string[];
	readonly cancelId: number;
	readonly layoutService: ILayoutService;
	readonly keybindingService: IKeybindingService;
	readonly surface: IBrandSurfaceData;
	readonly theme: IColorTheme;
	readonly title: string;
}

function toCss(color: Color): string {
	return Color.Format.CSS.format(color);
}

function getBrandPalette(theme: IColorTheme): IBrandPalette {
	const background = theme.getColor(editorBackground) ?? workbenchTheme.WORKBENCH_BACKGROUND(theme);
	const ink = theme.getColor(foreground) ?? Color.fromHex(background.isDarker() ? '#F6FBFF' : '#14253C');
	const dark = background.isDarker();
	const chrome = theme.getColor(workbenchTheme.TITLE_BAR_ACTIVE_BACKGROUND) ?? (dark ? background.lighten(0.16) : background.darken(0.08));
	const border = theme.getColor(workbenchTheme.WINDOW_ACTIVE_BORDER)
		?? theme.getColor(workbenchTheme.WINDOW_INACTIVE_BORDER)
		?? ink.transparent(dark ? 0.18 : 0.12);
	const accent = dark ? Color.fromHex('#50E6FF') : Color.fromHex('#0078D4');
	const accentAlt = dark ? Color.fromHex('#0078D4') : Color.fromHex('#005BA1');

	return {
		background: toCss(background),
		ink: toCss(ink),
		muted: toCss(ink.transparent(dark ? 0.68 : 0.56)),
		border: toCss(border),
		accent: toCss(accent),
		accentAlt: toCss(accentAlt),
		panel: toCss(dark ? background.lighten(0.08) : background),
		panelAlt: toCss(dark ? chrome.transparent(0.52) : chrome.transparent(0.82)),
		chip: toCss(dark ? background.lighten(0.16).transparent(0.72) : accent.transparent(0.12)),
		entry: toCss(dark ? background.lighten(0.12).transparent(0.88) : background.darken(0.02).transparent(0.96)),
		hairline: toCss(ink.transparent(dark ? 0.82 : 0.9)),
		shadow: toCss((dark ? Color.fromHex('#000000') : ink).transparent(dark ? 0.55 : 0.92)),
		glow: toCss(accent.transparent(dark ? 0.24 : 0.18)),
		glowAlt: toCss(accentAlt.transparent(dark ? 0.22 : 0.16))
	};
}

function applyPalette(container: HTMLElement, palette: IBrandPalette): void {
	container.style.setProperty('--ads-brand-background', palette.background);
	container.style.setProperty('--ads-brand-ink', palette.ink);
	container.style.setProperty('--ads-brand-muted', palette.muted);
	container.style.setProperty('--ads-brand-border', palette.border);
	container.style.setProperty('--ads-brand-accent', palette.accent);
	container.style.setProperty('--ads-brand-accent-alt', palette.accentAlt);
	container.style.setProperty('--ads-brand-panel', palette.panel);
	container.style.setProperty('--ads-brand-panel-alt', palette.panelAlt);
	container.style.setProperty('--ads-brand-chip', palette.chip);
	container.style.setProperty('--ads-brand-entry', palette.entry);
	container.style.setProperty('--ads-brand-hairline', palette.hairline);
	container.style.setProperty('--ads-brand-shadow', palette.shadow);
	container.style.setProperty('--ads-brand-glow', palette.glow);
	container.style.setProperty('--ads-brand-glow-alt', palette.glowAlt);
}

function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, className: string, text?: string): HTMLElementTagNameMap[K] {
	const element = document.createElement(tagName);
	element.className = className;
	if (typeof text === 'string') {
		element.textContent = text;
	}

	return element;
}

export function renderBrandSurface(container: HTMLElement, data: IBrandSurfaceData, theme: IColorTheme): void {
	const palette = getBrandPalette(theme);
	applyPalette(container, palette);
	container.classList.add('ads-brand-surface-host');
	dom.clearNode(container);

	const surface = createElement('section', 'ads-brand-surface');
	const backdrop = surface.appendChild(createElement('div', 'ads-brand-surface__backdrop'));
	backdrop.appendChild(createElement('span', 'ads-brand-surface__orb ads-brand-surface__orb--primary'));
	backdrop.appendChild(createElement('span', 'ads-brand-surface__orb ads-brand-surface__orb--secondary'));
	backdrop.appendChild(createElement('span', 'ads-brand-surface__mesh'));

	const frame = surface.appendChild(createElement('div', 'ads-brand-surface__frame'));
	const brand = frame.appendChild(createElement('div', 'ads-brand-surface__brand'));
	const mark = brand.appendChild(createElement('div', 'ads-brand-surface__mark'));
	mark.innerHTML = ADS_BRAND_LOGO_SVG;

	brand.appendChild(createElement('div', 'ads-brand-surface__eyebrow', data.eyebrow));
	brand.appendChild(createElement('h1', 'ads-brand-surface__title', data.title));
	brand.appendChild(createElement('p', 'ads-brand-surface__subtitle', data.subtitle));

	const chips = brand.appendChild(createElement('div', 'ads-brand-surface__chips'));
	for (const chip of data.chips) {
		const chipElement = chips.appendChild(createElement('div', 'ads-brand-surface__chip'));
		chipElement.appendChild(createElement('span', 'ads-brand-surface__chip-label', chip.label));
		chipElement.appendChild(createElement('span', 'ads-brand-surface__chip-value', chip.value));
	}

	const meta = frame.appendChild(createElement('dl', 'ads-brand-surface__meta'));
	for (const entry of data.entries) {
		const cell = meta.appendChild(createElement('div', 'ads-brand-surface__meta-cell'));
		cell.appendChild(createElement('dt', 'ads-brand-surface__meta-label', entry.label));
		const value = cell.appendChild(createElement('dd', 'ads-brand-surface__meta-value', entry.value));
		value.title = entry.value;
	}

	container.appendChild(surface);
}

export async function showBrandDialog(options: IBrandDialogOptions): Promise<number> {
	const dialogDisposables = new DisposableStore();
	const palette = getBrandPalette(options.theme);
	applyPalette(options.layoutService.container, palette);
	const dialog = new Dialog(
		options.layoutService.container,
		options.title,
		options.buttons,
		{
			cancelId: options.cancelId,
			type: 'none',
			classes: ['ads-about-dialog'],
			disableCloseAction: true,
			keyEventProcessor: (event: StandardKeyboardEvent) => {
				const resolved = options.keybindingService.softDispatch(event, options.layoutService.container);
				if (resolved.kind === ResultKind.KbFound && resolved.commandId && ALLOWABLE_COMMANDS.indexOf(resolved.commandId) === -1) {
					dom.EventHelper.stop(event, true);
				}
			},
			renderBody: parent => renderBrandSurface(parent, options.surface, options.theme),
			buttonStyles: defaultButtonStyles,
			checkboxStyles: defaultCheckboxStyles,
			inputBoxStyles: defaultInputBoxStyles,
			dialogStyles: {
				dialogBackground: 'transparent',
				dialogForeground: palette.ink,
				dialogShadow: 'transparent',
				dialogBorder: 'transparent',
				errorIconForeground: palette.accentAlt,
				warningIconForeground: palette.accent,
				infoIconForeground: palette.accent,
				textLinkForeground: palette.accent
			}
		}
	);

	dialogDisposables.add(dialog);

	try {
		const result = await dialog.show();
		return result.button;
	} finally {
		dialogDisposables.dispose();
	}
}
