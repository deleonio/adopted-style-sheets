import log from 'loglevel';

import type { Generic } from '../';
import type { LoaderCallback, RegisterOptions, RegisterThemeOptions, ThemeDetails, ThemeEncroachCss } from '../theme';
import { STORE } from './window';

let lockThemePatching = true;
let warrentyWarning = false;

// https://regex101.com/r/nEcl8u/1
const THEME_NAME_PATTERN = /^[a-z][a-z0-9]{1,}(-[a-z0-9]+)?$/;
const isThemeNameValid = (name: unknown): boolean => {
	return typeof name === 'string' && THEME_NAME_PATTERN.test(name);
};
const validateThemeName = (name: unknown) => {
	if (isThemeNameValid(name) === false) {
		throw new Error(
			`[Theming] The theme identifier "${
				typeof name === 'string' ? name : ''
			}" (Type: ${typeof name}) is not valid. Please use only follow this pattern: /^[a-z][a-z0-9]{1,}(-[a-z0-9]+)?$/`,
		);
	}
};

/**
 * @deprecated use setThemeTag instead
 */
export const patchThemeTag = (themeName: string, tagName: Generic.Theming.Props<string, string>, css: string, options?: Generic.Theming.PatchOptions): void =>
	setThemeTag(themeName, tagName, css, options);

export const setThemeTag = (themeName: string, tagName: Generic.Theming.Props<string, string>, css: string, options?: Generic.Theming.PatchOptions): void => {
	options = options ?? {};
	options.append = options.append ?? false;

	validateThemeName(themeName);
	if (lockThemePatching === true && warrentyWarning === false) {
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

	if (typeof STORE.A11yUi.Themes[themeName] !== 'object' || STORE.A11yUi.Themes[themeName] === null) {
		STORE.A11yUi.Themes[themeName] = {};
	}

	if (options.append && typeof (STORE.A11yUi.Themes[themeName] as Record<string, unknown>)[tagName] === 'string') {
		((STORE.A11yUi.Themes[themeName] as Record<string, unknown>)[tagName] as string) += css;
	} else {
		(STORE.A11yUi.Themes[themeName] as Record<string, unknown>)[tagName] = css;
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
	typeof STORE.A11yUi === 'object' &&
	STORE.A11yUi !== null &&
	typeof STORE.A11yUi.Theme === 'object' &&
	STORE.A11yUi.Theme !== null &&
	typeof (STORE.A11yUi.Theme as Record<string, unknown>).cache === 'boolean' &&
	typeof (STORE.A11yUi.Theme as Record<string, unknown>).encroachCss === 'object' &&
	(STORE.A11yUi.Theme as Record<string, unknown>).encroachCss !== null &&
	typeof ((STORE.A11yUi.Theme as Record<string, unknown>).encroachCss as Record<string, unknown>).mode === 'string' &&
	typeof (STORE.A11yUi.Theme as Record<string, unknown>).name === 'string';

const isTheCurrentThemeNotDefault = () =>
	(typeof STORE.A11yUi === 'object' && STORE.A11yUi !== null) === false ||
	(typeof STORE.A11yUi.Theme === 'object' && STORE.A11yUi.Theme !== null) === false ||
	(STORE.A11yUi.Theme as Record<string, unknown>).name !== 'default';

export const getThemeDetails = (element: HTMLElement | ParentNode | null): ThemeDetails => {
	if (isTheCurrentThemeConfigValid()) {
		return STORE.A11yUi.Theme as ThemeDetails;
	} else {
		const details: ThemeDetails = {
			cache: true,
			encroachCss: getEncroachCss(),
			loglevel: 'silent',
			name: null,
		};

		const themeNode = getThemeNode(element);
		if (themeNode instanceof HTMLElement) {
			details.cache = themeNode.dataset.themeCache !== 'false';
			details.encroachCss = getEncroachCss(themeNode.dataset);
			details.loglevel = themeNode.dataset.themeLoglevel === 'debug' ? themeNode.dataset.themeLoglevel : 'silent';
			details.name = themeNode.dataset.theme || null;
		}
		return details;
	}
};

export const getTheme = (element: HTMLElement | ParentNode | null): string | null => {
	return getThemeDetails(element).name;
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
			} else {
				log.warn(`[Theming] The presetting of theme options is only relevant by using 'fixed' detection mode.`);
			}
		}
	}
};

export const getRegisteredThemeNames = () => {
	return Object.keys(STORE.A11yUi.Themes);
};
export const getRegisteredThemes = () => {
	return STORE.A11yUi.Themes;
};
export const getRegisteredThemeByName = (themeName: string) => {
	return STORE.A11yUi.Themes[themeName];
};

let registered = false;

export const register = (
	themes:
		| Generic.Theming.RegisterPatch<string, string, string>
		| Generic.Theming.RegisterPatch<string, string, string>[]
		| Set<Generic.Theming.RegisterPatch<string, string, string>>,
	loaders: LoaderCallback | LoaderCallback[] | Set<LoaderCallback>,
	options: RegisterOptions = {
		debug: false,
	},
): Promise<void[]> => {
	if (registered === false) {
		registered = true;
		lockThemePatching = false;
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
						name: options.theme?.name,
					},
				);
			} else {
				log.error(`[Theming] Es wurde versucht eine nicht kompatibles Theme zu laden.`);
			}
		});
	}
	lockThemePatching = true;
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
