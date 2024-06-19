import esbuild from 'esbuild';
import { getBuildOptions } from './esbuild.common';
import aliasPlugin from 'esbuild-plugin-path-alias';
import path from 'node:path';

const ctx = await esbuild.build({
	...getBuildOptions('wdbLib'),
	outdir: './dist-wdbLib',
	treeShaking: true,
	minify: true,
	platform: 'browser',

	plugins: [
		aliasPlugin({
			// must be absolute path
			'@': path.resolve(process.cwd(), 'src-wdbLib'),
			'#': path.resolve(process.cwd(), 'src-types'),
		}),
	],
});
console.info('done');
