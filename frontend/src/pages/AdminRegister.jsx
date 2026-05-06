import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export default function AdminRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().role === 'Admin') {
          navigate('/admin-dashboard');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const saveAdminToFirestore = async (user, displayName) => {
    console.log("Saving Admin to Firestore...", user.email);
    const userRef = doc(db, 'users', user.email);
    await setDoc(userRef, {
      name: displayName || user.displayName || user.email.split('@')[0],
      email: user.email,
      role: 'Admin',
      uid: user.uid,
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    }, { merge: true });
    console.log("Admin Firestore save successful");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await saveAdminToFirestore(user, name);
      navigate('/admin-dashboard');
    } catch (err) {
      console.error("Admin Reg Error:", err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveAdminToFirestore(result.user);
      navigate('/admin-dashboard');
    } catch (err) {
      console.error("Admin Google Error:", err);
      setError("Admin Google Registration Failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-panel p-8 rounded-3xl border border-purple-500/30">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-purple-400" /></div>
          <h2 className="text-3xl font-bold">Admin Portal Setup</h2>
          <p className="text-gray-400 text-sm mt-2">Initialize your administrative account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Admin Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3" required />
          <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3" required />
          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-purple-600 font-bold hover:bg-purple-500 transition-colors">
            {loading ? 'Creating Admin...' : 'Register as Admin'}
          </button>
        </form>

        <button onClick={handleGoogleRegister} disabled={loading} className="w-full mt-4 py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          {loading ? 'Processing...' : 'Register Admin with Google'}
        </button>

        <p className="text-center mt-6 text-gray-400">
          Already have an account? <Link to="/admin-login" className="text-purple-400 font-bold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
