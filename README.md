# Adopted Style Sheets

[![npm](https://img.shields.io/npm/v/adopted-style-sheets)](https://www.npmjs.com/package/adopted-style-sheets)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://github.com/deleonio/adopted-style-sheets/blob/main/LICENSE)

Repository: [github.com/deleonio/adopted-style-sheets](https://github.com/deleonio/adopted-style-sheets) · Issues: [github.com/deleonio/adopted-style-sheets/issues](https://github.com/deleonio/adopted-style-sheets/issues)

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
```

```sh
yarn add adopted-style-sheets
```

## Usage

Here is a basic example of how to use the library: https://stackblitz.com/edit/vitejs-vite-podyif?file=src%2Fmain.ts,index.html

## API

The library exports the following functions:

| Function | Description |
| --- | --- |
| `register` | Registers themes, translations, loaders and options |
| `setTheme` / `patchTheme` | Sets or patches theme styles |
| `setThemeStyle` | Sets a style for a specific theme |
| `setThemeTag` / `patchThemeTag` | Sets or patches the theme tag |
| `getCssStyle` | Returns the current CSS style |
| `getTheme` / `getThemeDetails` | Returns theme information |
| `getDefaultThemeName` / `getDefaultThemeDetails` | Returns the default theme information |
| `getRegisteredThemes` | Returns all registered themes |
| `getRegisteredThemeByName` | Returns a theme by name |
| `getRegisteredThemeNames` | Returns all registered theme names |
| `getFeatureFlag` | Resolves a feature flag for the active theme |
| `getThemeFeatures` | Returns the feature flags pinned to a theme |
| `mergeFeatureFlags` | Combines multiple feature flag objects |

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

The application only registers a theme — it does not read flags. At `register()`
time each theme's pinned flags are stored per theme name; components resolve them
for **their** active theme. Components read the value internally with
`getFeatureFlag`, passing their host element so the flag is resolved from the
nearest `data-theme` ancestor (the fixed default theme is used when no element is
given). Resolution order, first defined wins: a global `register(..., { features })`
override → the active theme's pinned flag → `undefined`.

```ts
import { getFeatureFlag } from 'adopted-style-sheets';

// inside a web component — resolves the flag for the element's theme:
const mode = getFeatureFlag('myComponentFlag', this.host); // 'on' | 'off' | undefined
```

In `detect: 'auto'` mode several themes can be active on the same page, so two
elements under different themes can see different values. Read a theme's pinned
defaults directly by name with `getThemeFeatures`:

```ts
import { getThemeFeatures } from 'adopted-style-sheets';

const flags = getThemeFeatures('my-theme'); // { myComponentFlag: 'on' } | undefined
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

We welcome contributions! Please read our [CONTRIBUTING.md](https://github.com/deleonio/adopted-style-sheets/blob/main/CONTRIBUTING.md) for guidelines on how to contribute to this project.

Bug reports and feature requests are welcome via the [issue tracker](https://github.com/deleonio/adopted-style-sheets/issues).

## License

This project is licensed under the EUPL-v1.2-License. See the [LICENSE](https://github.com/deleonio/adopted-style-sheets/blob/main/LICENSE) file for details.

## Acknowledgements

Special thanks to all the contributors who have helped improve this project.
