# Developer Documentation: `PlantContext.jsx`

## Overview
`PlantContext.jsx` is the core database & state manager for plants, telemetry sensors, activity logs, smart automated irrigation, AI diagnostics logs, and Firestore real-time listeners.

## Why It's Used
Manages real-time Firestore database synchronization (`plants`, `activity_logs`), runs the IoT telemetry heartbeat simulation interval, triggers auto-watering pumps when moisture dips below safety thresholds, and maintains water reservoir levels.

## File Location
`src/context/PlantContext.jsx`

## Imports & Dependencies
- `createContext, useContext, useState, useEffect` from `react`
- `collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy` from `firebase/firestore`
- `db` from `../firebase/config`
- `useAuth` from `./AuthContext`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `children` | `ReactNode` | Wrapped application component tree |

## State & Hooks
- `plants` (`array`): List of active plant objects with live moisture, light, temp, humidity, pH, and status.
- `activityLogs` (`array`): Audit trail of watering, AI scan, and database sync events.
- `reservoirLevel` (`number`): Water tank level percentage (0 - 100%).
- `isPumpActive` (`boolean`): Hydro-pump active dosing state.
- `autoIrrigationEnabled` (`boolean`): Master automated dosing switch.
- `firebaseStatus` (`string`): Connection state ("connected", "connecting", "demo").
- `simulationActive` (`boolean`): Controls whether IoT moisture decay heartbeat runs.

## Full Code Flow (Step-by-Step)
1. Subscribes to Firestore `plants` collection via `onSnapshot`.
2. Runs `setInterval` every 4 seconds when `simulationActive` is true:
   - Depletes soil moisture by `0.2% - 0.8%`.
   - Checks if moisture dips below `plant.moistureMin`.
   - If `autoIrrigationEnabled` is true, auto-doses water back to 85%, decrements water reservoir by 4%, and logs event.
3. Exposes CRUD helper functions: `waterPlant`, `waterAllPlants`, `addPlant`, `updatePlant`, `deletePlant`, `refillReservoir`.

```javascript
useEffect(() => {
  if (!simulationActive) return;
  const interval = setInterval(() => {
    setPlants(prev => prev.map(plant => {
      const decay = Math.random() * 0.5 + 0.1;
      let newMoisture = Math.max(10, Math.round((plant.moisture - decay) * 10) / 10);
      if (autoIrrigationEnabled && plant.autoWater && newMoisture <= plant.moistureMin) {
        newMoisture = 95;
        setReservoirLevel(r => Math.max(0, r - 4));
        logActivity({ type: 'water', title: 'Auto-Irrigation Dosed Water', plantName: plant.name });
      }
      return { ...plant, moisture: newMoisture };
    }));
  }, 4000);
  return () => clearInterval(interval);
}, [simulationActive, autoIrrigationEnabled]);
```

## Backend Connection
Firestore DB collections: `plants`, `activity_logs`.

## Data Flow Diagram
`IoT Heartbeat / User Action` ➔ `PlantContext` ➔ `setPlants` ➔ `updateDoc (Firestore)` ➔ `onSnapshot` ➔ `UI Components`

## Events & Handlers
- `waterPlant(id, amount)`
- `waterAllPlants()`
- `addPlant(data)`
- `updatePlant(id, fields)`
- `deletePlant(id)`
- `refillReservoir()`
- `logActivity(item)`

## Edge Cases & Error Handling
Includes automatic fallback to local reactive state if Firestore network fails.

## Styling
N/A.
