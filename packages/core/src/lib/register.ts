import log from 'loglevel';
import { Generic } from '..';
import { ThemeDetails, LoaderCallback, RegisterOptions, RegisterThemeOptions, ThemeEncroachCss } from '../theme';
import { GLOBAL } from './window';

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

	if (typeof GLOBAL.A11yUi !== 'object' || GLOBAL.A11yUi === null) {
		GLOBAL.A11yUi = {};
	}
	if (
		typeof GLOBAL.A11yUi === 'object' &&
		GLOBAL.A11yUi !== null &&
		(typeof ((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) !== 'object' ||
			((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) === null)
	) {
		((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) = {};
	}
	if (
		typeof GLOBAL.A11yUi === 'object' &&
		GLOBAL.A11yUi !== null &&
		typeof ((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) === 'object' &&
		((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) !== null &&
		(typeof ((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] !== 'object' ||
			((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] === null)
	) {
		((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] = {};
	}
	if (
		typeof GLOBAL.A11yUi === 'object' &&
		GLOBAL.A11yUi !== null &&
		typeof ((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) === 'object' &&
		((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>) !== null &&
		typeof ((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] === 'object' &&
		((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] !== null
	) {
		(((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] = css;
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
	typeof GLOBAL.A11yUi === 'object' &&
	GLOBAL.A11yUi !== null &&
	typeof (GLOBAL.A11yUi as Record<string, unknown>).Theme === 'object' &&
	(GLOBAL.A11yUi as Record<string, unknown>).Theme !== null &&
	typeof ((GLOBAL.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).cache === 'boolean' &&
	typeof ((GLOBAL.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).encroachCss === 'object' &&
	typeof ((GLOBAL.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).encroachCss !== null &&
	typeof (((GLOBAL.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).encroachCss as Record<string, unknown>).mode === 'string' &&
	typeof ((GLOBAL.A11yUi as Record<string, unknown>).Theme as Record<string, unknown>).name === 'string';

export const getThemeDetails = (element: HTMLElement | ParentNode | null): ThemeDetails => {
	if (isTheCurrentThemeConfigValid()) {
		return (GLOBAL.A11yUi as Record<string, unknown>).Theme as ThemeDetails;
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
	return {
		cache: options.cache === true,
		detect: options.detect === 'fixed' ? 'fixed' : 'auto',
		encroachCss: options.encroachCss === undefined ? false : options.encroachCss,
		name: typeof options.name === 'string' ? options.name : null,
	};
};

/**
 * Implements a facade for define properties on records.
 *
 * @param object		Record reference
 * @param name			Property name
 * @param getValue	Property get value
 * @param writable	Could that property overwrite
 */
const defineProperty = <T>(object: Record<string, unknown>, name: string, getValue: T, writable = false) => {
	try {
		Object.defineProperty(object, name, {
			get: function () {
				return getValue;
			},
			writable,
		});
	} catch (e) {
		log.debug(`The property ${name} is already bind.`);
	}
};

const setConfigureTheme = (themeName: string, options: RegisterThemeOptions): void => {
	/**
	 * Die ThemeOptions werden nur einmal gesetzt, wenn Sie valide sind.
	 */
	if (isTheCurrentThemeConfigValid() === false) {
		/**
		 * Set the theming option defaults, if they are undefined or invalid.
		 */
		options = getThemeOptionDefaults(options);
		if (
			// Die Options müssen ein Objekt sein.
			typeof options === 'object' &&
			options !== null &&
			// Nur wenn die Detection 'fixed' ist, müssen die Options gesetzt werden.
			options.detect === 'fixed' &&
			// Wenn mehrere Themes geladen werden, dann wird nur der Theme-Name gesetzt, der mit dem Name eines Themes übereinstimmt.
			themeName === options.name
		) {
			defineProperty(GLOBAL, 'A11yUi', {});
			defineProperty(GLOBAL.A11yUi as Record<string, unknown>, 'Theme', options);
			log.debug(`[Theming] "${themeName}" was set as default theme.`);
		}
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
