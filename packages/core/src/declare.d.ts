import { Generic } from './';
import { A11yUiThemeDetails } from './theme';

export {};

declare global {
	interface Window {
		A11yUi: {
			Theme?: A11yUiThemeDetails;
			Themes?: Record<string, Generic.Theming.Map<string, string>>;
		} & Record<string, unknown>;
	}
}
