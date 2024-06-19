/**
 * css or xpath
 */
export type ElementSelector = string | Element | Document;
class WdbSelector {
	private XPATH_REG = /^(\/|\.\/|..\/)/;
	public isXpath(selector: string): boolean {
		return this.XPATH_REG.test(selector.trim());
	}

	$<T extends Element = HTMLElement>(
		selector: ElementSelector,
		parent?: ElementSelector,
	): T | null {
		if (!selector) return null;
		if (selector instanceof Element || selector instanceof Document) {
			return selector as T;
		}

		const parentElem = parent ? this.$(parent) : undefined;
		const isXpath = this.isXpath(selector);
		if (isXpath) {
			return this._$x<T>(selector, parentElem);
		}

		return this._$<T>(selector, parentElem);
	}
	$$<T extends Element = HTMLElement>(
		selector: string,
		parent?: ElementSelector,
	): T[] {
		if (!selector) return [];

		const parentElem = parent ? this.$(parent) : undefined;
		const isXpath = this.isXpath(selector);
		if (isXpath) {
			return this._$$x<T>(selector, parentElem);
		}
		const arr = this._$$<T>(selector, parentElem);
		const xRes: T[] = [];
		arr.forEach(i => xRes.push(i));
		return xRes;
	}

	private _$<T extends Element = HTMLElement>(
		css: string,
		parent?: Document | Element | null,
	): T | null {
		return (parent ?? document).querySelector<T>(css);
	}

	private _$$<T extends Element = HTMLElement>(
		css: string,
		parent?: Document | Element | null,
	): NodeListOf<T> {
		return (parent ?? document).querySelectorAll<T>(css);
	}

	private _$x<E extends Element = HTMLElement>(
		STR_XPATH: string,
		parent?: Document | Element | null,
	): E | null {
		STR_XPATH = STR_XPATH.trim();
		const xResults = document.evaluate(
			STR_XPATH,
			parent ?? document,
			null,
			XPathResult.ANY_TYPE,
			null,
		);
		return xResults.iterateNext() as E | null;
	}

	private _$$x<E extends Element = HTMLElement>(
		STR_XPATH: string,
		parent?: Document | Element | null,
	): E[] {
		STR_XPATH = STR_XPATH.trim();
		const xResults = document.evaluate(
			STR_XPATH,
			parent ?? document,
			null,
			XPathResult.ANY_TYPE,
			null,
		);
		const xNodes: E[] = [];
		let xRes = xResults.iterateNext();
		while (xRes) {
			xNodes.push(xRes as E);
			xRes = xResults.iterateNext();
		}
		return xNodes;
	}

	isElemVisible(selector: ElementSelector): boolean {
		const elem = this.$(selector);
		if (!elem) return false;
		const rect = elem.getBoundingClientRect();

		if (rect.width === 0 || rect.height === 0) return false;

		if (getComputedStyle(elem).visibility === 'hidden') return false;

		return true;
	}
}
export default new WdbSelector();
