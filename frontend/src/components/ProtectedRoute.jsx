import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function ProtectedRoute({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Verify role in Firestore
        try {
          const userSnap = await getDoc(doc(db, 'users', currentUser.email));
          if (userSnap.exists()) {
            const role = userSnap.data().role;
            if (!requiredRole || role === requiredRole) {
              setHasAccess(true);
            }
          }
        } catch (error) {
          console.error("Auth protection error:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!hasAccess) {
    return <Navigate to="/" />;
  }

  return children;
}
