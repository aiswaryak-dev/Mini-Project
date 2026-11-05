# Developer Documentation: `index.css`

## Overview
`index.css` is the global styling stylesheet. It imports Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`), sets font defaults, defines keyframe animations, and custom glassmorphic utility classes.

## Why It's Used
Establishes the design tokens, botanical background colors (`#FAFAF8`), keyframes for laser scanning animations, and glassmorphism styling across the web app.

## File Location
`src/index.css`

## Imports & Dependencies
- `@tailwind base;`
- `@tailwind components;`
- `@tailwind utilities;`

## Props
N/A.

## State & Hooks
N/A.

## Full Code Flow (Step-by-Step)
1. Establishes default base body styles: background `#FAFAF8`, text color `#063D24`, font family `Inter`.
2. Defines `@keyframes scan` for the vertical laser movement in the AI leaf disease scanner.
3. Defines `@keyframes fadeIn` for smooth entrance of modal dialogs.
4. Utility `.glass-panel` provides backdrop blur for floating headers.

```css
@keyframes scan {
  0% { top: 0%; }
  50% { top: 95%; }
  100% { top: 0%; }
}
```

## Backend Connection
N/A.

## Data Flow Diagram
N/A.

## Events & Handlers
N/A.

## Edge Cases & Error Handling
Includes cross-browser `-webkit-backdrop-filter` prefixes.

## Styling
Vanilla CSS + Tailwind CSS directive configuration.
