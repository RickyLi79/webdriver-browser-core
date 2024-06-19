import type { Recordable } from '.';

export interface IExecuteScriptSender {
	executeScript(script: string, args: any[]): Promise<any>;
	executeAsyncScript(script: string, args: any[]): Promise<any>;
	// dispose(): void;
}

export enum ExecuteScriptMessageType {
	REQUEST = 'ExecuteScript:request',
	RESPONSE = 'ExecuteScript:response',
}

export enum EXECUTE_CMD {
	EXECUTE_SCRIPT = 'executeScript',
	EXECUTE_ASYNC_SCRIPT = 'executeAsyncScript',
}
// export const EXECUTE_MESSAGE = 'EXECUTE_MESSAGE';
export type ExecuteMessage = {
	messageType: ExecuteScriptMessageType;

	channel: string;
	client: string;

	requestId: string;

	// _message_type_: typeof EXECUTE_MESSAGE;

	// data: {
	type: EXECUTE_CMD;
	script: string;
	args?: any[];
	// };
};

export enum ExecuteResponseStatus {
	OK = 200,
	ERROR = 500,
	TIMEOUT = 508,
}

export type ExecuteResponse = {
	messageType: string;
	channel: string;
	requestId: string;
	status: ExecuteResponseStatus;
	data?: any;
};

export interface IExecuteScriptReceiver {
	channel: string;
	clientMap: Recordable<{
		client: string;
		win: Window;
		origin: string;
	}>;
	// responseHandler: Recordable;
	onMessageHandler?: (e: MessageEvent<ExecuteMessage>) => void;
}
