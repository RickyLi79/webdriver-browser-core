import md5 from 'md5';

export function hashCode(str: string) {
	return md5(str);
	// let hash = 0;
	// if (str.length === 0) return String(hash);
	// for (let i = 0; i < str.length; i++) {
	// 	const chr = str.charCodeAt(i);
	// 	hash = (hash << 5) - hash + chr;
	// 	hash |= 0; // Convert to 32bit integer
	// }
	// return btoa(String(hash)).replace(/=/g, '');
}
