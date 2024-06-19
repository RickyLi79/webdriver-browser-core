import type { ProjectInfoFull } from './ProjectInfo';
import type { ResourcePack } from './ResourceInfo';
import type { VersionInfoFull } from './VersionInfo';

export type ProjectPack = {
	projectInfo: ProjectInfoFull;
	versions: {
		libs: ResourcePack[];
		info: VersionInfoFull;
		resources: ResourcePack[];
	}[];
};

export type ProjectVersionPack = {
	projectInfo: ProjectInfoFull;
	versionInfo: VersionInfoFull;
	resources: ResourcePack[];
};
