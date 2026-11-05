# Developer Documentation: `FirebaseStatusBadge.jsx`

## Overview
`FirebaseStatusBadge.jsx` displays a real-time status pill indicating whether the app is connected to Firebase Firestore project `plant-care-system-d738d` or running in local cache mode.

## Why It's Used
Provides visual feedback on database connectivity and cloud synchronization status.

## File Location
`src/components/FirebaseStatusBadge.jsx`

## Imports & Dependencies
- `React` from `react`
- `Database, ShieldCheck, Wifi, Cloud` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
Reads `firebaseStatus` from `usePlants()`.

## Full Code Flow (Step-by-Step)
1. Fetches `firebaseStatus` ("connected", "connecting", or "demo").
2. Renders glowing green pulse animation if `firebaseStatus === 'connected'`.
3. Displays label `plant-care-system-d738d` with mode badge ("Realtime DB" vs "Local Cache").

```javascript
<span className={`relative inline-flex rounded-full h-2 w-2 ${
  firebaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
}`}></span>
```

## Backend Connection
Monitors connection state of Firebase Firestore (`db`).

## Data Flow Diagram
`Firestore Listener` ➔ `PlantContext.firebaseStatus` ➔ `FirebaseStatusBadge`

## Events & Handlers
N/A.

## Edge Cases & Error Handling
Displays amber indicator if network is disconnected.

## Styling
Glassmorphism badge (`bg-emerald-950/40 border border-emerald-500/30 text-emerald-300`).
