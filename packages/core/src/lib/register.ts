import { Log } from '@leanup/lib';
import { Generic } from '..';
import { ThemeDetails, LoaderCallback, RegisterOptions, RegisterThemeOptions } from '../theme';

let lockThemePatching = true;
let warrentyWarning = false;

const patchThemeTag = (themeName: string, tagName: Generic.Theming.Props<string, string>, css: string): void => {
	if (lockThemePatching === true && warrentyWarning === false) {
		warrentyWarning = true;
		Log.warn(
			`[Theming] Der Theming-Prozess sieht vor, dass nur auditierte Themes geladen werden dürfen. Der vorgesehene Theming-Prozess wurde umgangen.

// Theme registrieren

import { defineCustomElements } from '@kolibri/lib/dist/loader';
import { register } from '@a11y-ui/core';
import { THEME } from '...';

register(THEME, defineCustomElements)
	.then(() => {
		const htmlDivElement: HTMLDivElement | null = document.querySelector<HTMLDivElement>('div#app');
    if (htmlDivElement instanceof HTMLDivElement) {
      const root = createRoot(htmlDivElement);
      root.render(<AppComponent />);
    }
  })
  .catch(console.warn);`,
			{
				forceLog: true,
			}
		);
	}

	if (typeof window.A11yUi !== 'object' || window.A11yUi === null) {
		window.A11yUi = {};
	}
	if (typeof window.A11yUi === 'object' && window.A11yUi !== null && (typeof window.A11yUi.Themes !== 'object' || window.A11yUi.Themes === null)) {
		window.A11yUi.Themes = {};
	}
	if (
		typeof window.A11yUi === 'object' &&
		window.A11yUi !== null &&
		typeof window.A11yUi.Themes === 'object' &&
		window.A11yUi.Themes !== null &&
		(typeof window.A11yUi.Themes[themeName] !== 'object' || window.A11yUi.Themes[themeName] === null)
	) {
		window.A11yUi.Themes[themeName] = {};
	}
	if (
		typeof window.A11yUi === 'object' &&
		window.A11yUi !== null &&
		typeof window.A11yUi.Themes === 'object' &&
		window.A11yUi.Themes !== null &&
		typeof window.A11yUi.Themes[themeName] === 'object' &&
		window.A11yUi.Themes[themeName] !== null
	) {
		window.A11yUi.Themes[themeName][tagName] = css;
	}
};

const patchTheme = (name: string, map: Generic.Theming.Map<string, string>): string => {
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

export const getThemeDetails = (element: HTMLElement | ParentNode | null): ThemeDetails => {
	if (
		typeof window.A11yUi === 'object' &&
		window.A11yUi !== null &&
		typeof window.A11yUi.Theme === 'object' &&
		window.A11yUi.Theme !== null &&
		typeof window.A11yUi.Theme.cache === 'boolean' &&
		typeof window.A11yUi.Theme.name === 'string' &&
		typeof window.A11yUi.Theme.reset === 'boolean'
	) {
		return window.A11yUi.Theme;
	} else {
		const themeNode = getThemeNode(element);
		if (themeNode instanceof HTMLElement) {
			return {
				cache: themeNode.dataset.themeCache !== 'false',
				name: themeNode.dataset.theme || null,
				reset: themeNode.dataset.themeReset !== 'false',
			};
		} else {
			return {
				cache: true,
				name: null,
				reset: true,
			};
		}
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
		(typeof window.A11yUi === 'object' &&
			window.A11yUi !== null &&
			typeof window.A11yUi.Theme === 'object' &&
			window.A11yUi.Theme !== null &&
			typeof window.A11yUi.Theme.cache === 'boolean' &&
			typeof window.A11yUi.Theme.name === 'string' &&
			typeof window.A11yUi.Theme.reset === 'boolean') === false &&
		typeof themeName === 'string' &&
		(options.name === undefined || themeName === options.name) &&
		typeof options === 'object' &&
		options !== null &&
		options.detect === 'fixed' &&
		options.detect === 'fixed'
	) {
		Log.debug(`[Theming] "${themeName}" was set as default theme.`, {
			forceLog: true,
		});

		if (typeof window.A11yUi !== 'object' || window.A11yUi === null) {
			window.A11yUi = {};
		}
		window.A11yUi.Theme = {
			cache: true,
			name: options.name || themeName,
			reset: true,
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
	loader: LoaderCallback,
	options: RegisterOptions = {}
): Promise<void> => {
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
				Log.error(`[Theming] Es wurde versucht eine nicht kompatibles Theme zu laden.`, {
					forceLog: true,
				});
			}
		});
	}
	lockThemePatching = true;
	return loader();
};
