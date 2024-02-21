/**
 * We try to store our date in the global window object.
 *
 * - Browser: window
 * - Node: global
 * - WebWorker: self
 * - ServiceWorker: self
 * - Other: object
 */
export const STORE: Record<string, unknown> = {};
