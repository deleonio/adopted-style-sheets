import { getThemeDetails, register } from '../src';

describe.skip(`Test: getThemeDetails`, () => {
	it('getThemeDetails > null', () => {
		console.log(getThemeDetails(null));
	});
	it('register', (done) => {
		register([], [])
			.catch(console.warn)
			.finally(() => {
				console.log(getThemeDetails(null));
				done();
			});
	});
});
