import log from 'loglevel';
import { Generic } from '..';
import { ThemeDetails, LoaderCallback, RegisterOptions, RegisterThemeOptions, ThemeEncroachCss } from '../theme';
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
			}" (Type: ${typeof name}) is not valid. Please use only follow this pattern: /^[a-z][a-z0-9]{1,}(-[a-z0-9]+)?$/`
		);
	}
};

export const patchThemeTag = (themeName: string, tagName: Generic.Theming.Props<string, string>, css: string): void => {
	validateThemeName(themeName);
	if (lockThemePatching === true && warrentyWarning === false) {
		warrentyWarning = true;
		log.warn(
			`[Theming] The theme process is locked. This means that the theme "${themeName}" should not be patched.

import { register } from '@a11y-ui/core';
import { defineCustomElements } from '...';
import { THEME } from '...';

register(THEME, defineCustomElements)
	.then(() => {
		const htmlDivElement: HTMLDivElement | null = document.querySelector<HTMLDivElement>('div#app');
    if (htmlDivElement instanceof HTMLDivElement) {
      const root = createRoot(htmlDivElement);
      root.render(<AppComponent />);
    }
  })
  .catch(console.warn);`
		);
	}

	if (typeof STORE.A11yUi !== 'object' || STORE.A11yUi === null) {
		STORE.A11yUi = {};
	}
	if (
		typeof STORE.A11yUi === 'object' &&
		STORE.A11yUi !== null &&
		(typeof ((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) !== 'object' ||
			((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) === null)
	) {
		((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) = {};
	}
	if (
		typeof STORE.A11yUi === 'object' &&
		STORE.A11yUi !== null &&
		typeof ((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) === 'object' &&
		((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) !== null &&
		(typeof ((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] !== 'object' ||
			((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] === null)
	) {
		((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] = {};
	}
	if (
		typeof STORE.A11yUi === 'object' &&
		STORE.A11yUi !== null &&
		typeof ((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) === 'object' &&
		((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) !== null &&
		typeof ((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] === 'object' &&
		((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] !== null
	) {
		(((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] = css;
	}
};

export const patchTheme = (name: string, map: Generic.Theming.Map<string, string>): string => {
	validateThemeName(name);
	if (typeof map === 'object' && map !== null) {
		const tagNames = Object.getOwnPropertyNames(map) as Generic.Theming.Props<string, string>[];
		tagNames.forEach((tagName) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			const cssStyle = map[tagName] as string;
			if (typeof cssStyle === 'string' && cssStyle.length > 0) {
				patchThemeTag(name, tagName, cssStyle);
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
	if (typeof dataset.themeEncroachCssMode === 'string' && (dataset.themeEncroachCssMode === 'after' || dataset.themeEncroachCssMode === 'before')) {
		return {
			mode: dataset.themeEncroachCssMode,
		};
	} else {
		return false;
	}
};

const isTheCurrentThemeConfigValid = () =>
	typeof STORE.A11yUi === 'object' &&
	STORE.A11yUi !== null &&
	typeof (STORE.A11yUi as Record<string, unknown>).Theme === 'object' &&
	(STORE.A11yUi as Record<string, unknown>).Theme !== null &&
	typeof ((STORE.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).cache === 'boolean' &&
	typeof ((STORE.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).encroachCss === 'object' &&
	typeof ((STORE.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).encroachCss !== null &&
	typeof (((STORE.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).encroachCss as Record<string, unknown>).mode === 'string' &&
	typeof ((STORE.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).name === 'string';

export const getThemeDetails = (element: HTMLElement | ParentNode | null): ThemeDetails => {
	if (isTheCurrentThemeConfigValid()) {
		return (STORE.A11yUi as Record<string, unknown>).Theme as ThemeDetails;
	} else {
		const themeNode = getThemeNode(element);
		const details: ThemeDetails = {
			cache: true,
			encroachCss: getEncroachCss(),
			name: null,
		};
		if (themeNode instanceof HTMLElement) {
			details.cache = themeNode.dataset.themeCache !== 'false';
			details.encroachCss = getEncroachCss(themeNode.dataset);
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
const getThemeOptionDefaults = (options: RegisterThemeOptions): Required<RegisterThemeOptions> => {
	// options = {
	// 	cache: options.cache !== false, // default: true
	// 	detect: options.detect === 'auto' ? 'auto' : 'fixed', // default: 'fixed'
	// 	// encroachCss: typeof options.encroachCss === 'object' && options.encroachCss != null ? options.encroachCss : false, // default: false
	// 	encroachCss: options.encroachCss === undefined ? false : options.encroachCss, // default: false
	// 	name: typeof options.name === 'string' ? options.name : null, // default: null
	// };
	options = {
		detect: options.detect || 'fixed',
		name: options.name,
	};
	return options as Required<RegisterThemeOptions>;
};

const setConfigureTheme = (themeName: string, options: RegisterThemeOptions): void => {
	/**
	 * Die ThemeOptions werden nur einmal gesetzt, wenn Sie valide sind.
	 */
	if (isTheCurrentThemeConfigValid() === false) {
		if (
			// Die Options müssen ein Objekt sein.
			typeof options === 'object' &&
			options !== null
		) {
			/**
			 * Set the theming option defaults, if they are undefined or invalid.
			 */
			options = getThemeOptionDefaults(options);

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
					if (typeof STORE.A11yUi !== 'object' || STORE.A11yUi === null) {
						STORE.A11yUi = {};
					}
					(STORE.A11yUi as Record<string, unknown>).Theme = options;
					console.log(`[Theming] Theme "${themeName}" was set as default theme.`, STORE.A11yUi);
					log.info(`[Theming] Theme "${themeName}" was set as default theme.`);
				}
			} else {
				log.warn(`[Theming] The presetting of theme options is only relevant by using 'fixed' detection mode.`);
			}
		}
		// if (typeof STORE.A11yUi !== 'object' || STORE.A11yUi === null) {
		// 	STORE.A11yUi = {};
		// }
		// // TODO: hier ist was merkwürdig
		// (STORE.A11yUi as Record<string, unknown>).Theme = {
		// 	cache: true,
		// 	encroachCss: {
		// 		mode: 'after',
		// 	},
		// 	name: options.name || themeName,
		// };
	}
};

// const loadTheme = (theme: A11yUiTheme, options: RegisterOptions) => {
//   setConfiguredTheme(theme, options);
//   return import(`../themes/${theme}.json`);
// };

let registered = false;

export const register = (
	themes:
		| Generic.Theming.RegisterPatch<string, string, string>
		| Generic.Theming.RegisterPatch<string, string, string>[]
		| Set<Generic.Theming.RegisterPatch<string, string, string>>,
	loaders: LoaderCallback | LoaderCallback[] | Set<LoaderCallback>,
	options: RegisterOptions = {}
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
				setConfigureTheme(theme(patchTheme), {
					cache: options.theme?.cache,
					detect: options.theme?.detect,
					encroachCss: options.theme?.encroachCss,
					name: options.theme?.name,
				});
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
	loaders.forEach((loader) => promises.push(loader()));
	return Promise.all(promises);
};
