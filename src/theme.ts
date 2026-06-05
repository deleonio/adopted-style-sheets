import type { Generic } from './';

type ThemeName = string | null;

export type FeatureFlags = Record<string, unknown>;

type Required<T> = {
	[P in keyof T]-?: T[P];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-redundant-type-constituents
export type LoaderCallback = () => any | Promise<any>;

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
type OptionalThemeDetails = {
	/**
	 * Gibt an, ob die Styling der Web Components gecached werden sollen.
	 *
	 * - true:	Styling wird gecached
	 * - false: Styling wird bei jeden Rendern neu berechnet
	 */
	cache?: boolean;
	/**
	 * Gibt an, ob das Basis-Styling der Web Components verwendet werden soll und wenn ja, ob es vor
	 * oder nach dem eigenen Theme-Styling eingefügt werden soll.
	 *
	 * - false:			Basis-Styling wird entfernt (default)
	 * - 'before':	Basis-Styling wird vorher eingefügt
	 * - 'after':		Basis-Styling wird danach eingefügt
	 */
	encroachCss?: ThemeEncroachCss | false;
	/**
	 * Gibt an, ob das Theming im Debug-Modus laufen sollen.
	 */
	loglevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
	/**
	 * Gibt an, ob das Theming im Client- oder Server-Site-Rendering laufen soll.
	 */
	mode?: 'csr' | 'ssr';
	/**
	 * Gibt den eindeutigen Namen eines Themes an.
	 */
	name?: ThemeName;
};
export type ThemeDetails = Required<OptionalThemeDetails>;
export type RegisterThemeOptions = OptionalThemeDetails & {
	/**
	 * Gibt an, ob das jeweilige Theme pro Component automatisch ermittelt werden soll oder
	 * für alle fest gesetzt ist.
	 *
	 * - auto:  Stößt eine rekursiven Suchfunktion nach dem Theme pro Web Component an. Das benötigt
	 *          zusätzliche Rechenleistung.
	 * - fixed: Kann das Theme direkt beim Laden der Web Component setzen und benötigt somit keine
	 *          zusätzliche Rechenleistung.
	 */
	detect?: 'auto' | 'fixed';
};
type RegisterTranslationOptions = {
	/**
	 * Gibt an, welches Sprache initial fest gesetzt werden soll, wenn mehrere Sprachen geladen wurden.
	 */
	name?: Generic.I18n.Locale.ISO_639_1;
};
export type RegisterOptions = {
	theme?: RegisterThemeOptions;
	/**
	 * Globale Feature-Flags für opt-in Komponentenverhalten. Mehrere Flag-Objekte
	 * können per `mergeFeatureFlags()` zusammengeführt werden, wobei spätere Werte gewinnen.
	 */
	features?: FeatureFlags;
	translations?:
		| Generic.I18n.RegisterPatch<Generic.I18n.Locale.ISO_639_1, string, string>
		| Generic.I18n.RegisterPatch<Generic.I18n.Locale.ISO_639_1, string, string>[]
		| Set<Generic.I18n.RegisterPatch<Generic.I18n.Locale.ISO_639_1, string, string>>;
	translation?: RegisterTranslationOptions;
	transformTagName?: (tagName: string) => string;
};
