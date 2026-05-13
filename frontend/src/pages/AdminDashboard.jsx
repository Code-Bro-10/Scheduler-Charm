import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Calendar, Settings, Video, CheckCircle, 
  XCircle, UserPlus, Trash2, TrendingUp, Activity, PieChart, 
  BarChart3, Shield, Bell, Moon, Sun, Globe, Search, Filter, Plus, Send,
  ChevronDown, X, Zap, MessageCircle, BarChart, Lock, Mail, HardDrive,
  Users2, ChevronRight, Info, Edit3, Save, Play, StopCircle, LogOut, UserPlus2,
  Copy, Check, UserCheck, AtSign, UserCog, Wifi, WifiOff
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, serverTimestamp, updateDoc, query, getDoc, addDoc, where, writeBatch, onSnapshot } from 'firebase/firestore';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [employees, setEmployees] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', role: 'User' });
  const [newMeeting, setNewMeeting] = useState({ 
    title: '', date: '', time: '', selectedUsers: [], externalEmails: '', duration: 30
  });
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [updatingHours, setUpdatingHours] = useState(false);

  useEffect(() => {
    if (!adminUser) return;
    const fetchAdminHours = async () => {
      const snap = await getDoc(doc(db, 'users', adminUser.uid));
      if (snap.exists() && snap.data().workingHours) {
        setWorkingHours(snap.data().workingHours);
      }
    };
    fetchAdminHours();
  }, [adminUser]);

  const handleUpdateAdminHours = async (e) => {
    e.preventDefault();
    setUpdatingHours(true);
    try {
      await updateDoc(doc(db, 'users', adminUser.uid), { workingHours });
      alert("Working hours updated successfully!");
    } catch (err) { console.error(err); }
    setUpdatingHours(false);
  };

  const autoPlanMeeting = () => {
    if (newMeeting.selectedUsers.length === 0) return alert("Select at least one internal participant to auto-plan.");
    
    // Simple heuristic: Use the first selected user's working hours (or default)
    const firstUser = employees.find(e => e.email === newMeeting.selectedUsers[0]);
    const targetHours = firstUser?.workingHours || { start: '09:00', end: '18:00' };
    
    // Find next available slot starting from today's date if selected, or tomorrow
    let suggestedTime = targetHours.start;
    
    setNewMeeting(prev => ({ ...prev, time: suggestedTime }));
    alert(`Auto-Plan Suggested: ${suggestedTime} based on ${firstUser?.name || 'User'}'s availability.`);
  };

  useEffect(() => {
    if (socket) {
      setSocketConnected(socket.connected);
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
      return () => {
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket]);

  useEffect(() => {
    if (!adminUser) return;
    const sessionRef = doc(db, 'system', 'admin_session');
    const claimSession = async () => {
      const snap = await getDoc(sessionRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.activeAdmin && data.activeAdmin !== adminUser.email && (Date.now() - data.lastActive?.toMillis()) < 60000) {
          alert("Unauthorized session.");
          signOut(auth);
          navigate('/admin-login');
          return;
        }
      }
      await setDoc(sessionRef, { activeAdmin: adminUser.email, lastActive: serverTimestamp() }, { merge: true });
    };
    claimSession();
    const interval = setInterval(() => updateDoc(sessionRef, { lastActive: serverTimestamp() }), 30000);
    return () => clearInterval(interval);
  }, [adminUser, navigate]);

  useEffect(() => {
    const unsubEmp = onSnapshot(collection(db, 'users'), (snapshot) => {
      const empList = [];
      snapshot.forEach(doc => empList.push({ id: doc.id, ...doc.data() }));
      setEmployees(empList);
    });
    const unsubMeet = onSnapshot(collection(db, 'meetings'), (snapshot) => {
      const meetList = [];
      snapshot.forEach(doc => meetList.push({ id: doc.id, ...doc.data() }));
      const sorted = meetList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setMeetings(sorted);
      if (selectedGroup) {
        const updated = sorted.filter(m => m.groupID === selectedGroup.groupID);
        setSelectedGroup(prev => ({ ...prev, participants: updated }));
      }
    });
    return () => { unsubEmp(); unsubMeet(); };
  }, [selectedGroup?.groupID]);

  const handleLogout = async () => {
    await updateDoc(doc(db, 'system', 'admin_session'), { activeAdmin: null });
    await signOut(auth);
    navigate('/admin-login');
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'users'), {
        ...newEmployee,
        isAvailable: true,
        createdAt: serverTimestamp()
      });
      setNewEmployee({ name: '', email: '', role: 'User' });
      alert("Team member added!");
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm("Remove this member?")) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    const externals = newMeeting.externalEmails.split(',').map(em => em.trim()).filter(em => em.includes('@'));
    const totalParticipants = [...newMeeting.selectedUsers, ...externals];
    
    if (totalParticipants.length === 0) return alert("Select at least one participant");
    setLoading(true);
    
    try {
      const groupID = `grp_${Date.now()}`;
      const roomName = `Meet-${newMeeting.title.replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
      const sharedLink = `https://meet.jit.si/${roomName}`;

      const promises = totalParticipants.map(async (email) => {
        const isExternal = !newMeeting.selectedUsers.includes(email);
        const selectedUser = employees.find(emp => emp.email === email);
        
        if (socket && socket.connected) {
          socket.emit('send_invitation_email', {
            to: email, userName: selectedUser?.name || 'Guest Participant',
            meetingTitle: newMeeting.title, date: newMeeting.date,
            time: newMeeting.time, meetingUrl: sharedLink
          });
        }
        
        return addDoc(collection(db, 'meetings'), {
          title: newMeeting.title, date: newMeeting.date, time: newMeeting.time,
          userEmail: email, userName: selectedUser?.name || 'Guest Participant',
          status: 'Pending', meetingUrl: sharedLink,
          createdAt: serverTimestamp(), groupID: groupID, isLive: false, isEnded: false,
          isExternal: isExternal
        });
      });
      await Promise.all(promises);
      setNewMeeting({ title: '', date: '', time: '', selectedUsers: [], externalEmails: '' });
      alert("Invitations dispatched!");
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleStartMeeting = async () => {
    const batch = writeBatch(db);
    selectedGroup.participants.forEach(p => batch.update(doc(db, 'meetings', p.id), { isLive: true }));
    await batch.commit();

    if (socket && socket.connected) {
      console.log("Emitting meeting_started event...");
      socket.emit('meeting_started', {
        meetingTitle: selectedGroup.title,
        date: selectedGroup.date,
        time: selectedGroup.time,
        meetingUrl: selectedGroup.participants[0].meetingUrl,
        participants: selectedGroup.participants.map(p => ({ email: p.userEmail, name: p.userName }))
      });
    } else {
      alert("⚠️ Mail Server Disconnected! Emails could not be sent, but the meeting is starting.");
    }

    window.open(selectedGroup.participants[0].meetingUrl, '_blank');
  };

  const handleEndMeeting = async () => {
    if (!window.confirm("End session?")) return;
    const batch = writeBatch(db);
    selectedGroup.participants.forEach(p => batch.update(doc(db, 'meetings', p.id), { isLive: false, isEnded: true, status: 'Completed' }));
    await batch.commit();
    setSelectedGroup(null);
  };

  const groupedMeetings = meetings.reduce((acc, current) => {
    const group = acc.find(item => item.groupID === current.groupID);
    if (!group) acc.push({ ...current, participants: [current] });
    else group.participants.push(current);
    return acc;
  }, []);

  const tabs = [
    { icon: <LayoutDashboard />, label: "Dashboard" },
    { icon: <Calendar />, label: "Schedule" },
    { icon: <Users />, label: "Users" },
    { icon: <Settings />, label: "Settings" }
  ];

  return (
    <div className="flex-grow flex z-10 pt-4 px-4 pb-8 max-w-[1400px] w-full mx-auto gap-6 overflow-hidden">
      <AnimatePresence>
        {selectedGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGroup(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass-panel p-10 rounded-[3rem] bg-[#0a0a0c] border-white/10 shadow-2xl overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <h3 className="text-3xl font-black italic text-white tracking-tighter">{selectedGroup.title}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">{selectedGroup.date} • {selectedGroup.time}</p>
                   </div>
                   <button onClick={() => setSelectedGroup(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                   {selectedGroup.participants.map((p, i) => (
                     <div key={i} className={`flex items-center justify-between p-5 bg-white/5 rounded-3xl border ${p.status === 'Rejected' ? 'border-red-500/20' : 'border-white/5'}`}>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400 text-xs">{p.userName[0]}</div>
                           <div><p className="font-bold text-sm text-gray-300">{p.userName}</p><p className="text-[9px] text-gray-600 font-bold">{p.userEmail}</p></div>
                        </div>
                        <span className={`text-[9px] font-black px-4 py-1 rounded-full uppercase ${p.status === 'Approved' ? 'text-green-400 bg-green-400/10' : p.status === 'Rejected' ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>{p.status}</span>
                     </div>
                   ))}
                </div>
                <div className="mt-8 flex gap-4">
                   {selectedGroup.participants.some(p => p.isLive) ? (
                     <button onClick={handleEndMeeting} className="flex-grow py-5 bg-red-600 rounded-2xl font-black text-white shadow-xl shadow-red-900/20 uppercase text-xs tracking-widest">Terminate Session</button>
                   ) : selectedGroup.participants[0].status !== 'Completed' ? (
                     <button onClick={handleStartMeeting} className="flex-grow py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-black text-white shadow-xl shadow-purple-900/20 uppercase text-xs tracking-widest hover:scale-[1.01]">Start & Dispatch Alerts</button>
                   ) : (
                     <div className="flex-grow py-5 bg-white/5 border border-white/10 rounded-2xl text-center text-gray-500 font-black uppercase text-[10px]">Session Concluded</div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-64 glass-panel rounded-[2.5rem] p-6 hidden lg:flex flex-col gap-8 h-[calc(100vh-8rem)] sticky top-24 border-white/5 shadow-2xl">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center font-black">A</div><h3 className="font-bold text-sm tracking-tight text-white/80 italic">Command Unit</h3></div>
        <nav className="flex flex-col gap-2">
          {tabs.map((item, i) => (
            <button key={i} onClick={() => setActiveTab(item.label)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === item.label ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:bg-white/5'}`}>{item.icon} <span className="font-bold text-sm">{item.label}</span></button>
          ))}
        </nav>
        
        <div className="mt-auto flex flex-col gap-4">
           <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${socketConnected ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
              {socketConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{socketConnected ? 'Mail Server Active' : 'Mail Server Offline'}</span>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all font-black text-xs uppercase tracking-widest border border-white/5"><LogOut className="w-4 h-4" /> Shutdown</button>
        </div>
      </motion.div>

      <div className="flex-grow flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence mode="wait">
          {activeTab === 'Dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="glass-panel p-8 rounded-[3rem] h-[350px]">
                  <h2 className="text-xl font-black italic mb-6">Traffic Matrix</h2>
                  <Line data={{labels:['M','T','W','T','F'], datasets:[{label:'Pulse', data:[10,25,18,30,22], borderColor:'rgb(168,85,247)', tension:0.4, fill:true, backgroundColor:'rgba(168,85,247,0.1)'}]}} options={{maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{display:false},x:{grid:{display:false},ticks:{color:'rgba(255,255,255,0.2)'}}}}} />
               </div>
               <div className="glass-panel p-8 rounded-[3rem] h-[350px]">
                  <h2 className="text-xl font-black italic mb-6 flex items-center gap-2 text-purple-400"><Zap className="w-5 h-5" />Network Nodes</h2>
                  <div className="space-y-4 h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                     {employees.map(e => (
                       <div key={e.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${e.isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} /><p className="font-bold text-sm tracking-tight text-gray-300">{e.name || e.email}</p></div>
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{e.isAvailable ? 'Online' : 'Offline'}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'Schedule' && (
            <motion.div key="sched" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-panel p-10 rounded-[3rem] border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent shadow-2xl">
                <h2 className="text-3xl font-black mb-8 italic tracking-tighter text-white">Initialize Meeting</h2>
                <form onSubmit={handleCreateMeeting} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input type="text" required value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} placeholder="Session Title" className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 text-sm text-white" />
                    <input type="date" required value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase text-white" />
                    <div className="flex gap-2">
                      <input type="time" required value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="flex-grow bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase text-white outline-none focus:border-purple-500" />
                      <button 
                        type="button" 
                        onClick={autoPlanMeeting}
                        className="px-4 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-2xl hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase whitespace-nowrap"
                      >
                        <Shield className="w-3 h-3" />
                        Auto-Plan
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <AtSign className="w-5 h-5 text-purple-400" />
                        <input type="text" value={newMeeting.externalEmails} onChange={e => setNewMeeting({...newMeeting, externalEmails: e.target.value})} placeholder="Invite guest emails (separate with commas)" className="flex-grow bg-transparent outline-none text-xs text-white" />
                     </div>
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Internal Team ({newMeeting.selectedUsers.length})</p>
                           <button type="button" onClick={() => setNewMeeting(prev => ({...prev, selectedUsers: employees.map(e => e.email)}))} className="text-[9px] font-black text-purple-400 uppercase tracking-widest hover:text-purple-300">Select All</button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                           {employees.map(e => (
                             <button key={e.id} type="button" onClick={() => setNewMeeting(prev => ({...prev, selectedUsers: prev.selectedUsers.includes(e.email) ? prev.selectedUsers.filter(u => u !== e.email) : [...prev.selectedUsers, e.email]}))} className={`px-4 py-2 rounded-xl text-[9px] font-black border transition-all ${newMeeting.selectedUsers.includes(e.email) ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>{e.name || e.email} <span className="opacity-40 ml-1 text-[7px]">({e.workingHours?.start || '9:00'}-{e.workingHours?.end || '18:00'})</span></button>
                           ))}
                        </div>
                     </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-5 bg-purple-600 rounded-2xl font-black tracking-[0.2em] shadow-xl uppercase text-xs hover:scale-[1.01] transition-all">Dispatch Invitations</button>
                </form>
              </div>
              <div className="glass-panel p-8 rounded-[3rem]">
                <h2 className="text-2xl font-black mb-8 italic text-white/90">Meeting Protocols</h2>
                <div className="space-y-4">
                   {groupedMeetings.map((group, i) => (
                     <div key={i} onClick={() => setSelectedGroup(group)} className={`flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer ${group.participants.some(p => p.isLive) ? 'bg-green-500/5 border-green-500/20 shadow-lg shadow-green-900/10' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                        <div className="flex items-center gap-6">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${group.participants.some(p => p.isLive) ? 'bg-green-500/20 border-green-500/50' : 'bg-purple-500/10 border-purple-500/20'}`}><Users2 className="w-6 h-6 text-purple-400" /></div>
                           <div><h4 className="text-xl font-bold tracking-tight italic text-gray-200">{group.title}</h4><p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{group.date} • {group.time}</p></div>
                        </div>
                        <div className="flex items-center gap-4">
                           {group.participants.some(p => p.isLive) && <span className="text-[9px] font-black text-green-400 tracking-[0.2em] bg-green-400/10 px-3 py-1 rounded animate-pulse border border-green-400/20">LIVE NOW</span>}
                           <ChevronRight className="w-5 h-5 text-gray-700" />
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-panel p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <h2 className="text-3xl font-black mb-8 italic text-white tracking-tighter flex items-center gap-3">
                  <UserPlus2 className="w-8 h-8 text-purple-400" /> Add Team Member
                </h2>
                <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Full Name</label>
                    <input type="text" required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 text-sm text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Official Email</label>
                    <input type="email" required value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} placeholder="john@company.com" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 text-sm text-white" />
                  </div>
                  <button type="submit" disabled={loading} className="md:col-span-2 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl hover:scale-[1.01] transition-all">Add Member to Database</button>
                </form>
              </div>

              <div className="glass-panel p-8 rounded-[3rem] border border-white/5">
                <h2 className="text-2xl font-black mb-8 italic text-white/90">Registered Personnel</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                   {employees.map(e => (
                     <div key={e.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col gap-4 relative group hover:bg-white/[0.08] transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center font-black text-purple-400">{e.name?.[0] || 'U'}</div>
                           <div className="overflow-hidden">
                              <h4 className="font-bold text-gray-200 truncate">{e.name || 'No Name'}</h4>
                              <p className="text-[10px] text-gray-500 truncate">{e.email}</p>
                           </div>
                        </div>
                        <button onClick={() => handleDeleteEmployee(e.id)} className="absolute top-4 right-4 p-2 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[8px] font-black px-3 py-1 bg-white/5 rounded-full uppercase tracking-widest text-gray-400">{e.role}</span>
                           <span className={`w-2 h-2 rounded-full ${e.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               <div className="glass-panel p-10 rounded-[3rem] border border-white/5">
                 <h2 className="text-3xl font-black mb-8 italic text-white tracking-tighter flex items-center gap-3">
                   <UserCog className="w-8 h-8 text-purple-400" /> Admin Preferences
                 </h2>
                 <form onSubmit={handleUpdateAdminHours} className="space-y-6 max-w-md mx-auto">
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest text-left block">My Office Start Time</label>
                       <input type="time" required value={workingHours.start} onChange={e => setWorkingHours({...workingHours, start: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 text-sm text-white" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest text-left block">My Office End Time</label>
                       <input type="time" required value={workingHours.end} onChange={e => setWorkingHours({...workingHours, end: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-purple-500 text-sm text-white" />
                     </div>
                   </div>
                   <button type="submit" disabled={updatingHours} className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl hover:scale-[1.01] transition-all">
                     {updatingHours ? 'Syncing...' : 'Update Office Hours'}
                   </button>
                 </form>
               </div>
               <div className="p-10 text-center">
                 <p className="text-gray-500 text-sm">Organization protocols are active and monitoring nodes.</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
