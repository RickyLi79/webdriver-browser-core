export type VersionInfo = {
	description: string;
	versionFallbacks: string[];
};
export type VersionInfoFull = VersionInfo & {
	name: string;
};
