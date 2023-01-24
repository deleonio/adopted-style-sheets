import { Generic, STORE, ThemeDetails } from '..';
// import CleanCSS from 'clean-css';

const CSS_PROPERTIES_REGISTERED: Set<string> = new Set();
const CSS_STYLE_CACHE: Map<string, Map<string, string[]>> = new Map();
const REGEX_CSS_PROPERTIES = /--[^;]+/g;
const REGEX_SPLIT_CSS_PROPERTY = /:/;
// const CSS_MINIFIER = new CleanCSS();

const extractProperties = (themeName: string, css: string) => {
	/**
	 * We should do that in the register method!
	 */
	let properties: RegExpMatchArray | string[] | null = css.match(REGEX_CSS_PROPERTIES);
	if (Array.isArray(properties)) {
		properties = properties.filter((property) => REGEX_SPLIT_CSS_PROPERTY.test(property));
		const style = document.createElement('style');
		style.innerHTML = `.${themeName} {${properties.join(';')}}`;
		document.querySelector('head')?.appendChild(style);
	}
	CSS_PROPERTIES_REGISTERED.add(themeName);
};

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

const removeStyle = (shadow: ShadowRoot) => {
	for (const childNode of Array.from(shadow.childNodes)) {
		if (childNode instanceof HTMLStyleElement && childNode.tagName === 'STYLE') {
			shadow.removeChild(childNode);
		} else {
			break;
		}
	}
};

const GLOBAL_A11Y_STYLE = `* {
  hyphens: auto;
  letter-spacing: inherit;
  word-break: break-word;
  word-spacing: inherit;
}`.replace(/\r?\n/g, '');

const patchStyle = (shadow: ShadowRoot, styles: string[]) => {
	try {
		const styleSheets: CSSStyleSheet[] = [];
		styles.forEach((style) => {
			const styleSheet: CSSStyleSheet = new CSSStyleSheet();
			styleSheet.replaceSync(style);
			styleSheets.push(styleSheet);
		});
		shadow.adoptedStyleSheets = styleSheets;
	} catch (e) {
		styles.reverse().forEach((style) => {
			const styleElement: HTMLStyleElement = document.createElement('style');
			styleElement.innerHTML = style;
			shadow.insertBefore(styleElement, shadow.firstChild);
		});
	}
};

const minifyCss = (styles: string[], cb: (styles: string[]) => void) => {
	cb(styles);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	// CSS_MINIFIER.minify(styles.join(''), (error, output) => {
	// 	console.log(output);
	// 	if (error) {
	// 		cb(styles);
	// 	} else {
	// 		cb([output.styles]);
	// 	}
	// });
};

const setThemeStyleAfterHydrated = (elm: HTMLElement, themeDetails: ThemeDetails, styleDisplay: string) => {
	const themeCache = themeDetails.cache;
	const themeEncroachCss = themeDetails.encroachCss;
	const themeName = themeDetails.name || 'default';
	const shadow: ShadowRoot & { adoptedStyleSheets?: CSSStyleSheet[] } = elm.shadowRoot as ShadowRoot;
	let STYLES: string[];
	if (CSS_STYLE_CACHE.get(themeName)?.has(elm.tagName)) {
		STYLES = CSS_STYLE_CACHE.get(themeName)?.get(elm.tagName) as string[];
		switchStyle(elm, shadow, STYLES, styleDisplay);
	} else {
		const GLOBAL_STYLE = getCssStyle(themeName, 'GLOBAL');
		const TAG_STYLE = getCssStyle(themeName, elm.tagName as Generic.Theming.Props<string, string>);

		if (CSS_PROPERTIES_REGISTERED.has(themeName) === false) {
			extractProperties(themeName, GLOBAL_STYLE);
		}

		STYLES = [GLOBAL_STYLE, TAG_STYLE];

		if (themeEncroachCss !== false) {
			const defaultStyleNodes: HTMLStyleElement[] = [
				...Array.from(shadow.childNodes).filter((node) => node instanceof HTMLStyleElement && node.tagName === 'STYLE'),
			] as HTMLStyleElement[];
			const defaultStyleSheets: CSSStyleSheet[] = [...Array.from(shadow.adoptedStyleSheets)];

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

		minifyCss(STYLES, (styles) => {
			if (themeDetails.loglevel === 'debug') {
				console.log(elm.tagName, styles);
			}

			if (themeCache === true) {
				if (CSS_STYLE_CACHE.has(themeName) === false) {
					CSS_STYLE_CACHE.set(themeName, new Map());
				}
				CSS_STYLE_CACHE.get(themeName)?.set(elm.tagName, styles);
			}

			switchStyle(elm, shadow, styles, styleDisplay);
		});
	}
};

const switchStyle = (elm: HTMLElement, shadow: ShadowRoot, styles: string[], styleDisplay: string) => {
	removeStyle(shadow);
	patchStyle(shadow, styles);
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
