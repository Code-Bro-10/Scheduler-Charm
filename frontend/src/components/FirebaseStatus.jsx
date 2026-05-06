import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function FirebaseStatus() {
  const [status, setStatus] = useState('Checking Firebase Connection...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const runCheck = async () => {
      try {
        // 1. Check Auth
        onAuthStateChanged(auth, (user) => {
          console.log("Current Auth State:", user ? "Logged In" : "Logged Out");
        });

        // 2. Check Firestore (Try to read a dummy doc)
        const testRef = doc(db, 'system', 'connection_test');
        await getDoc(testRef);
        
        setStatus('✅ Firebase Connection Healthy');
      } catch (err) {
        console.error("Firebase Diagnostic Error:", err);
        setError(err.message);
        setStatus('❌ Firebase Connection Failed');
      }
    };
    runCheck();
  }, []);

  if (!error && status.includes('Healthy')) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg p-4">
      <div className={`p-4 rounded-2xl border ${error ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-green-500/20 border-green-500 text-green-200'} glass-panel shadow-2xl`}>
        <h4 className="font-bold mb-1">{status}</h4>
        {error && (
          <p className="text-xs opacity-80">
            Error: {error} <br /><br />
            <strong className="text-white underline">Potential Fixes:</strong><br />
            1. Ensure your internet is working.<br />
            2. Check if "Google" is enabled in Firebase Authentication Providers.<br />
            3. Set Firestore rules to "allow read, write: if true;" for testing.
          </p>
        )}
      </div>
    </div>
  );
}
