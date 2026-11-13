import assert from 'node:assert/strict';

import { setThemeStyle } from '../src/lib/style-sheet';
import { STORE } from '../src/lib/window';

describe('Test: SSR visibility', () => {
	beforeEach(() => {
		STORE.A11yUi.STYLING_TASK_QUEUE.clear();
		STORE.A11yUi.Theme = undefined;
	});

	const makeElement = (): HTMLElement => {
		const elm = document.createElement('my-component');
		elm.classList.add('hydrated');
		document.body.appendChild(elm);
		return elm;
	};

	describe('csr mode (default)', () => {
		it('hides the element while the style task is queued', () => {
			const elm = makeElement();
			setThemeStyle(elm, {
				cache: true,
				encroachCss: { mode: 'before' },
				loglevel: 'silent',
				mode: 'csr',
				name: 'test',
			});
			assert.equal(elm.style.visibility, 'hidden');
			elm.remove();
		});
	});

	describe('ssr mode', () => {
		it('does not hide the element while the style task is queued', () => {
			const elm = makeElement();
			setThemeStyle(elm, {
				cache: true,
				encroachCss: { mode: 'before' },
				loglevel: 'silent',
				mode: 'ssr',
				name: 'test',
			});
			// The component arrives pre-styled from the server – visibility stays untouched.
			assert.equal(elm.style.visibility, '');
			assert.ok(STORE.A11yUi.STYLING_TASK_QUEUE.has(elm), 'styling task is still queued');
			elm.remove();
		});

		it('keeps visibility untouched even when the element was visible before', () => {
			const elm = makeElement();
			elm.style.setProperty('visibility', 'visible');
			setThemeStyle(elm, {
				cache: true,
				encroachCss: { mode: 'before' },
				loglevel: 'silent',
				mode: 'ssr',
				name: 'test',
			});
			assert.equal(elm.style.visibility, 'visible');
			elm.remove();
		});

		it('restores visibility and marks the element themed after the task runs', () => {
			const elm = makeElement();
			setThemeStyle(elm, {
				cache: true,
				encroachCss: { mode: 'before' },
				loglevel: 'silent',
				mode: 'ssr',
				name: 'test',
			});
			const task = STORE.A11yUi.STYLING_TASK_QUEUE.get(elm);
			assert.ok(task, 'styling task queued');
			task.resetCss();
			assert.equal(elm.dataset.themed, '', 'element is marked as themed');
			assert.equal(elm.style.visibility, '', 'visibility untouched');
			elm.remove();
		});
	});
});
