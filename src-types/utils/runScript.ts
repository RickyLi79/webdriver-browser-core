export async function runScript<T>(script: string, ...args: any[]): Promise<T> {
	const fn = new Function(script);
	const re = fn.apply(null, args);
	if (re?.then && typeof re.then === 'function') {
		return await re;
	}
	return re;
}
export function requireFromScript<T>(
	script: string,
	property: string = 'default',
): T {
	const fn = new Function(script);
	const re: T = fn.apply(null)[property];
	return re;
}
