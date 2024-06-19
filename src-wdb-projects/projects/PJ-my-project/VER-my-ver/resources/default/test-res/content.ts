import type { TResourceContentType, ResourceOut } from '#/ResourceInfo';

const obj = {
	a: 1,
	b: 2,
	c: {
		d: 666,
	},
	fn() {
		return 1;
	},
};

const resourceOut: ResourceOut = () => JSON.stringify(obj);
const resourceType: TResourceContentType = 'json';

export { resourceType, resourceOut };
