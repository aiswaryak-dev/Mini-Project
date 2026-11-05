# Developer Documentation: `App.jsx`

## Overview
`App.jsx` is the primary layout shell of the application. It manages sidebar visibility, top navbar header, route definitions for all 8 main views, and rendering of the authentication modal.

## Why It's Used
Serves as the central container layout ensuring consistent header navigation (`Navbar`), persistent left sidebar navigation (`Sidebar`), and dynamic route switching via React Router `<Routes>`.

## File Location
`src/App.jsx`

## Imports & Dependencies
- `React, { useState }`: React core and local state management.
- `Routes, Route`: Routing components from `react-router-dom`.
- `Navbar`: Sticky header bar component (`./components/Navbar`).
- `Sidebar`: Navigation sidebar component (`./components/Sidebar`).
- `Dashboard, Category, Identification, HealthAnalysis, Tracker, Encyclopedia, History, Profile`: Page components.
- `AuthModal`: Split-screen authentication modal (`./pages/AuthModal`).

## Props
None.

## State & Hooks
- `showAuthModal` (`boolean`): Controls opening and closing of `AuthModal`.
- `sidebarOpen` (`boolean`): Toggles left sidebar visibility on mobile/desktop screens.

## Full Code Flow (Step-by-Step)
1. Initializes `showAuthModal` state to `false` and `sidebarOpen` state to `true`.
2. Renders `<Navbar>` at the top with callbacks to open `AuthModal` and toggle sidebar.
3. Renders `<Sidebar>` if `sidebarOpen` is true.
4. Renders `<main>` containing `<Routes>` matching current browser URL.
5. Conditionally mounts `<AuthModal>` when `showAuthModal` is true.

```javascript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/category" element={<Category />} />
  <Route path="/identification" element={<Identification />} />
  <Route path="/health-analysis" element={<HealthAnalysis />} />
  <Route path="/tracker" element={<Tracker />} />
  <Route path="/encyclopedia" element={<Encyclopedia />} />
  <Route path="/history" element={<History />} />
  <Route path="/profile" element={<Profile />} />
</Routes>
```

## Backend Connection
Indirectly passes user login modal triggers to `AuthModal` which executes Firebase Auth methods.

## Data Flow Diagram
`App.jsx` ➔ `Navbar (onOpenAuth)` ➔ `showAuthModal (true)` ➔ `<AuthModal />` ➔ Firebase Auth

## Events & Handlers
- `onToggleSidebar`: Toggles `sidebarOpen` state.
- `onOpenAuth`: Sets `showAuthModal(true)`.

## Edge Cases & Error Handling
Unmatched routes automatically fall back to `Dashboard` root view.

## Styling
Tailwind utility layout: `min-h-screen flex flex-col bg-[#FAFAF8] text-[#063D24]`.
