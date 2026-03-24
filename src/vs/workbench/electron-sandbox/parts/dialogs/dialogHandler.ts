/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { isLinuxSnap } from 'vs/base/common/platform';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { AbstractDialogHandler, IConfirmation, IConfirmationResult, IPrompt, IPromptResult } from 'vs/platform/dialogs/common/dialogs';
import { ILogService } from 'vs/platform/log/common/log';
import { INativeHostService } from 'vs/platform/native/common/native';
import { IProductService } from 'vs/platform/product/common/productService';
import { process } from 'vs/base/parts/sandbox/electron-sandbox/globals';
import { aboutDetail } from 'sql/base/common/locConstants'; // {{SQL CARBON EDIT}} Imports about detail localized string for ADS about dialog
import { ILayoutService } from 'vs/platform/layout/browser/layoutService';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IBrandSurfaceEntry, showBrandDialog } from 'vs/workbench/browser/parts/dialogs/aboutSplash';

export class NativeDialogHandler extends AbstractDialogHandler {

	constructor(
		@ILogService private readonly logService: ILogService,
		@INativeHostService private readonly nativeHostService: INativeHostService,
		@IProductService private readonly productService: IProductService,
		@IClipboardService private readonly clipboardService: IClipboardService,
		@ILayoutService private readonly layoutService: ILayoutService,
		@IKeybindingService private readonly keybindingService: IKeybindingService,
		@IThemeService private readonly themeService: IThemeService
	) {
		super();
	}

	async prompt<T>(prompt: IPrompt<T>): Promise<IPromptResult<T>> {
		this.logService.trace('DialogService#prompt', prompt.message);

		const buttons = this.getPromptButtons(prompt);

		const { response, checkboxChecked } = await this.nativeHostService.showMessageBox({
			type: this.getDialogType(prompt.type),
			title: prompt.title,
			message: prompt.message,
			detail: prompt.detail,
			buttons,
			cancelId: prompt.cancelButton ? buttons.length - 1 : -1 /* Disabled */,
			checkboxLabel: prompt.checkbox?.label,
			checkboxChecked: prompt.checkbox?.checked
		});

		return this.getPromptResult(prompt, response, checkboxChecked);
	}

	async confirm(confirmation: IConfirmation): Promise<IConfirmationResult> {
		this.logService.trace('DialogService#confirm', confirmation.message);

		const buttons = this.getConfirmationButtons(confirmation);

		const { response, checkboxChecked } = await this.nativeHostService.showMessageBox({
			type: this.getDialogType(confirmation.type) ?? 'question',
			title: confirmation.title,
			message: confirmation.message,
			detail: confirmation.detail,
			buttons,
			cancelId: buttons.length - 1,
			checkboxLabel: confirmation.checkbox?.label,
			checkboxChecked: confirmation.checkbox?.checked
		});

		return { confirmed: response === 0, checkboxChecked };
	}

	input(): never {
		throw new Error('Unsupported'); // we have no native API for password dialogs in Electron
	}

	async about(): Promise<void> {
		let version = this.productService.version;
		if (this.productService.target) {
			version = `${version} (${this.productService.target} setup)`;
		} else if (this.productService.darwinUniversalAssetId) {
			version = `${version} (Universal)`;
		}

		const osProps = await this.nativeHostService.getOSProperties();

		const osLabel = `${osProps.type} ${osProps.arch} ${osProps.release}${isLinuxSnap ? ' snap' : ''}`;
		const detailRows: IBrandSurfaceEntry[] = [
			{ label: 'Version', value: version || 'Unknown' },
			{ label: 'Commit', value: this.productService.commit || 'Unknown' },
			{ label: 'Date', value: this.productService.date || 'Unknown' },
			{ label: 'VS Code', value: this.productService.vscodeVersion || 'Unknown' },
			{ label: 'Electron', value: process.versions['electron'] || 'Unknown' },
			{ label: 'Chromium', value: process.versions['chrome'] || 'Unknown' },
			{ label: 'Node.js', value: process.versions['node'] || 'Unknown' },
			{ label: 'V8', value: process.versions['v8'] || 'Unknown' },
			{ label: 'OS', value: osLabel }
		];
		const shortCommit = detailRows[1].value === 'Unknown' ? 'Unknown' : detailRows[1].value.slice(0, 10);
		const detailToCopy = aboutDetail(
			version || 'Unknown',
			this.productService.commit || 'Unknown',
			this.productService.date || 'Unknown',
			process.versions['electron'] || 'Unknown',
			process.versions['chrome'] || 'Unknown',
			process.versions['node'] || 'Unknown',
			process.versions['v8'] || 'Unknown',
			osLabel,
			this.productService.vscodeVersion || 'Unknown'
		);

		const response = await showBrandDialog({
			layoutService: this.layoutService,
			keybindingService: this.keybindingService,
			theme: this.themeService.getColorTheme(),
			title: localize('aboutTitle', "About {0}", this.productService.nameLong),
			buttons: [
				localize({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy"),
				localize('close', "Close")
			],
			cancelId: 1,
			surface: {
				eyebrow: 'DATA PLATFORM WORKBENCH',
				title: this.productService.nameLong,
				subtitle: `Version ${detailRows[0].value} • Commit ${shortCommit}`,
				chips: [
					{ label: 'Version', value: detailRows[0].value },
					{ label: 'Commit', value: shortCommit },
					{ label: 'VS Code', value: detailRows[3].value }
				],
				entries: detailRows
			}
		});

		if (response === 0) {
			this.clipboardService.writeText(detailToCopy);
		}
	}
}
