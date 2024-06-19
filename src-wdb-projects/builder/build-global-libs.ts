import type { ResourcePack } from '#/ResourceInfo';
//@ts-ignore
import { globSync } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { FILENAMES, SYS_NAMES } from '../constants';
import { buildResource, type ResourcePath } from './helpers/buildResource';

export async function buildGlobalLibs() {
	const startAt = performance.now();
	//#region
	const ROOT = path.resolve(process.cwd(), 'src-wdb-projects', 'global-libs');
	//#endregion

	const metaFiles = globSync(`**/${FILENAMES.RESOURCE_META_MARK}.ts`, {
		cwd: ROOT,
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
		if (fs.existsSync(contentPath)) {
			// const ver = path.basename(path.resolve(iRoot, ''));
			const name = path.basename(path.resolve(iRoot, '..'));
			all.push({
				name,
				// ver,
				meta: metaPath,
				content: contentPath,
				category: path.basename(path.resolve(metaPath, '..', '..')),
			});
		}
		return all;
	}, [] as ResourcePath[]);
	const TEMP = path.resolve(
		process.cwd(),
		'temp',
		'global-libs',
		crypto.randomUUID(),
	);
	fs.mkdirSync(TEMP, { recursive: true });

	const buildResult = await buildResource({
		srcRoot: ROOT,
		resourcePaths: libs,
		tempRoot: TEMP,
		projectUid: SYS_NAMES.GLOBAL_LIBS,
		versionName: '',
		aliasPaths: {
			// must be absolute path
			'@/': path.resolve(process.cwd(), 'src-wdb-projects/types/'),
			'#/': path.resolve(process.cwd(), 'src-wdb-projects/'),
		},
	});

	const endAt = performance.now();
	const elapsed = (endAt - startAt).toFixed(2) + 'ms';
	console.info(
		`build-global-libs ${elapsed}, ${buildResult.success.length} success , ${buildResult.errLibs.length} errors`,
	);
	const json = JSON.stringify(buildResult, null, 2);
	const lastResultFile = path.resolve(TEMP, '../..', 'last-global-libs.json');
	fs.writeFileSync(lastResultFile, json, 'utf8');
	console.info(lastResultFile);
	return buildResult;
}

// export default main;
