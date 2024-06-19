import {
	ResourceContentType,
	type ResourceMeta,
	type ResourceMetaFull,
	type ResourceOut,
	type ResourcePack,
} from '#/ResourceInfo';
import esbuild, { type BuildOptions } from 'esbuild';
//@ts-ignore
import aliasPlugin from 'esbuild-plugin-path-alias';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { hashCode } from '../../../src-types/utils/hashUtils';
import { convertToRtn, getJsValue } from './jsScriptHelper';

export type ResourcePath = {
	fullPath?: string;
	name: string;
	meta: string;
	category: string;
	metaDist?: string;
	content: string;
	contentDist?: string;
	err?: string;
	libResource?: ResourcePack;
};

export async function buildResource({
	tempRoot,
	srcRoot,
	// projectName,
	projectUid,
	versionName,
	resourcePaths,
	aliasPaths,
}: {
	tempRoot: string;
	srcRoot: string;
	versionName: string;
	// projectName: string;
	projectUid: string;
	resourcePaths: ResourcePath[];

	aliasPaths: Record<string, string>;
}) {
	const startAt = performance.now();

	const buildOptions: BuildOptions = {
		bundle: true,
		format: 'esm',
		treeShaking: true,
		outdir: path.relative(process.cwd(), tempRoot),
		platform: 'browser',
		legalComments: 'none',
		plugins: [aliasPlugin(aliasPaths)],
	};

	for (const iLib of resourcePaths) {
		const resourceName = path.basename(path.dirname(iLib.meta));
		const metaDist = path.relative(srcRoot, iLib.meta);
		const contentExists = fs.existsSync(iLib.content);
		const entryPoints = [
			{
				in: path.relative(process.cwd(), iLib.meta),
				out: metaDist.replace(/\.ts$/, ''),
			},
		];
		let contentDist: string;
		if (contentExists) {
			contentDist = path.relative(srcRoot, iLib.content);
			entryPoints.push({
				in: path.relative(process.cwd(), iLib.content),
				out: contentDist.replace(/\.ts$/, ''),
			});
		}
		try {
			await esbuild.build({
				...buildOptions,
				entryPoints,
			});
			iLib.name = resourceName;
			iLib.fullPath = path
				.relative(srcRoot, path.dirname(iLib.meta))
				.replaceAll(path.sep, '/');
			iLib.metaDist = metaDist.replace(/\.ts$/, '.js');
			if (contentExists) {
				iLib.contentDist = contentDist!.replace(/\.ts$/, '.js');
			}
		} catch (err) {
			iLib.err = 'build err';
		}
	}

	const promiseList = resourcePaths.map(iLab => {
		return new Promise<ResourcePack>(async (resolve, reject) => {
			if (iLab.err) {
				reject(iLab);
				return;
			}
			try {
				const iMeta: ResourceMeta = (
					await import(pathToFileURL(iLab.meta).toString())
				).default;
				let content: string;
				let contentType: ResourceContentType | undefined = iMeta.contentType;
				if (iMeta.contentFile) {
					content = fs.readFileSync(
						path.resolve(path.dirname(iLab.meta), iMeta.contentFile),
						'utf8',
					);
					contentType = iMeta.contentType ?? 'text';
				} else {
					content = convertToRtn(
						fs.readFileSync(path.resolve(tempRoot, iLab.contentDist!), 'utf8'),
					);

					const contentObj = getJsValue<
						number,
						{ resourceOut?: ResourceOut; resourceType?: ResourceContentType }
					>(content);
					if (typeof contentObj.resourceOut === 'function') {
						content = contentObj.resourceOut();
						contentType =
							iMeta.contentType ?? contentObj.resourceType ?? 'text';
					} else {
						contentType = iMeta.contentType ?? 'js';
					}
				}
				const hash = hashCode(content);
				// const hash = content;

				const iMetaFull: ResourceMetaFull = {
					...iMeta,
					name: iLab.name,
					version: versionName,
					fullId: iLab.fullPath!,
					project: projectUid,
					hash,
					category: iLab.category,
					contentType,
				};

				resolve({
					fullId: iMetaFull.fullId,
					meta: iMetaFull,
					content,
				});
			} catch (err) {
				iLab.err = (err as Error).message;
				reject(iLab);
			}
		});
	});

	const results = await Promise.allSettled(promiseList);
	const success = results.reduce((all, i) => {
		if (i.status === 'fulfilled') {
			all.push(i.value);
		}
		return all;
	}, [] as ResourcePack[]);
	const errLibs = resourcePaths.filter(i => !!i.err);
	errLibs.forEach(i => {
		console.error(i.err, i.content);
	});
	fs.rmSync(tempRoot, { recursive: true });
	const endAt = performance.now();

	const elapsed = (endAt - startAt).toFixed(2) + 'ms';
	return {
		elapsed,
		success,
		errLibs,
	};
}
