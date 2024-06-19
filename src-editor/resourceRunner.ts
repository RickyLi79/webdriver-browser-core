import type {
	ResourceRef,
	ResourceRefOrData,
	ResourceResponse,
	ResourceRunResponse,
} from '../src-types/resourceManager.types';
import type { ChunkMessageSender } from './chunkMessageSender';

const SCRIPT_ROOT = 'return window.__WDB_BROWSER_LIB__.resourceManager';
const SCRIPT_loadResource = `${SCRIPT_ROOT}.loadResource(...arguments)`;
const SCRIPT_loadAndRun = `${SCRIPT_ROOT}.loadAndRun(...arguments)`;

export class ResourceRunner {
	private readonly chunkMessageSender: ChunkMessageSender;

	constructor({
		chunkMessageSender,
	}: {
		chunkMessageSender: ChunkMessageSender;
	}) {
		this.chunkMessageSender = chunkMessageSender;
	}

	async loadResource<T>(
		resourceRef: ResourceRefOrData,
	): Promise<ResourceResponse<T>> {
		const response = await this.chunkMessageSender.executeScript<
			ResourceResponse<T>
		>(SCRIPT_loadResource, [resourceRef]);
		return response;
	}

	async loadAndRun<T>(
		resourceRef: ResourceRefOrData<string>,
		...argRefs: ResourceRefOrData<any>[]
	): Promise<ResourceRunResponse<T>> {
		const response = await this.chunkMessageSender.executeScript<
			ResourceRunResponse<T>
		>(SCRIPT_loadAndRun, [resourceRef, ...argRefs]);
		return response;
	}
}
