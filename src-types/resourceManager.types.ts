import type { Fn, Promisable, Recordable } from '.';
import type { RQResponse, RQResponseStatus } from './RequestQueue.types';

export const RESOURCE_SCOPE = 'Resource';
export enum ResourceRequestMethods {
	LOAD = 'load',
}

export type ResourceResponse<T> = Omit<RQResponse<T>, 'requestId'>;
export type ResourceRunResponse<T> = {
	scriptStatus: RQResponseStatus;
	argsStatus: RQResponseStatus[];
	status: RQResponseStatus;
	message?: string;
	result: T;
};

export type ResourceContentType = 'js' | 'json' | 'text';

export type ResourceContent = {
	project: string;
	uid: string;
	hash: string;
	content: string;
	contentType: ResourceContentType;
};

export type ResourceRef<T = string> = {
	project: string;
	fullId: string;
	version: string[];
	property?: string;
	itemGetter?: Fn<[string], Promisable<T>>;
};
export type ResourceRefOrData<T = string> =
	| ResourceRef<T>
	| {
			data: T;
	  };
// | {
// 		data: T;
//   };

export interface IResourceManager {
	loadResource<T>(resourceRef: ResourceRef<T>): Promise<ResourceResponse<T>>;
	loadAndRun<T>(
		scriptRef: ResourceRef<string>,
		...argRefs: ResourceRef<any>[]
	): Promise<ResourceRunResponse<T>>;
	// loadAndRun<T>(
	// 	resourceRef: ResourceRef<T>,
	// 	argsRef?: ResourceRef<T>,
	// ): Promise<ResourceRunResponse<T>>;
}
