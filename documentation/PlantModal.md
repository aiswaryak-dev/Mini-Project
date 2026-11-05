# Developer Documentation: `PlantModal.jsx`

## Overview
`PlantModal.jsx` provides a detail drawer modal allowing complete inspection of a plant's historical telemetry graph, care guides, minimum moisture threshold calibration, and auto-dosing rules.

## Why It's Used
Enables users to calibrate smart irrigation rules per plant, view 24h soil moisture trends, update location/notes, and manually dose water.

## File Location
`src/components/PlantModal.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `X, Droplets, Thermometer, Sun, Wind, Activity, Save, Sliders, Calendar, Sparkles, CheckCircle` from `lucide-react`
- `usePlants` from `../context/PlantContext`
- `TelemetryChart` from `./TelemetryChart`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `plant` | `object` | Plant specimen object |
| `onClose` | `function` | Callback to close modal |

## State & Hooks
- `moistureMin` (`number`): Slider state for minimum moisture trigger.
- `autoWater` (`boolean`): Auto-irrigation toggle.
- `location` (`string`): Room/zone location.
- `notes` (`string`): Care observations.
- `isSaving` (`boolean`): Save action state.
- `savedSuccess` (`boolean`): Saved toast indicator state.

## Full Code Flow (Step-by-Step)
1. Mounts modal overlay displaying plant photo banner and quick sensor metrics.
2. Embeds `<TelemetryChart>` rendering live 24h moisture curve.
3. Form submission (`handleSave`) invokes `updatePlant(plant.id, updatedFields)` in `PlantContext`.
4. Saves settings to Firestore and displays success badge.

```javascript
const handleSave = async (e) => {
  e.preventDefault();
  setIsSaving(true);
  await updatePlant(plant.id, { moistureMin: Number(moistureMin), autoWater, location, notes });
  setIsSaving(false);
  setSavedSuccess(true);
};
```

## Backend Connection
Calls `updatePlant()` in `PlantContext`, updating Firestore document in `plants` collection.

## Data Flow Diagram
`Slider Change & Submit` ➔ `handleSave` ➔ `updatePlant()` ➔ Firestore `updateDoc` ➔ `PlantContext`

## Events & Handlers
- `handleSave(e)`: Saves updated rules.
- `handleWaterNow()`: Doses 40% moisture.
- `onClose()`: Closes modal.

## Edge Cases & Error Handling
Validates numerical ranges for sliders (15 - 60%).

## Styling
Elevated modal container (`bg-white rounded-3xl max-w-2xl shadow-elevated`).
