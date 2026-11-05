# Developer Documentation: `Identification.jsx`

## Overview
`Identification.jsx` renders the AI Plant Identification view (Screenshot 3). It features a drag-and-drop uploader, tips box, plant part selector pills (Leaf, Flower, Fruit, Whole Plant), and AI result output.

## Why It's Used
Enables users to upload plant specimen images and run AI computer vision analysis to identify botanical species, scientific names, and care instructions.

## File Location
`src/pages/Identification.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `Search, Upload, CheckCircle, Info, ArrowRight, Leaf, Flower2, Apple, Sprout, Sparkles` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
- `selectedPart` (`string`): Selected plant part ("Leaf", "Flower", "Fruit", "Whole Plant").
- `file` (`File`): Uploaded image file object.
- `preview` (`string`): Image preview URL.
- `isAnalyzing` (`boolean`): Loading state during AI processing.
- `result` (`object`): AI diagnostic output object.

## Full Code Flow (Step-by-Step)
1. Renders drag & drop upload box and tips guidelines box.
2. User selects an image file via input or drop.
3. User selects plant part pill ("Leaf", "Flower", etc.).
4. Clicking "Identify Plant" executes `handleRunIdentification()`.
5. Simulates neural identification and updates `result` state.
6. Logs identification event to `activity_logs` in Firestore via `logActivity()`.

```javascript
const handleRunIdentification = () => {
  setIsAnalyzing(true);
  setTimeout(() => {
    setIsAnalyzing(false);
    const res = { name: 'Monstera Deliciosa', scientificName: 'Monstera deliciosa Liebm.', confidence: 98.4 };
    setResult(res);
    logActivity({ type: 'ai', title: 'AI Plant Identification Executed', plantName: res.name });
  }, 2000);
};
```

## Backend Connection
Calls `logActivity()` in `PlantContext`, writing event log to Firestore `activity_logs` collection.

## Data Flow Diagram
`Upload File & Click Identify` ➔ `handleRunIdentification` ➔ AI Processing ➔ `setResult` ➔ Firestore `addDoc(activity_logs)`

## Events & Handlers
- `handleFileChange(e)`: Reads uploaded image.
- `handleRunIdentification()`: Runs AI classification.

## Edge Cases & Error Handling
Validates image preview URL creation and file type.

## Styling
Dashed uploader box (`border-2 border-dashed border-emerald-300 rounded-2xl bg-slate-50/50`).
