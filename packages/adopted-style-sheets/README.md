# Adopted Style Sheets

## Overview

This library implements functions to use the adopted style of web components for multiple themes. It makes it possible to reuse a web component with multiple style guides (themes).

## Features

- **Theme Management**: Easily switch between different themes for your web components.
- **Reusable Components**: Create web components that can adapt to various style guides without modification.
- **Dynamic Styling**: Apply styles dynamically based on user preferences or application state.

## Installation

To install the library, you can use npm or yarn:

```sh
npm install adopted-style-sheets
or
yarn add adopted-style-sheets
```

## Usage

Here is a basic example of how to use the library:

First create your custom themeable library:

```js
import { applyTheme, createTheme } from 'adopted-style-sheets';

export enum KeyEnum {
	'error',
	'warning',
	'info',
	'success',
	'message',
	'close',
	'new',
  ...
}

export enum TagEnum {
	'accordion',
	'alert',
	'avatar',
	'badge',
	'breadcrumb',
	'button',
  ...
}

const MyTheme = new Theme('my', KeyEnum, TagEnum);

const lightTheme = MyTheme.createTheme('my-light', {
  GLOBAL: `
    :host {
      --background-color: #fff,
      --text-color: #000,
    }`,
  "MY-ALERT": `
    my-alert {
      border-style: solid;
      border-width: 1px;
    }
    my-alert__error {
      border-color: red;
    }`,
});

const darkTheme = MyTheme.createTheme('my-dark', {
  GLOBAL: `
    :host {
      --background-color: #000,
      --text-color: #fff,
    }`
  "MY-ALERT": `
    my-alert {
      border-style: solid;
      border-width: 1px;
    }
    my-alert__error {
      border-color: red;
    }`,
});

class MyAlert extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: 'open' });
		shadow.innerHTML = `
      <style>
        /* Global styles */
        :host {
          background-color: var(--background-color);
          color: var(--text-color);
        }
      </style>
      <div class="my-alert my-alert__error">
        <p>Hello, World!</p>
      </div>
    `;
		setThemeStyle(this, getThemeDetails(this));
	}
}

function defineComponent() {
  customElements.define('my-alert', MyAlert);
}

await register(MyTheme, defineComponent);
```

## API

register,
setTheme,
setThemeStyle,
setThemeTag,

## Contributing

We welcome contributions! Please read our CONTRIBUTING.md for guidelines on how to contribute to this project.

## License

This project is licensed under the EUPL-v1.2-License. See the LICENSE file for details.

## Acknowledgements

Special thanks to all the contributors who have helped improve this project.
