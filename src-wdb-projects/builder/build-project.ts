import type { ResourcePack } from '#/ResourceInfo';
//@ts-ignore
import { globSync } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { FILENAMES, SYS_NAMES } from '../constants';
import { buildResource, type ResourcePath } from './helpers/buildResource';
import type { ProjectInfo, ProjectInfoFull } from '#/ProjectInfo';
import type { VersionInfo, VersionInfoFull } from '#/VersionInfo';
import type { ProjectVersionPack } from '#/ProjectPack';

export async function buildProjectVersionPack(
	versionRoot: string,
): Promise<ProjectVersionPack> {
	const startAt = performance.now();

	//#region
	const projectRoot = path.resolve(versionRoot, '..');
	const projectName = path.basename(projectRoot).replace(/^PJ-/, '');
	const versionName = path.basename(versionRoot).replace(/^VER-/, '');
	//#endregion

	const pUri = pathToFileURL(
		path.resolve(projectRoot, FILENAMES.PROJECT_INFO),
	).toString();
	const projectInfo: ProjectInfo = (await import(pUri)).default;
	const projectInfoFull: ProjectInfoFull = {
		...projectInfo,
		name: projectName,
	};

	const vUri = pathToFileURL(
		path.resolve(versionRoot, FILENAMES.VERSION_INFO),
	).toString();
	const versionInfo: VersionInfo = (await import(vUri)).default;

	const versionInfoFull: VersionInfoFull = {
		...versionInfo,
		name: versionName,
	};

	const resources = await buildProjectResources(versionRoot);

	const buildResult: ProjectVersionPack = {
		projectInfo: projectInfoFull,
		versionInfo: versionInfoFull,
		resources,
	};

	const TEMP = path.resolve(process.cwd(), 'temp', projectName);
	fs.mkdirSync(TEMP, { recursive: true });

	const json = JSON.stringify(buildResult, null, 2);
	const lastResultFile = path.resolve(
		TEMP,
		`${projectName}_${versionName}.json`,
	);
	fs.writeFileSync(lastResultFile, json, 'utf8');
	console.info(lastResultFile);
	return buildResult;
}

export async function buildProjectResources(
	versionRoot: string,
): Promise<ResourcePack[]> {
	const startAt = performance.now();
	//#region
	const projectRoot = path.resolve(versionRoot, '..');
	const resourcesRoot = path.resolve(versionRoot, SYS_NAMES.RESOURCES);
	const projectName = path.basename(projectRoot).replace(/^PJ-/, '');
	const versionName = path.basename(versionRoot).replace(/^VER-/, '');
	//#endregion

	const pUri = pathToFileURL(
		path.resolve(projectRoot, FILENAMES.PROJECT_INFO),
	).toString();
	const projectInfo: ProjectInfo = (await import(pUri)).default;

	const metaFiles = globSync(`*/**/${FILENAMES.RESOURCE_META_MARK}.ts`, {
		cwd: resourcesRoot,
		withFileTypes: true,
		nodir: true,
	});
	const libs = metaFiles.reduce((all, iMetaFile) => {
		const metaPath = iMetaFile.fullpath();
		const iRoot = path.dirname(metaPath);
		const contentPath = path.resolve(
			iRoot,
			`${FILENAMES.RESOURCE_CONTENT_MARK}.ts`,
		);
		// if (fs.existsSync(contentPath)) {
		const name = path.basename(path.resolve(iRoot, '..'));
		all.push({
			name,
			meta: metaPath,
			content: contentPath,
			category: path.basename(path.resolve(metaPath, '..', '..')),
		});
		// }
		return all;
	}, [] as ResourcePath[]);
	const TEMP = path.resolve(
		process.cwd(),
		'temp',
		projectName,
		versionName,
		crypto.randomUUID(),
	);
	fs.mkdirSync(TEMP, { recursive: true });

	const buildResult = await buildResource({
		srcRoot: resourcesRoot,
		resourcePaths: libs,
		tempRoot: TEMP,
		// projectName,
		projectUid: projectInfo.uid,
		versionName,
		aliasPaths: {
			// must be absolute path
			'@/': path.resolve(process.cwd(), 'src-wdb-projects/types/'),
			'#/': path.resolve(process.cwd(), 'src-wdb-projects/'),
		},
	});

	const endAt = performance.now();
	const elapsed = (endAt - startAt).toFixed(2) + 'ms';
	console.info(
		`${projectName}@${versionName} ${elapsed}, ${buildResult.success.length} success , ${buildResult.errLibs.length} errors`,
	);
	// const json = JSON.stringify(buildResult, null, 2);
	// const lastResultFile = path.resolve(
	// 	TEMP,
	// 	'../..',
	// 	`${projectName}_${versionName}.json`,
	// );
	// fs.writeFileSync(lastResultFile, json, 'utf8');
	// console.info(lastResultFile);
	return buildResult.success;
}
