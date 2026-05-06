import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, User, ArrowRight, Zap, Globe, Calendar, UserPlus } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex-grow flex flex-col justify-center items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full text-center space-y-8 z-10"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-purple-500/30 text-purple-300 text-sm font-medium mb-4"
        >
          <Zap className="w-4 h-4 text-purple-400" />
          <span>The Future of Scheduling is Here</span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Master Your Time with <br />
          <span className="text-gradient">Scheduler Charm</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Experience the most elegant, seamless, and premium way to manage your meetings and appointments.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 pt-8">
          <div className="flex flex-col gap-2">
            <Link to="/user-login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-64 px-8 py-4 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                <User className="w-5 h-5" />
                User Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </motion.button>
            </Link>
            <Link to="/user-register" className="text-sm text-blue-400 hover:underline">New User? Register here</Link>
          </div>

          <div className="flex flex-col gap-2">
            <Link to="/admin-login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-64 px-8 py-4 rounded-xl glass-panel border border-purple-500/30 text-white font-semibold flex items-center justify-center gap-3 hover:bg-purple-900/20 transition-colors shadow-[0_0_30px_rgba(124,58,237,0.2)]"
              >
                <Shield className="w-5 h-5 text-purple-400" />
                Admin Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </motion.button>
            </Link>
            <Link to="/admin-register" className="text-sm text-purple-400 hover:underline">Register as Administrator</Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mt-32 mb-16 z-10 px-4">
        {[
          { icon: <Calendar />, title: "Smart Scheduling", desc: "AI-powered conflict resolution and auto-timezone adjustments." },
          { icon: <Globe />, title: "Universal Integrations", desc: "Seamlessly connects with Google Meet, Zoom, and your favorite calendars." },
          { icon: <Shield />, title: "Enterprise Security", desc: "Bank-grade encryption and secure role-based access control." }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            viewport={{ once: true }}
            className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors border border-white/5"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
