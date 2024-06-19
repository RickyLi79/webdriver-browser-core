import type {
	ChunkData,
	ChunkStore,
	IChunkMessage,
} from '#/ChunkMessage.types';

export class ChunkMessage implements IChunkMessage {
	constructor(private readonly store: ChunkStore) {}

	public async chunkExecuteScript(data: ChunkData) {
		const { store } = this;
		if (data.chunkInfo) {
			// console.debug(
			// 	`chunkInfo ${data.chunkInfo.idx + 1}/${data.chunkInfo.total}`,
			// );
			let arr = store.request[data.chunkInfo.id];
			if (!arr) {
				arr = store.request[data.chunkInfo.id] = Array.from({
					length: data.chunkInfo.total,
				});
			}
			arr[data.chunkInfo.idx] = data.data;
		}

		if (data.chunkInfo && data.chunkInfo.idx + 1 !== data.chunkInfo.total) {
			return; // 数据未齐全，不进行真正的execute
		}

		let totalData = data.data;
		if (data.chunkInfo) {
			const chunks = store.request[data.chunkInfo.id];
			totalData = chunks.join('');
			delete store.request[data.chunkInfo.id];
		}
		const [script, args = []] = JSON.parse(totalData) as [string, any[]];

		async function runScript(script: string, ...args: any[]): Promise<any> {
			const fn = new Function(script);
			const re = fn.apply(null, args);
			if (re?.then && typeof re.then === 'function') {
				return await re;
			}
			return re;
		}
		return new Promise((resolve, reject) => {
			runScript(script, ...args)
				.then(re => {
					// console.debug(`chunkInfo runScript`);
					resolve(re);
				})
				.catch(err => {
					// debugger;
					reject(err);
				});
		});
	}
}
