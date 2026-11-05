# Developer Documentation: `Tracker.jsx`

## Overview
`Tracker.jsx` renders the Disease Progress Tracker view (Screenshot 5). It features an analysis selector dropdown, `+ Add Follow-up` button, 5-node timeline stepper, 0% recovery gauge, and tips container.

## Why It's Used
Tracks plant recovery progress over treatment cycles (Day 0 to Day 15+) by allowing users to log sequential follow-up images.

## File Location
`src/pages/Tracker.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `TrendingUp, Plus, Image as ImageIcon, Info, CheckCircle2, ChevronRight` from `lucide-react`
- `usePlants` from `../context/PlantContext`

## Props
None.

## State & Hooks
- `selectedAnalysis` (`string`): Selected diagnostic analysis record ID.
- `timelineSteps` (`array`): List of 5 timeline node objects (`step`, `day`, `label`, `image`).
- `progressPercent` (`number`): Overall recovery progress percentage (0 - 100%).

## Full Code Flow (Step-by-Step)
1. Renders top controls (Analysis dropdown + `+ Add Follow-up` button).
2. Renders 5 timeline node steps (Day 0 Initial, Day 1-3, Day 4-7, Day 8-14, Day 15+).
3. Clicking `+ Add Follow-up` executes `handleAddFollowup()`.
4. Populates next empty node with image, calculates updated progress percentage, and logs follow-up to Firestore via `logActivity()`.

```javascript
const handleAddFollowup = () => {
  const emptyIndex = timelineSteps.findIndex(s => s.image === null);
  if (emptyIndex !== -1) {
    const updated = [...timelineSteps];
    updated[emptyIndex].image = 'https://images.unsplash.com/...';
    setTimelineSteps(updated);
    const newPercent = Math.round(((emptyIndex + 1) / 5) * 100);
    setProgressPercent(newPercent);
  }
};
```

## Backend Connection
Calls `logActivity()` in `PlantContext`, writing progress log to Firestore `activity_logs`.

## Data Flow Diagram
`Add Follow-up Click` ➔ `handleAddFollowup` ➔ `timelineSteps` updated ➔ `setProgressPercent` ➔ Firestore log

## Events & Handlers
- `handleAddFollowup()`: Simulates adding follow-up specimen photo to timeline.

## Edge Cases & Error Handling
Prevents adding follow-up images when all 5 timeline nodes are filled.

## Styling
Stepper nodes (`w-8 h-8 rounded-full border-2 border-slate-300` or `bg-[#16883D] text-white`).
