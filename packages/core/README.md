```
  ,---.    ,--.  ,--.                   ,--. ,--. ,--.
 /  O  \  /   | /   | ,--. ,--. ,-----. |  | |  | |  |
|  .-.  | `|  | `|  |  \  '  /  '-----' |  | |  | |  |
|  | |  |  |  |  |  |   \   '           '  '-'  ' |  |
`--' `--'  `--'  `--' .-'  /             `-----'  `--'
    the accessible    `---'   web component library
```

![Dependencies](https://img.shields.io/librariesio/release/npm/@a11y-ui/core?style=for-the-badge)
![Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@a11y-ui/core?style=for-the-badge)
![Version](https://img.shields.io/npm/v/@a11y-ui/core?style=for-the-badge)
![Downloads](https://img.shields.io/npm/dt/@a11y-ui/core?style=for-the-badge)
![Size](https://img.shields.io/bundlephobia/min/@a11y-ui/core?style=for-the-badge)
![Lerna](https://img.shields.io/badge/managed%20with-lerna-blueviolet?style=for-the-badge)

# A11y-UI Core

## Components

```mermaid
flowchart LR
    Generic --> Element
    Generic --> I18n
    Generic --> Theming
    subgraph Common
      PrefixedKey
    end
    subgraph Element
      Watchers
      Props
      Members
      StateHooks
      StateHooksCallback
      NextStateHooksCallback
      Component --> StateHooks
      Component --> StateHooksCallback
      Component --> NextStateHooksCallback
      ComponentApi --> Component
      ComponentApi --> Members
      ComponentApi --> Watchers
    end
    subgraph I18n
      TranslationKey --> PrefixedKey
      TranslationMap --> TranslationKey
      PatchTranslation --> ISO_639_1
      PatchTranslation --> TranslationMap
      RegisterPatchTranslation --> PatchTranslation
      RegisterPatchTranslation --> ISO_639_1
      subgraph Locale
        ISO_639_1
        ISO_639_2
      end
    end
    subgraph Theming
      CssProps --> PrefixedKey
      ThemeCss --> CssProps
      PatchTheme --> ThemeCss
      RegisterPatchTheme --> PatchTheme
    end
```


## Pattern

```mermaid
flowchart LR
    Schema --> Core
    subgraph Component-Lib
      Themes --> Schema
      Components --> Schema
      Adapters --> Components
    end
```
