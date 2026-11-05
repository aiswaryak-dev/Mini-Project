# Developer Documentation: `History.jsx`

## Overview
`History.jsx` renders the Analysis History view (Set 2 Screenshot 2). It features search input, analysis type dropdown, date range calendar picker, `Filters` button, and an "Analysis Records" container with a green clipboard icon.

## Why It's Used
Maintains an audit trail of user's past AI health scans and diagnostic reports.

## File Location
`src/pages/History.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `History as HistoryIcon, Search, Calendar, Filter, ClipboardList, Info` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
- `search` (`string`): Search query text.
- `type` (`string`): Analysis type filter ("All Types", "disease", "nutrient", "pest").
- `dateRange` (`string`): Date range picker string.

## Full Code Flow (Step-by-Step)
1. Fetches `activityLogs` from `PlantContext`.
2. Renders top filter bar with Search input, Analysis Type select, Date Range input, and `Filters` reset button.
3. Filters `activityLogs` based on search string and type.
4. Renders "Analysis Records" container. If records exist, lists diagnostic cards; otherwise displays empty state ("No analysis history yet").

```javascript
const records = activityLogs.filter(log => {
  const matchesSearch = log.title.toLowerCase().includes(search.toLowerCase());
  const matchesType = type === 'All Types' || log.type === type;
  return matchesSearch && matchesType;
});
```

## Backend Connection
Reads real-time audit logs from Firestore `activity_logs` collection via `usePlants()`.

## Data Flow Diagram
`Firestore activity_logs` ➔ `PlantContext.activityLogs` ➔ `History.jsx` ➔ Filtered Records View

## Events & Handlers
- `setSearch(val)`: Updates search text.
- `setType(val)`: Updates analysis filter.

## Edge Cases & Error Handling
Displays friendly empty state with clipboard icon when zero scan records match filters.

## Styling
Info banner (`p-3.5 rounded-xl bg-[#EAF6E8] text-[#16883D]`).
