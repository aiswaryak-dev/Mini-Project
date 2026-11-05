# Developer Documentation: `FirebaseConfig.js`

## Overview
`config.js` initializes the Firebase SDK using project credentials for `plant-care-system-d738d`. It exports initialized instances of `auth`, `googleProvider`, `db` (Firestore), and `analytics`.

## Why It's Used
Centralizes Firebase configuration and service instantiation in a single reusable module.

## File Location
`src/firebase/config.js`

## Imports & Dependencies
- `initializeApp` from `firebase/app`: Bootstraps Firebase application.
- `getAuth, GoogleAuthProvider` from `firebase/auth`: Authentication service.
- `getFirestore` from `firebase/firestore`: Database service.
- `getAnalytics, isSupported` from `firebase/analytics`: Telemetry analytics.

## Props
N/A.

## State & Hooks
N/A.

## Full Code Flow (Step-by-Step)
1. Defines `firebaseConfig` object with API keys and project IDs.
2. Calls `initializeApp(firebaseConfig)` to register the application instance.
3. Instantiates `getAuth(app)` and `getFirestore(app)`.
4. Safely checks browser environment and invokes `isSupported()` before initializing analytics.

```javascript
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
```

## Backend Connection
Directly connects to Firebase Backend Project `plant-care-system-d738d`.

## Data Flow Diagram
`config.js` ➔ `Firebase Cloud Services (plant-care-system-d738d)`

## Events & Handlers
Exports service handles to `AuthContext` and `PlantContext`.

## Edge Cases & Error Handling
Uses `isSupported()` check around analytics to prevent SSR or unsupported browser crashes.

## Styling
N/A.
