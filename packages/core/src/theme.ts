import { Generic } from '.';

export type LoaderCallback = () => Promise<void>;
type ThemeName = string | null;
export type ThemeEncroachCss = {
	/**
	 * Gibt an, das Basis-CSS in den Web Components wiederverwendet werden soll und wenn ja, ob
	 * es entweder vor oder nach dem CSS des Themes eingefügt werden soll.
	 *
	 * - after:		Fügt das Basis-CSS nach dem CSS des Themes ein.
	 * - before:	Fügt das Basis-CSS vor dem CSS des Themes ein.
	 */
	mode: 'after' | 'before';
};
export type ThemeDetails = {
	/**
	 * Gibt an, ob die Style-Sheets für die Web Components gecached werden sollen.
	 */
	cache: boolean;
	/**
	 * Gibt an, welches Theme initial fest gesetzt werden soll, wenn mehrere Themes geladen wurden.
	 */
	encroachCss: ThemeEncroachCss | false;
	/**
	 * Gibt an, welches Theme ausgewählt ist.
	 */
	name: ThemeName;
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
type RegisterTranslationOptions = {
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
