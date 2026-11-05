# Developer Documentation: `Garden.jsx`

## Overview
`Garden.jsx` renders the Interactive Plant Garden view. It features category filter pills (All, Indoor, Outdoor, Balcony, Greenhouse), search filtering by plant name/species, grid vs list view toggle, and plant card rendering.

## Why It's Used
Serves as the primary catalog manager allowing users to view, search, filter, water, and add plant specimens.

## File Location
`src/pages/Garden.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `Search, Filter, Plus, Grid, List, Sprout, Droplets` from `lucide-react`
- `usePlants` from `../context/PlantContext`
- `PlantCard` from `../components/PlantCard`
- `PlantModal` from `../components/PlantModal`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `onOpenAddPlant` | `function` | Callback to open `AddPlantModal` |

## State & Hooks
- `searchQuery` (`string`): Search string.
- `selectedCategory` (`string`): Selected zone category filter.
- `viewMode` (`string`): View layout mode ("grid" or "list").
- `selectedPlant` (`object`): Selected plant object for modal inspection.

## Full Code Flow (Step-by-Step)
1. Fetches `plants` array from `PlantContext`.
2. Filters `plants` based on `searchQuery` and `selectedCategory`.
3. Renders search input, category pill tabs, and view mode toggle buttons.
4. Maps `filteredPlants` array into `<PlantCard>` components.
5. If `selectedPlant` is non-null, mounts `<PlantModal>`.

```javascript
const filteredPlants = plants.filter(plant => {
  const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCategory = selectedCategory === 'All' || plant.category === selectedCategory;
  return matchesSearch && matchesCategory;
});
```

## Backend Connection
Reads real-time plant array synced from Firestore `plants` collection via `usePlants()`.

## Data Flow Diagram
`Search Input / Category Click` ➔ `setSearchQuery / setSelectedCategory` ➔ `filteredPlants` array ➔ Renders `<PlantCard>` Grid

## Events & Handlers
- `waterAllPlants()`: Doses water to all plants.
- `onOpenAddPlant()`: Opens add plant modal dialog.
- `setSelectedPlant(p)`: Opens plant details drawer modal.

## Edge Cases & Error Handling
Displays friendly empty state card with clear filters button if search query yields zero results.

## Styling
Dynamic grid/list container (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` or `space-y-4`).
