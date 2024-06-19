import esbuild from 'esbuild';
import aliasPlugin from 'esbuild-plugin-path-alias';
import path from 'node:path';
import {
	APP_HOST,
	APP_PORT,
	PUBLIC_DIR,
	getBuildOptions,
} from './esbuild.common';

const ctx = await esbuild.context({
	...getBuildOptions('launcher'),
	outdir: `${PUBLIC_DIR}/dist`,

	plugins: [
		aliasPlugin({
			// must be absolute path
			'@': path.resolve(process.cwd(), 'src-launcher'),
			'#': path.resolve(process.cwd(), 'src-types'),
		}),
	],
});
await ctx.watch();
ctx;
const { host, port } = await ctx.serve({
	// host: 'localhost',
	port: APP_PORT,
	servedir: PUBLIC_DIR,

	// onRequest(args) {
	// 	console.info(args);
	// },
});
console.info(APP_HOST);
