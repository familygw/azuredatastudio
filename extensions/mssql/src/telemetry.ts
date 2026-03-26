/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import AdsTelemetryReporter from '@microsoft/ads-extension-telemetry';
import { ErrorAction, ErrorHandler, Message, CloseAction } from 'vscode-languageclient';

import * as Constants from './constants';
import * as nls from 'vscode-nls';
import { ServerInfo } from 'azdata';

interface IPackageInfo {
	name: string;
	version: string;
	aiKey: string;
}

interface ITelemetryErrorEvent {
	withAdditionalProperties(properties: { [key: string]: string }): ITelemetryErrorEvent;
	send(): void;
}

interface ITelemetryReporter {
	sendTelemetryEvent(eventName: string, properties?: { [key: string]: string }, measures?: { [key: string]: number }): void;
	sendActionEvent(viewName: string, actionName: string): void;
	sendMetricsEvent(measures: { [key: string]: number }, eventName: string): void;
	createErrorEvent2(viewName: string, actionName: string, error: unknown): ITelemetryErrorEvent;
	dispose(): void;
}

const localize = nls.loadMessageBundle();
const viewKnownIssuesAction = localize('viewKnownIssuesText', "View Known Issues");
const restartExtensionHostAction = localize('restartExtensionHost', "Restart Extension Host");
const reloadWindowAction = localize('reloadWindow', "Reload Window");

const packageInfo = vscode.extensions.getExtension(Constants.packageName)?.packageJSON as IPackageInfo | undefined;
const noOpErrorEvent: ITelemetryErrorEvent = {
	withAdditionalProperties: () => noOpErrorEvent,
	send: () => { }
};

const noOpTelemetryReporter: ITelemetryReporter = {
	sendTelemetryEvent: () => { },
	sendActionEvent: () => { },
	sendMetricsEvent: () => { },
	createErrorEvent2: () => noOpErrorEvent,
	dispose: () => { }
};

export const TelemetryReporter: ITelemetryReporter = vscode.env.isTelemetryEnabled && packageInfo?.aiKey
	? new AdsTelemetryReporter<string, string>(packageInfo.name, packageInfo.version, packageInfo.aiKey)
	: noOpTelemetryReporter;

/**
 * Collects server information from ServerInfo to put into a
 * property bag
 */
export function fillServerInfo(telemetryInfo: { [key: string]: string }, serverInfo: ServerInfo): void {
	telemetryInfo['serverEdition'] = serverInfo?.serverEdition;
	telemetryInfo['serverLevel'] = serverInfo?.serverLevel;
	telemetryInfo['serverMajorVersion'] = serverInfo?.serverMajorVersion?.toString() || '';
	telemetryInfo['serverMinorVersion'] = serverInfo?.serverMinorVersion?.toString() || '';
	telemetryInfo['isCloud'] = serverInfo?.isCloud.toString();
}

/**
 * Handle Language Service client errors
 */
export class LanguageClientErrorHandler implements ErrorHandler {

	/**
	 * Show an error message prompt with a link to known issues wiki page
	 * @memberOf LanguageClientErrorHandler
	 */
	showOnErrorPrompt(): void {
		TelemetryReporter.sendTelemetryEvent(Constants.serviceName + 'Crash');
		void vscode.window.showErrorMessage(
			localize('serviceCrashMessage', "{0} component exited unexpectedly. Please restart Azure Data Studio.", Constants.serviceName),
			restartExtensionHostAction,
			reloadWindowAction,
			viewKnownIssuesAction).then(action => {
				switch (action) {
					case restartExtensionHostAction:
						void vscode.commands.executeCommand('workbench.action.restartExtensionHost');
						break;
					case reloadWindowAction:
						void vscode.commands.executeCommand('workbench.action.reloadWindow');
						break;
					case viewKnownIssuesAction:
						void vscode.env.openExternal(vscode.Uri.parse(Constants.serviceCrashLink));
						break;
				}
			});
	}

	/**
	 * Callback for language service client error
	 *
	 * @memberOf LanguageClientErrorHandler
	 */
	error(error: Error, message: Message, count: number): ErrorAction {
		this.showOnErrorPrompt();

		// we don't retry running the service since crashes leave the extension
		// in a bad, unrecovered state
		return ErrorAction.Shutdown;
	}

	/**
	 * Callback for language service client closed
	 *
	 * @memberOf LanguageClientErrorHandler
	 */
	closed(): CloseAction {
		this.showOnErrorPrompt();

		// we don't retry running the service since crashes leave the extension
		// in a bad, unrecovered state
		return CloseAction.DoNotRestart;
	}
}

export enum TelemetryViews {
	MssqlObjectExplorer = 'mssqlObjectExplorer',
	MssqlConnections = 'mssqlConnections'
}

export enum TelemetryActions {
	GroupBySchemaEnabled = 'objectExplorerGroupBySchemaEnabled',
	GroupBySchemaDisabled = 'objectExplorerGroupBySchemaDisabled',
	EnableGroupBySchemaContextMenu = 'objectExplorerEnableGroupBySchemaContextMenu',
	DisableGroupBySchemaContextMenu = 'objectExplorerDisableGroupBySchemaContextMenu',
	EnableGroupByServerViewTitleAction = 'objectExplorerEnableGroupByServerViewTitleAction',
	DisableGroupByServerViewTitleAction = 'objectExplorerDisableGroupByServerViewTitleAction',
	EnableFeatureAsyncParallelProcessing = 'enableFeatureAsyncParallelProcessing',
	EnableFeatureSqlAuthenticationProvider = 'enableFeatureSqlAuthenticationProvider',
	EnableFeatureConnectionPooling = 'enableFeatureConnectionPooling',
}
