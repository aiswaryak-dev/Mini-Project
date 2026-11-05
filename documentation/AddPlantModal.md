# Developer Documentation: `AddPlantModal.jsx`

## Overview
`AddPlantModal.jsx` provides a modal dialog form for registering new plant nodes into the garden network and Firestore database.

## Why It's Used
Enables users to specify plant name, species, garden zone (Indoor, Outdoor, Balcony, Greenhouse), location, minimum moisture threshold, preset photo, auto-water toggle, and initial care notes.

## File Location
`src/components/AddPlantModal.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `X, Sprout, Image, Sliders, Sparkles, CheckCircle2` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `onClose` | `function` | Callback to close the modal dialog |

## State & Hooks
- `name` (`string`): Plant name.
- `species` (`string`): Botanical species.
- `category` (`string`): Zone selection ("Indoor", "Outdoor", etc.).
- `location` (`string`): Specific room/shelf location.
- `moistureMin` (`number`): Moisture safety trigger threshold.
- `image` (`string`): Selected photo URL.
- `autoWater` (`boolean`): Auto-dosing toggle.
- `notes` (`string`): Care notes.
- `isSubmitting` (`boolean`): Submitting spinner state.

## Full Code Flow (Step-by-Step)
1. Renders fixed overlay modal with preset plant image selector.
2. On form submit (`handleSubmit`), validates required fields (`name`, `species`).
3. Calls `addPlant(...)` from `PlantContext`.
4. Closes modal via `onClose()`.

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!name || !species) return;
  setIsSubmitting(true);
  await addPlant({ name, species, category, location, moistureMin, image, autoWater, notes });
  setIsSubmitting(false);
  onClose();
};
```

## Backend Connection
Calls `addPlant()` in `PlantContext`, which writes a new document to Firestore `plants` collection via `addDoc()`.

## Data Flow Diagram
`AddPlantModal Form` ➔ `handleSubmit` ➔ `addPlant()` ➔ Firestore `addDoc(db, 'plants')` ➔ `onSnapshot` ➔ `PlantCard`

## Events & Handlers
- `handleSubmit(e)`: Validates form and saves plant.
- `onClose()`: Dismisses modal.

## Edge Cases & Error Handling
Disables submit button while `isSubmitting` is true to prevent duplicate entries.

## Styling
Tailwind modal backdrop (`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm`).
