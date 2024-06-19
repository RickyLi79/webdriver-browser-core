import {
	RQResponseStatus,
	type IRequestQueue,
	type RQInitOptions,
	type RQRequest,
	type RQResponse,
	type Response,
} from '#/RequestQueue.types';
import type { Recordable } from '#/index';
import { oneOfType } from '#/utils/typeUtils';

export class RequestQueue implements IRequestQueue {
	private readonly requestQueue: RQRequest[] = [];
	private nextRequestResolver?: (requestList: RQRequest[]) => void;
	private nextRequestReject?: (reason: any) => void;
	private nextRequestTimeout?: number;
	private checkTimeoutTimer: Recordable<number> = {};

	private responseHandler: Recordable<{
		resolve: (res: Response) => void;
		reject: (reason: Response) => void;
	}> = {};

	constructor(public readonly initOptions: RQInitOptions) {}

	private addMessageQueue(msg: RQRequest) {
		this.requestQueue.push(msg);
		this.flushRequests();
	}

	private flushRequests() {
		if (!this.nextRequestResolver) {
			return;
		}
		if (this.requestQueue.length === 0) {
			return;
		}
		this.nextRequestResolver([...this.requestQueue]);
		this.deleteWaitForRequestsHandler();
	}

	private deleteWaitForRequestsHandler() {
		this.requestQueue.splice(0);
		this.nextRequestResolver = undefined;
		this.nextRequestReject = undefined;
		if (this.nextRequestTimeout) {
			clearTimeout(this.nextRequestTimeout);
			this.nextRequestTimeout = undefined;
		}
	}

	private deleteResponseHandler(requestId: string) {
		delete this.responseHandler[requestId];
		const timeout = this.checkTimeoutTimer[requestId];
		if (timeout) {
			clearTimeout(timeout);
			delete this.checkTimeoutTimer[requestId];
		}
	}

	public request<Data>(
		req: Omit<RQRequest, 'type' | 'requestId'>,
	): Promise<Response<Data>> {
		const bReq: RQRequest = {
			timeout: this.initOptions.defaultTimeout,
			...req,
			requestId: crypto.randomUUID(),
		};
		const p = new Promise<Response<Data>>((resolve: any, reject) => {
			this.responseHandler[bReq.requestId] = { resolve, reject };
			if (bReq.timeout) {
				const timeout = setTimeout(
					(requestId: string) => {
						const responseHandler = this.responseHandler[requestId];
						if (responseHandler) {
							try {
								responseHandler.reject({
									status: RQResponseStatus.TIMEOUT,
									data: Date.now(),
								});
							} finally {
								this.deleteResponseHandler(requestId);
							}
						}
					},
					bReq.timeout,
					bReq.requestId,
				) as any as number;
				this.checkTimeoutTimer[bReq.requestId] = timeout;
			}
			this.addMessageQueue(bReq);
		});
		return p;
	}

	public response(res: RQResponse) {
		const responseHandler = this.responseHandler[res.requestId];
		if (!responseHandler) return;
		let data = res.data;
		try {
			if (
				oneOfType(res.status, [
					RQResponseStatus.NOT_FOUND,
					RQResponseStatus.ERROR,
				] as const)
			) {
				responseHandler.reject({ status: res.status, data });
			} else {
				responseHandler.resolve({ status: res.status, data });
			}
		} finally {
			this.deleteResponseHandler(res.requestId);
		}
	}

	public waitForRequests(): Promise<RQRequest[]> {
		if (this.requestQueue.length > 0) {
			const list = [...this.requestQueue];
			this.requestQueue.splice(0);
			return Promise.resolve(list);
		}
		const promise = new Promise<RQRequest[]>((resolve, reject) => {
			this.nextRequestResolver = list => {
				// console.debug(list);
				resolve(list);
			};
			this.nextRequestReject = reject;
			this.nextRequestTimeout = setTimeout(
				() => {
					this.nextRequestResolver?.([]);
				},
				this.initOptions.holdTimeSec * 1000 * 0.9,
			) as any;
		});
		return promise;
	}
}
