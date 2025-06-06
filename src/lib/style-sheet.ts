import type { Generic, ThemeDetails } from '../';
import { STORE } from '../';
import type { ThemeEncroachCss } from '../theme';

const CSS_PROPERTIES_REGISTERED: Set<string> = new Set();
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
	if (themeMap instanceof Map && themeMap.has(tagName)) {
		return themeMap.get(tagName)!;
	} else {
		return '';
	}
};

const removeStyle = (shadow: HTMLElement | ShadowRoot) => {
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
		const styleSheets: CSSStyleSheet[] = [];
		styles.forEach((style) => {
			const styleSheet: CSSStyleSheet = new CSSStyleSheet();
			styleSheet.replaceSync(style);
			styleSheets.push(styleSheet);
		});
		(shadow as ShadowRoot).adoptedStyleSheets = styleSheets;
	} catch (e) {
		void e;
		[...styles].reverse().forEach((style, idx) => {
			if (typeof style !== 'string' || style.length === 0) {
				return;
			}
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
		});
	}
};

const encroachStyles = (shadow: HTMLElement | ShadowRoot, styles: string[], encroachCss?: ThemeEncroachCss | false) => {
	if (encroachCss !== false) {
		const defaultStyleNodes: HTMLStyleElement[] = [
			...Array.from(shadow.childNodes).filter((node) => node instanceof HTMLStyleElement && node.tagName === 'STYLE'),
		] as HTMLStyleElement[];

		let defaultStyleSheets: CSSStyleSheet[];
		try {
			defaultStyleSheets = [...Array.from((shadow as ShadowRoot).adoptedStyleSheets)];
		} catch (e) {
			void e;
			defaultStyleSheets = [];
		}

		if (encroachCss?.mode === 'before') {
			defaultStyleNodes.reverse().forEach((style) => styles.unshift(style.innerHTML));
			defaultStyleSheets.reverse().forEach((style) =>
				styles.unshift(
					Array.from(style.cssRules)
						.map((rule) => rule.cssText)
						.join(''),
				),
			);
		} else if (encroachCss?.mode === 'after') {
			defaultStyleNodes.forEach((style) => styles.push(style.innerHTML));
			defaultStyleSheets.forEach((style) =>
				styles.push(
					Array.from(style.cssRules)
						.map((rule) => rule.cssText)
						.join(''),
				),
			);
		}
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

	if (STORE.A11yUi.CSS_STYLE_CACHE.get(themeName)?.has(elm.tagName)) {
		switchStyle(elm, shadow, STORE.A11yUi.CSS_STYLE_CACHE.get(themeName)?.get(elm.tagName) as string[], resetCss);
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
			if (STORE.A11yUi.CSS_STYLE_CACHE.has(themeName) === false) {
				STORE.A11yUi.CSS_STYLE_CACHE.set(themeName, new Map());
			}
			STORE.A11yUi.CSS_STYLE_CACHE.get(themeName)?.set(elm.tagName, STYLES);
		}

		switchStyle(elm, shadow, STYLES, resetCss);
	}
};

const switchStyle = (elm: HTMLElement, shadow: HTMLElement | ShadowRoot, styles: string[], resetCss: () => void) => {
	const start = performance.now();

	removeStyle(shadow);
	patchStyle(shadow, styles);
	deleteDoneTask(elm);
	resetCss();

	if (STORE.A11yUi.PERFORMANCE_MEASURES.has(elm.tagName)) {
		const existingMeasure = STORE.A11yUi.PERFORMANCE_MEASURES.get(elm.tagName)!;
		existingMeasure.count += 1;
		existingMeasure.totalTime += performance.now() - start;
	} else {
		STORE.A11yUi.PERFORMANCE_MEASURES.set(elm.tagName, {
			count: 1,
			totalTime: performance.now() - start,
		});
	}
};

const runStyling = (elm: HTMLElement) => {
	const task = STORE.A11yUi.STYLING_TASK_QUEUE.get(elm);
	if (task) {
		const { resetCss, themeDetails } = task;
		setThemeStyleAfterHydrated(elm, themeDetails, resetCss);
		deleteDoneTask(elm);
	}
};

let waitForHydrated = (elm: HTMLElement) => {
	const T = setTimeout(() => {
		clearTimeout(T);
		if (elm.classList.contains('hydrated')) {
			runStyling(elm);
		} else {
			waitForHydrated(elm);
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
			for (const entry of entries) {
				const elm = entry.target as HTMLElement;
				if (elm.classList.contains('hydrated')) {
					runStyling(elm);
					observer.observe(elm, unobserveOptions);
				}
			}
		})
	: null;

if (mutationobserver) {
	waitForHydrated = (elm: HTMLElement) => mutationobserver.observe(elm, observeOptions);
	recalculateStylingDelay = () => void 0;
}

let getThemeReadyDelay = (elm: HTMLElement): number => {
	const raw = getComputedStyle(elm).getPropertyValue('--theme-visibility-delay').trim();
	if (raw.endsWith('ms')) {
		return parseFloat(raw);
	} else if (raw.endsWith('s')) {
		return parseFloat(raw) * 1000;
	} else {
		const fallback = parseFloat(raw);
		return isNaN(fallback) ? 0 : fallback;
	}
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
	STORE.A11yUi.STYLING_TASK_QUEUE.set(elm, {
		/**
		 * Das Element soll solange nicht sichtbar bleiben
		 * bis der Style im DOM gesetzt ist.
		 */
		resetCss: () => {
			const delay = getThemeReadyDelay(elm);
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
