# Developer Documentation: `AuthModal.jsx`

## Overview
`AuthModal.jsx` renders the authentication dialog. It features a left brand hero column (green leaf logo, headline, subtext, 3D potted plant + heart background graphic) and a right form card switching between Login and Create Account.

## Why It's Used
Handles Firebase Authentication login and user account registration without requiring phone number input.

## File Location
`src/pages/AuthModal.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `X, Mail, Lock, Eye, EyeOff, User, ArrowRight, UserPlus, Sprout, ShieldCheck` from `lucide-react`
- `useAuth` from `../context/AuthContext`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `onClose` | `function` | Callback to close modal dialog |

## State & Hooks
- `isSignUp` (`boolean`): Toggles between Login view and Create Account view.
- `email` (`string`): Email input state (prefilled `abb@gmail.com`).
- `password` (`string`): Password input state.
- `confirmPassword` (`string`): Confirm password input state.
- `fullName` (`string`): Full name input state.
- `showPassword` (`boolean`): Password visibility toggle.
- `loading` (`boolean`): Submitting auth state.
- `error` (`string`): Error message string.

## Full Code Flow (Step-by-Step)
1. Renders fixed modal overlay with split-screen layout.
2. Left Column displays brand hero (headline, subtext, 3D potted plant SVG + heart watermark shape).
3. Right Column renders Login card if `isSignUp === false` or Create Account card (Full Name, Email, Password, Confirm Password) if `isSignUp === true`.
4. Highlighted input fields use light yellow fill (`bg-[#FEFCE8]`).
5. Form submit (`handleSubmit`) calls `login(email, password)` or `signup(email, password, name)` from `AuthContext`.

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    if (isSignUp) await signup(email, password, fullName);
    else await login(email, password);
    onClose();
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## Backend Connection
Connects to Firebase Auth via `login()` and `signup()` in `AuthContext`.

## Data Flow Diagram
`Form Submit` ➔ `handleSubmit` ➔ `AuthContext (login/signup)` ➔ Firebase Auth ➔ `onAuthStateChanged` ➔ `onClose()`

## Events & Handlers
- `handleSubmit(e)`: Executes authentication.
- `setIsSignUp(bool)`: Toggles between Login and Register views.
- `onClose()`: Closes modal.

## Edge Cases & Error Handling
Validates password matching on sign up and displays error alert box.

## Styling
Yellow input highlight (`bg-[#FEFCE8] border border-emerald-300 rounded-xl`).
