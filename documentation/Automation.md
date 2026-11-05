# Developer Documentation: `Automation.jsx`

## Overview
`Automation.jsx` renders the Smart Irrigation Rules & Telemetry Calibration view. It features master auto-dosing toggles, IoT simulation decay controls, pump dosing volume selectors, and plant moisture trigger sliders.

## Why It's Used
Enables users to calibrate minimum soil moisture safety thresholds for each plant specimen and configure automated hydro-pump dosing behavior.

## File Location
`src/pages/Automation.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `Sliders, Zap, Droplets, Thermometer, ShieldCheck, RefreshCw, Save, CheckCircle2` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
- `doseVolume` (`string`): Selected dosing volume per cycle ("100ml", "200ml", "350ml").
- `savedSuccess` (`boolean`): Saved toast indicator state.
- Reads `plants`, `autoIrrigationEnabled`, `setAutoIrrigationEnabled`, `simulationActive`, `setSimulationActive`, `updatePlant` from `usePlants()`.

## Full Code Flow (Step-by-Step)
1. Renders Master Control switches (Auto-Dosing Engine ON/OFF, IoT Telemetry Pulse ON/OFF).
2. Renders Default Dosing Volume selector dropdown.
3. Renders Plant Sensor Threshold Calibrations list with interactive moisture sliders (15 - 60%).
4. Moving slider invokes `updatePlant(plantId, { moistureMin: val })` in `PlantContext`.

```javascript
const handleUpdateMin = (plantId, val) => {
  updatePlant(plantId, { moistureMin: Number(val) });
};
```

## Backend Connection
Calls `updatePlant()` in `PlantContext`, updating Firestore document in `plants` collection.

## Data Flow Diagram
`Slider Move` ➔ `handleUpdateMin` ➔ `updatePlant()` ➔ Firestore `updateDoc` ➔ `PlantContext`

## Events & Handlers
- `setAutoIrrigationEnabled(bool)`: Toggles automated pump dosing.
- `setSimulationActive(bool)`: Toggles IoT telemetry simulation engine.
- `handleUpdateMin(id, val)`: Calibrates plant moisture safety trigger.

## Edge Cases & Error Handling
Clamps moisture threshold range between 15% and 60%.

## Styling
Master control cards (`bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft`).
