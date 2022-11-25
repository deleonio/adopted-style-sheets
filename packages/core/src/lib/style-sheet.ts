import { Generic } from '..';
import { ThemeDetails } from '../theme';
import { GLOBAL } from './window';

type CSSStyleSheetW3C = CSSStyleSheet & {
	replaceSync?: (css: string) => void;
};

const CSS_PROPERTIES_REGISTERED: Set<string> = new Set();
const CSS_STYLE_SHEETS: Map<string, Map<string, CSSStyleSheetW3C>> = new Map();
const HTML_STYLE_ELEMENTS: Map<string, Map<string, HTMLStyleElement>> = new Map();
const REGEX_CSS_PROPERTIES = /--[^;]+/g;
const REGEX_SPLT_CSS_PROPERTY = /:/;

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
			typeof GLOBAL.A11yUi === 'object' &&
			GLOBAL.A11yUi !== null &&
			typeof (GLOBAL.A11yUi as Record<string, unknown>).Themes === 'object' &&
			(GLOBAL.A11yUi as Record<string, unknown>).Themes !== null &&
			typeof ((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] === 'object' &&
			((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] !== null &&
			typeof (((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] === 'string'
		) {
			if ((tagName === 'GLOBAL' || tagName === 'PROPERTIES') && CSS_PROPERTIES_REGISTERED.has(themeName) === false) {
				const css = (((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] as string;
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
						(((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[tagName] as string
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
				style.innerHTML = (((GLOBAL.A11yUi as Record<string, unknown>).Themes as Record<string, unknown>)[themeName] as Record<string, unknown>)[
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
		if (childNode instanceof HTMLElement && childNode.tagName === 'STYLE') {
			shadow.removeChild(childNode);
		} else {
			break;
		}
	}
};

const GLOBAL_A11Y_STYLE = `* {
  font-size: inherit;
  hyphens: auto;
  letter-spacing: inherit;
  word-break: break-word;
  word-spacing: inherit;
}`;

const patchAdopted = (
	elm: HTMLElement,
	shadow: ShadowRoot & { adoptedStyleSheets?: CSSStyleSheet[] },
	adoptedStyleSheets: CSSStyleSheet[],
	display: string
) => {
	const timeout = setTimeout(() => {
		clearTimeout(timeout);
		if (elm.classList.contains('hydrated')) {
			removeStyle(shadow);

			const style: CSSStyleSheetW3C = new CSSStyleSheet();
			if (typeof style.replaceSync === 'function') {
				style.replaceSync(GLOBAL_A11Y_STYLE);
			}
			adoptedStyleSheets.unshift(style);

			shadow.adoptedStyleSheets = adoptedStyleSheets;
			elm.style.display = display;
		} else {
			patchAdopted(elm, shadow, adoptedStyleSheets, display);
		}
	}, 25);
};

const patchStyle = (elm: HTMLElement, shadow: ShadowRoot & { adoptedStyleSheets?: CSSStyleSheet[] }, styleNodes: HTMLStyleElement[], display: string) => {
	const timeout = setTimeout(() => {
		clearTimeout(timeout);
		if (elm.classList.contains('hydrated')) {
			removeStyle(shadow);

			const style: HTMLStyleElement = document.createElement('style');
			style.innerHTML = GLOBAL_A11Y_STYLE;
			styleNodes.unshift(style);

			const firstNode = shadow.firstChild;
			styleNodes.forEach((styleNode) => {
				if (firstNode instanceof HTMLElement) {
					shadow.insertBefore(styleNode, firstNode);
				} else {
					shadow.appendChild(styleNode);
				}
			});
			elm.style.display = display;
		} else {
			patchStyle(elm, shadow, styleNodes, display);
		}
	}, 25);
};

const addEncroachCssStyleSheet = (shadow: ShadowRoot, adoptedStyleSheets: CSSStyleSheet[]) => {
	shadow.adoptedStyleSheets?.forEach((adoptedStyle) => {
		adoptedStyleSheets.push(adoptedStyle);
	});
};

const addEncroachCssStyleElement = (shadow: ShadowRoot, styleNodes: HTMLStyleElement[]) => {
	for (const childNode of Array.from(shadow.childNodes)) {
		if (childNode instanceof HTMLStyleElement) {
			styleNodes.push(childNode);
		} else {
			break;
		}
	}
};

export const setThemeStyle = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	const themeCache = themeDetails.cache;
	const themeEncroachCss = themeDetails.encroachCss;
	const themeName: string = themeDetails.name || 'default';

	const globalStyle = getCssStyleSheet(themeCache, themeName, 'GLOBAL');
	const componentStyle = getCssStyleSheet(themeCache, themeName, elm.tagName as Generic.Theming.Props<string, string>);

	const shadow: ShadowRoot & { adoptedStyleSheets?: CSSStyleSheet[] } = elm.shadowRoot as ShadowRoot;
	if (componentStyle instanceof CSSStyleSheet && componentStyle.cssRules.length > 0) {
		const adoptedStyleSheets: CSSStyleSheet[] = [];
		if (themeEncroachCss !== false && themeEncroachCss?.mode === 'before') {
			addEncroachCssStyleSheet(shadow, adoptedStyleSheets);
		}
		if (globalStyle instanceof CSSStyleSheet && globalStyle.cssRules.length > 0 && adoptedStyleSheets.includes(globalStyle) === false) {
			adoptedStyleSheets.push(globalStyle);
		}
		if (componentStyle instanceof CSSStyleSheet && componentStyle.cssRules.length > 0 && adoptedStyleSheets.includes(componentStyle) === false) {
			adoptedStyleSheets.push(componentStyle);
		}
		if (themeEncroachCss !== false && themeEncroachCss?.mode === 'after') {
			addEncroachCssStyleSheet(shadow, adoptedStyleSheets);
		}
		const display = elm.style.display;
		elm.style.display = 'none';
		patchAdopted(elm, shadow, adoptedStyleSheets, display);
	} else if (componentStyle instanceof HTMLStyleElement && componentStyle.innerHTML.length > 0) {
		const styleNodes: HTMLStyleElement[] = [];
		if (themeEncroachCss !== false && themeEncroachCss?.mode === 'before') {
			addEncroachCssStyleElement(shadow, styleNodes);
		}
		if (globalStyle instanceof HTMLStyleElement && globalStyle.innerHTML.length > 0 && styleNodes.includes(globalStyle) === false) {
			styleNodes.push(globalStyle);
		}
		if (componentStyle instanceof HTMLStyleElement && componentStyle.innerHTML.length > 0 && styleNodes.includes(componentStyle) === false) {
			styleNodes.push(componentStyle);
		}
		if (themeEncroachCss !== false && themeEncroachCss?.mode === 'after') {
			addEncroachCssStyleElement(shadow, styleNodes);
		}
		/**
		 * Das Element soll solange nicht sichtbar bleiben
		 * bis der Style im DOM gesetzt ist.
		 */
		const display = elm.style.display;
		elm.style.display = 'none';
		patchStyle(elm, shadow, styleNodes, display);
	}
};

// const getThemeDetailsAsync = (elm: HTMLElement, retries = 0): Promise<A11yUiThemeDetails> => {
//   return new Promise((resolve, reject) => {
//     const themeDetails = getThemeDetails(elm);
//     if (themeDetails.name === 'default' && retries > 0) {
//       const timeout = setTimeout(() => {
//         clearTimeout(timeout);
//         console.log(elm, retries);
//         getThemeDetailsAsync(elm, retries--)
//           .then(resolve)
//           .catch(reject);
//       }, 25);
//     } else {
//       if (themeDetails.name === 'default') {
//         console.log(elm, 'could not found a theme');
//       }
//       resolve(themeDetails);
//     }
//   });
// };
