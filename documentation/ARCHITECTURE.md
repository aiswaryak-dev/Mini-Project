# Application Architecture Documentation

This document explains the high-level system architecture, client-side routing structure, service integration, and data flow across the **AI-Based Smart Plant Monitoring and Care System**.

---

## 🏗️ High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 Frontend Application                   │
│                                                                        │
│   ┌──────────────────┐  ┌─────────────────────┐  ┌─────────────────┐   │
│   │ BrowserRouter    │  │  AuthContext        │  │  PlantContext   │   │
│   │ (React Router 6) │  │  (Firebase Auth)    │  │  (Firestore DB) │   │
│   └────────┬─────────┘  └──────────┬──────────┘  └────────┬────────┘   │
│            │                       │                      │            │
│            ▼                       ▼                      ▼            │
│   ┌──────────────────┐  ┌─────────────────────┐  ┌─────────────────┐   │
│   │ View Pages       │  │ User State          │  │ Realtime Sync   │   │
│   │ (Dashboard, etc) │  │ (Login, Signout)    │  │ & IoT Engine    │   │
│   └──────────────────┘  └─────────────────────┘  └─────────────────┘   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼ (Firebase v10 Web SDK)
┌────────────────────────────────────────────────────────────────────────┐
│                     Firebase Cloud Services                            │
│                        (plant-care-system-d738d)                       │
│                                                                        │
│   ┌──────────────────────┐  ┌───────────────────┐  ┌───────────────┐   │
│   │ Firebase Auth        │  │ Cloud Firestore   │  │ Analytics     │   │
│   │ (Email/Pass, Google) │  │ Database          │  │ (Measurement) │   │
│   └──────────────────────┘  └───────────────────┘  └───────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚦 Client-Side Routing Structure (`App.jsx`)

The routing is powered by `react-router-dom` v6 with client-side navigation. All pages share a persistent sidebar and top navigation navbar.

| Route Path | View Component | Description |
| :--- | :--- | :--- |
| `/` | `Dashboard.jsx` | Main welcome dashboard with 2x2 feature cards |
| `/category` | `Category.jsx` | Garden Plants vs Kitchen Garden selector cards |
| `/identification` | `Identification.jsx` | Drag-and-drop plant image uploader & AI identifier |
| `/health-analysis` | `HealthAnalysis.jsx` | 3 sub-feature tabs (Disease, Nutrient, Pest) + guidelines |
| `/tracker` | `Tracker.jsx` | 5-step disease progress timeline & 0% recovery gauge |
| `/encyclopedia` | `Encyclopedia.jsx` | Botanical encyclopedia search & category filter |
| `/history` | `History.jsx` | Historical diagnostic analysis records list |
| `/profile` | `Profile.jsx` | User profile card, contact details & AI alert checkboxes |

---

## 🔄 End-to-End Data Flow Pattern

1. **User Action / Telemetry Pulse**:
   User interacts with UI (e.g. clicks "Dose Water") or the IoT Simulation Engine interval fires (every 4s).
2. **Context Dispatch**:
   The action calls a context function exposed by `usePlants()` (e.g. `waterPlant(plantId)`).
3. **Optimistic Local State Update**:
   `PlantContext` immediately mutates local React state (`setPlants(...)`), keeping the UI lightning-fast.
4. **Firestore Backend Push**:
   If connected to Firebase, `PlantContext` calls Firestore SDK methods (`updateDoc(doc(db, 'plants', id), ...)`).
5. **Real-time Listener (`onSnapshot`)**:
   Any Firestore changes trigger `onSnapshot` subscriptions across all active devices, synchronizing state in real time.
6. **Activity Log & Alerts**:
   Events automatically log to `activity_logs` collection and trigger UI notifications.
