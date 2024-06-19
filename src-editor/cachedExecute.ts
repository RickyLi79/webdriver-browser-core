import type { Fn } from '../src-types';

const scriptMap: Map<Fn, string> = new Map();

function genScript(fn: Fn): string {
	let script = fn.toString().split('this.$$$')[1];
	return script;
}

export function getExecuteScript(fn: Fn): string {
	let script = scriptMap.get(fn);
	if (!script) {
		script = genScript(fn);
		scriptMap.set(fn, script);
	}
	return script;
}
