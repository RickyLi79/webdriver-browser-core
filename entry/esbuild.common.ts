import { BuildOptions } from 'esbuild';

import { globSync } from 'glob';
import process from 'node:process';
import path from 'node:path';

export const APP_PORT = 5567;
export const APP_HOST = `http://localhost:${APP_PORT}`;
export const PUBLIC_DIR = './public';

export function getBuildOptions(ext: string) {
	const entryRoot = path.resolve(process.cwd(), 'entry', ext);
	const entryFiles = globSync(`**/*.ts`, {
		cwd: entryRoot,
		absolute: true,
		ignore: '_*',
	});
	const entryPoints = entryFiles.map(i => ({
		in: path.relative(process.cwd(), i),
		out: path.relative(entryRoot, i).replace(/\.ts$/, ''),
	}));

	const buildOptions: BuildOptions = {
		entryPoints,
		bundle: true,
		format: 'esm',
		legalComments: 'none',
		

		external: ['node:*'],

		// sourcemap: true,

		// write: false,
		// minify: true,
	};
	return buildOptions;
}
