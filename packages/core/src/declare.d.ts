import { Generic } from './';
import { ThemeDetails } from './theme';

export {};

declare global {
	interface Window {
		A11yUi: {
			Theme?: ThemeDetails;
			Themes?: Record<string, Generic.Theming.Map<string, string>>;
		} & Record<string, unknown>;
	}
}
