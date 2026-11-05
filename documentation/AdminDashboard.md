# Developer Documentation: `AdminDashboard.jsx`

## Overview
`AdminDashboard.jsx` renders the pixel-accurate Admin Dashboard page recreated from the user reference image. It features 4 top metric cards, 2 middle analysis overview cards, and a bottom recent analyses table.

## Why It's Used
Serves as the administrative control center for managing plant system data, reviewing pathology diagnostic trends, and monitoring overall user activity.

## File Location
`src/pages/AdminDashboard.jsx`

## Imports & Dependencies
- `React` from `react`
- `Sprout, Bug, Users, BarChart2, PieChart, Folder, ShieldAlert` from `lucide-react`

## Props
None.

## State & Hooks
N/A.

## Full Code Flow (Step-by-Step)
1. Renders title: `"Dashboard"` and subtitle: `"Welcome to the admin dashboard. Here you can manage system data and monitor overall activity."`.
2. Renders 4 top metric cards:
   - `Total Plants`: `0` (soft green circle with sprout icon)
   - `Total Diseases`: `0` (soft red circle with shield alert icon)
   - `Total Pests`: `0` (soft yellow circle with bug icon)
   - `Total Users`: `0` (soft blue circle with users icon)
3. Renders 2 middle analysis cards:
   - `Analysis Overview`: Bar chart icon in soft green circle + `"No data available"`
   - `Analysis by Type`: Donut pie chart icon in soft green circle + `"No data available"`
4. Renders `Recent Analyses` table with light green header bar (`#EAF6E8`) and empty state folder icon.

```javascript
<table className="w-full text-xs text-left">
  <thead className="bg-[#EAF6E8]/70 text-[#063D24] font-bold">
    <tr>
      <th className="py-3 px-4">Sl. No.</th>
      <th className="py-3 px-4">Analysis Type</th>
      <th className="py-3 px-4">Plant Name</th>
      <th className="py-3 px-4">Result / Problem Detected</th>
      <th className="py-3 px-4">User</th>
      <th className="py-3 px-4">Status</th>
    </tr>
  </thead>
</table>
```

## Backend Connection
Can be connected to Firestore collections `plants`, `activity_logs`, and `users` to display real-time counts.

## Data Flow Diagram
`Admin Route` ➔ `AdminDashboard.jsx` ➔ Renders Metric Cards & Table

## Events & Handlers
N/A.

## Edge Cases & Error Handling
Displays friendly empty state folder icon when zero analysis records exist.

## Styling
Cards (`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm`).
