import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration provided by user
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyAYkmdYn9H-79F92VLyvI69-2eIlv4RogM",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "plant-care-system-d738d.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "plant-care-system-d738d",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "plant-care-system-d738d.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "1093921151274",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:1093921151274:web:4f980e98cf197cc7c06653",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-4W5XB3HF30"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);


// Analytics optional initialization (safe check for SSR/browser support)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
