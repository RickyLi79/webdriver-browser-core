export function setupMockWindow() {
	mockSessionStorage();
	mockWindow();
}

const noop = () => {};
function mockWindow() {
	const mock = {
		opener: null as any,
		addEventListener: noop,
		removeEventListener: noop,
		postMessage: noop,
	};
	mock.opener = mock;
	//@ts-ignore
	globalThis.window = mock;
}

function mockSessionStorage() {
	const mock: typeof sessionStorage = new (class {
		private store: Recordable<string> = {};
		setItem(key: string, value: string) {
			this.store[key] = value;
		}
		getItem(key: string) {
			return this.store[key];
		}
		removeItem(key: string) {
			delete this.store[key];
		}
		clear() {
			this.store = {};
		}
		get length(): number {
			return Object.keys(this.store).length;
		}
		key(index: number): string | null {
			return Object.keys(this.store)[index] ?? null;
		}
	})();

	globalThis.sessionStorage = mock;
}
