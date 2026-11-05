# Developer Documentation: `Sidebar.jsx`

## Overview
`Sidebar.jsx` renders the persistent left navigation sidebar featuring the green brand logo, 8 main page navigation links, logout action, and bottom potted plant vector graphic.

## Why It's Used
Provides primary navigation between application views while highlighting the active route with a light green pill background (`#EAF6E8`).

## File Location
`src/components/Sidebar.jsx`

## Imports & Dependencies
- `React` from `react`
- `NavLink, useNavigate` from `react-router-dom`
- `LayoutDashboard, Sprout, Search, ShieldCheck, TrendingUp, BookOpen, History, User, LogOut` from `lucide-react`
- `useAuth` from `../context/AuthContext`

## Props
None.

## State & Hooks
Reads `currentUser` and `logout` from `useAuth()`. Uses `useNavigate()` hook.

## Full Code Flow (Step-by-Step)
1. Defines `navItems` array with paths (`/`, `/category`, `/identification`, `/health-analysis`, `/tracker`, `/encyclopedia`, `/history`, `/profile`).
2. Iterates over `navItems` using `<NavLink>`.
3. Highlights active route with `bg-[#EAF6E8] text-[#16883D] font-bold`.
4. Renders bottom potted plant graphic.

```javascript
<NavLink
  key={item.path}
  to={item.path}
  className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium ${
      isActive ? 'bg-[#EAF6E8] text-[#16883D] font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
    }`
  }
>
  <Icon className="w-4 h-4" />
  <span>{item.name}</span>
</NavLink>
```

## Backend Connection
Triggers `logout()` in `AuthContext` on logout click.

## Data Flow Diagram
`Nav Click` ➔ `NavLink (React Router)` ➔ Route Change ➔ `<App />` Renders Page View

## Events & Handlers
- `handleLogout()`: Signs out user and redirects to `/`.

## Edge Cases & Error Handling
Gracefully handles session destruction.

## Styling
Sidebar (`w-[#16883D]` brand green accents, `#EAF6E8` active pill background).
