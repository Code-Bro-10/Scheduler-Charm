import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Video, ChevronRight, User as UserIcon, Bell, Sparkles, Plus, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSocket } from '../context/SocketContext';

export default function UserDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socket = useSocket();
  const user = auth.currentUser;

  const availableSlots = [
    "09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"
  ];

  const aiSuggestions = [
    { time: "11:00 AM", reason: "Most productive for you", confidence: 95 },
    { time: "03:30 PM", reason: "Gap between existing calls", confidence: 88 }
  ];

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.emit('join_room', user?.email);
      socket.on('receive_notification', (data) => {
        setNotifications(prev => [data, ...prev]);
      });
    }
    return () => {
      if (socket) socket.off('receive_notification');
    };
  }, [socket, user]);

  const fetchMeetings = async () => {
    try {
      // FIX: Removed 'orderBy' from Firestore query to avoid the "Index Required" error.
      // We will sort the results in JavaScript instead.
      const q = query(
        collection(db, 'meetings'),
        where('userEmail', '==', user.email)
      );
      const querySnapshot = await getDocs(q);
      const meetings = [];
      querySnapshot.forEach((doc) => {
        meetings.push({ id: doc.id, ...doc.data() });
      });

      // Sort by date and time in JavaScript
      const sortedMeetings = meetings.sort((a, b) => {
        return new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`);
      });

      setUpcomingMeetings(sortedMeetings);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  };

  const handleBooking = async () => {
    if (!topic || !selectedSlot) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'meetings'), {
        title: topic,
        date: selectedDate,
        time: selectedSlot,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        status: 'Pending',
        platform: 'Jitsi Meet',
        meetingUrl: `https://meet.jit.si/${encodeURIComponent(topic)}-${Date.now()}`,
        createdAt: serverTimestamp()
      });
      setTopic('');
      setSelectedSlot('');
      fetchMeetings();
      if (socket) socket.emit('send_notification', { room: 'admin_room', message: `New meeting request from ${user.displayName}` });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const joinMeeting = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="flex-grow flex flex-col z-10 pt-4 px-4 pb-8 max-w-[1400px] w-full mx-auto gap-8">
      <header className="flex justify-between items-start mb-4">
        <div>
          <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-4xl font-bold mb-2">Hello, {user?.displayName?.split(' ')[0]}</motion.h1>
          <p className="text-gray-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI predicts a 15% productivity boost if you schedule your focus time now.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="relative p-3 rounded-2xl glass-panel hover:bg-white/10 transition-colors">
            <Bell className="w-6 h-6 text-gray-300" />
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />}
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center p-[1px] shadow-lg">
             {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <div className="w-full h-full rounded-2xl bg-[#09090b] flex items-center justify-center font-bold">{user?.email[0].toUpperCase()}</div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Plus className="w-6 h-6 text-purple-400" />
              Instant Booking
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Topic</label>
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="What's this meeting about?" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-600 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-purple-500 transition-all outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Suggested by Charm AI</label>
                <div className="grid grid-cols-1 gap-3">
                  {aiSuggestions.map((s, i) => (
                    <button key={i} onClick={() => setSelectedSlot(s.time)} className={`p-4 rounded-2xl border transition-all text-left relative group ${selectedSlot === s.time ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{s.time}</span>
                        <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded">{s.confidence}% match</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{s.reason}</p>
                    </button>
                  ))}
                  <div className="flex items-center gap-2 my-2"><div className="flex-grow border-t border-white/5" /><span className="text-[10px] text-gray-600 font-bold">OR SELECT MANUAL</span><div className="flex-grow border-t border-white/5" /></div>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.slice(0, 3).map((slot, i) => (
                      <button key={i} onClick={() => setSelectedSlot(slot)} className={`p-2 rounded-xl border text-[10px] font-bold transition-all ${selectedSlot === slot ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 hover:bg-white/5'}`}>{slot}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleBooking} disabled={loading} className="w-full mt-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:translate-y-[-2px] transition-all">
                  {loading ? 'Analyzing...' : 'Secure Slot'}
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5">
              <h3 className="font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" />Action Items</h3>
              <div className="space-y-3">
                {['Prepare Q3 Report', 'Email Team Leads', 'Review Designs'].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-4 h-4 rounded border border-gray-500" />
                    <span className="text-sm text-gray-300">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent">
              <h3 className="font-bold mb-4">Charm Score</h3>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-blue-400">92</span>
                <span className="text-sm text-gray-500 mb-2">/ 100</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">You are 8% more organized than last week! Keep it up.</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-8">
           <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-purple-400" />Active Sessions</h2>
            <div className="space-y-4">
              <AnimatePresence>
                {upcomingMeetings.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No meetings scheduled.</p>
                ) : (
                  upcomingMeetings.map((m, i) => (
                    <motion.div key={m.id} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="glass-panel p-5 rounded-3xl border border-white/5 group relative overflow-hidden">
                      <div className={`absolute left-0 top-0 w-1 h-full ${m.status === 'Approved' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg group-hover:text-purple-400 transition-colors">{m.title}</h4>
                          <p className="text-xs text-gray-500">{m.date} • {m.time}</p>
                        </div>
                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-purple-300 font-bold tracking-widest uppercase">{m.platform}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(j => <div key={j} className="w-6 h-6 rounded-full border-2 border-background bg-gray-800 flex items-center justify-center text-[8px] font-bold">U{j}</div>)}
                        </div>
                        <button onClick={() => joinMeeting(m.meetingUrl)} className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${m.status === 'Approved' ? 'bg-purple-600 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}>
                          <Video className="w-4 h-4" />
                          {m.status === 'Approved' ? 'Launch Room' : 'Awaiting Approval'}
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
