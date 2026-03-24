/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/// <reference path="../../../../typings/require.d.ts" />

//@ts-check
(function () {
	'use strict';

	const bootstrapWindow = bootstrapWindowLib();

	// Add a perf entry right from the top
	performance.mark('code/didStartRenderer');

	// Load workbench main JS, CSS and NLS all in parallel. This is an
	// optimization to prevent a waterfall of loading to happen, because
	// we know for a fact that workbench.desktop.main will depend on
	// the related CSS and NLS counterparts.
	bootstrapWindow.load([
		'sql/setup', // {{SQL CARBON EDIT}}
		'vs/workbench/workbench.desktop.main',
		'vs/nls!vs/workbench/workbench.desktop.main',
		'vs/css!vs/workbench/workbench.desktop.main'
	],
		function (desktopMain, configuration) {

			// Mark start of workbench
			performance.mark('code/didLoadWorkbenchMain');

			// @ts-ignore // {{SQL CARBON EDIT}} - load desktop main directly
			return require('vs/workbench/electron-sandbox/desktop.main').main(configuration);
			//return desktopMain.main(configuration);
		},
		{
			configureDeveloperSettings: function (windowConfig) {
				return {
					// disable automated devtools opening on error when running extension tests
					// as this can lead to nondeterministic test execution (devtools steals focus)
					forceDisableShowDevtoolsOnError: typeof windowConfig.extensionTestsPath === 'string' || windowConfig['enable-smoke-test-driver'] === true,
					// enable devtools keybindings in extension development window
					forceEnableDeveloperKeybindings: Array.isArray(windowConfig.extensionDevelopmentPath) && windowConfig.extensionDevelopmentPath.length > 0,
					removeDeveloperKeybindingsAfterLoad: true
				};
			},
			canModifyDOM: function (windowConfig) {
				showSplash(windowConfig);
			},
			beforeLoaderConfig: function (loaderConfig) {
				/** @type {any} */ (loaderConfig).recordStats = true;
			},
			beforeRequire: function () {
				performance.mark('code/willLoadWorkbenchMain');

				// It looks like browsers only lazily enable
				// the <canvas> element when needed. Since we
				// leverage canvas elements in our code in many
				// locations, we try to help the browser to
				// initialize canvas when it is idle, right
				// before we wait for the scripts to be loaded.
				// @ts-ignore
				window.requestIdleCallback(() => {
					const canvas = document.createElement('canvas');
					const context = canvas.getContext('2d');
					context?.clearRect(0, 0, canvas.width, canvas.height);
					canvas.remove();
				}, { timeout: 50 });
			}
		}
	);

	//#region Helpers

	/**
	 * @typedef {import('../../../platform/window/common/window').INativeWindowConfiguration} INativeWindowConfiguration
	 * @typedef {import('../../../platform/environment/common/argv').NativeParsedArgs} NativeParsedArgs
	 *
	 * @returns {{
	 *   load: (
	 *     modules: string[],
	 *     resultCallback: (result: unknown, configuration: INativeWindowConfiguration & NativeParsedArgs) => unknown,
	 *     options?: {
	 *       configureDeveloperSettings?: (config: INativeWindowConfiguration & NativeParsedArgs) => {
	 * 			forceDisableShowDevtoolsOnError?: boolean,
	 * 			forceEnableDeveloperKeybindings?: boolean,
	 * 			disallowReloadKeybinding?: boolean,
	 * 			removeDeveloperKeybindingsAfterLoad?: boolean
	 * 		 },
	 * 	     canModifyDOM?: (config: INativeWindowConfiguration & NativeParsedArgs) => void,
	 * 	     beforeLoaderConfig?: (loaderConfig: object) => void,
	 *       beforeRequire?: () => void
	 *     }
	 *   ) => Promise<unknown>
	 * }}
	 */
	function bootstrapWindowLib() {
		// @ts-ignore (defined in bootstrap-window.js)
		return window.MonacoBootstrapWindow;
	}

	const ADS_BRAND_LOGO_SVG = `
<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="adsStartupCloud" x1="42.639" y1="30.974" x2="42.639" y2="0" gradientUnits="userSpaceOnUse">
			<stop offset="0" stop-color="#27B2D7"></stop>
			<stop offset="0.185" stop-color="#32C0E2"></stop>
			<stop offset="0.605" stop-color="#48DCF7"></stop>
			<stop offset="0.85" stop-color="#50E6FF"></stop>
		</linearGradient>
		<linearGradient id="adsStartupBase" x1="0" y1="42.437" x2="37.647" y2="42.437" gradientUnits="userSpaceOnUse">
			<stop offset="0" stop-color="#005BA1"></stop>
			<stop offset="0.517" stop-color="#0078D4"></stop>
			<stop offset="1" stop-color="#005BA1"></stop>
		</linearGradient>
		<linearGradient id="adsStartupGear" x1="44.676" y1="64" x2="44.676" y2="34.253" gradientUnits="userSpaceOnUse">
			<stop offset="0.049" stop-color="#27B2D7"></stop>
			<stop offset="0.305" stop-color="#31BFE1"></stop>
			<stop offset="0.773" stop-color="#4BE0FA"></stop>
			<stop offset="0.85" stop-color="#50E6FF"></stop>
		</linearGradient>
	</defs>
	<path d="M55.669 11.835A12.218 12.218 0 0 0 43.208 0 12.512 12.512 0 0 0 31.284 8.28 11.557 11.557 0 0 0 21.277 19.547c0 6.311 5.386 11.427 12.03 11.427h21.054A9.931 9.931 0 0 0 64 21.273a9.741 9.741 0 0 0-8.331-9.438Z" fill="url(#adsStartupCloud)"></path>
	<path d="M18.824 27.712C8.428 27.712 0 24.66 0 20.9v36.261c0 3.734 8.289 6.767 18.565 6.817h.259c10.4 0 18.823-3.051 18.823-6.817V20.9c0 3.76-8.428 6.812-18.823 6.812Z" fill="url(#adsStartupBase)"></path>
	<path d="M37.647 20.9c0 3.765-8.428 6.817-18.823 6.817S0 24.66 0 20.9s8.428-6.817 18.824-6.817 18.823 3.047 18.823 6.817Z" fill="#F2F2F2"></path>
	<path d="M33.252 20.343c0 2.395-6.46 4.334-14.429 4.334S4.394 22.738 4.394 20.343s6.461-4.334 14.429-4.334 14.429 1.94 14.429 4.334Z" fill="#50E6FF"></path>
	<path d="M23.086 43.485h-.1L19.738 48.5 14.445 33.183l-5.2 9.5C3.72 41.494 0 39.33 0 36.836v3.752c0 2.791 4.646 5.179 11.28 6.232l.008.009 2.379-4.406 5.075 14.449 6.433-9.894c7.255-.946 12.472-3.436 12.472-6.39v-3.752c0 3.234-6.22 5.938-14.561 6.649Z" fill="#E6E6E6"></path>
	<path d="m46.808 63.815 1.112-3.661L50.1 58.9l3.753 1.668 2.409-2.456v-.278l-1.714-3.289 1.019-2.317 3.753-1.344h.417v-3.379h-.463l-3.707-1.112-1.2-2.132 1.622-3.8-2.456-2.364h-.278l-3.29 1.668-2.27-1.39-1.483-4.124h-3.428v.51l-1.112 3.66L39.3 39.443l-4.03-1.854-2.363 2.456.232.463L34.9 43.937 33.973 46.3l-4.356 1.344v3.429h.51l3.661 1.112 1.019 2.363L33 58.532l2.456 2.41.417-.232L39.3 58.95l2.364.926L43.24 64h3.382Zm-5.56-10.935a4.931 4.931 0 1 1 6.9-7.043 4.931 4.931 0 0 1-6.9 7.043Z" fill="url(#adsStartupGear)"></path>
</svg>
`;

	/**
	 * @param {{ version?: string, target?: string, darwinUniversalAssetId?: string }} product
	 */
	function formatStartupVersionLabel(product) {
		let version = product.version || 'Unknown';
		if (product.target) {
			version = `${version} (${product.target} setup)`;
		} else if (product.darwinUniversalAssetId) {
			version = `${version} (Universal)`;
		}

		return version;
	}

	/**
	 * @param {string} baseTheme
	 * @param {string} shellBackground
	 */
	function getStartupBrandPalette(baseTheme, shellBackground) {
		const dark = baseTheme === 'vs-dark' || baseTheme === 'hc-black';
		return {
			background: shellBackground,
			ink: dark ? '#F6FBFF' : '#14253C',
			muted: dark ? 'rgba(246, 251, 255, 0.68)' : 'rgba(20, 37, 60, 0.56)',
			border: dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(20, 37, 60, 0.12)',
			accent: dark ? '#50E6FF' : '#0078D4',
			accentAlt: dark ? '#0078D4' : '#005BA1',
			panel: dark ? 'rgba(22, 34, 48, 0.88)' : 'rgba(255, 255, 255, 0.92)',
			panelAlt: dark ? 'rgba(16, 27, 39, 0.54)' : 'rgba(0, 120, 212, 0.08)',
			chip: dark ? 'rgba(30, 48, 68, 0.72)' : 'rgba(0, 120, 212, 0.10)',
			entry: dark ? 'rgba(24, 37, 53, 0.88)' : 'rgba(245, 249, 253, 0.95)',
			hairline: dark ? 'rgba(246, 251, 255, 0.18)' : 'rgba(20, 37, 60, 0.10)',
			shadow: dark ? 'rgba(0, 0, 0, 0.52)' : 'rgba(20, 37, 60, 0.12)',
			glow: dark ? 'rgba(80, 230, 255, 0.24)' : 'rgba(0, 120, 212, 0.16)',
			glowAlt: dark ? 'rgba(0, 120, 212, 0.22)' : 'rgba(0, 91, 161, 0.14)'
		};
	}

	/**
	 * @param {HTMLElement} element
	 * @param {ReturnType<typeof getStartupBrandPalette>} palette
	 */
	function applyStartupBrandPalette(element, palette) {
		element.style.setProperty('--ads-brand-background', palette.background);
		element.style.setProperty('--ads-brand-ink', palette.ink);
		element.style.setProperty('--ads-brand-muted', palette.muted);
		element.style.setProperty('--ads-brand-border', palette.border);
		element.style.setProperty('--ads-brand-accent', palette.accent);
		element.style.setProperty('--ads-brand-accent-alt', palette.accentAlt);
		element.style.setProperty('--ads-brand-panel', palette.panel);
		element.style.setProperty('--ads-brand-panel-alt', palette.panelAlt);
		element.style.setProperty('--ads-brand-chip', palette.chip);
		element.style.setProperty('--ads-brand-entry', palette.entry);
		element.style.setProperty('--ads-brand-hairline', palette.hairline);
		element.style.setProperty('--ads-brand-shadow', palette.shadow);
		element.style.setProperty('--ads-brand-glow', palette.glow);
		element.style.setProperty('--ads-brand-glow-alt', palette.glowAlt);
	}

	/**
	 * @param {{
	 *   eyebrow: string,
	 *   title: string,
	 *   subtitle: string,
	 *   chips: { label: string, value: string }[],
	 *   entries: { label: string, value: string }[]
	 * }} data
	 * @param {ReturnType<typeof getStartupBrandPalette>} palette
	 */
	function createStartupBrandSurface(data, palette) {
		const surface = document.createElement('section');
		surface.className = 'ads-brand-surface';
		applyStartupBrandPalette(surface, palette);

		const backdrop = document.createElement('div');
		backdrop.className = 'ads-brand-surface__backdrop';
		backdrop.innerHTML = '<span class="ads-brand-surface__orb ads-brand-surface__orb--primary"></span><span class="ads-brand-surface__orb ads-brand-surface__orb--secondary"></span><span class="ads-brand-surface__mesh"></span>';
		surface.appendChild(backdrop);

		const frame = document.createElement('div');
		frame.className = 'ads-brand-surface__frame';
		surface.appendChild(frame);

		const brand = document.createElement('div');
		brand.className = 'ads-brand-surface__brand';
		frame.appendChild(brand);

		const mark = document.createElement('div');
		mark.className = 'ads-brand-surface__mark';
		mark.innerHTML = ADS_BRAND_LOGO_SVG;
		brand.appendChild(mark);

		const eyebrow = document.createElement('div');
		eyebrow.className = 'ads-brand-surface__eyebrow';
		eyebrow.textContent = data.eyebrow;
		brand.appendChild(eyebrow);

		const title = document.createElement('h1');
		title.className = 'ads-brand-surface__title';
		title.textContent = data.title;
		brand.appendChild(title);

		const subtitle = document.createElement('p');
		subtitle.className = 'ads-brand-surface__subtitle';
		subtitle.textContent = data.subtitle;
		brand.appendChild(subtitle);

		const chips = document.createElement('div');
		chips.className = 'ads-brand-surface__chips';
		for (const chip of data.chips) {
			const chipElement = document.createElement('div');
			chipElement.className = 'ads-brand-surface__chip';
			chipElement.innerHTML = `<span class="ads-brand-surface__chip-label">${chip.label}</span><span class="ads-brand-surface__chip-value">${chip.value}</span>`;
			chips.appendChild(chipElement);
		}
		brand.appendChild(chips);

		const meta = document.createElement('dl');
		meta.className = 'ads-brand-surface__meta';
		for (const entry of data.entries) {
			const cell = document.createElement('div');
			cell.className = 'ads-brand-surface__meta-cell';
			const label = document.createElement('dt');
			label.className = 'ads-brand-surface__meta-label';
			label.textContent = entry.label;
			const value = document.createElement('dd');
			value.className = 'ads-brand-surface__meta-value';
			value.textContent = entry.value;
			value.title = entry.value;
			cell.appendChild(label);
			cell.appendChild(value);
			meta.appendChild(cell);
		}
		frame.appendChild(meta);

		return surface;
	}

	/**
	 * @param {string} shellBackground
	 * @param {string} shellForeground
	 * @returns {string}
	 */
	function getStartupSplashStyles(shellBackground, shellForeground) {
		return `
			body { background-color: ${shellBackground}; color: ${shellForeground}; margin: 0; padding: 0; }
			#monaco-parts-splash.ads-brand-startup {
				position: relative;
				min-height: 100vh;
				width: 100vw;
				overflow: hidden;
				background:
					radial-gradient(circle at top right, rgba(80, 230, 255, 0.10), transparent 32%),
					radial-gradient(circle at bottom left, rgba(0, 120, 212, 0.08), transparent 28%),
					${shellBackground};
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-startup__layout {
				position: absolute;
				inset: 0;
				pointer-events: none;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-startup__hero {
				position: relative;
				z-index: 2;
				min-height: 100vh;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 40px 20px;
				box-sizing: border-box;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-startup__hero .ads-brand-surface {
				width: min(780px, calc(100vw - 40px));
				--ads-brand-display-font: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
				--ads-brand-ui-font: "Segoe UI", "SF Pro Text", "Helvetica Neue", sans-serif;
				--ads-brand-mono-font: ui-monospace, "SFMono-Regular", "Consolas", monospace;
				position: relative;
				overflow: hidden;
				border-radius: 28px;
				border: 1px solid var(--ads-brand-border);
				padding: 28px;
				background: linear-gradient(145deg, var(--ads-brand-panel-alt), transparent 50%), linear-gradient(180deg, var(--ads-brand-panel), var(--ads-brand-background));
				box-shadow: 0 28px 90px var(--ads-brand-shadow);
				color: var(--ads-brand-ink);
				font-family: var(--ads-brand-ui-font);
				isolation: isolate;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__backdrop {
				position: absolute;
				inset: 0;
				pointer-events: none;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__orb {
				position: absolute;
				border-radius: 999px;
				filter: blur(10px);
				opacity: 0.9;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__orb--primary {
				width: 280px;
				height: 280px;
				top: -110px;
				right: -30px;
				background: radial-gradient(circle, var(--ads-brand-glow) 0%, transparent 72%);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__orb--secondary {
				width: 260px;
				height: 260px;
				bottom: -120px;
				left: -60px;
				background: radial-gradient(circle, var(--ads-brand-glow-alt) 0%, transparent 76%);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__mesh {
				position: absolute;
				inset: 0;
				background-image: linear-gradient(90deg, var(--ads-brand-hairline) 1px, transparent 1px), linear-gradient(var(--ads-brand-hairline) 1px, transparent 1px);
				background-size: 36px 36px;
				mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.48), transparent 78%);
				opacity: 0.35;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__frame {
				position: relative;
				display: grid;
				grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
				gap: 24px;
				align-items: stretch;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__brand {
				position: relative;
				display: flex;
				flex-direction: column;
				gap: 14px;
				padding: 22px;
				border-radius: 22px;
				background: linear-gradient(180deg, var(--ads-brand-panel-alt), var(--ads-brand-entry));
				border: 1px solid var(--ads-brand-border);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__mark {
				width: 84px;
				height: 84px;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				padding: 10px;
				border-radius: 24px;
				background: linear-gradient(160deg, rgba(80, 230, 255, 0.16), rgba(0, 120, 212, 0.12)), rgba(255, 255, 255, 0.03);
				border: 1px solid rgba(80, 230, 255, 0.20);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__mark svg {
				width: 100%;
				height: 100%;
				display: block;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__eyebrow {
				font-size: 11px;
				letter-spacing: 0.28em;
				text-transform: uppercase;
				color: var(--ads-brand-muted);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__title {
				margin: 0;
				font-family: var(--ads-brand-display-font);
				font-size: clamp(32px, 4vw, 46px);
				font-weight: 600;
				line-height: 1.04;
				letter-spacing: -0.04em;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__subtitle {
				margin: 0;
				max-width: 42ch;
				font-size: 14px;
				line-height: 1.6;
				color: var(--ads-brand-muted);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__chips {
				display: flex;
				flex-wrap: wrap;
				gap: 10px;
				margin-top: auto;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__chip {
				display: inline-flex;
				align-items: center;
				gap: 8px;
				padding: 8px 12px;
				border-radius: 999px;
				border: 1px solid var(--ads-brand-border);
				background: var(--ads-brand-chip);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__chip-label {
				font-size: 10px;
				font-weight: 700;
				letter-spacing: 0.18em;
				text-transform: uppercase;
				color: var(--ads-brand-muted);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__chip-value {
				font-family: var(--ads-brand-mono-font);
				font-size: 11px;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__meta {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 12px;
				margin: 0;
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__meta-cell {
				display: flex;
				flex-direction: column;
				gap: 6px;
				min-width: 0;
				padding: 14px 16px;
				border-radius: 18px;
				background: var(--ads-brand-entry);
				border: 1px solid var(--ads-brand-hairline);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__meta-label {
				font-size: 10px;
				font-weight: 700;
				letter-spacing: 0.18em;
				text-transform: uppercase;
				color: var(--ads-brand-muted);
			}
			#monaco-parts-splash.ads-brand-startup .ads-brand-surface__meta-value {
				margin: 0;
				font-family: var(--ads-brand-mono-font);
				font-size: 12px;
				line-height: 1.55;
				overflow-wrap: anywhere;
			}
			@media (max-width: 760px) {
				#monaco-parts-splash.ads-brand-startup .ads-brand-startup__hero {
					padding: 24px 16px;
				}
				#monaco-parts-splash.ads-brand-startup .ads-brand-startup__hero .ads-brand-surface {
					padding: 20px;
					border-radius: 24px;
				}
				#monaco-parts-splash.ads-brand-startup .ads-brand-surface__frame {
					grid-template-columns: 1fr;
				}
				#monaco-parts-splash.ads-brand-startup .ads-brand-surface__meta {
					grid-template-columns: 1fr;
				}
			}
		`;
	}

	/**
	 * @param {INativeWindowConfiguration & NativeParsedArgs} configuration
	 */
	function showSplash(configuration) {
		performance.mark('code/willShowPartsSplash');

		let data = configuration.partsSplash;

		if (data) {
			// high contrast mode has been turned by the OS -> ignore stored colors and layouts
			if (configuration.autoDetectHighContrast && configuration.colorScheme.highContrast) {
				if ((configuration.colorScheme.dark && data.baseTheme !== 'hc-black') || (!configuration.colorScheme.dark && data.baseTheme !== 'hc-light')) {
					data = undefined;
				}
			} else if (configuration.autoDetectColorScheme) {
				// OS color scheme is tracked and has changed
				if ((configuration.colorScheme.dark && data.baseTheme !== 'vs-dark') || (!configuration.colorScheme.dark && data.baseTheme !== 'vs')) {
					data = undefined;
				}
			}
		}

		// developing an extension -> ignore stored layouts
		if (data && configuration.extensionDevelopmentPath) {
			data.layoutInfo = undefined;
		}

		// minimal color configuration (works with or without persisted data)
		let baseTheme, shellBackground, shellForeground;
		if (data) {
			baseTheme = data.baseTheme;
			shellBackground = data.colorInfo.editorBackground;
			shellForeground = data.colorInfo.foreground;
		} else if (configuration.autoDetectHighContrast && configuration.colorScheme.highContrast) {
			if (configuration.colorScheme.dark) {
				baseTheme = 'hc-black';
				shellBackground = '#000000';
				shellForeground = '#FFFFFF';
			} else {
				baseTheme = 'hc-light';
				shellBackground = '#FFFFFF';
				shellForeground = '#000000';
			}
		} else if (configuration.autoDetectColorScheme) {
			if (configuration.colorScheme.dark) {
				baseTheme = 'vs-dark';
				shellBackground = '#1E1E1E';
				shellForeground = '#CCCCCC';
			} else {
				baseTheme = 'vs';
				shellBackground = '#FFFFFF';
				shellForeground = '#000000';
			}
		}

		if (!baseTheme) {
			baseTheme = configuration.colorScheme?.dark ? 'vs-dark' : 'vs';
			shellBackground = configuration.colorScheme?.dark ? '#1E1E1E' : '#FFFFFF';
			shellForeground = configuration.colorScheme?.dark ? '#CCCCCC' : '#000000';
		}

		const style = document.createElement('style');
		style.className = 'initialShellColors';
		document.head.appendChild(style);
		style.textContent = getStartupSplashStyles(shellBackground, shellForeground);

		// set zoom level as soon as possible
		const globalWithVscode = /** @type {typeof globalThis & { vscode?: { webFrame?: { setZoomLevel?: (zoomLevel: number) => void } } }} */ (globalThis);
		if (typeof data?.zoomLevel === 'number' && typeof globalWithVscode.vscode?.webFrame?.setZoomLevel === 'function') {
			globalWithVscode.vscode.webFrame.setZoomLevel(data.zoomLevel);
		}

		const splash = document.createElement('div');
		splash.id = 'monaco-parts-splash';
		splash.className = `${baseTheme || ''} ads-brand-startup`.trim();

		if (data?.layoutInfo) {
			const { layoutInfo, colorInfo } = data;
			const layoutShell = document.createElement('div');
			layoutShell.className = 'ads-brand-startup__layout';

			if (layoutInfo.windowBorder) {
				splash.style.position = 'relative';
				splash.style.height = 'calc(100vh - 2px)';
				splash.style.width = 'calc(100vw - 2px)';
				splash.style.border = '1px solid var(--window-border-color)';
				splash.style.setProperty('--window-border-color', colorInfo.windowBorder);

				if (layoutInfo.windowBorderRadius) {
					splash.style.borderRadius = layoutInfo.windowBorderRadius;
				}
			}

			// ensure there is enough space
			layoutInfo.sideBarWidth = Math.min(layoutInfo.sideBarWidth, window.innerWidth - (layoutInfo.activityBarWidth + layoutInfo.editorPartMinWidth));

			// part: title
			const titleDiv = document.createElement('div');
			titleDiv.setAttribute('style', `position: absolute; width: 100%; left: 0; top: 0; height: ${layoutInfo.titleBarHeight}px; background-color: ${colorInfo.titleBarBackground}; -webkit-app-region: drag;`);
			layoutShell.appendChild(titleDiv);

			// part: activity bar
			const activityDiv = document.createElement('div');
			activityDiv.setAttribute('style', `position: absolute; height: calc(100% - ${layoutInfo.titleBarHeight}px); top: ${layoutInfo.titleBarHeight}px; ${layoutInfo.sideBarSide}: 0; width: ${layoutInfo.activityBarWidth}px; background-color: ${colorInfo.activityBarBackground};`);
			layoutShell.appendChild(activityDiv);

			// part: side bar (only when opening workspace/folder)
			// folder or workspace -> status bar color, sidebar
			if (configuration.workspace) {
				const sideDiv = document.createElement('div');
				sideDiv.setAttribute('style', `position: absolute; height: calc(100% - ${layoutInfo.titleBarHeight}px); top: ${layoutInfo.titleBarHeight}px; ${layoutInfo.sideBarSide}: ${layoutInfo.activityBarWidth}px; width: ${layoutInfo.sideBarWidth}px; background-color: ${colorInfo.sideBarBackground};`);
				layoutShell.appendChild(sideDiv);
			}

			// part: statusbar
			const statusDiv = document.createElement('div');
			statusDiv.setAttribute('style', `position: absolute; width: 100%; bottom: 0; left: 0; height: ${layoutInfo.statusBarHeight}px; background-color: ${configuration.workspace ? colorInfo.statusBarBackground : colorInfo.statusBarNoFolderBackground};`);
			layoutShell.appendChild(statusDiv);
			splash.appendChild(layoutShell);
		}

		const configurationWithProduct = /** @type {INativeWindowConfiguration & NativeParsedArgs & { product?: { version?: string, target?: string, darwinUniversalAssetId?: string, commit?: string, nameLong?: string, vscodeVersion?: string, date?: string } }} */ (configuration);
		const product = configurationWithProduct.product || {};
		const versionLabel = formatStartupVersionLabel(product);
		const commit = product.commit || 'Unknown';
		const shortCommit = commit === 'Unknown' ? commit : commit.slice(0, 10);
		const palette = getStartupBrandPalette(baseTheme, shellBackground);
		const hero = document.createElement('div');
		hero.className = 'ads-brand-startup__hero';
		hero.appendChild(createStartupBrandSurface({
			eyebrow: 'DATA PLATFORM WORKBENCH',
			title: product.nameLong || 'Unknown',
			subtitle: `Version ${versionLabel} • Commit ${shortCommit}`,
			chips: [
				{ label: 'Version', value: versionLabel },
				{ label: 'Commit', value: shortCommit },
				{ label: 'VS Code', value: product.vscodeVersion || 'Unknown' }
			],
			entries: [
				{ label: 'Version', value: versionLabel },
				{ label: 'Commit', value: commit },
				{ label: 'Date', value: product.date || 'Unknown' },
				{ label: 'VS Code', value: product.vscodeVersion || 'Unknown' },
				{ label: 'Shell', value: configuration.os ? `${configuration.os.hostname} • ${configuration.os.arch}` : 'Unknown' },
				{ label: 'Runtime', value: navigator.userAgent }
			]
		}, palette));
		splash.appendChild(hero);

		document.body.appendChild(splash);

		performance.mark('code/didShowPartsSplash');
	}

	//#endregion
}());
