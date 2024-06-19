const START_LINE_COMMENT_REGEXP = /^\/\/.*\.(ts|tsx|js|mjs|cjs)\n/gm;
const CONVERT_REGEXP = /export \{((.|\n)+)\};?$/;
const CONVERT_KEY = /(.+) as (.+)/;
export function convertToRtn(code: string) {
	code = code.trim();
	code = code.replace(START_LINE_COMMENT_REGEXP, '');
	const [, inside] = CONVERT_REGEXP.exec(code) as string[];
	const k = inside.split(',').map(i => {
		i = i.trim();
		if (CONVERT_KEY.test(i)) {
			const [, k1, v1] = CONVERT_KEY.exec(i) as string[];
			return `${v1}:${k1}`;
		}
		return i;
	});
	return code.replace(CONVERT_REGEXP, `return {${k.join(',')}};`);
}

export function getJsValue<
	Default extends any,
	All extends Record<string, any> = { default: Default },
>(code: string): All & { default: Default } {
	return new Function(code).apply(null);
}
