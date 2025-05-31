import type { Measure, StylingTask } from './lib/window';
import type { RegisterThemeOptions } from './theme';

declare global {
	interface Window {
		A11yUi: {
			CSS_STYLE_CACHE: Map<string, Map<string, string[]>>;
			STYLING_TASK_QUEUE: Map<HTMLElement, StylingTask>;
			Theme?: RegisterThemeOptions;
			THEMES: Map<string, Map<string, string>>;
			PERFORMANCE_MEASURES: Map<string, Measure>;
		} & Record<string, unknown>;
	}
}
