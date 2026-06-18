import type { Common } from './common';
import type { FeatureFlags } from './theme';

export declare namespace Theming {
	export type PatchOptions = {
		append?: boolean;
	};
	export type Props<Prefix extends string, Key extends string> = Uppercase<Common.PrefixedKey<Prefix, Key> | 'GLOBAL' | 'PROPERTIES'>;
	export type Map<Prefix extends string, Key extends string> = {
		[K in Props<Prefix, Key>]?: string;
	};
	export type Patch<Name extends string, Prefix extends string, Key extends string> = (
		name: Name,
		map: Map<Prefix, Key>,
		options?: PatchOptions,
		features?: FeatureFlags,
	) => Name;
	export type RegisterPatch<Name extends string, Prefix extends string, Key extends string> = (patch: Patch<Name, Prefix, Key>) => Name;
	export type Register<Name extends string, Prefix extends string, Key extends string> = (
		name: Name,
		map: Map<Prefix, Key>,
		features?: FeatureFlags,
	) => RegisterPatch<Name, Prefix, Key>;
}

/**
 * Creates a theme patch for `register()`.
 *
 * @param name     Unique theme identifier.
 * @param map      CSS map per component tag (plus `GLOBAL`/`PROPERTIES`).
 * @param features Feature-flag defaults pinned to this theme (stored per theme name in the engine
 *                 at `register()` time). Components resolve them for their active theme via
 *                 `getFeatureFlag(key, element)` / `getThemeFeatures(name)`; the app does not read
 *                 them. A global `register(..., { features })` override still wins per key (theme
 *                 flags are defaults, app options are overrides).
 */
export const createTheme: Theming.Register<string, string, string> = <Name extends string, Prefix extends string, Key extends string>(
	name: Name,
	map: Theming.Map<Prefix, Key>,
	features?: FeatureFlags,
): Theming.RegisterPatch<Name, Prefix, Key> => {
	return (patch): Name =>
		patch(
			name,
			map,
			{
				append: false,
			},
			features,
		);
};
