import { getThemeDetails, register } from '../src';
import { createTheme } from '../src/theming';

const THEME = createTheme('test', {});

describe(`Test: register`, () => {
	it('register', (done) => {
		register(THEME, [])
			.catch(console.warn)
			.finally(() => {
				console.log(getThemeDetails(null));
				done();
			});
	});
});
