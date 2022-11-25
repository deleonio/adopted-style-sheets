import log from 'loglevel';
import { Generic } from '..';
import { ThemeDetails, LoaderCallback, RegisterOptions, RegisterThemeOptions, ThemeEncroachCss } from '../theme';
import { GLOBAL } from './window';

let lockThemePatching = true;
let warrentyWarning = false;

export const patchThemeTag = (themeName: string, tagName: Generic.Theming.Props<string, string>, css: string): void => {
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

const getEncroachCss = (dataset: DOMStringMap): false | ThemeEncroachCss => {
	if (dataset.themeEncroachCss !== 'false' || dataset.themeReset !== 'false') {
		return false;
	} else if ((typeof dataset.themeEncroachCssMode === 'string' && dataset.themeEncroachCssMode === 'after') || dataset.themeEncroachCssMode === 'before') {
		return {
			mode: dataset.themeEncroachCssMode,
		};
	} else {
		return {
			mode: 'after',
		};
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
			encroachCss: {
				mode: 'after',
			},
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

const setConfigureTheme = (themeName: string, options: RegisterThemeOptions = {}): void => {
	options = {
		detect: options.detect || 'fixed',
		name: options.name,
	};
	if (
		isTheCurrentThemeConfigValid() === false &&
		typeof themeName === 'string' &&
		(options.name === undefined || themeName === options.name) &&
		typeof options === 'object' &&
		options !== null &&
		options.detect === 'fixed'
	) {
		log.debug(`[Theming] "${themeName}" was set as default theme.`);

		if (typeof GLOBAL.A11yUi !== 'object' || GLOBAL.A11yUi === null) {
			GLOBAL.A11yUi = {};
		}
		// TODO: hier ist was merkwürdig
		(GLOBAL.A11yUi as Record<string, unknown>).Theme = {
			cache: true,
			encroachCss: {
				mode: 'after',
			},
			name: options.name || themeName,
		};
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
					detect: options.theme?.detect,
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
