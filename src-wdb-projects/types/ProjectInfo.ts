export type ProjectInfo = {
	uid: string;
	description: string;
	defaultVersion: string;
	isDev: boolean;
	// author: string;
};
export type ProjectInfoFull = ProjectInfo & {
	name: string;
};
