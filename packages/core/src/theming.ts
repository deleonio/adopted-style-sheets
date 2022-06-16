import { Common } from './common';

export declare namespace Theming {
	export type CssProps<Prefix extends string, Tag extends string> = Uppercase<Common.PrefixedKey<Prefix, Tag> | 'GLOBAL' | 'PROPERTIES'>;
	export type ThemeCss<Prefix extends string, Tag extends string> = {
		[K in CssProps<Prefix, Tag>]?: string;
	};
	export type PatchTheme<Theme extends string, Prefix extends string, Tag extends string> = (themeName: Theme, css: ThemeCss<Prefix, Tag>) => Theme;
	export type RegisterPatchTheme<Theme extends string, Prefix extends string, Tag extends string> = (patchTheme: PatchTheme<Theme, Prefix, Tag>) => Theme;
}

export const createTheme = <Theme extends string, Prefix extends string, Tag extends string>(
	name: Theme,
	css: Theming.ThemeCss<Prefix, Tag>
): Theming.RegisterPatchTheme<Theme, Prefix, Tag> => {
	return (patchTheme): Theme => patchTheme(name, css);
};
