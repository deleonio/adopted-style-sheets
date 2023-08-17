import { getThemeDetails, register } from '../src';

describe.skip(`Test: getThemeDetails`, () => {
	it('getThemeDetails > null', () => {
		console.log(getThemeDetails(null));
	});
	it('register', (done) => {
		register([], []).finally(() => {
			console.log(getThemeDetails(null));
			done();
		});
	});
});
