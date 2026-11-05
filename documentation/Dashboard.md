# Developer Documentation: `Dashboard.jsx`

## Overview
`Dashboard.jsx` renders the primary home dashboard (Screenshot 1). It features the "Welcome back! 🌿" greeting, subtitle, and a 2x2 grid of main feature cards.

## Why It's Used
Serves as the main landing page introducing users to the AI-Based Smart Plant Monitoring and Care System's core capabilities.

## File Location
`src/pages/Dashboard.jsx`

## Imports & Dependencies
- `React` from `react`
- `Link` from `react-router-dom`
- `Search, Shield, BookOpen, Clock, ArrowRight` from `lucide-react`

## Props
None.

## State & Hooks
N/A.

## Full Code Flow (Step-by-Step)
1. Renders title: `"Welcome back! 🌿"` and subtitle.
2. Renders section heading: `"Main Features"`.
3. Renders 4 feature cards:
   - **Plant Identification**: 🔍 icon in green circle, vector plant, `Get Started →` button linking to `/identification`.
   - **Plant Health Analysis**: 🛡️ icon in green circle, inspecting plant vector, `Get Started →` button linking to `/health-analysis`.
   - **Plant Encyclopedia**: 📖 icon in green circle, plant on books vector, `Explore →` button linking to `/encyclopedia`.
   - **Analysis History**: 🕒 icon in green circle, checklist vector, `View History →` button linking to `/history`.
4. Renders footer copyright notice.

```javascript
<Link 
  to="/identification" 
  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16883D] text-white font-bold text-xs"
>
  <span>Get Started</span>
  <ArrowRight className="w-3.5 h-3.5" />
</Link>
```

## Backend Connection
N/A (Card buttons link to feature routes).

## Data Flow Diagram
`Card Button Click` ➔ `React Router Link` ➔ Navigates to Target Feature Page

## Events & Handlers
N/A.

## Edge Cases & Error Handling
Responsive 1-column on mobile, 2-column grid on desktop.

## Styling
Feature cards (`bg-white rounded-3xl p-6 border border-slate-100 shadow-sm`).
