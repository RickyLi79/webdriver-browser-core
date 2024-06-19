import type { Recordable } from '.';

export type RQInitOptions = {
	// scope: string;
	holdTimeSec: number;
	// sendInterval: number;
	defaultTimeout: number;
};

export enum RQResponseStatus {
	UNKNOWN = 0,
	OK = 200,
	NOT_FOUND = 404,
	TIMEOUT = 408,
	ERROR = 500,
	SERVICE_SHUTDOWN = 503,
}

export type RQRequest<Data = any> = {
	scope: string;
	requestId: string;
	request: string;
	data?: Data;
	timeout?: number;
};

export type RQResponse<Data = any> = {
	requestId: string;
	status: RQResponseStatus;
	data: Data;
};

export type Response<Data = any> = {
	status: RQResponseStatus;
	data: Data;
};

export type RequestQueueStore = {
	scope: string;
	instance: IRequestQueue;
	requestQueue: RQRequest[];
	responseHandler: Recordable<{
		resolve: (res: Response) => void;
		reject: (reason: Response) => void;
	}>;
	checkTimeoutTimer: Recordable<number>;
	nextRequestResolver?: (requestList: RQRequest[]) => void;
	nextRequestReject?: (reason: any) => void;
};

export interface IRequestQueue {
	request<Data>(
		req: Omit<RQRequest, 'type' | 'requestId'>,
	): Promise<Response<Data>>;
	response(res: RQResponse): void;

	waitForRequests(): Promise<RQRequest[]>;
}
