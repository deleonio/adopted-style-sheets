import { setThemeTag } from '../src/lib/register';
import { STORE } from '../src/lib/window';
import { strict as assert } from 'node:assert';

const THEME_NAME = 'minify-test';
const TAG = 'GLOBAL';

describe('minifyCss', () => {
	beforeEach(() => {
		STORE.A11yUi.THEMES.clear();
	});

	it('keeps spaces before pseudo classes', () => {
		setThemeTag(THEME_NAME, TAG, '.entry-item :is(a, button) { color: hotpink !important; }');
		const themeMap = STORE.A11yUi.THEMES.get(THEME_NAME);
		const css = themeMap?.get(TAG);
		assert.equal(css, '.entry-item :is(a,button){color:hotpink !important}');
	});
});
