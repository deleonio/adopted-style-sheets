import type { RegisterThemeOptions, ThemeDetails } from '../theme';

export type StylingTask = {
	styleVisibility: string | null;
	themeDetails: ThemeDetails;
};

type History = {
	timestamp: number;
	numberOfTasks: number;
};

type Store = {
	A11yUi: {
		CSS_STYLE_CACHE: Map<string, Map<string, string[]>>;
		HYDRATED_HISTORY: History[];
		STYLING_TASK_QUEUE: Map<HTMLElement, StylingTask>;
		Theme?: RegisterThemeOptions;
		Themes: Record<string, unknown>;
	};
};

const CSS_STYLE_CACHE: Map<string, Map<string, string[]>> = new Map();
const HYDRATED_HISTORY: History[] = [];
const STYLING_TASK_QUEUE: Map<HTMLElement, StylingTask> = new Map();

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
		CSS_STYLE_CACHE,
		HYDRATED_HISTORY,
		STYLING_TASK_QUEUE,
		Themes: {},
	},
};
