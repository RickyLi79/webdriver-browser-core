export { RQResponseStatus } from '../src-types/RequestQueue.types';
import type { IExecuteScriptSender } from '../src-types/executeScript.types';
export type { ResourceRef } from '../src-types/resourceManager.types';
import { ChunkMessageSender } from './chunkMessageSender';
export { initExecuteScriptSender } from './executeScriptSender';
import { RequestQueueReviver } from './requestQueueReviver';
import { ResourceRunner } from './resourceRunner';
export {
	RESOURCE_SCOPE,
	ResourceRequestMethods,
} from '../src-types/resourceManager.types';

export type WdbEditorSdkInitOptions = {
	/**
	 * @default 1024*1024*1.8
	 */
	chunkSize?: number;

	/**
	 * should be script content of 'wdbLib.js'
	 */
	initScript: string;

	scriptExecutor: IExecuteScriptSender;
};

export class WdbEditorSDK {
	private static instance: WdbEditorSDK;

	public readonly scriptExecutor: Pick<
		IExecuteScriptSender,
		'executeScript' | 'executeAsyncScript'
	>;
	public readonly chunkMessageSender: ChunkMessageSender;

	public readonly requestQueueReviver: RequestQueueReviver;
	public readonly resourceRunner: ResourceRunner;

	public static async getSingleton(initOptions: WdbEditorSdkInitOptions) {
		if (!this.instance) {
			this.instance = new WdbEditorSDK(initOptions);
			await this.instance.initHooks(initOptions);
		}
		return this.instance;
	}

	private constructor({
		chunkSize = 1024 * 1024 * 1.8,
		scriptExecutor,
	}: WdbEditorSdkInitOptions) {
		this.scriptExecutor = scriptExecutor;
		this.chunkMessageSender = new ChunkMessageSender({
			scriptExecutor: this.scriptExecutor,
			chunkSize,
		});
		this.resourceRunner = new ResourceRunner({
			chunkMessageSender: this.chunkMessageSender,
		});

		this.requestQueueReviver = new RequestQueueReviver({
			chunkMessageSender: this.chunkMessageSender,
		});
	}

	private async initHooks({ initScript }: WdbEditorSdkInitOptions) {
		await this.scriptExecutor.executeScript(initScript, []);
		this.requestQueueReviver.start();
		return;
	}

	public executeScript(script: string, args: any[] = []): Promise<any> {
		return this.chunkMessageSender.executeScript(script, args);
	}
}
