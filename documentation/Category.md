# Developer Documentation: `Category.jsx`

## Overview
`Category.jsx` renders the plant category selection view (Screenshot 2). It presents two large selection cards: "Garden Plants" and "Kitchen Garden".

## Why It's Used
Allows users to choose the target category of plants they wish to inspect or analyze before proceeding to plant identification.

## File Location
`src/pages/Category.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `useNavigate` from `react-router-dom`
- `ArrowRight, Check` from `lucide-react`

## Props
None.

## State & Hooks
- `selectedCategory` (`string`): Tracks currently selected category name.
- Uses `useNavigate()` for programmatic route transitions.

## Full Code Flow (Step-by-Step)
1. Renders title `"Select Plant Category 🌿"` and subtitle.
2. Renders 2 category cards:
   - **Garden Plants**: Potted plant vector in soft green circle, `Select →` button.
   - **Kitchen Garden**: Tomato/vegetable vector in soft green circle, `Select →` button.
3. Clicking `Select →` invokes `handleSelect(categoryName)`.
4. Updates local state and navigates to `/identification`.

```javascript
const handleSelect = (catName) => {
  setSelectedCategory(catName);
  setTimeout(() => navigate('/identification'), 400);
};
```

## Backend Connection
N/A.

## Data Flow Diagram
`Category Select Click` ➔ `handleSelect` ➔ `setSelectedCategory` ➔ `navigate('/identification')`

## Events & Handlers
- `handleSelect(categoryName)`: Selects category and navigates to identification view.

## Edge Cases & Error Handling
Includes slight transition delay for button press feedback.

## Styling
Cards (`bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center`).
