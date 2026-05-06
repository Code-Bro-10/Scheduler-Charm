import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCBQJPjz8A9or-y-lY-twJNah-FgbvvoeA",
  authDomain: "meeting-software.firebaseapp.com",
  projectId: "meeting-software",
  storageBucket: "meeting-software.firebasestorage.app",
  messagingSenderId: "900440106657",
  appId: "1:900440106657:web:8a19462e299fc7b056f2e0",
  measurementId: "G-FLQ6Z3LN46"
};

// Initialize Firebase (check if already initialized for HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (Safe initialization)
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
