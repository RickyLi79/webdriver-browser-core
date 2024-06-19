import {
	EXECUTE_CMD,
	ExecuteResponseStatus,
	type ExecuteMessage,
	type ExecuteResponse,
	type IExecuteScriptReceiver,
	ExecuteScriptMessageType,
} from '../src-types/executeScript.types';

const KEY = '__MOCK_EXECUTE_SCRIPT_RECEIVER__';

export function getExecuteScriptReceiver(): IExecuteScriptReceiver {
	return (globalThis as any)[KEY];
}

export function initExecuteScriptReceiver() {
	let store = getExecuteScriptReceiver();
	if (!store) {
		(globalThis as any)[KEY] = store = {
			channel: crypto.randomUUID(),
			clientMap: {},
			// responseHandler: {},
		};
	}
	for (const i in store.clientMap) {
		store.clientMap[i].win.close();
	}
	store.clientMap = {};

	if (store?.onMessageHandler) {
		window.removeEventListener('message', store.onMessageHandler);
		store.onMessageHandler = undefined;
		console.debug('old message removeEventListener');
	}
	async function onMessageHandler(e: MessageEvent<ExecuteMessage>) {
		const { data: msg } = e;
		if (msg?.messageType !== ExecuteScriptMessageType.REQUEST) return;

		const store = getExecuteScriptReceiver();
		if (msg.channel !== store.channel) return;
		const client = store.clientMap[msg.client];
		if (!client) return;
		if (e.origin !== client.origin) return;
		function successHandler(re: any) {
			const store = getExecuteScriptReceiver();
			const res: ExecuteResponse = {
				messageType: ExecuteScriptMessageType.RESPONSE,
				status: ExecuteResponseStatus.OK,
				channel: store.channel,
				requestId: msg.requestId,
				data: re,
			};
			store.clientMap[msg.client].win.postMessage(res, e.origin);
		}
		function errorHandler(err: unknown) {
			// console.error(err);
			const store = getExecuteScriptReceiver();
			const res: ExecuteResponse = {
				messageType: ExecuteScriptMessageType.RESPONSE,
				status: ExecuteResponseStatus.ERROR,
				channel: store.channel,
				requestId: msg.requestId,
				data: err instanceof Error ? err.message : err,
			};
			store.clientMap[msg.client].win.postMessage(res, e.origin);
		}
		async function runScript(script: string, ...args: any[]): Promise<any> {
			// eslint-disable-next-line no-new-func
			const fn = new Function(script);
			const re = fn.apply(null, args);
			if (re?.then && typeof re.then === 'function') {
				return await re;
			}
			return re;
		}
		let re: any;
		if (msg.type === EXECUTE_CMD.EXECUTE_SCRIPT) {
			try {
				re = await runScript(msg.script, ...(msg.args ?? []));
				successHandler(re);
			} catch (err) {
				errorHandler(err);
			}
		} else if (msg.type === EXECUTE_CMD.EXECUTE_ASYNC_SCRIPT) {
			new Promise(async (resolve, reject) => {
				try {
					await runScript(msg.script, ...(msg.args ?? []), resolve);
				} catch (err) {
					reject(err);
				}
			})
				.then(successHandler)
				.catch(errorHandler);
		} else {
			const t: never = msg.type;
		}
	}
	window.addEventListener('message', onMessageHandler);
	store.onMessageHandler = onMessageHandler;
}

export type ChannelOptions = {
	url: string;
	origin: string;
	channel: string;
	client: string;
};
export function openChannelWindow(url: string) {
	const store = getExecuteScriptReceiver();
	const client = crypto.randomUUID();
	const search = new URLSearchParams();
	search.append('client', client);
	search.append('channel', store.channel);
	search.append('origin', window.location.origin);
	const winName = `${store.channel}-${new URL(url).host}`;
	const win = window.open(
		url + '?' + search.toString(),
		winName,
		`toolbar=no, menubar=no, location=no, status=no`,
	);
	win &&
		(store.clientMap[client] = {
			client,
			win,
			origin: new URL(url).origin,
		});
}
