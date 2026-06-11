import assert from 'node:assert/strict';

import { getFeatureFlag, mergeFeatureFlags, register } from '../src/lib/register';
import { STORE } from '../src/lib/window';
import { createTheme } from '../src/theming';

describe('Test: feature flags', () => {
	beforeEach(() => {
		STORE.A11yUi.Features = {};
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

	describe('register with features', () => {
		it('stores options.features for getFeatureFlag', async () => {
			await register(createTheme('flags1', {}), [], { features: { inputNumberButtons: 'hide' } });
			assert.equal(getFeatureFlag('inputNumberButtons'), 'hide');
		});

		it('returns undefined for flags that are not set', () => {
			assert.equal(getFeatureFlag('unknownFlag'), undefined);
		});

		it('accumulates flags across multiple register calls, later wins per key', async () => {
			await register(createTheme('flags2', {}), [], { features: { a: 'first', b: 'first' } });
			await register(createTheme('flags3', {}), [], { features: { b: 'second' } });
			assert.equal(getFeatureFlag('a'), 'first');
			assert.equal(getFeatureFlag('b'), 'second');
		});
	});
});
