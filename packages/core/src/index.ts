import type { Common } from './common';
import type { Element } from './element';
import type { I18n } from './i18n';
import type { Theming } from './theming';

export declare namespace Generic {
	export type { Common, Element, I18n, Theming };
}

export { createTranslation } from './i18n';
export { RobustStore, getTheme, getThemeDetails, patchTheme, patchThemeTag, register, setThemeStyle } from './lib';
export { ThemeDetails } from './theme';
export { createTheme } from './theming';
