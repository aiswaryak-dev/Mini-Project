# Developer Documentation: `AuthContext.jsx`

## Overview
`AuthContext.jsx` provides global Firebase Authentication state management (`currentUser`, `isDemoMode`) and methods (`login`, `signup`, `loginWithGoogle`, `loginAnonymous`, `logout`).

## Why It's Used
Manages user authentication lifecycle and provides seamless fallback to Demo Mode when offline or unauthenticated.

## File Location
`src/context/AuthContext.jsx`

## Imports & Dependencies
- `createContext, useContext, useEffect, useState` from `react`
- `onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously, signInWithPopup, updateProfile` from `firebase/auth`
- `auth, googleProvider` from `../firebase/config`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `children` | `ReactNode` | Child components wrapped by provider |

## State & Hooks
- `currentUser` (`object`): Active user object (`uid`, `displayName`, `email`, `photoURL`, `isDemo`).
- `loading` (`boolean`): Initial auth state checking flag.
- `isDemoMode` (`boolean`): True if running in guest/demo mode.

## Full Code Flow (Step-by-Step)
1. Mounts `useEffect` subscribing to `onAuthStateChanged(auth, ...)`.
2. When a user signs in, updates `currentUser` state with authenticated profile.
3. If no user is logged in, defaults to `demoUser` object and sets `isDemoMode(true)`.
4. Exposes auth helper functions (`signup`, `login`, `logout`, `loginWithGoogle`, `loginAnonymous`).

```javascript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0],
        email: user.email,
        photoURL: user.photoURL
      });
      setIsDemoMode(false);
    } else {
      setCurrentUser(demoUser);
      setIsDemoMode(true);
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);
```

## Backend Connection
Connects to Firebase Auth service.

## Data Flow Diagram
`User UI Action` ➔ `AuthContext (login/signup)` ➔ `Firebase Auth SDK` ➔ `onAuthStateChanged` ➔ `setCurrentUser`

## Events & Handlers
- `signup(email, password, name)`
- `login(email, password)`
- `loginWithGoogle()`
- `loginAnonymous()`
- `logout()`

## Edge Cases & Error Handling
Includes silent fallback to Demo Mode if Firebase Auth is disabled or network fails.

## Styling
N/A.
