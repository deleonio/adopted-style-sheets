import type { Common } from './common';

export declare namespace Theming {
	export type PatchOptions = {
		append?: boolean;
	};
	export type Props<Prefix extends string, Key extends string> = Uppercase<Common.PrefixedKey<Prefix, Key> | 'GLOBAL' | 'PROPERTIES'>;
	export type Map<Prefix extends string, Key extends string> = {
		[K in Props<Prefix, Key>]?: string;
	};
	export type Patch<Name extends string, Prefix extends string, Key extends string> = (name: Name, map: Map<Prefix, Key>, options?: PatchOptions) => Name;
	export type RegisterPatch<Name extends string, Prefix extends string, Key extends string> = (patch: Patch<Name, Prefix, Key>) => Name;
	export type Register<Name extends string, Prefix extends string, Key extends string> = (
		name: Name,
		map: Map<Prefix, Key>,
	) => RegisterPatch<Name, Prefix, Key>;
}

export const createTheme: Theming.Register<string, string, string> = <Name extends string, Prefix extends string, Key extends string>(
	name: Name,
	map: Theming.Map<Prefix, Key>,
): Theming.RegisterPatch<Name, Prefix, Key> => {
	return (patch): Name =>
		patch(name, map, {
			append: false,
		});
};
