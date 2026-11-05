# Firebase Backend & Firestore Database Specification

This document details the backend configuration, Firebase Authentication flows, Cloud Firestore database schema collections, fields, data types, and service layer methods for **`plant-care-system-d738d`**.

---

## 🔑 Firebase Project Configuration (`src/firebase/config.js`)

- **Project ID**: `plant-care-system-d738d`
- **Auth Domain**: `plant-care-system-d738d.firebaseapp.com`
- **Storage Bucket**: `plant-care-system-d738d.firebasestorage.app`
- **Messaging Sender ID**: `1093921151274`
- **App ID**: `1:1093921151274:web:4f980e98cf197cc7c06653`
- **Measurement ID**: `G-4W5XB3HF30`

---

## 🗄️ Cloud Firestore Collections Schema

### 1. `plants` Collection
Stores registered plant specimen nodes, live telemetry readouts, and automated irrigation settings.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique document ID |
| `name` | `string` | Display name of the plant (e.g. "Monstera Deliciosa") |
| `species` | `string` | Botanical species name (e.g. "Swiss Cheese Plant") |
| `category` | `string` | Zone category ("Indoor", "Outdoor", "Balcony", "Greenhouse") |
| `location` | `string` | Physical location (e.g. "Living Room Corner") |
| `moisture` | `number` | Current soil moisture percentage (0 - 100%) |
| `moistureMin` | `number` | Minimum moisture safety threshold (15 - 60%) |
| `light` | `number` | Solar illuminance in lux (100 - 1200 lux) |
| `temp` | `number` | Ambient temperature in °C (15 - 35°C) |
| `humidity` | `number` | Relative humidity percentage (30 - 80%) |
| `pH` | `number` | Soil acidity/alkalinity level (5.5 - 7.5) |
| `status` | `string` | Health state ("Optimal", "Needs Water", "High Temp", "Alert") |
| `lastWatered` | `string (ISO)` | Timestamp when last irrigated |
| `autoWater` | `boolean` | Master switch for automated pump dosing |
| `image` | `string (URL)` | Photo URL of the plant |
| `notes` | `string` | Custom care instructions and observations |
| `userId` | `string` | Firebase Auth User UID owner |
| `createdAt` | `timestamp` | Firestore server timestamp |

---

### 2. `activity_logs` Collection
Audit trail for system events, automated dosing, manual watering, AI scans, and database syncs.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique log ID |
| `type` | `string` | Category ("water", "ai", "firebase", "alert") |
| `title` | `string` | Summary title of the event |
| `plantName` | `string` | Target plant name |
| `details` | `string` | Extended event details |
| `timestamp` | `timestamp` | Event creation timestamp |

---

## 🔐 Firebase Authentication Flow (`AuthContext.jsx`)

1. **Email & Password Authentication**:
   - `createUserWithEmailAndPassword(auth, email, password)`
   - `signInWithEmailAndPassword(auth, email, password)`
2. **Google OAuth Popup**:
   - `signInWithPopup(auth, googleProvider)`
3. **Anonymous / Demo Session Fallback**:
   - `signInAnonymously(auth)`
   - Seamless transition to `demoUser` profile if network or Auth rules restrict login.
4. **Session Persistence**:
   - `onAuthStateChanged(auth, callback)` automatically updates `currentUser` state across page reloads.

---

## 🛡️ Recommended Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plants/{plantId} {
      allow read, write: if true; // Public access for demo, restrict to request.auth != null in production
    }
    match /activity_logs/{logId} {
      allow read, write: if true;
    }
  }
}
```
