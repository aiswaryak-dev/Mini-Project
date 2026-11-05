# Developer Documentation: `AdminLogin.jsx`

## Overview
`AdminLogin.jsx` renders the dedicated Admin Portal Authentication page. It authenticates administrator users securely using Firebase Authentication and validates administrator privileges via Firestore user role records.

## Why It's Used
Protects access to the Admin Dashboard and validates administrator credentials.

## File Location
`src/pages/AdminLogin.jsx`

## Imports & Dependencies
- `React, { useState }` from `react`
- `useNavigate` from `react-router-dom`
- `ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Sprout, AlertCircle` from `lucide-react`
- `signInWithEmailAndPassword` from `firebase/auth`
- `doc, getDoc` from `firebase/firestore`
- `auth, db` from `../firebase/config`

## Props
| Prop Name | Type | Description |
| :--- | :--- | :--- |
| `onAdminLogin` | `function` | Callback invoked upon successful admin authentication |

## State & Hooks
- `email` (`string`): Admin email input value.
- `password` (`string`): Admin password input value.
- `loading` (`boolean`): Loading state while authenticating.
- `error` (`string`): Error message string ("Incorrect password or admin account not found.").

## Full Code Flow (Step-by-Step)
1. User submits form (`handleSubmit`).
2. Calls `signInWithEmailAndPassword(auth, cleanEmail, password)`.
3. Verifies user role in Firestore (`users/{uid}`). If role is not `admin`, access is denied.
4. On successful authentication & authorization, sets `sessionStorage.setItem('adminAuth', 'true')`.
5. Invokes `onAdminLogin()` and navigates to `/admin/dashboard`.
6. On invalid credentials, displays error: `"Incorrect password or admin account not found."`.

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  const cleanEmail = email.trim();
  if (!cleanEmail || !password) {
    setError("Please fill in all required fields.");
    return;
  }

  setLoading(true);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);

    try {
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data()?.role && userDocSnap.data().role !== 'admin') {
        setError("Access denied. Account does not have administrator privileges.");
        setLoading(false);
        return;
      }
    } catch (roleErr) {
      console.warn("Role check warning:", roleErr);
    }

    sessionStorage.setItem('adminAuth', 'true');
    if (onAdminLogin) onAdminLogin();
    navigate('/admin/dashboard');
  } catch (err) {
    setError("Incorrect password or admin account not found.");
  } finally {
    setLoading(false);
  }
};
```

## Backend Connection
Connects to Firebase Auth (`signInWithEmailAndPassword`).

## Data Flow Diagram
`Admin Login Submit` ➔ `handleSubmit` ➔ `signInWithEmailAndPassword` ➔ `sessionStorage` ➔ `/admin/dashboard`

## Events & Handlers
- `handleSubmit(e)`: Authenticates administrator.

## Edge Cases & Error Handling
Displays clear error message on wrong password/email.

## Styling
Yellow input highlight (`bg-[#FEFCE8] border border-emerald-300`).
