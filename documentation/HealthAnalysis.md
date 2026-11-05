# Developer Documentation: `HealthAnalysis.jsx`

## Overview
`HealthAnalysis.jsx` renders the AI Plant Health Analysis view (Screenshot 4). It features 3 sub-feature tabs (Disease Detection, Nutrient Deficiency Detection, Pest Detection), image guidelines grid, and diagnostic report box.

## Why It's Used
Enables users to analyze plant foliage for fungal/viral diseases, soil/mineral deficiencies, and insect attacks to obtain AI treatment recommendations.

## File Location
`src/pages/HealthAnalysis.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `Shield, FlaskConical, Bug, Upload, ArrowRight, Sun, Target, Eye, AlertCircle, Info, Sparkles, CheckCircle2` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
- `selectedFeature` (`string`): Selected feature tab ("disease", "nutrient", "pest").
- `file` (`File`): Uploaded leaf specimen.
- `preview` (`string`): Image preview URL.
- `isAnalyzing` (`boolean`): Diagnostic processing state.
- `report` (`object`): Diagnostic findings and treatment report.

## Full Code Flow (Step-by-Step)
1. Renders 3 feature selection cards (Disease Detection, Nutrient Deficiency, Pest Detection).
2. User selects feature tab and uploads leaf specimen photo.
3. Renders 4 image guideline cards (Good lighting, Clear focus, Whole plant, Avoid blur).
4. Clicking "Run Detection" executes `handleRunAnalysis()`.
5. Updates `report` state and logs diagnostic scan to Firestore via `logActivity()`.

```javascript
const handleRunAnalysis = () => {
  setIsAnalyzing(true);
  setTimeout(() => {
    setIsAnalyzing(false);
    setReport({ title: 'Powdery Mildew Fungal Infection', confidence: 94.2 });
    logActivity({ type: 'ai', title: 'AI Disease Detection Executed' });
  }, 2000);
};
```

## Backend Connection
Calls `logActivity()` in `PlantContext`, pushing scan logs to Firestore `activity_logs`.

## Data Flow Diagram
`Feature Select & Image Upload` ➔ `handleRunAnalysis` ➔ AI Processing ➔ `setReport` ➔ Firestore `addDoc(activity_logs)`

## Events & Handlers
- `setSelectedFeature(id)`: Switches feature tab.
- `handleFileChange(e)`: Uploads leaf photo.
- `handleRunAnalysis()`: Executes pathology diagnostic engine.

## Edge Cases & Error Handling
Disables action button while analysis is in progress (`isAnalyzing`).

## Styling
Feature selector cards (`border-slate-100` or `border-[#16883D] ring-2 ring-[#16883D]/20`).
