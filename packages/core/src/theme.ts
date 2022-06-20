import { Generic } from '.';

export type LoaderCallback = () => Promise<void>;
export type ThemeName = string | null;
export type ThemeDetails = {
	cache: boolean;
	name: ThemeName;
	reset: boolean;
};
export type RegisterThemeOptions = {
	/**
	 * Gibt an, ob das jeweilige Theme pro Component automatisch ermittelt werden soll oder
	 * für alle fest gesetzt ist.
	 *
	 * - auto:  Stößt eine rekursiven Suchfunktion nach dem Theme pro Component an. Das benötigt
	 *          zusätzliche Rechenleistung.
	 * - fixed: Kann das Theme direkt beim Laden der Component setzen und benötigt somit keine
	 *          zusätzliche Rechenleistung.
	 */
	detect?: 'auto' | 'fixed';
	/**
	 * Gibt an, welches Theme initial fest gesetzt werden soll, wenn mehrere Themes geladen wurden.
	 */
	name?: string;
};
export type RegisterTranslationOptions = {
	/**
	 * Gibt an, welches Sprache initial fest gesetzt werden soll, wenn mehrere Sprachen geladen wurden.
	 */
	name?: Generic.I18n.Locale.ISO_639_1;
};
export type RegisterOptions = {
	theme?: RegisterThemeOptions;
	translations?:
		| Generic.I18n.RegisterPatch<Generic.I18n.Locale.ISO_639_1, string, string>
		| Generic.I18n.RegisterPatch<Generic.I18n.Locale.ISO_639_1, string, string>[]
		| Set<Generic.I18n.RegisterPatch<Generic.I18n.Locale.ISO_639_1, string, string>>;
	translation?: RegisterTranslationOptions;
};
