import { before } from 'mocha';
import { setupMockWindow } from './utils/mockWindow';

describe('jsdom', () => {
	before(() => {
		setupMockWindow();
	});
	it('a', async () => {});
});
