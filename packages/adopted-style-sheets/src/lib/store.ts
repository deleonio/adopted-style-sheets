type RobustStoreSetItemOptions = {
	enumerable?: boolean;
	immutable?: boolean;
};

export class RobustStore {
	private static options: RobustStoreSetItemOptions = {
		enumerable: false,
		immutable: false,
	};
	private static instances: Map<string, RobustStore> = new Map();
	private readonly store: Record<string, unknown>;

	private constructor(object: Record<string, unknown>, identifier: string) {
		this.store = this.createStore(object, identifier);
	}

	public static getInstance(identifier: string, object: Record<string, unknown>): RobustStore {
		let instance = RobustStore.instances.get(identifier);
		if (instance === undefined) {
			instance = new RobustStore(object, identifier);
			RobustStore.instances.set(identifier, instance);
		}
		return instance;
	}

	private createStore(object: Record<string, unknown>, identifier: string): Record<string, unknown> {
		Object.defineProperty(object, identifier, {
			enumerable: false,
			value: {},
			writable: false,
		});
		return object[identifier] as Record<string, unknown>;
	}

	private recursiveSetItem(store: Record<string, unknown>, key: string, value: unknown, options: RobustStoreSetItemOptions = RobustStore.options): void {
		let storeValue: unknown = typeof value === 'object' && value !== null ? {} : value;
		Object.defineProperty(store, key, {
			enumerable: options.enumerable === true,
			get: () => storeValue,
			/**
			 * Die set Methode muss eigentlich ein this.recursiveSetItem aufrufen.
			 */
			set: options.immutable === true ? undefined : (value: unknown) => (storeValue = value),
		});
		if (typeof value === 'object' && value !== null) {
			for (const [k, v] of Object.entries(value)) {
				this.recursiveSetItem(store[key] as Record<string, unknown>, k, v, options);
			}
		}
	}

	public setItem(key: string, value: unknown, options: RobustStoreSetItemOptions = RobustStore.options): RobustStore {
		this.recursiveSetItem(this.store, key, value, options);
		return this;
	}

	public getItem(key: string | string[]): unknown {
		if (Array.isArray(key)) {
			return key.map((k) => this.getItem(k));
		}
		return this.store[key];
	}
}
