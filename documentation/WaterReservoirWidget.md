# Developer Documentation: `WaterReservoirWidget.jsx`

## Overview
`WaterReservoirWidget.jsx` renders a widget displaying irrigation water tank capacity, pump activity status, auto-irrigation master switch, and tank refill button.

## Why It's Used
Monitors irrigation system water reserves (5.0 Liters capacity) and enables manual hydro-pump refilling.

## File Location
`src/components/WaterReservoirWidget.jsx`

## Imports & Dependencies
- `React` from `react`
- `Droplets, RefreshCw, Zap, SlidersHorizontal, CheckCircle2` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
Reads `reservoirLevel`, `isPumpActive`, `autoIrrigationEnabled`, `setAutoIrrigationEnabled`, and `refillReservoir` from `usePlants()`.

## Full Code Flow (Step-by-Step)
1. Fetches water tank level (`reservoirLevel`) and pump state (`isPumpActive`).
2. Renders animated progress bar showing liquid capacity (e.g. `78%`).
3. If `reservoirLevel < 25%`, displays animated "REFILL NEEDED" warning badge.
4. Clicking "Refill Tank" invokes `refillReservoir()`.

```javascript
<button
  onClick={refillReservoir}
  disabled={reservoirLevel >= 100}
  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white"
>
  <RefreshCw className="w-3.5 h-3.5" />
  <span>Refill Tank</span>
</button>
```

## Backend Connection
Triggers `refillReservoir()` in `PlantContext`, logging event to `activity_logs`.

## Data Flow Diagram
`Refill Click` ➔ `refillReservoir()` ➔ `PlantContext.setReservoirLevel(100)` ➔ Logged to Firestore

## Events & Handlers
- `refillReservoir()`: Resets tank level to 100%.
- `setAutoIrrigationEnabled()`: Toggles auto-dosing rules.

## Edge Cases & Error Handling
Disables refill button when tank is already at 100%.

## Styling
Gradient widget container (`bg-gradient-to-br from-emerald-900 to-slate-950 text-white`).
