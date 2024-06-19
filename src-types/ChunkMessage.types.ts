import type { Recordable } from '.';

export type ChunkInfo = {
	id: string;
	idx: number;
	total: number;
};

export type ChunkData = {
	data: string;
	chunkInfo?: ChunkInfo;
};

export type ChunkStore = {
	request: Recordable<string[]>;
	response: Recordable;
};

export interface IChunkMessage {
	chunkExecuteScript(data: ChunkData): Promise<any>;
}
