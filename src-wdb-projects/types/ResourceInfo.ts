export type ResourceOut = () => string;

export type ResourceMetaA = {
	uid: string;

	description: string;

	contentFile?: string;
	contentType?: ResourceContentType;
};

export type ResourceMetaB = {
	versionFallback?: string[];
};

export type ResourceContentType = 'js' | 'json' | 'text';

export type ResourceMeta = ResourceMetaA & ResourceMetaB;

export type ResourceMetaFull = ResourceMeta & {
	name: string;
	contentVer?: string;
	fullId: string;
	version: string;
	project: string;
	category: string;
	hash: string;
	contentType: ResourceContentType;
};

export type ResourceContent = string;

export type ResourcePack = {
	fullId: string;
	meta: ResourceMetaFull;
	content: ResourceContent;
};
