import type { Generic, ThemeDetails } from '../';
import { STORE } from '../';
import type { ThemeEncroachCss } from '../theme';
import type { StylingTask } from './window';

const CSS_PROPERTIES_REGISTERED: Set<string> = new Set();
const REGEX_CSS_PROPERTIES = /--[^;]+/g;
const REGEX_SPLIT_CSS_PROPERTY = /:/;

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
	if (
		/**
		 * Search custom StyleSheet in Config
		 * TODO: Performance???
		 */
		typeof STORE.A11yUi === 'object' &&
		STORE.A11yUi !== null &&
		typeof STORE.A11yUi.Themes === 'object' &&
		STORE.A11yUi.Themes !== null &&
		typeof STORE.A11yUi.Themes[themeName] === 'object' &&
		STORE.A11yUi.Themes[themeName] !== null &&
		typeof (STORE.A11yUi.Themes[themeName] as Record<string, unknown>)[tagName] === 'string'
	) {
		return ((STORE.A11yUi.Themes[themeName] as Record<string, unknown>)[tagName] as string).replace(/\r?\n/g, '');
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

const setThemeStyleAfterHydrated = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	const themeName = themeDetails.name || 'default';

	let shadow: HTMLElement | ShadowRoot;
	try {
		if (elm.shadowRoot === null) {
			throw new Error('ShadowRoot is null');
		}
		shadow = elm.shadowRoot;
	} catch (e) {
		shadow = elm;
	}

	if (STORE.A11yUi.CSS_STYLE_CACHE.get(themeName)?.has(elm.tagName)) {
		switchStyle(shadow, STORE.A11yUi.CSS_STYLE_CACHE.get(themeName)?.get(elm.tagName) as string[]);
	} else {
		const PROPERTY_STYLE = getCssStyle(themeName, 'PROPERTIES');
		const GLOBAL_STYLE = getCssStyle(themeName, 'GLOBAL');
		const TAG_STYLE = getCssStyle(themeName, elm.tagName as Generic.Theming.Props<string, string>);

		if (CSS_PROPERTIES_REGISTERED.has(themeName) === false) {
			extractProperties(themeName, GLOBAL_STYLE);
		}

		const STYLES = [PROPERTY_STYLE, GLOBAL_STYLE, TAG_STYLE];

		encroachStyles(shadow, STYLES, themeDetails.encroachCss);

		if (themeDetails.loglevel === 'debug') {
			console.log(elm.tagName, STYLES);
		}

		if (themeDetails.cache === true) {
			if (STORE.A11yUi.CSS_STYLE_CACHE.has(themeName) === false) {
				STORE.A11yUi.CSS_STYLE_CACHE.set(themeName, new Map());
			}
			STORE.A11yUi.CSS_STYLE_CACHE.get(themeName)?.set(elm.tagName, STYLES);
		}

		switchStyle(shadow, STYLES);
	}
};

const switchStyle = (shadow: HTMLElement | ShadowRoot, styles: string[]) => {
	removeStyle(shadow);
	patchStyle(shadow, styles);
};

const logHydratedHistory = (themeDetails: ThemeDetails) => {
	if (themeDetails.loglevel === 'debug') {
		STORE.A11yUi.HYDRATED_HISTORY.push({
			timestamp: Date.now(),
			numberOfTasks: STORE.A11yUi.STYLING_TASK_QUEUE.size,
		});
	}
};

const pushToDoTask = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	STORE.A11yUi.STYLING_TASK_QUEUE.set(elm, {
		themeDetails,
	});
};
const loggedPushToDoTask = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	pushToDoTask(elm, themeDetails);
	logHydratedHistory(themeDetails);
};

const deleteDoneTask = (elm: HTMLElement) => {
	STORE.A11yUi.STYLING_TASK_QUEUE.delete(elm);
};
const loggedDeleteDoneTask = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	deleteDoneTask(elm);
	logHydratedHistory(themeDetails);
};

const waitForHydrated = (elm: HTMLElement) => {
	const T = setTimeout(() => {
		clearTimeout(T);
		if (STORE.A11yUi.STYLING_TASK_QUEUE.has(elm) && elm.classList.contains('hydrated')) {
			const { themeDetails } = STORE.A11yUi.STYLING_TASK_QUEUE.get(elm) as StylingTask;
			setThemeStyleAfterHydrated(elm, themeDetails);
			loggedDeleteDoneTask(elm, themeDetails);
		} else {
			waitForHydrated(elm);
		}
	}, 25);
};

const observerCallback = (mutationsList: MutationRecord[]) => {
	for (const mutation of mutationsList) {
		if (
			/**
			 * Save by observer config
			 */
			// mutation.type === 'attributes' &&
			// mutation.attributeName === 'class' &&
			/**
			 * Implizit check for HTMLElement
			 */
			// mutation.target &&
			STORE.A11yUi.STYLING_TASK_QUEUE.has(mutation.target as HTMLElement) &&
			(mutation.target as HTMLElement).classList.contains('hydrated')
		) {
			const { themeDetails } = STORE.A11yUi.STYLING_TASK_QUEUE.get(mutation.target as HTMLElement) as StylingTask;
			setThemeStyleAfterHydrated(mutation.target as HTMLElement, themeDetails);
			loggedDeleteDoneTask(mutation.target as HTMLElement, themeDetails);
		}
	}
};

const observerOptions = {
	attributes: true,
	attributeFilter: ['class'],
	childList: false,
	subtree: false,
};

/**
 * MutationObserver is not supported in IE11 and Test
 * - https://caniuse.com/#feat=mutationobserver
 * - https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 * - https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
 */
let observer: MutationObserver | null;
try {
	observer = new MutationObserver(observerCallback);
} catch (e) {
	observer = null;
}

export const setThemeStyle = (elm: HTMLElement, themeDetails: ThemeDetails) => {
	themeDetails = {
		...STORE.A11yUi.Theme,
		...themeDetails,
	};
	loggedPushToDoTask(elm, themeDetails);
	if (observer) {
		observer.observe(elm, observerOptions);
	} else {
		waitForHydrated(elm);
	}
};
