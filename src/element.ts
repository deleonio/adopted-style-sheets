export declare namespace Element {
	export type Validators<R, O> = {
		readonly [Property in keyof R as `validate${Capitalize<string & Property>}`]: (newValue?: R[Property], oldValue?: R[Property]) => void;
	} & {
		readonly [Property in keyof O as `validate${Capitalize<string & Property>}`]: (newValue?: O[Property], oldValue?: O[Property]) => void;
	};
	export type Mapper<R, O> = {
		readonly [Property in keyof R as `map${Capitalize<string & Property>}`]?: (newValue?: R[Property]) => R[Property];
	} & {
		readonly [Property in keyof O as `map${Capitalize<string & Property>}`]?: (newValue?: O[Property]) => O[Property];
	};
	export type Watchers<R, O> = Validators<R, O> & Mapper<R, O>;
	export type Props<P> = {
		[Property in keyof P as `_${string & Property}`]?: P[Property];
	};
	export type Members<R, O> = {
		[Property in keyof R as `_${string & Property}`]: R[Property];
	} & {
		[Property in keyof O as `_${string & Property}`]?: O[Property];
	};
	export type StateHooks = 'afterPatch' | 'beforePatch';
	export type StateHooksCallback = (value: unknown, state: Record<string, unknown>, component: Component, key: string) => void;
	export type NextStateHooksCallback = (nextValue: unknown, nextState: Map<string, unknown>, component: Component, key: string) => void;
	export interface Component {
		componentWillLoad?: () => void;
		hydrated?: boolean;
		nextHooks?: Map<string, Map<StateHooks, StateHooksCallback | NextStateHooksCallback>>;
		nextState?: Map<string, unknown>;
		state: Record<string, unknown>;
		timeout?: number;
	}
	export type ComponentApi<RequiredProps, OptionalProps, RequiredState, OptionalState> = Component &
		Members<RequiredProps, OptionalProps> &
		Watchers<RequiredProps, OptionalProps> & {
			readonly state: Members<RequiredState, OptionalState>;
		};
	export type Stringified<T> = T | string;
}
