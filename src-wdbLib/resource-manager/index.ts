import { RQResponseStatus, type IRequestQueue } from '#/RequestQueue.types';
import {
	RESOURCE_SCOPE,
	ResourceRequestMethods,
	type IResourceManager,
	type ResourceContent,
	type ResourceRefOrData,
	type ResourceResponse,
	type ResourceRunResponse,
} from '#/resourceManager.types';
import { requireFromScript, runScript } from '#/utils/runScript';

export class ResourceManager implements IResourceManager {
	private readonly requestQueue: IRequestQueue;
	constructor({ requestQueue }: { requestQueue: IRequestQueue }) {
		this.requestQueue = requestQueue;
	}

	async loadResource<T>(
		resourceRef: ResourceRefOrData<T>,
	): Promise<ResourceResponse<T>> {
		if ('data' in resourceRef) {
			return {
				status: RQResponseStatus.OK,
				data: resourceRef.data,
			};
		}

		//#region todo: 尝试从本地获取缓存化的resource

		//#endregion

		const response = await this.requestQueue.request<ResourceContent>({
			scope: RESOURCE_SCOPE,
			request: ResourceRequestMethods.LOAD,
			data: { ...resourceRef, itemGetter: 0 },
		});

		//#region todo: convert by itemGetter
		const { itemGetter, property = 'default' } = resourceRef;
		let data: T;
		if (response.data.contentType === 'js') {
			if (itemGetter) {
				data = await runScript(itemGetter.toString(), response.data.content);
			} else {
				data = requireFromScript<T>(response.data.content, property);
			}
		} else if (response.data.contentType === 'json') {
			data = JSON.parse(response.data.content);
		} else {
			data = response.data.content as any;
		}
		//#endregion
		return {
			status: response.status,
			data,
		};
	}

	async loadAndRun<T>(
		scriptRef: ResourceRefOrData<string>,
		...argRefs: ResourceRefOrData<any>[]
	): Promise<ResourceRunResponse<T>> {
		const finalRes: ResourceRunResponse<T> = {
			scriptStatus: RQResponseStatus.UNKNOWN,
			argsStatus: [],
			status: RQResponseStatus.UNKNOWN,
			result: undefined as any,
		};
		const scriptResponse = await this.loadResource(scriptRef);
		finalRes.scriptStatus = scriptResponse.status;
		if (scriptResponse.status === RQResponseStatus.NOT_FOUND) {
			return finalRes;
		}
		const args: any[] = [];
		for (const idx in argRefs) {
			const argRef = argRefs[idx];
			const argsResponse: ResourceResponse<any> = argRef
				? await this.loadResource(argRef)
				: { status: RQResponseStatus.OK, data: undefined };

			finalRes.argsStatus[idx] = argsResponse.status;
			if (argsResponse.status === RQResponseStatus.NOT_FOUND) {
				return finalRes;
			}
			args.push(argsResponse.data);
		}

		try {
			const result = await runScript<T>(
				`return (${scriptResponse.data}).apply(this, arguments)`,
				...args,
			);
			finalRes.status = RQResponseStatus.OK;
			finalRes.result = result;
		} catch (err) {
			finalRes.status = RQResponseStatus.ERROR;
			finalRes.message =
				(err as Error)?.message ??
				(err as any)?.toString?.() ??
				'runtime error';
		}
		return finalRes;
	}
}
