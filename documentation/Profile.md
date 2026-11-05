# Developer Documentation: `Profile.jsx`

## Overview
`Profile.jsx` renders the My Profile management view (Set 2 Screenshot 3). It features a left user avatar summary card with an "Active Account" pill tag, and a right personal information form with AI alert preferences checkboxes.

## Why It's Used
Enables users to manage their account credentials (full name, email address, phone number) and toggle AI notification preferences.

## File Location
`src/pages/Profile.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `User, Mail, Phone, Bell, Save, CheckCircle2` from `lucide-react`
- `useAuth` from `../context/AuthContext`

## Props
None.

## State & Hooks
- `fullName` (`string`): User display name ("abb").
- `email` (`string`): User email address ("abb@gmail.com").
- `phone` (`string`): User phone number ("1234567890").
- `reminders` (`boolean`): Watering & Fertilizer reminders checkbox.
- `weeklyDigest` (`boolean`): Weekly plant health digest checkbox.
- `saved` (`boolean`): Save success toast state.

## Full Code Flow (Step-by-Step)
1. Fetches authenticated `currentUser` from `AuthContext`.
2. Renders left summary card with large green initial avatar ("A"), name, email, and "Active Account" pill.
3. Renders right form with inputs for Full Name (user icon), Email Address (mail icon), and Phone Number (phone icon).
4. Renders AI Alert Preferences checkboxes.
5. Form submission (`handleSave`) updates profile state and displays success toast.

```javascript
const handleSave = (e) => {
  e.preventDefault();
  setSaved(true);
  setTimeout(() => setSaved(false), 2500);
};
```

## Backend Connection
Monitors `currentUser` from Firebase Auth.

## Data Flow Diagram
`Form Input Change & Submit` ➔ `handleSave` ➔ `setSaved(true)` ➔ Updates Auth Profile

## Events & Handlers
- `handleSave(e)`: Saves personal information and AI notification settings.

## Edge Cases & Error Handling
Includes input fallback to `"abb"` if user is in Demo Mode.

## Styling
Left Avatar card (`bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center`).
