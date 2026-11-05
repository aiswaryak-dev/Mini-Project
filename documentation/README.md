# AI-Based Smart Plant Monitoring & Care System - Developer Documentation

Welcome to the comprehensive developer documentation for the **AI-Based Smart Plant Monitoring and Care System** (FloraPulse AI v2.0).

---

## 📌 Project Overview

The **AI-Based Smart Plant Monitoring & Care System** is a modern React web application built with Vite, Tailwind CSS, and Firebase v10 SDK. The platform serves as an intelligent botanical management hub that integrates real-time IoT soil sensor telemetry, automated hydro-pump irrigation controls, computer vision AI plant disease diagnostics, botanical encyclopedia search, and disease progress tracking.

### Key Objectives:
- **Real-Time IoT Telemetry**: Continuous simulation and monitoring of soil moisture, ambient temperature, humidity, pH, and solar illuminance (lux).
- **Automated Hydro-Pump Irrigation**: Smart rule-based pump triggers based on minimum moisture safety thresholds with manual override options.
- **AI Computer Vision & LLM Assistant**: Specimen leaf disease diagnostic scanner, pathology analysis reports, and SproutAI botanical chatbot assistant.
- **Firebase Synchronization**: Cloud sync with project `plant-care-system-d738d` across Firestore collections and Firebase Authentication.

---

## 🛠️ Technology Stack

| Layer | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 | Declarative component UI library |
| **Build Tool & Server** | Vite 5 | Next-generation fast frontend tooling |
| **Styling & Theme** | Tailwind CSS v3 | Utility-first CSS framework with custom botanical design tokens |
| **Icons** | Lucide React | Clean, modern SVG iconography |
| **Routing** | React Router DOM v6 | Client-side page navigation |
| **Cloud Backend** | Firebase v10 SDK | Cloud Firestore Database, Firebase Authentication, and Analytics |

---

## 📁 Source Code Directory Structure (`src/`)

```
src/
├── firebase/
│   └── config.js              # Firebase SDK init (Auth, Firestore, Analytics)
├── context/
│   ├── AuthContext.jsx        # Firebase Authentication context & user session provider
│   └── PlantContext.jsx       # Real-time Firestore state, IoT telemetry simulation & pump logic
├── components/
│   ├── AddPlantModal.jsx      # Modal dialog to register a new plant specimen
│   ├── FirebaseStatusBadge.jsx# Live indicator badge for Firebase connection status
│   ├── Navbar.jsx             # Sticky header bar with menu toggle, notifications & user pill
│   ├── PlantCard.jsx          # Interactive plant item card with live moisture meter
│   ├── PlantModal.jsx         # Detail modal for telemetry charts, care guides & calibrations
│   ├── Sidebar.jsx            # Left navigation sidebar with active link styling & graphics
│   ├── TelemetryChart.jsx     # Live SVG smooth curve graph for 24h soil moisture trends
│   └── WaterReservoirWidget.jsx # Water tank level gauge & manual pump trigger widget
├── pages/
│   ├── ActivityLogs.jsx       # Real-time system event audit trail & alerts feed
│   ├── AIDiagnostics.jsx      # Computer vision leaf disease scanner & SproutAI chatbot
│   ├── AuthModal.jsx          # Split-screen Firebase login & account registration modal
│   ├── Automation.jsx         # Smart irrigation rules engine & moisture threshold sliders
│   ├── Category.jsx           # Garden Plants vs Kitchen Garden selector cards view
│   ├── Dashboard.jsx          # Main greeting dashboard with 2x2 feature cards
│   ├── Encyclopedia.jsx       # Botanical encyclopedia search with filter selectors
│   ├── Garden.jsx             # Interactive plant garden manager grid with search & filters
│   ├── HealthAnalysis.jsx     # 3 sub-feature tabs (Disease, Nutrient, Pest) + guidelines
│   ├── History.jsx            # Historical diagnostic analysis records list & date filter
│   ├── Identification.jsx     # Drag-and-drop plant image uploader & AI identification
│   ├── Profile.jsx            # User profile card, contact details & AI alert checkboxes
│   └── Tracker.jsx            # 5-step disease progress timeline stepper & 0% recovery gauge
├── App.jsx                    # Core application router layout & global state shell
├── index.css                  # Tailwind directives, animations & glassmorphism utilities
└── main.jsx                   # Entry point wrapping App with React Router & Contexts
```

---

## 📄 Documentation Sitemap

For detailed documentation on specific components, contexts, or backend architecture, see:

- [ARCHITECTURE.md](file:///c:/Users/user/Desktop/mini%20project/documentation/ARCHITECTURE.md) — High-level architecture, routing, and data flow.
- [BACKEND.md](file:///c:/Users/user/Desktop/mini%20project/documentation/BACKEND.md) — Firebase Firestore schema, Auth flows, and service methods.
- **Core Files**:
  - [main.md](file:///c:/Users/user/Desktop/mini%20project/documentation/main.md)
  - [App.md](file:///c:/Users/user/Desktop/mini%20project/documentation/App.md)
  - [index_css.md](file:///c:/Users/user/Desktop/mini%20project/documentation/index_css.md)
  - [FirebaseConfig.md](file:///c:/Users/user/Desktop/mini%20project/documentation/FirebaseConfig.md)
  - [AuthContext.md](file:///c:/Users/user/Desktop/mini%20project/documentation/AuthContext.md)
  - [PlantContext.md](file:///c:/Users/user/Desktop/mini%20project/documentation/PlantContext.md)
- **Components**:
  - [AddPlantModal.md](file:///c:/Users/user/Desktop/mini%20project/documentation/AddPlantModal.md)
  - [FirebaseStatusBadge.md](file:///c:/Users/user/Desktop/mini%20project/documentation/FirebaseStatusBadge.md)
  - [Navbar.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Navbar.md)
  - [PlantCard.md](file:///c:/Users/user/Desktop/mini%20project/documentation/PlantCard.md)
  - [PlantModal.md](file:///c:/Users/user/Desktop/mini%20project/documentation/PlantModal.md)
  - [Sidebar.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Sidebar.md)
  - [TelemetryChart.md](file:///c:/Users/user/Desktop/mini%20project/documentation/TelemetryChart.md)
  - [WaterReservoirWidget.md](file:///c:/Users/user/Desktop/mini%20project/documentation/WaterReservoirWidget.md)
- **Pages**:
  - [Dashboard.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Dashboard.md)
  - [Category.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Category.md)
  - [Identification.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Identification.md)
  - [HealthAnalysis.md](file:///c:/Users/user/Desktop/mini%20project/documentation/HealthAnalysis.md)
  - [Tracker.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Tracker.md)
  - [Encyclopedia.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Encyclopedia.md)
  - [History.md](file:///c:/Users/user/Desktop/mini%20project/documentation/History.md)
  - [Profile.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Profile.md)
  - [ActivityLogs.md](file:///c:/Users/user/Desktop/mini%20project/documentation/ActivityLogs.md)
  - [AIDiagnostics.md](file:///c:/Users/user/Desktop/mini%20project/documentation/AIDiagnostics.md)
  - [AuthModal.md](file:///c:/Users/user/Desktop/mini%20project/documentation/AuthModal.md)
  - [Automation.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Automation.md)
  - [Garden.md](file:///c:/Users/user/Desktop/mini%20project/documentation/Garden.md)
