import { STORE } from '../src/lib/window';
import { register } from '../src';

const THEME = (name: string) => 'name';

describe(`Test: Demo-Tests`, () => {
	it('randomColor', (done: () => void) => {
		register(THEME, [])
			.then(() => {
				console.log(STORE.A11yUi);
			})
			.catch(console.warn)
			.finally(done);
	});
});
