import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  signInWithPopup,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Default demo user profile when offline or testing without signin
  const demoUser = {
    uid: 'demo-gardener-123',
    displayName: 'Eco Gardener (Demo)',
    email: 'gardener@florapulse.io',
    phoneNumber: '',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    isDemo: true,
    role: 'user',
    isAdmin: false
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let userRole = 'user';
        let phoneNum = '';
        let fullName = user.displayName || user.email?.split('@')[0] || 'Botanist User';

        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.role) userRole = data.role;
            if (data.phoneNumber) phoneNum = data.phoneNumber;
            if (data.fullName) fullName = data.fullName;
          }
        } catch (err) {
          console.warn("Firestore user profile fetch warning:", err);
        }

        const isAdmin = userRole === 'admin';
        if (isAdmin) {
          sessionStorage.setItem('adminAuth', 'true');
        } else {
          sessionStorage.removeItem('adminAuth');
        }

        setCurrentUser({
          uid: user.uid,
          displayName: fullName,
          email: user.email || 'guest@plantcare.firebase',
          phoneNumber: phoneNum,
          photoURL: user.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
          isDemo: false,
          role: userRole,
          isAdmin: isAdmin
        });
        setIsDemoMode(false);
      } else {
        sessionStorage.removeItem('adminAuth');
        setCurrentUser(demoUser);
        setIsDemoMode(true);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Auth state error, falling back to Demo Mode:", error);
      sessionStorage.removeItem('adminAuth');
      setCurrentUser(demoUser);
      setIsDemoMode(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, displayName, phoneNumber) => {
    console.log("REGISTRATION: starting process for", email);
    let user = null;

    if (auth.currentUser && !auth.currentUser.isAnonymous && auth.currentUser.email?.toLowerCase() === email.toLowerCase()) {
      user = auth.currentUser;
      console.log("REGISTRATION: Using existing active Firebase user", user.uid);
    } else {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        user = res.user;
        console.log("REGISTRATION: Firebase account created", user?.uid);
      } catch (authErr) {
        if (authErr?.code === 'auth/email-already-in-use' && auth.currentUser && auth.currentUser.email?.toLowerCase() === email.toLowerCase()) {
          user = auth.currentUser;
          console.log("REGISTRATION: Account already exists in current session", user.uid);
        } else {
          throw authErr;
        }
      }
    }

    if (user) {
      if (displayName) {
        try {
          await updateProfile(user, { displayName });
        } catch (e) {
          console.warn("updateProfile warning:", e);
        }
      }

      const phoneStr = phoneNumber ? String(phoneNumber) : '';

      console.log("REGISTRATION: saving Firestore profile");
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userData = {
          uid: user.uid,
          userId: user.uid,
          fullName: displayName || '',
          email: email,
          phoneNumber: phoneStr,
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, userData, { merge: true });
        console.log("REGISTRATION: Firestore profile saved successfully");
      } catch (err) {
        console.error("Firestore user profile creation error:", err);
        const customError = new Error("Account created, but profile information could not be saved. Please try again.");
        customError.code = 'firestore/profile-save-failed';
        throw customError;
      }

      setCurrentUser({
        uid: user.uid,
        displayName: displayName || user.email?.split('@')[0] || 'Botanist User',
        email: email,
        phoneNumber: phoneStr,
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
        isDemo: false
      });
      setIsDemoMode(false);
      console.log("REGISTRATION: AuthContext state updated");
    }
    return user;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const loginAnonymous = async () => {
    try {
      return await signInAnonymously(auth);
    } catch (err) {
      console.warn("Anonymous auth disabled in console, enabling demo mode:", err);
      setCurrentUser(demoUser);
      setIsDemoMode(true);
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('adminAuth');
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Signout error:", e);
    }
    setCurrentUser(demoUser);
    setIsDemoMode(true);
  };

  const updateUserProfile = async (displayName, phoneNumber) => {
    const user = auth.currentUser;
    const uid = user?.uid || currentUser?.uid;

    if (user && displayName) {
      await updateProfile(user, { displayName });
    }

    if (uid && !currentUser?.isDemo) {
      const userDocRef = doc(db, 'users', uid);
      const updateData = {
        fullName: displayName || '',
        updatedAt: serverTimestamp()
      };
      if (phoneNumber !== undefined) {
        updateData.phoneNumber = phoneNumber;
      }
      await setDoc(userDocRef, updateData, { merge: true });
    }

    setCurrentUser(prev => prev ? {
      ...prev,
      displayName: displayName !== undefined ? displayName : prev.displayName,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : prev.phoneNumber
    } : null);
  };

  const changeUserPassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      const err = new Error("No active Firebase authentication session found. Please log in again.");
      err.code = "auth/no-user";
      throw err;
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  const value = {
    currentUser,
    isDemoMode,
    signup,
    login,
    loginWithGoogle,
    loginAnonymous,
    logout,
    updateUserProfile,
    changeUserPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
