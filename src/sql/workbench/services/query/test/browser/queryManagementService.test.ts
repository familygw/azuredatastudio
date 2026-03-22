/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';

import * as azdata from 'azdata';
import { IQueryManagementService, IQueryRequestHandler, QueryManagementService } from 'sql/workbench/services/query/common/queryManagement';
import { IConnectionManagementService } from 'sql/platform/connection/common/connectionManagement';
import { NullAdsTelemetryService } from 'sql/platform/telemetry/common/adsTelemetryService';
import { IAdsTelemetryService } from 'sql/platform/telemetry/common/telemetry';
import { TestInstantiationService } from 'vs/platform/instantiation/test/common/instantiationServiceMock';
import { NullLogService, ILogService } from 'vs/platform/log/common/log';

suite('Query Management Service', () => {
	function createService(instantiationService: TestInstantiationService): QueryManagementService {
		instantiationService.stub(IConnectionManagementService, {
			getProviderIdFromUri: () => 'MSSQL',
			refreshAzureAccountTokenIfNecessary: async () => true
		} as Partial<IConnectionManagementService>);
		instantiationService.stub(IAdsTelemetryService, new NullAdsTelemetryService());
		instantiationService.stub(ILogService, new NullLogService());

		const service = instantiationService.createInstance(QueryManagementService);
		instantiationService.stub(IQueryManagementService, service);
		return service;
	}

	function createNoopHandler(): IQueryRequestHandler {
		return {
			cancelQuery: async () => ({ messages: '' }),
			runQuery: async () => { },
			runQueryStatement: async () => { },
			runQueryString: async () => { },
			runQueryAndReturn: async () => ({ rowCount: 0, columnInfo: [], rows: [] }),
			parseSyntax: async () => ({ parseable: true, errors: [] }),
			getQueryRows: async () => ({ message: '', resultSubset: { rowCount: 0, rows: [] } }),
			disposeQuery: async () => { },
			connectionUriChanged: async () => { },
			saveResults: async () => ({ messages: '' }),
			copyResults: async () => { },
			setQueryExecutionOptions: async () => { },
			initializeEdit: async () => { },
			disposeEdit: async () => { },
			updateCell: async () => ({ cell: undefined!, isRowDirty: false }),
			commitEdit: async () => { },
			createRow: async () => ({ defaultValues: [], newRowId: 0 }),
			deleteRow: async () => { },
			revertCell: async () => ({ cell: undefined!, isRowDirty: false }),
			revertRow: async () => { },
			getEditRows: async () => ({ rowCount: 0, subset: [] })
		};
	}

	function createRunner(): {
		hasCompleted: boolean;
		handleMessage: (messages: azdata.IResultMessage[]) => void;
	} {
		return {
			hasCompleted: false,
			handleMessage: () => { }
		};
	}

	test('queues notifications by owner uri until the matching runner is registered', () => {
		const instantiationService = new TestInstantiationService();
		const service = createService(instantiationService);
		const uriA = 'test:a';
		const uriB = 'test:b';

		let runnerAMessageCount = 0;
		let runnerBMessageCount = 0;
		const runnerA = createRunner();
		runnerA.handleMessage = () => runnerAMessageCount++;
		const runnerB = createRunner();
		runnerB.handleMessage = () => runnerBMessageCount++;

		const message: azdata.QueryExecuteMessageParams = {
			ownerUri: uriA,
			message: {
				batchId: 0,
				isError: false,
				message: 'queued message'
			}
		};

		service.onMessage(new Map([[uriA, [message]]]));
		assert.strictEqual(service._handlerCallbackQueue.get(uriA)?.length, 1);

		service.registerRunner(runnerB as any, uriB);
		assert.strictEqual(runnerAMessageCount, 0);
		assert.strictEqual(runnerBMessageCount, 0);
		assert.strictEqual(service._handlerCallbackQueue.get(uriA)?.length, 1);

		service.registerRunner(runnerA as any, uriA);
		assert.strictEqual(runnerAMessageCount, 1);
		assert.strictEqual(runnerBMessageCount, 0);
		assert.strictEqual(service._handlerCallbackQueue.has(uriA), false);
	});

	test('clears queued notifications when disposing a query', async () => {
		const instantiationService = new TestInstantiationService();
		const service = createService(instantiationService);
		service.addQueryRequestHandler('MSSQL', createNoopHandler());

		const uri = 'test:dispose';
		const message: azdata.QueryExecuteMessageParams = {
			ownerUri: uri,
			message: {
				batchId: 0,
				isError: false,
				message: 'stale message'
			}
		};

		service.onMessage(new Map([[uri, [message]]]));
		assert.strictEqual(service._handlerCallbackQueue.get(uri)?.length, 1);

		await service.disposeQuery(uri);
		assert.strictEqual(service._handlerCallbackQueue.has(uri), false);
	});
});
