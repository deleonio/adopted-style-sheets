import type { Generic, ThemeDetails } from '../';
import { STORE } from '../';
import type { ThemeEncroachCss } from '../theme';

const CSS_PROPERTIES_REGISTERED: Set<string> = new Set();
const CSS_SHEET_CACHE: Map<string, CSSStyleSheet> = new Map();
const REGEX_CSS_PROPERTIES = /--[^;]+/g;
const REGEX_SPLIT_CSS_PROPERTY = /:/;

const SUPPORTS_MUTATION_OBSERVER = typeof MutationObserver !== 'undefined';

let CURRENT_STYLING_DELAY = 25;

let recalculateStylingDelay = () => {
	CURRENT_STYLING_DELAY = Math.min(25 + Math.log2(STORE.A11yUi.STYLING_TASK_QUEUE.size + 1) * 20, 250);
};

const extractProperties = (themeName: string, css: string) => {
	/**
	 * We could do that in the register method!
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

export const getCssStyle = (themeName: string, tagName: Generic.Theming.Props<string, string>): string => {
	const themeMap = STORE.A11yUi.THEMES.get(themeName);
	if (themeMap instanceof Map) {
		const style = themeMap.get(tagName);
		if (style !== undefined) {
			return style;
		}
	}
	return '';
};

const removeStyle = (shadow: HTMLElement | ShadowRoot) => {
	const firstChild = shadow.firstChild;
	if (!(firstChild instanceof HTMLStyleElement) || firstChild.dataset.themingFallback !== undefined) {
		return;
	}
	for (const childNode of Array.from(shadow.childNodes)) {
		if (childNode instanceof HTMLStyleElement && childNode.tagName === 'STYLE' && childNode.dataset.themingFallback === undefined) {
			shadow.removeChild(childNode);
		} else {
			break;
		}
	}
};

const patchStyle = (shadow: HTMLElement | ShadowRoot, styles: string[]) => {
	try {
		if (STORE.A11yUi.Theme?.mode === 'ssr') {
			throw new Error('SSR');
		}
		const styleSheets: CSSStyleSheet[] = styles
			.filter((style) => typeof style === 'string' && style.length > 0)
			.map((style) => {
				let sheet = CSS_SHEET_CACHE.get(style);
				if (!sheet) {
					sheet = new CSSStyleSheet();
					sheet.replaceSync(style);
					CSS_SHEET_CACHE.set(style, sheet);
				}
				return sheet;
			});
		(shadow as ShadowRoot).adoptedStyleSheets = styleSheets;
	} catch (e) {
		void e;
		for (let i = styles.length - 1; i >= 0; i--) {
			const style = styles[i];
			if (typeof style !== 'string' || style.length === 0) {
				continue;
			}
			const idx = styles.length - 1 - i;
			const styleElement: HTMLStyleElement = document.createElement('style');
			styleElement.dataset.themingFallback = '';
			switch (idx) {
				case 4:
					styleElement.dataset.themingBaseA11y = '';
					break;
				case 3:
					styleElement.dataset.themingBaseGlobal = '';
					break;
				case 2:
					styleElement.dataset.themingBaseComponent = '';
					break;
				case 1:
					styleElement.dataset.themingCustomGlobal = '';
					break;
				case 0:
					styleElement.dataset.themingCustomComponent = '';
					break;
				default:
					styleElement.dataset.themingUnknown = '';
					break;
			}
			styleElement.innerHTML = style;
			shadow.insertBefore(styleElement, shadow.firstChild);
		}
	}
};

const encroachStyles = (shadow: HTMLElement | ShadowRoot, styles: string[], encroachCss?: ThemeEncroachCss | false) => {
	if (encroachCss === false || (encroachCss?.mode !== 'before' && encroachCss?.mode !== 'after')) {
		return;
	}

	const defaultStyleNodes = Array.from(shadow.childNodes).filter(
		(node): node is HTMLStyleElement => node instanceof HTMLStyleElement && node.tagName === 'STYLE',
	);

	let defaultStyleSheets: CSSStyleSheet[];
	try {
		defaultStyleSheets = Array.from((shadow as ShadowRoot).adoptedStyleSheets);
	} catch (e) {
		void e;
		defaultStyleSheets = [];
	}

	if (defaultStyleNodes.length === 0 && defaultStyleSheets.length === 0) {
		return;
	}

	if (encroachCss.mode === 'before') {
		// Collect all prepend strings then splice once to avoid O(n²) unshift-in-loop
		const prepend: string[] = [
			...defaultStyleSheets.map((style) =>
				Array.from(style.cssRules)
					.map((rule) => rule.cssText)
					.join(''),
			),
			...defaultStyleNodes.map((style) => style.innerHTML),
		];
		styles.unshift(...prepend);
	} else {
		defaultStyleNodes.forEach((style) => styles.push(style.innerHTML));
		defaultStyleSheets.forEach((style) =>
			styles.push(
				Array.from(style.cssRules)
					.map((rule) => rule.cssText)
					.join(''),
			),
		);
	}
};

const setThemeStyleAfterHydrated = (elm: HTMLElement, themeDetails: ThemeDetails, resetCss: () => void) => {
	const themeName = themeDetails.name || 'default';

	let shadow: HTMLElement | ShadowRoot;
	try {
		if (elm.shadowRoot === null) {
			throw new Error('ShadowRoot is null');
		}
		shadow = elm.shadowRoot;
	} catch (e) {
		void e;
		shadow = elm;
	}

	const themeCache = STORE.A11yUi.CSS_STYLE_CACHE.get(themeName);
	const cachedStyles = themeCache?.get(elm.tagName);

	if (cachedStyles) {
		switchStyle(elm, shadow, cachedStyles, resetCss);
	} else {
		const PROPERTY_STYLE = getCssStyle(themeName, 'PROPERTIES');
		const GLOBAL_STYLE = getCssStyle(themeName, 'GLOBAL');
		const TAG_STYLE = getCssStyle(themeName, elm.tagName as Generic.Theming.Props<string, string>);

		if (CSS_PROPERTIES_REGISTERED.has(themeName) === false) {
			extractProperties(themeName, GLOBAL_STYLE);
		}

		const STYLES = [PROPERTY_STYLE, GLOBAL_STYLE, TAG_STYLE];

		encroachStyles(shadow, STYLES, themeDetails.encroachCss);

		if (themeDetails.cache === true) {
			let styleCache = STORE.A11yUi.CSS_STYLE_CACHE.get(themeName);
			if (!styleCache) {
				styleCache = new Map();
				STORE.A11yUi.CSS_STYLE_CACHE.set(themeName, styleCache);
			}
			styleCache.set(elm.tagName, STYLES);
		}

		switchStyle(elm, shadow, STYLES, resetCss);
	}
};

const switchStyle = (elm: HTMLElement, shadow: HTMLElement | ShadowRoot, styles: string[], resetCss: () => void) => {
	const shouldTrack = STORE.A11yUi.Theme?.loglevel === 'debug';
	const start = shouldTrack ? performance.now() : 0;

	removeStyle(shadow);
	patchStyle(shadow, styles);
	deleteDoneTask(elm);
	requestAnimationFrame(resetCss);

	if (shouldTrack) {
		const elapsed = performance.now() - start;
		const existingMeasure = STORE.A11yUi.PERFORMANCE_MEASURES.get(elm.tagName);
		if (existingMeasure) {
			existingMeasure.count += 1;
			existingMeasure.totalTime += elapsed;
		} else {
			STORE.A11yUi.PERFORMANCE_MEASURES.set(elm.tagName, {
				count: 1,
				totalTime: elapsed,
			});
		}
	}
};

const runStyling = (elm: HTMLElement) => {
	const task = STORE.A11yUi.STYLING_TASK_QUEUE.get(elm);
	if (task) {
		const { resetCss, themeDetails } = task;
		setThemeStyleAfterHydrated(elm, themeDetails, resetCss);
	}
};

const MAX_HYDRATION_RETRIES = 100;

let waitForHydrated = (elm: HTMLElement, retries = 0) => {
	if (retries >= MAX_HYDRATION_RETRIES) return;
	const T = setTimeout(() => {
		clearTimeout(T);
		if (elm.classList.contains('hydrated')) {
			runStyling(elm);
		} else {
			waitForHydrated(elm, retries + 1);
		}
	}, CURRENT_STYLING_DELAY);
};

/**
 * MutationObserver is not supported in IE11 and Test
 * - https://caniuse.com/#feat=mutationobserver
 * - https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 * - https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
 */

const observeOptions: MutationObserverInit = {
	attributes: true,
	attributeFilter: ['class'],
	childList: false,
	subtree: false,
};
const unobserveOptions: MutationObserverInit = {
	attributes: true,
	attributeFilter: [],
	childList: false,
	subtree: false,
};

const mutationobserver = SUPPORTS_MUTATION_OBSERVER
	? new MutationObserver((entries, observer) => {
			const styledElements: HTMLElement[] = [];
			for (const entry of entries) {
				const elm = entry.target as HTMLElement;
				if (elm.classList.contains('hydrated') && STORE.A11yUi.STYLING_TASK_QUEUE.has(elm)) {
					runStyling(elm);
					styledElements.push(elm);
				}
			}
			for (const elm of styledElements) {
				observer.observe(elm, unobserveOptions);
			}
		})
	: null;

if (mutationobserver) {
	waitForHydrated = (elm: HTMLElement) => mutationobserver.observe(elm, observeOptions);
	recalculateStylingDelay = () => void 0;
}

const THEME_DELAY_CACHE: Map<string, number> = new Map();

let getThemeReadyDelay = (elm: HTMLElement, themeName?: string): number => {
	if (themeName) {
		const cached = THEME_DELAY_CACHE.get(themeName);
		if (cached !== undefined) return cached;
	}
	const raw = getComputedStyle(elm).getPropertyValue('--theme-visibility-delay').trim();
	let delay: number;
	if (raw.endsWith('ms')) {
		delay = parseFloat(raw);
	} else if (raw.endsWith('s')) {
		delay = parseFloat(raw) * 1000;
	} else {
		const fallback = parseFloat(raw);
		delay = isNaN(fallback) ? 0 : fallback;
	}
	if (themeName) {
		THEME_DELAY_CACHE.set(themeName, delay);
	}
	return delay;
};

if (STORE.A11yUi.IS_TEST_ENVIRONMENT) {
	// Test-Runner detected, disabling theme visibility delay.
	getThemeReadyDelay = () => 0;
}

const setVisibility = (elm: HTMLElement, storeCssProperty: string | null) => {
	elm.style.setProperty('visibility', storeCssProperty);
	elm.dataset.themed = '';
};

const pushToDoTask = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	const storeCssProperty = elm.style.visibility || null;
	const themeName = themeDetails.name || 'default';
	STORE.A11yUi.STYLING_TASK_QUEUE.set(elm, {
		/**
		 * Das Element soll solange nicht sichtbar bleiben
		 * bis der Style im DOM gesetzt ist.
		 */
		resetCss: () => {
			const delay = getThemeReadyDelay(elm, themeName);
			if (delay > 0) {
				setTimeout(() => {
					setVisibility(elm, storeCssProperty);
				}, delay);
			} else {
				setVisibility(elm, storeCssProperty);
			}
		},
		themeDetails,
	});
	elm.style.setProperty('visibility', 'hidden', 'important');

	waitForHydrated(elm);
};

const deleteDoneTask = (elm: HTMLElement) => {
	STORE.A11yUi.STYLING_TASK_QUEUE.delete(elm);
	recalculateStylingDelay();
};

export const setThemeStyle = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	pushToDoTask(elm, {
		...STORE.A11yUi.Theme,
		...themeDetails,
	});
};
