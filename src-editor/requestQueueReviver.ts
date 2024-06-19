import type { Promisable, Recordable } from '../src-types';
import {
	RQResponseStatus,
	type RQRequest,
} from '../src-types/RequestQueue.types';
import type { ChunkMessageSender } from './chunkMessageSender';

const LOOP_INTERVAL = 20;

const SCRIPT_ROOT = 'return window.__WDB_BROWSER_LIB__.requestQueue';
const SCRIPT_waitForRequests = `${SCRIPT_ROOT}.waitForRequests()`;
const SCRIPT_response = `${SCRIPT_ROOT}.response(arguments[0])`;

type ScopeHandler = (request: {
	scope: string;
	request: string;
	data: any;
}) => Promisable<{
	status: RQResponseStatus;
	data?: any;
}>;

export class RequestQueueReviver {
	private readonly chunkMessageSender: ChunkMessageSender;
	private readonly scopeHandlers: Recordable<ScopeHandler> = {};

	constructor({
		chunkMessageSender,
	}: {
		chunkMessageSender: ChunkMessageSender;
	}) {
		this.chunkMessageSender = chunkMessageSender;
	}

	private running = false;
	public start() {
		if (this.running) return;
		this.running = true;
		this.loopWatch();
		console.debug('loopWatch start');
	}
	public stop() {
		if (!this.running) return;
		this.running = false;
		console.debug('loopWatch stop');
	}

	private async loopWatch() {
		if (!this.running) return;
		try {
			const requestList: RQRequest[] =
				await this.chunkMessageSender.executeScript(SCRIPT_waitForRequests);
			new Promise<void>(async resolve => {
				// console.debug('on Request', requestList.length);
				for (const iReq of requestList) {
					await this.handleRequest(iReq);
				}
				resolve();
			});
		} catch (err) {
			console.error(err);
		}
		setTimeout(() => this.loopWatch(), LOOP_INTERVAL) as any;
	}

	private async handleRequest(request: RQRequest) {
		const handler = this.scopeHandlers[request.scope];
		if (handler !== undefined) {
			try {
				const { status, data } = await handler({
					scope: request.scope,
					request: request.request,
					data: request.data,
				});
				return await this.chunkMessageSender.executeScript(SCRIPT_response, [
					{
						requestId: request.requestId,
						status,
						data,
					},
				]);
			} catch (err) {
				return await this.chunkMessageSender.executeScript(SCRIPT_response, [
					{
						requestId: request.requestId,
						status: RQResponseStatus.ERROR,
						data: (err as Error).message ?? err?.toString() ?? 'error',
					},
				]);
			}
		}

		console.error('RQResponseStatus.NOT_FOUND', request.scope, request.request);
		return this.chunkMessageSender.executeScript(SCRIPT_response, [
			{
				requestId: request.requestId,
				status: RQResponseStatus.NOT_FOUND,
			},
		]);
	}

	public setScopeHandler(scope: string, handler: ScopeHandler) {
		this.scopeHandlers[scope] = handler;
	}
}
