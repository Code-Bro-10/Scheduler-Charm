import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, LogOut, User, Shield, UserPlus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <CalendarDays className="w-8 h-8 text-purple-500" />
            </motion.div>
            <span className="font-bold text-xl tracking-tight">
              Scheduler <span className="text-gradient">Charm</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
               <Link to="/team" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                <Users className="w-4 h-4" />
                Team
              </Link>
            )}

            {!user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex items-center gap-2 border-r border-white/10 pr-4 mr-2">
                  <Link to="/user-login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">User Login</Link>
                  <Link to="/user-register" className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Register
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/admin-login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Admin Login</Link>
                  <Link to="/admin-register" className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Register
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {user.photoURL && (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/10" />
                )}
                <span className="text-sm text-gray-300 hidden sm:inline">{user.displayName || user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
