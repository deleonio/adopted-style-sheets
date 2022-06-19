import { Common } from './common';
import { Element } from './element';
import { I18n } from './i18n';
import { Theming } from './theming';

export declare namespace Generic {
	export { Common, Element, I18n, Theming };
}

export { createTranslation } from './i18n';
export { getTheme, register } from './lib/register';
export { createTheme } from './theming';

