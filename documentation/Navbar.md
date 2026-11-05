# Developer Documentation: `Navbar.jsx`

## Overview
`Navbar.jsx` renders the top sticky header containing the sidebar menu toggle, notification bell with alert dot, Firebase status badge, and user account avatar pill.

## Why It's Used
Serves as the global top bar providing quick access to menu controls, user authentication state, and notifications across all pages.

## File Location
`src/components/Navbar.jsx`

## Imports & Dependencies
- `React` from `react`
- `Menu, Bell, User, ChevronDown` from `lucide-react`
- `useAuth` from `../context/AuthContext`
- `FirebaseStatusBadge` from `./FirebaseStatusBadge`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `onToggleSidebar` | `function` | Toggles left sidebar visibility |
| `onOpenAuth` | `function` | Opens `AuthModal` dialog |

## State & Hooks
Reads `currentUser` and `isDemoMode` from `useAuth()`.

## Full Code Flow (Step-by-Step)
1. Fetches `currentUser` display name or defaults to `"abb"`.
2. Renders menu toggle button on left (`Menu`).
3. Renders `FirebaseStatusBadge`, notification bell, and user avatar pill on right.

```javascript
<div 
  onClick={onOpenAuth}
  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16883D] text-white text-xs font-semibold cursor-pointer shadow-sm"
>
  <User className="w-3.5 h-3.5" />
  <span>{userName}</span>
  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
</div>
```

## Backend Connection
Monitors `currentUser` from Firebase Auth.

## Data Flow Diagram
`User Pill Click` ➔ `onOpenAuth()` ➔ `App.jsx` ➔ `AuthModal`

## Events & Handlers
- `onToggleSidebar()`: Fires sidebar toggle.
- `onOpenAuth()`: Opens login modal.

## Edge Cases & Error Handling
Displays fallback username `"abb"` if user is unauthenticated.

## Styling
Sticky top bar (`h-16 bg-white border-b border-slate-100 px-6 sticky top-0 z-20`).
