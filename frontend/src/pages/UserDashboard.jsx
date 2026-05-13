import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Video, User, Plus, Search, Filter, 
  CheckCircle2, XCircle, Bell, LayoutGrid, List, Sparkles,
  ArrowRight, Check, X, Shield, Zap, MessageSquare, Send, AlertCircle,
  Flag, ExternalLink
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { useSocket } from '../context/SocketContext';

export default function UserDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const user = auth.currentUser;
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  
  const [rejectionId, setRejectionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [updatingHours, setUpdatingHours] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch user profile and working hours
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setIsAvailable(data.isAvailable ?? true);
          if (data.workingHours) setWorkingHours(data.workingHours);
        } else {
          // Initialize user doc if missing
          await setDoc(userRef, { 
            uid: user.uid,
            name: user.displayName || 'Team Member', 
            email: user.email, 
            isAvailable: true, 
            role: 'User',
            workingHours: { start: '09:00', end: '18:00' }
          }, { merge: true });
        }
      } catch (err) { console.error("Profile fetch error:", err); }
    };
    fetchProfile();

    // Listen for meetings assigned to this user
    const q = query(collection(db, 'meetings'), where('userEmail', '==', user.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetList = [];
      snapshot.forEach((doc) => {
        meetList.push({ id: doc.id, ...doc.data() });
      });
      
      const sorted = meetList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
        return dateB - dateA;
      });
      
      setMeetings(sorted);
      setLoading(false);
    });

    if (socket) {
      socket.emit('join_room', user.email);
      socket.on('receive_notification', (data) => {
        setNotifications(prev => [data, ...prev]);
        // Visual alert for new notifications
        console.log("New Alert:", data.message);
      });
    }

    return () => {
      unsubscribe();
      if (socket) socket.off('receive_notification');
    };
  }, [user, socket]);

  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      setIsAvailable(newStatus);
      await setDoc(doc(db, 'users', user.email), { isAvailable: newStatus }, { merge: true });
    } catch (err) { console.error("Toggle error:", err); }
  };

  const handleApprove = async (meetingId) => {
    const meeting = meetings.find(m => m.id === meetingId);
    try {
      await updateDoc(doc(db, 'meetings', meetingId), { status: 'Approved' });
      if (socket) {
        socket.emit('meeting_status_change', {
          to: 'admin@system.com',
          userName: user.displayName || 'Team Member',
          meetingTitle: meeting?.title || 'Sync',
          date: meeting?.date,
          time: meeting?.time,
          status: 'Approved',
          meetingUrl: meeting?.meetingUrl
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return alert("Provide a reason");
    const meeting = meetings.find(m => m.id === rejectionId);
    try {
      await updateDoc(doc(db, 'meetings', rejectionId), { status: 'Rejected', rejectionReason });
      if (socket) {
        socket.emit('meeting_status_change', {
          to: 'admin@system.com',
          userName: user.displayName || 'Team Member',
          meetingTitle: meeting?.title || 'Sync',
          date: meeting?.date,
          time: meeting?.time,
          status: 'Rejected',
          rejectionReason: rejectionReason,
          meetingUrl: meeting?.meetingUrl
        });
      }
      setRejectionId(null);
      setRejectionReason('');
    } catch (err) { console.error(err); }
  };

  const handleUpdateWorkingHours = async (e) => {
    e.preventDefault();
    setUpdatingHours(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { workingHours });
      alert("Daily schedule updated!");
    } catch (err) { console.error(err); }
    setUpdatingHours(false);
  };

  return (
    <div className="flex-grow flex flex-col p-6 max-w-[1400px] mx-auto w-full gap-8 z-10 overflow-hidden">
      <AnimatePresence>
        {rejectionId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRejectionId(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md glass-panel p-10 rounded-[3rem] bg-[#0c0c0e] border-white/10 shadow-2xl">
                <h3 className="text-2xl font-black italic mb-2 tracking-tighter">Decline Sync</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Briefly explain why you can't attend</p>
                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-red-500/50 transition-all text-white" />
                <div className="flex gap-4 mt-8">
                   <button onClick={() => setRejectionId(null)} className="flex-grow py-4 rounded-2xl bg-white/5 text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                   <button onClick={handleReject} className="flex-grow py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-900/20">Submit</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-600 italic tracking-tighter">Workspace</h1>
          <div className="flex items-center gap-3 mt-3">
            <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.7)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]'}`} />
            <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">{isAvailable ? 'Network Active' : 'Mode: Busy'}</span>
          </div>
        </div>
        <button onClick={toggleAvailability} className={`px-12 py-4 rounded-2xl font-black transition-all border tracking-widest text-xs ${isAvailable ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 shadow-xl shadow-green-900/10' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 shadow-xl shadow-red-900/10'}`}>
           {isAvailable ? 'SWITCH TO BUSY' : 'RESTORE CONNECTIVITY'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-black flex items-center gap-3 tracking-widest uppercase opacity-60"><Sparkles className="w-5 h-5 text-purple-400" /> Transmission Logs</h2>
             <span className="text-[10px] font-black text-gray-600 bg-white/5 px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/5">{meetings.length} Total</span>
          </div>
          
          <div className="grid gap-5">
            {loading ? (
               <div className="p-20 text-center glass-panel rounded-[3rem] opacity-30"><p className="font-black uppercase tracking-widest">Scanning Network...</p></div>
            ) : meetings.length === 0 ? (
              <div className="glass-panel p-24 rounded-[4rem] text-center border-white/5 bg-white/[0.01]">
                 <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-6" />
                 <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-30">No active transmissions detected</p>
              </div>
            ) : (
              meetings.map((m) => (
                <motion.div key={m.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`glass-panel p-8 rounded-[3rem] border transition-all ${m.isLive ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent shadow-2xl shadow-green-900/10' : m.isEnded ? 'opacity-30 grayscale' : 'border-white/5 hover:border-white/10'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-bold border transition-all ${m.isEnded ? 'bg-white/5 border-white/5' : m.isLive ? 'bg-green-500/20 border-green-500/50' : 'bg-purple-500/10 border-purple-500/20'}`}>
                         <span className="text-lg text-purple-300 tracking-tighter">{m.date.split('-')[2]}</span>
                         <span className="text-[10px] uppercase text-purple-500/40 font-black">{new Date(m.date).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div>
                        <h3 className={`font-black text-2xl italic tracking-tighter ${m.isEnded ? 'line-through text-gray-700' : 'text-gray-100'}`}>{m.title}</h3>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 mt-2 font-black uppercase tracking-widest">
                          <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5"><Clock className="w-3 h-3 text-purple-400" /> {m.time}</span>
                          {m.isLive && <span className="text-green-400 animate-pulse bg-green-400/10 px-3 py-1 rounded-lg border border-green-400/20 flex items-center gap-1.5"><Zap className="w-3 h-3" /> LIVE UNIT ACTIVE</span>}
                          {m.isEnded && <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/5">ARCHIVED</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {m.isEnded ? (
                         <div className="px-8 py-3 bg-white/5 rounded-2xl border border-white/5 text-gray-600 font-black uppercase text-[10px] tracking-widest">Protocol Complete</div>
                      ) : m.status === 'Pending' ? (
                        <div className="flex gap-3">
                           <button onClick={() => handleApprove(m.id)} className="px-10 py-4 rounded-2xl bg-purple-600 text-white font-black shadow-xl shadow-purple-900/30 hover:scale-[1.05] transition-all uppercase text-[10px] tracking-widest">Authorize</button>
                           <button onClick={() => setRejectionId(m.id)} className="p-4 rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5"><X className="w-5 h-5" /></button>
                        </div>
                      ) : m.status === 'Approved' ? (
                        m.isLive ? (
                          <button onClick={() => joinMeeting(m.meetingUrl)} className="px-12 py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-black font-black flex items-center gap-3 hover:scale-[1.05] transition-all shadow-2xl shadow-green-500/30 uppercase text-[10px] tracking-widest"><Video className="w-5 h-5" /> JOIN TRANSMISSION</button>
                        ) : (
                          <div className="flex items-center gap-3 px-6 py-3 bg-yellow-500/5 rounded-2xl border border-yellow-500/20">
                             <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                             <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Awaiting Admin</span>
                          </div>
                        )
                      ) : (
                        <div className="px-8 py-3 bg-red-500/5 rounded-2xl border border-red-500/10 text-red-500/30 font-black uppercase text-[10px] tracking-[0.3em]">Invitation Declined</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-10 rounded-[4rem] bg-gradient-to-br from-purple-600/5 to-transparent border border-white/5 shadow-xl">
            <h3 className="font-black mb-8 text-[10px] tracking-[0.4em] uppercase opacity-30 flex items-center gap-2"><Clock className="w-4 h-4" /> Office Schedule</h3>
            <form onSubmit={handleUpdateWorkingHours} className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-500 uppercase ml-2 tracking-widest">Start</label>
                    <input type="time" value={workingHours.start} onChange={e => setWorkingHours({...workingHours, start: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase text-white outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-500 uppercase ml-2 tracking-widest">End</label>
                    <input type="time" value={workingHours.end} onChange={e => setWorkingHours({...workingHours, end: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase text-white outline-none focus:border-purple-500" />
                  </div>
               </div>
               <button type="submit" disabled={updatingHours} className="w-full py-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all">
                 {updatingHours ? 'Saving...' : 'Sync Schedule'}
               </button>
            </form>
          </div>

          <div className="glass-panel p-10 rounded-[4rem] bg-gradient-to-br from-purple-600/5 to-transparent border border-white/5 shadow-xl">
            <h3 className="font-black mb-8 text-[10px] tracking-[0.4em] uppercase opacity-30 flex items-center gap-2"><Shield className="w-4 h-4" /> Security Terminal</h3>
            <div className="space-y-8">
               <div className="flex gap-5">
                  <div className="p-4 bg-purple-500/10 rounded-2xl h-fit border border-purple-500/20"><Zap className="w-6 h-6 text-purple-400" /></div>
                  <div>
                    <p className="font-black text-sm tracking-tight text-white/90 italic">Node Sync Enabled</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-black mt-2 tracking-wider">Your dashboard is synchronized with enterprise protocols.</p>
                  </div>
               </div>
               <div className="pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Network Load</span>
                     <span className="text-[10px] font-black text-purple-400">OPTIMAL</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 2 }} className="h-full bg-gradient-to-r from-purple-600 to-indigo-500" />
                  </div>
               </div>
            </div>
          </div>
          
          <div className="glass-panel p-10 rounded-[4rem] border border-white/5 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
             <h3 className="font-black mb-6 text-[10px] tracking-[0.4em] uppercase opacity-30">Notifications</h3>
             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {notifications.length === 0 ? (
                   <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest text-center py-10 italic">Buffer Empty</p>
                ) : (
                   notifications.map((n, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-bold text-gray-400 border-l-2 border-l-purple-500">
                         {n.message}
                      </div>
                   ))
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
