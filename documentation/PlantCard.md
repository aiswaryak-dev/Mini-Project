# Developer Documentation: `PlantCard.jsx`

## Overview
`PlantCard.jsx` renders an interactive plant item card displaying live soil moisture meter, temperature/light readouts, health status tags, auto-water indicator, and manual water button.

## Why It's Used
Visualizes individual plant sensor nodes on the Dashboard and Garden grid, enabling quick manual watering and modal drawer inspection.

## File Location
`src/components/PlantCard.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `Droplets, Thermometer, Sun, Zap, MoreVertical, AlertTriangle, CheckCircle2, HeartPulse, Trash2` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `plant` | `object` | Plant specimen data object |
| `onSelectPlant` | `function` | Callback to open `PlantModal` |

## State & Hooks
- `watering` (`boolean`): Loading state during manual pump dosing animation.

## Full Code Flow (Step-by-Step)
1. Receives `plant` prop containing moisture %, light, temp, status, and photo URL.
2. Calculates moisture bar width and color (green if optimal, amber/red if below threshold).
3. Clicking "Water" triggers `waterPlant(plant.id)` from `PlantContext`.
4. Clicking card triggers `onSelectPlant(plant)` to inspect telemetry graph.

```javascript
const handleWater = (e) => {
  e.stopPropagation();
  setWatering(true);
  waterPlant(plant.id);
  setTimeout(() => setWatering(false), 1500);
};
```

## Backend Connection
Calls `waterPlant()` and `deletePlant()` in `PlantContext`, which update Firestore `plants` documents.

## Data Flow Diagram
`Water Button Click` ➔ `handleWater` ➔ `waterPlant()` ➔ Firestore `updateDoc` ➔ Realtime UI update

## Events & Handlers
- `handleWater(e)`: Doses water to plant.
- `handleDelete(e)`: Deletes plant from garden.
- `onSelectPlant(plant)`: Opens details drawer.

## Edge Cases & Error Handling
Displays animated alert tag if moisture drops below minimum safety threshold.

## Styling
Rounded card (`bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:-translate-y-1`).
