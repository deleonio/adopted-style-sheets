import { Common } from './common';
import { Locale } from './locale';

export declare namespace I18n {
	export type TranslationKey<Prefix extends string, Key extends string> = Lowercase<Common.PrefixedKey<Prefix, Key>>;
	export type TranslationMap<Prefix extends string, Key extends string> = {
		[K in TranslationKey<Prefix, Key>]?: string;
	};
	export type PatchTranslation<Locale extends Locale.ISO_639_1, Prefix extends string, Key extends string> = (
		name: Locale,
		css: TranslationMap<Prefix, Key>
	) => Locale;
	export type RegisterPatchTranslation<Locale extends Locale.ISO_639_1, Prefix extends string, Key extends string> = (
		patchTranslation: PatchTranslation<Locale, Prefix, Key>
	) => Locale;
}

export const createTranslation = <Locale extends Locale.ISO_639_1, Prefix extends string, Key extends string>(
	name: Locale,
	translation: I18n.TranslationMap<Prefix, Key>
): I18n.RegisterPatchTranslation<Locale, Prefix, Key> => {
	return (patchTranslation): Locale => patchTranslation(name, translation);
};
