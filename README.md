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

Here is a basic example of how to use the library: https://stackblitz.com/edit/vitejs-vite-podyif?file=src%2Fmain.ts,index.html

## API

register,
setTheme,
setThemeStyle,
setThemeTag,
mergeFeatureFlags,
getFeatureFlag,

### Feature Flags

Applications can opt in/out of optional component behaviors at registration time.

A theme can pin its own default flags directly via `createTheme(name, map, features)`.
They are applied automatically when the theme is registered:

```ts
import { createTheme } from 'adopted-style-sheets';

export const THEME = createTheme('my-theme', THEME_MAP, { myComponentFlag: 'on' });
```

App-level flags passed to `register()` still win on key collisions, so a theme's
flags act as defaults that the app can override:

```ts
import { register, mergeFeatureFlags } from 'adopted-style-sheets';
import { THEME, FEATURE_FLAGS } from 'my-theme';

register(THEME, loaders, {
	// overrides any flag the theme pinned via createTheme
	features: mergeFeatureFlags(FEATURE_FLAGS, { myComponentFlag: 'off' }),
});
```

Read a flag anywhere after registration with `getFeatureFlag`:

```ts
import { getFeatureFlag } from 'adopted-style-sheets';

const mode = getFeatureFlag('myComponentFlag'); // 'on' | 'off' | undefined
```

Component libraries get fully typed flags by extending the registry via declaration merging:

```ts
declare module 'adopted-style-sheets' {
	interface FeatureFlagRegistry {
		myComponentFlag: 'on' | 'off';
	}
}
```

## Contributing

We welcome contributions! Please read our CONTRIBUTING.md for guidelines on how to contribute to this project.

## License

This project is licensed under the EUPL-v1.2-License. See the LICENSE file for details.

## Acknowledgements

Special thanks to all the contributors who have helped improve this project.
