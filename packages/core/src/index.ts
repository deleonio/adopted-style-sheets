import type { Common } from './common';
import type { Element } from './element';
import type { I18n } from './i18n';
import type { Theming } from './theming';
import { createTranslation as coreCreateTranslation } from './i18n';
import { createTheme as coreCreateTheme } from './theming';

export declare namespace Generic {
	export type { Common, Element, I18n, Theming };
}

interface Library<Prefix extends string, Key extends string, Tag extends string> {
	readonly Prefix: Prefix;
	readonly Key: Key;
	readonly Tag: Tag;
}

export class Theme<Prefix extends string, Key extends string, Tag extends string> implements Library<Prefix, Key, Tag> {
	public readonly Prefix: Prefix;
	public readonly Key: Key;
	public readonly Tag: Tag;
	public readonly createTheme: Generic.Theming.Register<string, Prefix, Tag> = <Name extends string>(name: Name, map: Generic.Theming.Map<Prefix, Tag>) =>
		coreCreateTheme(name, map);
	public readonly createTranslation: Generic.I18n.Register<I18n.Locale.ISO_639_1, Prefix, Key> = <Name extends Generic.I18n.Locale.ISO_639_1>(
		name: Name,
		map: Generic.I18n.Map<Prefix, Key>
	) => coreCreateTranslation(name, map);

	public constructor(prefix: Prefix, keyEnum: unknown, tagEnum: unknown) {
		this.Prefix = prefix;
		this.Key = Object.getOwnPropertyNames(keyEnum) as unknown as Key;
		this.Tag = Object.getOwnPropertyNames(tagEnum) as unknown as Tag;
	}
}

export { STORE } from './lib/window';
export { RobustStore, getTheme, getThemeDetails, patchTheme, patchThemeTag, register, setThemeStyle } from './lib';
export type { LoaderCallback, RegisterOptions, ThemeDetails } from './theme';
