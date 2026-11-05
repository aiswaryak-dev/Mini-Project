# Developer Documentation: `Encyclopedia.jsx`

## Overview
`Encyclopedia.jsx` renders the Plant Encyclopedia view (Set 2 Screenshot 1). It features search inputs, category/type dropdown filters, a green outline `Filters` button, empty state with a green book icon, and bottom info banner.

## Why It's Used
Enables users to search botanical species, ideal light/moisture conditions, and common pest/disease treatment guides.

## File Location
`src/pages/Encyclopedia.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `BookOpen, Search, Filter, Info, Sprout` from `lucide-react`

## Props
None.

## State & Hooks
- `searchQuery` (`string`): Search query string.
- `selectedCategory` (`string`): Selected category filter ("All Categories", "Garden Plants", "Kitchen Garden").
- `selectedType` (`string`): Selected type filter ("All Types", "Indoor", "Edible").

## Full Code Flow (Step-by-Step)
1. Renders title `"Plant Encyclopedia 📖"` and description.
2. Renders top filters bar with Search input, Category select, Type select, and `Filters` reset button.
3. Filters `DEMO_PLANTS_DATA` array based on active search and dropdown values.
4. If search query is empty, displays empty state container with green book icon ("No plants found").
5. If search query matches plants, displays plant cards grid.

```javascript
const filtered = DEMO_PLANTS_DATA.filter(p => {
  const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCat = selectedCategory === 'All Categories' || p.category === selectedCategory;
  return matchesSearch && matchesCat;
});
```

## Backend Connection
N/A (Queries local botanical dictionary; expandable to Firestore `encyclopedia` collection).

## Data Flow Diagram
`Search Input / Filter Select` ➔ `setSearchQuery / setSelectedCategory` ➔ `filtered` array ➔ Re-render View

## Events & Handlers
- `setSearchQuery(query)`: Updates search text.
- `setSelectedCategory(cat)`: Filters by category.
- `setSelectedType(type)`: Filters by type.

## Edge Cases & Error Handling
Displays friendly empty state container when zero matching species are found.

## Styling
Filters card (`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm`).
