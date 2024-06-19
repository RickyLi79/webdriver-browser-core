import type { Recordable } from '../src-types';
import type { ChunkData } from '../src-types/ChunkMessage.types';
import type { IExecuteScriptSender } from '../src-types/executeScript.types';

type ChunkItem = {
	id: string;
	totalSize: number;
	chunks: string[];
};
type ChunkWrappedData = {
	data: string;

	chunkItem?: ChunkItem;
};

type ExecuteScriptChunkStore = {
	scriptExecutor: IExecuteScriptSender;
	chunkSize: number;
	chunks: Recordable<ChunkItem>;
};

export class ChunkMessageSender {
	private readonly store: ExecuteScriptChunkStore;

	constructor({
		chunkSize,
		scriptExecutor,
	}: {
		chunkSize: number;
		scriptExecutor: IExecuteScriptSender;
	}) {
		this.store = {
			chunkSize,
			chunks: {},
			scriptExecutor,
		};
		this.store.chunkSize = chunkSize;
		this.store.scriptExecutor = scriptExecutor;
	}

	// private clearChunkExecutor() {
	// 	getStore()?.chunks && (getStore().chunks = {});
	// }

	private cutChunk(data: string, chunkSize: number): string[] {
		const chunkList = Array.from({
			length: Math.ceil(data.length / chunkSize),
		}).map((_, idx) => data.substring(idx * chunkSize, (idx + 1) * chunkSize));
		return chunkList;
	}

	private createChunk(
		store: ExecuteScriptChunkStore,
		data: string,
	): ChunkWrappedData {
		const { chunkSize, chunks: chunkStore } = store;
		if (data.length <= chunkSize) {
			return {
				data,
			};
		}
		const chunks = this.cutChunk(data, store.chunkSize);
		const chunkItem: ChunkItem = {
			id: crypto.randomUUID(),
			chunks,
			totalSize: data.length,
		};
		const chunk0 = chunks[0];
		chunkStore[chunkItem.id] = chunkItem;
		return {
			data: chunk0,
			chunkItem,
		};
	}

	async executeScript<T>(script: string, args: any[] = []): Promise<T> {
		const data = JSON.stringify([script, args]);
		const { store } = this;
		const msg = this.createChunk(store, data);
		const chunkScript =
			'return window.__WDB_BROWSER_LIB__.chunk.chunkExecuteScript(arguments[0])';
		if (msg.chunkItem) {
			const toArgs: ChunkData[] = msg.chunkItem.chunks.map(
				(value, idx, arr) => ({
					data: value,
					chunkInfo: {
						id: msg.chunkItem!.id,
						idx,
						total: arr.length,
					},
				}),
			);
			let lastResult: any;
			for (const i of toArgs) {
				lastResult = await store.scriptExecutor.executeScript(chunkScript, [i]);
			}
			return lastResult;
		}
		const toArgs: ChunkData = { data };
		const result = await store.scriptExecutor.executeScript(chunkScript, [
			toArgs,
		]);
		return result;
	}
}
