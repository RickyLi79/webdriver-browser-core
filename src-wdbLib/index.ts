import type { ChunkStore, IChunkMessage } from '#/ChunkMessage.types';
import type { IRequestQueue } from '#/RequestQueue.types';
import type { IResourceManager } from '#/resourceManager.types';
import type { IWdbBrowserLib } from '#/wdbBrowserLib.types';
import { ChunkMessage } from './chunk-message';
import { RequestQueue } from './request-queue';
import { ResourceManager } from './resource-manager';

class WdbBrowserLib implements IWdbBrowserLib {
	private static instance: WdbBrowserLib;
	public static getSingleton() {
		if (!this.instance) {
			this.instance = new WdbBrowserLib();
			console.debug('init WdbBrowserLib!');
		} else {
			console.debug('skip init WdbBrowserLib');
		}
		return this.instance;
	}

	private chunkStore: ChunkStore = {
		request: {},
		response: {},
	};
	public chunk: IChunkMessage;
	public requestQueue: IRequestQueue;
	public resourceManager: IResourceManager;

	private constructor() {
		this.chunk = new ChunkMessage(this.chunkStore);
		this.requestQueue = new RequestQueue({
			holdTimeSec: 1e3 * 60 * 10,
			defaultTimeout: 60e3,
		});
		this.resourceManager = new ResourceManager({
			requestQueue: this.requestQueue,
		});
	}
}

export function setupWdbBrowserLib(): IWdbBrowserLib {
	const inst: IWdbBrowserLib = WdbBrowserLib.getSingleton();
	window.__WDB_BROWSER_LIB__ = inst;
	return inst;
}
