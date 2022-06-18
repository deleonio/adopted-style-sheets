import { Common } from '../common';
import { Locale } from './locale';

export declare namespace I18n {
	export { Locale };

	export type Props<Prefix extends string, Key extends string> = Lowercase<Common.PrefixedKey<Prefix, Key>>;
	export type Map<Prefix extends string, Key extends string> = {
		[K in Props<Prefix, Key>]?: string;
	};
	export type Patch<Name extends string, Prefix extends string, Key extends string> = (name: Name, map: Map<Prefix, Key>) => Name;
	export type RegisterPatch<Name extends string, Prefix extends string, Key extends string> = (patch: Patch<Name, Prefix, Key>) => Name;
	export type Register<Name extends string, Prefix extends string, Key extends string> = (
		name: Name,
		map: Map<Prefix, Key>
	) => RegisterPatch<Name, Prefix, Key>;
}

export const createTranslation: I18n.Register<string, string, string> = <Name extends string, Prefix extends string, Key extends string>(
	name: Name,
	map: I18n.Map<Prefix, Key>
): I18n.RegisterPatch<Name, Prefix, Key> => {
	return (patch): Name => patch(name, map);
};
