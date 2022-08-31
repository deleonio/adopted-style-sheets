/**
 * We try to store our date in the global window object.
 *
 * - Browser: window
 * - Node: global
 * - WebWorker: self
 * - ServiceWorker: self
 * - Other: object
 */
export const GLOBAL: Record<string, unknown> = typeof window === 'object' ? window : typeof global === 'object' ? global : typeof self === 'object' ? self : {};
