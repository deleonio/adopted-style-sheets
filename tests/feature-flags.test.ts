import assert from 'node:assert/strict';

import { getFeatureFlag, getThemeFeatures, mergeFeatureFlags, register } from '../src/lib/register';
import { STORE } from '../src/lib/window';
import { createTheme } from '../src/theming';

describe('Test: feature flags', () => {
	beforeEach(() => {
		// Reset all flag/theme state so each test is isolated (the default theme is otherwise sticky).
		STORE.A11yUi.FEATURES = {};
		STORE.A11yUi.THEME_FEATURES = {};
		STORE.A11yUi.THEMES.clear();
		STORE.A11yUi.Theme = undefined;
	});

	describe('mergeFeatureFlags', () => {
		it('returns an empty object for no input', () => {
			assert.deepEqual(mergeFeatureFlags(), {});
		});

		it('ignores undefined sets', () => {
			assert.deepEqual(mergeFeatureFlags(undefined, { a: 1 }, undefined), { a: 1 });
		});

		it('lets later sets win per key', () => {
			assert.deepEqual(mergeFeatureFlags({ a: 1, b: 1 }, { b: 2 }), { a: 1, b: 2 });
		});

		it('does not mutate its inputs', () => {
			const themeDefaults = { a: 1 };
			mergeFeatureFlags(themeDefaults, { a: 2 });
			assert.deepEqual(themeDefaults, { a: 1 });
		});
	});

	describe('global app-level overrides (register options.features)', () => {
		it('stores options.features for getFeatureFlag (applies regardless of theme)', async () => {
			await register(createTheme('appflags', {}), [], { features: { inputNumberButtons: 'hide' } });
			assert.equal(getFeatureFlag('inputNumberButtons'), 'hide');
		});

		it('returns undefined for flags that are not set', () => {
			assert.equal(getFeatureFlag('unknownFlag'), undefined);
		});

		it('accumulates overrides across multiple register calls, later wins per key', async () => {
			await register(createTheme('acc1', {}), [], { features: { a: 'first', b: 'first' } });
			await register(createTheme('acc2', {}), [], { features: { b: 'second' } });
			assert.equal(getFeatureFlag('a'), 'first');
			assert.equal(getFeatureFlag('b'), 'second');
		});
	});

	describe('theme-pinned flags (createTheme) — fixed default theme', () => {
		it('resolves the fixed default theme’s pinned flag without an element', async () => {
			await register(createTheme('mytheme', {}, { inputNumberButtons: 'hide' }), []);
			assert.equal(getFeatureFlag('inputNumberButtons'), 'hide');
		});

		it('exposes pinned flags per theme name via getThemeFeatures', async () => {
			await register(createTheme('mytheme', {}, { inputNumberButtons: 'hide' }), []);
			assert.deepEqual(getThemeFeatures('mytheme'), { inputNumberButtons: 'hide' });
			assert.equal(getThemeFeatures('does-not-exist'), undefined);
		});

		it('lets a global override win over a theme-pinned flag', async () => {
			await register(createTheme('ovr', {}, { a: 'theme' }), [], { features: { a: 'app' } });
			assert.equal(getFeatureFlag('a'), 'app');
		});

		it('does not leak a sibling theme’s flags when the fixed default theme pinned none', async () => {
			// "plain" is the flagless fixed default; a non-active sibling "fancy" pins a flag.
			await register([createTheme('plain', {}), createTheme('fancy', {}, { x: 'leak' })], []);
			assert.equal(getFeatureFlag('x'), undefined);
			// Each theme keeps its own pinned set, readable by name.
			assert.equal(getThemeFeatures('plain'), undefined);
			assert.deepEqual(getThemeFeatures('fancy'), { x: 'leak' });
		});
	});

	describe('per-active-theme resolution via element (auto detection)', () => {
		const makeThemed = (themeName: string) => {
			const el = document.createElement('div');
			el.dataset.theme = themeName;
			document.body.appendChild(el);
			return el;
		};

		it('resolves a flag from the element’s nearest data-theme ancestor', async () => {
			await register([createTheme('kern', {}, { inputNumberButtons: 'hide' }), createTheme('light', {}, { inputNumberButtons: 'show' })], [], {
				theme: { detect: 'auto' },
			});
			assert.equal(getFeatureFlag('inputNumberButtons', makeThemed('kern')), 'hide');
			assert.equal(getFeatureFlag('inputNumberButtons', makeThemed('light')), 'show');
		});

		it('walks up the DOM to find the theme', async () => {
			await register(createTheme('kern', {}, { inputNumberButtons: 'hide' }), [], { theme: { detect: 'auto' } });
			const host = makeThemed('kern');
			const child = document.createElement('span');
			host.appendChild(child);
			assert.equal(getFeatureFlag('inputNumberButtons', child), 'hide');
		});

		it('returns undefined in auto mode when no element resolves a theme', async () => {
			await register(createTheme('kern', {}, { inputNumberButtons: 'hide' }), [], { theme: { detect: 'auto' } });
			assert.equal(getFeatureFlag('inputNumberButtons'), undefined);
		});

		it('lets a global override win even when an element resolves a theme', async () => {
			await register(createTheme('kern', {}, { inputNumberButtons: 'hide' }), [], { theme: { detect: 'auto' }, features: { inputNumberButtons: 'show' } });
			assert.equal(getFeatureFlag('inputNumberButtons', makeThemed('kern')), 'show');
		});

		it('returns undefined when the element’s theme does not pin the flag', async () => {
			await register(createTheme('kern', {}, { inputNumberButtons: 'hide' }), [], { theme: { detect: 'auto' } });
			assert.equal(getFeatureFlag('someOtherFlag', makeThemed('kern')), undefined);
		});
	});
});
