```
  ,---.    ,--.  ,--.                   ,--. ,--. ,--. 
 /  O  \  /   | /   | ,--. ,--. ,-----. |  | |  | |  | 
|  .-.  | `|  | `|  |  \  '  /  '-----' |  | |  | |  | 
|  | |  |  |  |  |  |   \   '           '  '-'  ' |  | 
`--' `--'  `--'  `--' .-'  /             `-----'  `--' 
    the accessible    `---'   web component library   
```

# A11y-UI

## Package-Pattern

```mermaid
flowchart LR
    Schema --> Core
    subgraph Component-Lib
      Themes --> Schema
      Components --> Schema
      Adapters --> Components
    end
```

