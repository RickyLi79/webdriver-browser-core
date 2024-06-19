import path from 'path';
import { buildProjectVersionPack } from './build-project';

const baseRoot = path.resolve(process.cwd(), 'src-wdb-projects');

async function main() {
	{
		const versionRoot = path.resolve(
			baseRoot,
			'projects',
			'PJ-my-project',
			'VER-my-ver',
		);
		const versionPack = await buildProjectVersionPack(versionRoot);
	}
	{
		const versionRoot = path.resolve(
			baseRoot,
			'projects',
			'PJ-my-project',
			'VER-main',
		);
		const versionPack = await buildProjectVersionPack(versionRoot);
	}
	// Promise.allSettled([
	// 	// buildGlobalLibs(),
	// 	buildProjectInfo(versionRoot),
	// 	buildProjectResources(versionRoot),
	// ]).then(re => {
	// 	re.forEach(i => {
	// 		if (i.status === 'rejected') {
	// 			console.error(i.reason);
	// 		}
	// 	});
	// });
}

main();
