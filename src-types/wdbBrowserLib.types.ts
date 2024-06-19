import type { IChunkMessage } from './ChunkMessage.types';
import type { IRequestQueue } from './RequestQueue.types';

declare global {
	interface Window {
		__WDB_BROWSER_LIB__: IWdbBrowserLib;
	}
}

export interface IWdbBrowserLib {
	chunk: IChunkMessage;
	requestQueue: IRequestQueue;
}
