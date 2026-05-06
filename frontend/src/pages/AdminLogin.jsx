import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLogin() {
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

  const handleAdminAuth = async (user) => {
    try {
      const userRef = doc(db, 'users', user.email);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.role === 'Admin') {
          navigate('/admin-dashboard');
        } else {
          await auth.signOut();
          setError(`Access Denied: This account is registered as a ${data.role}. Use the User Portal instead.`);
        }
      } else {
        await auth.signOut();
        setError('Admin Account Not Found. Please register as an Administrator first.');
      }
    } catch (error) {
      console.error(error);
      setError('Permission Error: Firestore is blocking access. Check your Security Rules.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleAdminAuth(result.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleAdminAuth(result.user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-panel p-8 rounded-3xl border border-purple-500/30">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-purple-400" /></div>
          <h2 className="text-3xl font-bold text-gradient">Admin Portal</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3" required />
          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-purple-600 font-bold flex items-center justify-center gap-2">
            {loading ? 'Verifying...' : 'Admin Login'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <button onClick={handleGoogleLogin} disabled={loading} className="w-full mt-4 py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2">
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          {loading ? 'Verifying...' : 'Admin Sign-in with Google'}
        </button>

        <p className="text-center mt-6 text-gray-400">
          Need an admin account? <Link to="/admin-register" className="text-purple-400 font-bold hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
