import { Generic, STORE, ThemeDetails } from '..';

type CSSStyleSheetW3C = CSSStyleSheet & {
	replaceSync?: (css: string) => void;
};

const CSS_PROPERTIES_REGISTERED: Set<string> = new Set();
const CSS_STYLE_CACHE: Map<string, Map<string, string>> = new Map();
const CSS_STYLE_SHEETS: Map<string, Map<string, CSSStyleSheetW3C>> = new Map();
const HTML_STYLE_ELEMENTS: Map<string, Map<string, HTMLStyleElement>> = new Map();
const REGEX_CSS_PROPERTIES = /--[^;]+/g;
const REGEX_SPLT_CSS_PROPERTY = /:/;

const getCssStyle = (themeName: string, tagName: Generic.Theming.Props<string, string>): string => {
	if (
		/**
		 * Search custom StyleSheet in Config
		 * TODO: Performance???
		 */
		typeof STORE.A11yUi === 'object' &&
		STORE.A11yUi !== null &&
		typeof (STORE.A11yUi as Record<string, unknown>).Themes === 'object' &&
		(STORE.A11yUi as Record<string, unknown>).Themes !== null &&
		typeof ((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] === 'object' &&
		((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] !== null &&
		typeof (((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] === 'string'
	) {
		return ((((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] as string).replace(
			/\r?\n/g,
			''
		);
	} else {
		return '';
	}
};

// Search custom StyleSheet in Cache
const getCssStyleSheet = (themeCache: boolean, themeName: string, tagName: Generic.Theming.Props<string, string>): CSSStyleSheet | HTMLStyleElement | null => {
	if (themeCache === true && CSS_STYLE_SHEETS.has(themeName) && CSS_STYLE_SHEETS.get(themeName)?.has(tagName)) {
		return CSS_STYLE_SHEETS.get(themeName)?.get(tagName) as CSSStyleSheetW3C;
	} else if (themeCache === true && HTML_STYLE_ELEMENTS.has(themeName) && HTML_STYLE_ELEMENTS.get(themeName)?.has(tagName)) {
		return HTML_STYLE_ELEMENTS.get(themeName)?.get(tagName) as HTMLStyleElement;
	} else {
		// Instantiate default StyleSheet
		if (
			// Search custom StyleSheet in Config
			typeof STORE.A11yUi === 'object' &&
			STORE.A11yUi !== null &&
			typeof (STORE.A11yUi as Record<string, unknown>).Themes === 'object' &&
			(STORE.A11yUi as Record<string, unknown>).Themes !== null &&
			typeof ((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] === 'object' &&
			((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] !== null &&
			typeof (((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] === 'string'
		) {
			/**
			 * We should do that in the register method!
			 */
			if ((tagName === 'GLOBAL' || tagName === 'PROPERTIES') && CSS_PROPERTIES_REGISTERED.has(themeName) === false) {
				const css = (((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] as string;
				let properties: RegExpMatchArray | string[] | null = css.match(REGEX_CSS_PROPERTIES);
				if (Array.isArray(properties)) {
					properties = properties.filter((property) => REGEX_SPLT_CSS_PROPERTY.test(property));
					const style = document.createElement('style');
					style.innerHTML = `.${themeName} {${properties.join(';')}}`;
					document.querySelector('head')?.appendChild(style);
				}
				CSS_PROPERTIES_REGISTERED.add(themeName);
			}

			let style: CSSStyleSheetW3C | HTMLStyleElement;
			try {
				style = new CSSStyleSheet();
				if (typeof style.replaceSync === 'function') {
					style.replaceSync(
						(((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] as string
					);
				}

				// Caching custom CSSStyleSheet
				if (themeCache === true) {
					if (CSS_STYLE_SHEETS.has(themeName) === false) {
						CSS_STYLE_SHEETS.set(themeName, new Map());
					}
					CSS_STYLE_SHEETS.get(themeName)?.set(tagName, style);
				}
			} catch (e) {
				style = document.createElement('style');
				style.innerHTML = (((STORE.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[
					tagName
				] as string;

				// Caching custom HTMLStyleElement

				/**
				 * Advice: That does not work, because every shadow root need
				 *         his own style tags.
				 */

				// if (themeCache === true) {
				// 	if (HTML_STYLE_ELEMENTS.has(themeName) === false) {
				// 		HTML_STYLE_ELEMENTS.set(themeName, new Map());
				// 	}
				// 	HTML_STYLE_ELEMENTS.get(themeName)?.set(tagName, style);
				// }
			}

			// Caching previous StyleSheet
			// if (PRE_STYLE_SHEETS.has(theme) === false) {
			//   PRE_STYLE_SHEETS.set(theme, new Map());
			// }
			// if (PRE_STYLE_SHEETS.get(theme)?.has(elm.tagName) === false) {
			//   PRE_STYLE_SHEETS.get(theme)?.set(elm.tagName, [...(shadow.adoptedStyleSheets as CSSStyleSheet[])]);
			//   PRE_STYLE_SHEETS.get(theme)
			//     ?.get(elm.tagName)
			//     ?.forEach((componentStyle) => {
			//       let css = '';
			//       if (componentStyle.type === 'text/css') {
			//         Array.from(componentStyle.cssRules).forEach((cssRule) => {
			//           css += cssRule.cssText;
			//         });
			//       }
			//       console.log(elm.tagName, css);
			//     });
			// }

			return style;
		} else {
			return null;
			// 	throw new Error(`No style information registered for the theme ${themeName} and custom element ${tagName}.`);
		}
	}
};

const removeStyle = (shadow: ShadowRoot) => {
	for (const childNode of Array.from(shadow.childNodes)) {
		if (childNode instanceof HTMLStyleElement && childNode.tagName === 'STYLE') {
			shadow.removeChild(childNode);
		} else {
			break;
		}
	}
};

const GLOBAL_A11Y_STYLE = `:host * {
  font-size: inherit;
  hyphens: auto;
  letter-spacing: inherit;
  word-break: break-word;
  word-spacing: inherit;
}`.replace(/\r?\n/g, '');

const patchStyle = (shadow: ShadowRoot, css: string) => {
	try {
		const style: CSSStyleSheetW3C = new CSSStyleSheet();
		style.replaceSync(css);
		shadow.adoptedStyleSheets = [style];
	} catch (e) {
		const style: HTMLStyleElement = document.createElement('style');
		style.innerHTML = css;
		const firstNode = shadow.firstChild;
		shadow.insertBefore(style, firstNode);
	}
};

const setThemeStyleAfterHydrated = (elm: HTMLElement, themeDetails: ThemeDetails, styleDisplay: string) => {
	const themeCache = themeDetails.cache;
	const themeEncroachCss = themeDetails.encroachCss;
	const themeName = themeDetails.name || 'default';
	const shadow: ShadowRoot & { adoptedStyleSheets?: CSSStyleSheet[] } = elm.shadowRoot as ShadowRoot;
	if (themeCache === false || CSS_STYLE_CACHE.has(themeName) === false || CSS_STYLE_CACHE.get(themeName)?.has(elm.tagName) === false) {
		const STYLES: string[] = [
			getCssStyle(themeName, 'GLOBAL'),
			getCssStyle(themeName, 'PROPERTIES'),
			getCssStyle(themeName, elm.tagName as Generic.Theming.Props<string, string>),
		];

		getCssStyleSheet(themeCache, themeName, 'GLOBAL');

		const defaultStyleNodes: HTMLStyleElement[] = [
			...Array.from(shadow.childNodes).filter((node) => node instanceof HTMLStyleElement && node.tagName === 'STYLE'),
		] as HTMLStyleElement[];
		const defaultStyleSheets: CSSStyleSheet[] = [...Array.from(shadow.adoptedStyleSheets)];

		if (themeEncroachCss !== false) {
			if (themeEncroachCss?.mode === 'before') {
				defaultStyleNodes.reverse().forEach((style) => STYLES.unshift(style.innerHTML));
				defaultStyleSheets.reverse().forEach((style) =>
					STYLES.unshift(
						Array.from(style.cssRules)
							.map((rule) => rule.cssText)
							.join('')
					)
				);
			} else if (themeEncroachCss?.mode === 'after') {
				defaultStyleNodes.forEach((style) => STYLES.push(style.innerHTML));
				defaultStyleSheets.forEach((style) =>
					STYLES.push(
						Array.from(style.cssRules)
							.map((rule) => rule.cssText)
							.join('')
					)
				);
			}
		}

		STYLES.unshift(GLOBAL_A11Y_STYLE);

		// Caching custom CSSStyleSheet
		if (CSS_STYLE_CACHE.has(themeName) === false) {
			CSS_STYLE_CACHE.set(themeName, new Map());
		}
		CSS_STYLE_CACHE.get(themeName)?.set(elm.tagName, STYLES.join(''));
	}
	removeStyle(shadow);
	patchStyle(shadow, CSS_STYLE_CACHE.get(themeName)?.get(elm.tagName) as string);
	elm.style.display = styleDisplay;
};

const waitForHydrated = (elm: HTMLElement, themeDetails: ThemeDetails, styleDisplay: string) => {
	const T = setTimeout(() => {
		clearTimeout(T);
		if (elm.classList.contains('hydrated')) {
			setThemeStyleAfterHydrated(elm, themeDetails, styleDisplay);
		} else {
			waitForHydrated(elm, themeDetails, styleDisplay);
		}
	}, 25);
};

export const setThemeStyle = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	/**
	 * Das Element soll solange nicht sichtbar bleiben
	 * bis der Style im DOM gesetzt ist.
	 */
	const DISPLAY = `${elm.style.display}`;
	elm.style.display = 'none';
	waitForHydrated(elm, themeDetails, DISPLAY);
};
