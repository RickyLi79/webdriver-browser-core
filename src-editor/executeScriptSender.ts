import type { Recordable } from '../src-types';

import {
	EXECUTE_CMD,
	IExecuteScriptSender,
	type ExecuteMessage,
	ExecuteScriptMessageType,
	type ExecuteResponse,
	ExecuteResponseStatus,
} from '../src-types/executeScript.types';

export type InitToken = {
	channel: string;
	origin: string;
	client: string;
};

type ResponseHandler<T> = {
	resolve: (res: T) => void;
	reject: (err: any) => void;
};

const KEY = '__ExecuteScriptSender__';
function setExecuteScriptSender(instance: IExecuteScriptSender) {
	return ((globalThis as any)[KEY] = instance);
}
function getExecuteScriptSender(): IExecuteScriptSender & {
	dispose: () => void;
} {
	return (globalThis as any)[KEY] as any;
}

class ExecuteScriptSender implements IExecuteScriptSender {
	constructor(private readonly initToken: InitToken) {
		// console.info(initToken);
		getExecuteScriptSender()?.dispose();
		window.addEventListener('message', this.messageHandler.bind(this));
		setExecuteScriptSender(this);
	}
	private responseHandlers: Recordable<ResponseHandler<any>> = {};
	private messageHandler(e: MessageEvent<ExecuteResponse>) {
		const { data: msg } = e;
		if (msg?.messageType !== ExecuteScriptMessageType.RESPONSE) return;
		const { initToken, responseHandlers } = this;
		if (msg.channel !== initToken.channel) return;
		const resHandler = responseHandlers[msg.requestId];
		if (!resHandler) return;
		try {
			// console.info(msg);
			if (msg.status === ExecuteResponseStatus.OK) {
				resHandler.resolve(msg.data);
			} else if (msg.status === ExecuteResponseStatus.ERROR) {
				const errMsg = JSON.stringify(msg.data);
				resHandler.reject(new Error(errMsg));
			} else if (msg.status === ExecuteResponseStatus.TIMEOUT) {
				resHandler.reject(new Error('time out'));
			}
		} finally {
			delete responseHandlers[msg.requestId];
		}
	}

	public async executeScript(script: string, args?: any[]): Promise<any> {
		return this.sendMessage({
			type: EXECUTE_CMD.EXECUTE_SCRIPT,
			script,
			args,
		});
	}
	public async executeAsyncScript(script: string, args?: any[]): Promise<any> {
		return this.sendMessage({
			type: EXECUTE_CMD.EXECUTE_ASYNC_SCRIPT,
			script,
			args,
		});
	}

	private sendMessage<T>(
		msg: Pick<ExecuteMessage, 'type' | 'script' | 'args'>,
	): Promise<T> {
		if (!window.opener) {
			return Promise.reject(new Error('opener not connected yet'));
		}
		const { initToken, responseHandlers } = this;
		const requestId = crypto.randomUUID();
		const bMsg: ExecuteMessage = {
			messageType: ExecuteScriptMessageType.REQUEST,
			channel: initToken.channel,
			client: initToken.client,
			requestId,

			...msg,
		};
		const p = new Promise<T>((resolve, reject) => {
			responseHandlers[requestId] = { resolve, reject };
		});
		window.opener.postMessage(bMsg, initToken.origin);
		return p;
	}

	dispose() {
		const { responseHandlers } = this;
		for (const i in responseHandlers) {
			responseHandlers[i].resolve(null);
		}
		window.removeEventListener('message', this.messageHandler);
		console.info('ExecuteScriptSender disposed');
	}
}

function initExecuteScriptSender(initToken: InitToken = getInitToken()) {
	return new ExecuteScriptSender(initToken);
}

const WDB_INIT_TOKEN_KEY = 'WDB:initToken';
function getInitToken() {
	let initToken: InitToken;
	const rawHash = location.hash;
	const sp = new URLSearchParams(rawHash.slice(1).split('?')[1]);
	initToken = Object.fromEntries(
		['channel', 'origin', 'client'].map(i => [i, sp.get(i)]),
	) as any;
	if (Object.entries(initToken!).every(([_key, value]) => !!value)) {
		sessionStorage.setItem(WDB_INIT_TOKEN_KEY, JSON.stringify(initToken));
	} else if (window.opener) {
		const tokenStr = sessionStorage.getItem(WDB_INIT_TOKEN_KEY);
		if (tokenStr) {
			console.info('reload initToken from sessionStorage');
			initToken = JSON.parse(tokenStr);
		}
	}
	return initToken;
}

export { initExecuteScriptSender, getExecuteScriptSender };
