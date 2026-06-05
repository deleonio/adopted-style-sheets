import log from 'loglevel';

import type { Generic } from '../';
import type { FeatureFlags, LoaderCallback, RegisterOptions, RegisterThemeOptions, ThemeDetails, ThemeEncroachCss } from '../theme';
import { STORE } from './window';

let lockThemePatching = true;
let warrentyWarning = false;

// https://regex101.com/r/nEcl8u/1
const THEME_NAME_PATTERN = /^[a-z][a-z0-9]{1,}(-[a-z0-9]+)?$/;
const isThemeNameValid = (name: unknown): boolean => typeof name === 'string' && THEME_NAME_PATTERN.test(name);

const validateThemeName = (name: unknown) => {
	if (!isThemeNameValid(name)) {
		throw new Error(
			`[Theming] The theme identifier "${
				typeof name === 'string' ? name : ''
			}" (Type: ${typeof name}) is not valid. Please use only follow this pattern: /^[a-z][a-z0-9]{1,}(-[a-z0-9]+)?$/`,
		);
	}
};

const minifyCss = (css: string) =>
	css
		.replace(/\/\*[\s\S]*?\*\//g, '') // Entferne Kommentare
		.replace(/\s*([{},;])\s*/g, '$1') // Entferne Leerzeichen rund um Tokens (ohne ':')
		.replace(/:\s+/g, ':') // Entferne Leerzeichen nach ':'
		.replace(/\s+/g, ' ') // Reduziere Mehrfach-Whitespace auf ein Leerzeichen
		.replace(/;\}/g, '}') // Entferne unnötiges Semikolon vor geschweifter Klammer
		.trim();

/**
 * @deprecated use setThemeTag instead
 */
export const patchThemeTag = (themeName: string, tagName: Generic.Theming.Props<string, string>, css: string, options?: Generic.Theming.PatchOptions): void =>
	setThemeTag(themeName, tagName, css, options);

export const setThemeTag = (themeName: string, tagName: Generic.Theming.Props<string, string>, css: string, options?: Generic.Theming.PatchOptions): void => {
	options = options ?? {};
	options.append = options.append ?? false;

	validateThemeName(themeName);
	if (lockThemePatching && !warrentyWarning) {
		warrentyWarning = true;
		log.warn(
			`[Theming] The theme process is locked. This means that the theme "${themeName}" should not be patched.

    import { register } from 'adopted-style-sheets';
    import { defineCustomElements } from '...';
    import { THEME } from '...';

    register(THEME, defineCustomElements)
    .then(() => {
        // run your app or website
    })
    .catch(console.warn);`,
		);
	}

	let themeMap = STORE.A11yUi.THEMES.get(themeName);
	if (!themeMap) {
		themeMap = new Map();
		STORE.A11yUi.THEMES.set(themeName, themeMap);
	}

	if (options.append && themeMap.has(tagName)) {
		const prev = themeMap.get(tagName) as string;
		themeMap.set(tagName, minifyCss(`${prev}${css}`));
	} else {
		themeMap.set(tagName, minifyCss(css));
	}
};

/**
 * @deprecated use setTheme instead
 */
export const patchTheme = (
	name: string,
	map: Generic.Theming.Map<string, string>,
	options?: Generic.Theming.PatchOptions,
	registerOptions?: RegisterOptions,
): string => setTheme(name, map, options, registerOptions);

export const setTheme = (
	name: string,
	map: Generic.Theming.Map<string, string>,
	options?: Generic.Theming.PatchOptions,
	registerOptions?: RegisterOptions,
): string => {
	validateThemeName(name);
	if (typeof map === 'object' && map !== null) {
		const tagNames = Object.getOwnPropertyNames(map) as Generic.Theming.Props<string, string>[];
		tagNames.forEach((tagName) => {
			const cssStyle = map[tagName];
			const normalizedTagName = tagName.toLowerCase();
			const domTagName =
				typeof registerOptions?.transformTagName === 'function' && !['GLOBAL', 'PROPERTIES'].includes(tagName)
					? registerOptions.transformTagName(normalizedTagName)
					: tagName;

			if (typeof cssStyle === 'string' && cssStyle.length > 0) {
				setThemeTag(name, domTagName.toUpperCase() as Generic.Theming.Props<string, string>, cssStyle, options);
			}
		});
	}
	return name;
};

const getThemeNode = (element: HTMLElement | ParentNode | null): HTMLElement | null => {
	if (element instanceof HTMLElement) {
		if (typeof element.dataset.theme === 'string') {
			return element;
		} else {
			let parentNode: HTMLElement | ParentNode | null = element.parentNode;
			while (parentNode instanceof ShadowRoot) {
				parentNode = parentNode.host;
			}
			return getThemeNode(parentNode);
		}
	} else {
		return null;
	}
};

const getEncroachCss = (dataset: DOMStringMap = {}): false | ThemeEncroachCss => {
	if (dataset.themeEncroachCss === 'false' || dataset.themeReset === 'true') {
		return false;
	} else {
		return {
			mode: dataset.themeEncroachCssMode === 'after' || dataset.themeEncroachCssMode === 'before' ? dataset.themeEncroachCssMode : 'before',
		};
	}
};

const isTheCurrentThemeConfigValid = () =>
	typeof STORE.A11yUi.Theme === 'object' &&
	STORE.A11yUi.Theme !== null &&
	typeof (STORE.A11yUi.Theme as Record<string, unknown>).cache === 'boolean' &&
	typeof (STORE.A11yUi.Theme as Record<string, unknown>).encroachCss === 'object' &&
	(STORE.A11yUi.Theme as Record<string, unknown>).encroachCss !== null &&
	typeof ((STORE.A11yUi.Theme as Record<string, unknown>).encroachCss as Record<string, unknown>).mode === 'string' &&
	typeof (STORE.A11yUi.Theme as Record<string, unknown>).name === 'string';

const isTheCurrentThemeNotDefault = () =>
	(typeof STORE.A11yUi.Theme === 'object' && STORE.A11yUi.Theme !== null) === false || (STORE.A11yUi.Theme as Record<string, unknown>).name !== 'default';

export const getThemeDetails = (element: HTMLElement | ParentNode | null): ThemeDetails => {
	if (isTheCurrentThemeConfigValid()) {
		return STORE.A11yUi.Theme as ThemeDetails;
	} else {
		const details: ThemeDetails = {
			cache: true,
			encroachCss: getEncroachCss(),
			loglevel: 'silent',
			mode: 'csr',
			name: null,
		};

		const themeNode = getThemeNode(element);
		if (themeNode instanceof HTMLElement) {
			details.cache = themeNode.dataset.themeCache !== 'false';
			details.encroachCss = getEncroachCss(themeNode.dataset);
			details.loglevel = themeNode.dataset.themeLoglevel === 'debug' ? themeNode.dataset.themeLoglevel : 'silent';
			details.mode = themeNode.dataset.themeMode === 'ssr' ? themeNode.dataset.themeMode : 'csr';
			details.name = themeNode.dataset.theme || null;
		}
		return details;
	}
};

export const getTheme = (element: HTMLElement | ParentNode | null): string | null => {
	return getThemeDetails(element).name;
};

/**
 * Returns the name of the default theme that was primarily registered via `register()`.
 * Returns `null` if no theme was registered with 'fixed' detection mode.
 */
export const getDefaultThemeName = (): string | null => {
	if (isTheCurrentThemeConfigValid()) {
		return (STORE.A11yUi.Theme as ThemeDetails).name;
	}
	return null;
};

/**
 * Returns the full theme details of the default theme that was primarily registered via `register()`.
 * Returns `null` if no theme was registered with 'fixed' detection mode.
 */
export const getDefaultThemeDetails = (): ThemeDetails | null => {
	if (isTheCurrentThemeConfigValid()) {
		return STORE.A11yUi.Theme as ThemeDetails;
	}
	return null;
};

/**
 * Set the theming option defaults.
 */
const getThemeOptionDefaults = (themeName: string, options: RegisterThemeOptions): Required<RegisterThemeOptions> => {
	return {
		cache: options.cache !== false, // default: true
		detect: options.detect === 'auto' ? 'auto' : 'fixed', // default: 'fixed'
		encroachCss:
			options.encroachCss === false
				? false
				: typeof options.encroachCss === 'object' &&
					  options.encroachCss != null &&
					  (options.encroachCss.mode === 'after' || options.encroachCss.mode === 'before')
					? options.encroachCss
					: {
							mode: 'before', // default: 'before'
						},
		loglevel: options.loglevel === 'debug' ? options.loglevel : 'silent', // default: 'silent'
		mode: options.mode === 'ssr' ? options.mode : 'csr', // default: 'csr'
		name: typeof options.name === 'string' ? options.name : themeName, // default: themeName
	};
};

const setConfigureTheme = (themeName: string, options: RegisterThemeOptions): void => {
	/**
	 * Die ThemeOptions werden nur gesetzt, wenn sie noch nicht valide gesetzt wurden oder
	 * noch immer ein Default-Theme gesetzt ist.
	 */
	if (isTheCurrentThemeConfigValid() === false && isTheCurrentThemeNotDefault()) {
		if (
			// Die Options müssen ein Objekt sein.
			typeof options === 'object' &&
			options !== null
		) {
			/**
			 * Set the theming option defaults, if they are undefined or invalid.
			 */
			options = getThemeOptionDefaults(themeName, options);

			if (
				/**
				 * The presetting of theme options is only relevant by using 'fixed'
				 * detection mode.
				 */ options.detect === 'fixed'
			) {
				if (options.name === null && typeof themeName === 'string') {
					options.name = themeName;
				}

				if (
					/**
					 * Wenn mehrere Themes geladen werden, dann wird nur der Theme-Name gesetzt,
					 * der mit dem Name eines Themes übereinstimmt.
					 */
					themeName === options.name
				) {
					STORE.A11yUi.Theme = options;
					log.info(`[Theming] Theme "${themeName}" was set as default theme.`);
				}
			} else if (!warrentyWarning) {
				warrentyWarning = true;
				log.warn(`[Theming] The presetting of theme options is only relevant by using 'fixed' detection mode.`);
			}
		}
	}
};

/**
 * Kombiniert mehrere Feature-Flag-Objekte zu einem. Spätere Einträge überschreiben frühere.
 * Typisches Muster: mergeFeatureFlags(THEME_DEFAULTS, appOverrides)
 */
export const mergeFeatureFlags = (...sets: (FeatureFlags | undefined)[]): FeatureFlags => {
	const result: FeatureFlags = {};
	for (const set of sets) {
		if (set) Object.assign(result, set);
	}
	return result;
};

/**
 * Gibt den Wert eines Feature-Flags zurück, das via register() gesetzt wurde.
 * Gibt undefined zurück wenn das Flag nicht gesetzt ist.
 */
export const getFeatureFlag = (key: string): unknown => (STORE.A11yUi.Features as Record<string, unknown>)[key];

export const getRegisteredThemeNames = (): string[] => {
	return Array.from(STORE.A11yUi.THEMES.keys());
};
export const getRegisteredThemes = (): Map<string, Map<string, string>> => {
	return STORE.A11yUi.THEMES;
};
export const getRegisteredThemeByName = (themeName: string): Map<string, string> | undefined => {
	return STORE.A11yUi.THEMES.get(themeName);
};

let registered = false;

export const register = (
	themes:
		| Generic.Theming.RegisterPatch<string, string, string>
		| Generic.Theming.RegisterPatch<string, string, string>[]
		| Set<Generic.Theming.RegisterPatch<string, string, string>>,
	loaders: LoaderCallback | LoaderCallback[] | Set<LoaderCallback>,
	options: RegisterOptions = {},
): Promise<void[]> => {
	if (!registered) {
		registered = true;
		lockThemePatching = false;
		if (typeof window !== 'undefined') {
			window.A11yUi = STORE.A11yUi;
		}
	}
	if (typeof themes === 'function') {
		themes = new Set([themes]);
	} else if (Array.isArray(themes)) {
		themes = new Set(themes);
	}
	if (themes instanceof Set) {
		themes.forEach((theme: (patchTheme: Generic.Theming.Patch<string, string, string>) => string) => {
			if (typeof theme === 'function' && theme.length === 1) {
				setConfigureTheme(
					theme((name: string, map: Generic.Theming.Map<string, string>, patchOptions?: Generic.Theming.PatchOptions) =>
						setTheme(name, map, patchOptions, options),
					),
					{
						cache: options.theme?.cache,
						detect: options.theme?.detect,
						encroachCss: options.theme?.encroachCss,
						mode: options.theme?.mode,
						name: options.theme?.name,
					},
				);
			} else {
				log.error(`[Theming] An attempt was made to load an incompatible theme.`);
			}
		});
	}
	lockThemePatching = true;
	if (options.features) {
		STORE.A11yUi.Features = mergeFeatureFlags(STORE.A11yUi.Features, options.features);
	}
	if (typeof loaders === 'function') {
		loaders = new Set([loaders]);
	} else if (Array.isArray(loaders)) {
		loaders = new Set(loaders);
	}
	const promises: Promise<void>[] = [];
	loaders.forEach((loader) => {
		const result = loader() as () => void;
		if (result instanceof Promise) {
			promises.push(result);
		}
	});

	return Promise.all(promises);
};
