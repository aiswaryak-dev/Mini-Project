# Developer Documentation: `ActivityLogs.jsx`

## Overview
`ActivityLogs.jsx` renders a real-time event audit log feed displaying irrigation events, manual water pump doses, AI diagnostic scans, and Firebase sync records.

## Why It's Used
Provides a searchable and filterable audit trail for system events and health alerts.

## File Location
`src/pages/ActivityLogs.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `History, Droplets, Sparkles, ShieldCheck, AlertTriangle, Filter, Search` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
- `filterType` (`string`): Selected category filter ("all", "water", "ai", "firebase", "alert").
- `search` (`string`): Search query string.

## Full Code Flow (Step-by-Step)
1. Fetches `activityLogs` array from `PlantContext`.
2. Renders search bar and filter pills ("all", "water", "ai", "firebase", "alert").
3. Filters logs based on type and text.
4. Renders log feed list with timestamp, event icon, target plant name, and details.

```javascript
const filtered = activityLogs.filter(log => {
  const matchesType = filterType === 'all' || log.type === filterType;
  const matchesSearch = log.title.toLowerCase().includes(search.toLowerCase());
  return matchesType && matchesSearch;
});
```

## Backend Connection
Queries real-time logs from Firestore `activity_logs` collection.

## Data Flow Diagram
`Firestore activity_logs` ➔ `PlantContext.activityLogs` ➔ `ActivityLogs.jsx` ➔ Event Feed

## Events & Handlers
- `setFilterType(t)`: Filters logs by category.
- `setSearch(text)`: Filters logs by keyword.

## Edge Cases & Error Handling
Displays friendly message if no logs match current search filters.

## Styling
Log item cards (`p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between`).
