/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as azdata from 'azdata';


import * as constants from './constants';
import * as utils from './utils';

import { ApiWrapper } from './apiWrapper';
import { AppContext } from './appContext';
import { DataSourceWizardService } from './services/contracts';
import { managerInstance, ApiType } from './services/serviceApiManager';
import { OpenVirtualizeDataWizardCommand, OpenVirtualizeDataWizardTask, OpenMssqlHdfsTableFromFileWizardCommand } from './wizards/wizardCommands';
import { ServiceClient } from './services/serviceClient';
import { TelemetryReporter } from './services/telemetry';

export function activate(extensionContext: vscode.ExtensionContext): void {
	let apiWrapper = new ApiWrapper();
	let appContext = new AppContext(extensionContext, apiWrapper);
	apiWrapper.setCommandContext(constants.CommandContext.WizardServiceEnabled, true);

	const outputChannel = apiWrapper.createOutputChannel(constants.serviceName);
	let serviceClient = new ServiceClient(apiWrapper, outputChannel);
	let wizardServicePromise: Promise<DataSourceWizardService> | undefined;
	const getWizardService = async (): Promise<DataSourceWizardService> => {
		if (!wizardServicePromise) {
			const registeredWizardService = new Promise<DataSourceWizardService>((resolve) => {
				const registration = managerInstance.onRegisteredApi<DataSourceWizardService>(ApiType.DataSourceWizard)((wizardService: DataSourceWizardService) => {
					registration.dispose();
					resolve(wizardService);
				});
			});

			wizardServicePromise = Promise.all([
				serviceClient.startService(extensionContext),
				registeredWizardService
			]).then(([, wizardService]) => wizardService);
		}

		try {
			return await wizardServicePromise;
		} catch (err) {
			wizardServicePromise = undefined;
			throw err;
		}
	};

	extensionContext.subscriptions.push(new OpenVirtualizeDataWizardCommand(appContext, getWizardService));
	apiWrapper.registerTaskHandler(constants.virtualizeDataTask, async (profile: azdata.IConnectionProfile) => {
		await new OpenVirtualizeDataWizardTask(appContext, getWizardService).execute(profile);
	});
	extensionContext.subscriptions.push(new OpenMssqlHdfsTableFromFileWizardCommand(appContext, getWizardService));
	extensionContext.subscriptions.push(TelemetryReporter);
}
