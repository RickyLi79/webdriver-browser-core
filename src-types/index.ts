export type Nullable<T> = T | null;

export type Arrayable<T> = T | T[];

export type Promisable<T = any> = T | Promise<T>;

export type Recordable<T = any> = { [key: string]: T };

export type HTMLElementExtend<T> = HTMLElement & T;

export type Fn<Arg extends any[] = any[], Ret = any> = (...args: Arg) => Ret;

export type Gettable<T extends any> = T extends Fn
	? never
	: T | (() => Promisable<T>);

export type MyType<T> = T;
