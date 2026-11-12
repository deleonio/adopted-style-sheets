import type { FeatureFlags, RegisterThemeOptions, ThemeDetails } from '../theme';
import { isTestEnvironment } from './helpers';

export type StylingTask = {
	resetCss: () => void;
	themeDetails: ThemeDetails;
};

export type Measure = {
	count: number;
	totalTime: number;
};

type Store = {
	A11yUi: {
		CSS_STYLE_CACHE: Map<string, Map<string, string[]>>;
		FEATURES: FeatureFlags;
		IS_TEST_ENVIRONMENT: boolean;
		PERFORMANCE_MEASURES: Map<string, Measure>;
		STYLING_TASK_QUEUE: Map<HTMLElement, StylingTask>;
		Theme?: RegisterThemeOptions;
		THEMES: Map<string, Map<string, string>>;
		THEME_FEATURES: Record<string, FeatureFlags>;
		showAverageTimes: () => Record<string, number[]>;
	};
};

/**
 * We try to store our date in the global window object.
 *
 * - Browser: window
 * - Node: global
 * - WebWorker: self
 * - ServiceWorker: self
 * - Other: object
 */
export const STORE: Store = {
	A11yUi: {
		CSS_STYLE_CACHE: new Map(),
		FEATURES: {},
		IS_TEST_ENVIRONMENT: isTestEnvironment(),
		PERFORMANCE_MEASURES: new Map(),
		STYLING_TASK_QUEUE: new Map(),
		THEMES: new Map(),
		THEME_FEATURES: {},
		showAverageTimes: () => {
			const averages: Record<string, number[]> = {};
			for (const [tagName, measure] of STORE.A11yUi.PERFORMANCE_MEASURES.entries()) {
				averages[tagName] = [measure.totalTime / measure.count, measure.count];
			}
			const sorted = Object.entries(averages).sort((a, b) => b[1][0] - a[1][0]);
			console.table(Object.fromEntries(sorted.map(([tag, [avg, count]]) => [tag, { 'avg (ms)': parseFloat(avg.toFixed(2)), count }])));
			return averages;
		},
	},
};
