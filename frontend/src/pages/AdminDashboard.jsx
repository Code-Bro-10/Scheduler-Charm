import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Calendar, Settings, Video, CheckCircle, XCircle, UserPlus, Trash2, TrendingUp, Activity, PieChart } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, serverTimestamp, updateDoc, query, getDoc } from 'firebase/firestore';
import { useSocket } from '../context/SocketContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [employees, setEmployees] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', role: 'User' });
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const [stats, setStats] = useState([
    { label: "Total Meetings", value: "0", trend: "0%", color: "text-purple-400" },
    { label: "Active Users", value: "0", trend: "0%", color: "text-blue-400" },
    { label: "Pending Requests", value: "0", trend: "0%", color: "text-pink-400" },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const empSnapshot = await getDocs(collection(db, 'users'));
      const empList = [];
      empSnapshot.forEach((doc) => {
        empList.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(empList);

      const meetSnapshot = await getDocs(collection(db, 'meetings'));
      const meetList = [];
      meetSnapshot.forEach((doc) => {
        meetList.push({ id: doc.id, ...doc.data() });
      });

      const sortedMeetings = meetList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      setMeetings(sortedMeetings);

      setStats([
        { label: "Total Meetings", value: sortedMeetings.length.toString(), trend: "+12%", color: "text-purple-400" },
        { label: "Active Users", value: empList.length.toString(), trend: "+5%", color: "text-blue-400" },
        { label: "Pending Requests", value: sortedMeetings.filter(m => m.status === 'Pending').length.toString(), trend: "-2%", color: "text-pink-400" },
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleMeetingStatus = async (meetingId, newStatus) => {
    try {
      const meetingRef = doc(db, 'meetings', meetingId);
      const meetingSnap = await getDoc(meetingRef);
      
      if (meetingSnap.exists()) {
        const meetingData = meetingSnap.data();
        await updateDoc(meetingRef, { status: newStatus });
        
        // Trigger backend to send email via Socket
        if (socket) {
          socket.emit('meeting_status_change', {
            to: meetingData.userEmail,
            userName: meetingData.userName,
            meetingTitle: meetingData.title,
            date: meetingData.date,
            time: meetingData.time,
            status: newStatus,
            meetingUrl: meetingData.meetingUrl
          });
        }
        
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to remove this user? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'users', employeeId));
      alert('User removed successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error removing user.');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, 'users', newEmployee.email);
      await setDoc(userRef, {
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        createdAt: serverTimestamp()
      });
      setNewEmployee({ name: '', email: '', role: 'User' });
      alert('Employee added successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Meetings',
      data: [12, 19, 15, 25, 22, 10, 8],
      fill: true,
      borderColor: 'rgb(124, 58, 237)',
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      tension: 0.4
    }]
  };

  const doughnutData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{
      data: [65, 25, 10],
      backgroundColor: [
        'rgba(34, 197, 94, 0.6)',
        'rgba(234, 179, 8, 0.6)',
        'rgba(239, 68, 68, 0.6)',
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12 }
    },
    scales: {
      y: { display: false },
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
    }
  };

  const tabs = [
    { icon: <LayoutDashboard />, label: "Dashboard" },
    { icon: <Calendar />, label: "Schedule" },
    { icon: <Users />, label: "Users" },
    { icon: <TrendingUp />, label: "Analytics" },
    { icon: <Settings />, label: "Settings" }
  ];

  return (
    <div className="flex-grow flex z-10 pt-4 px-4 pb-8 max-w-[1400px] w-full mx-auto gap-6">
      <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-64 glass-panel rounded-3xl p-6 hidden lg:flex flex-col gap-8 h-[calc(100vh-8rem)] sticky top-24">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">A</div>
          <div><h3 className="font-semibold">Admin Panel</h3><p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Premium</p></div>
        </div>
        <nav className="flex flex-col gap-2">
          {tabs.map((item, i) => (
            <button key={i} onClick={() => setActiveTab(item.label)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.label ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              {item.icon} <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </motion.div>

      <div className="flex-grow flex flex-col gap-6">
        {activeTab === 'Dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <motion.div key={i} className="glass-panel p-6 rounded-3xl relative group cursor-pointer overflow-hidden">
                  <p className="text-gray-400 text-sm font-medium mb-2">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <h3 className={`text-4xl font-bold ${stat.color}`}>{stat.value}</h3>
                    <span className="text-xs text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded-full">{stat.trend}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/5">
                 <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" />Meeting Velocity</h2>
                 <Line data={lineChartData} options={chartOptions} />
              </div>
              <div className="glass-panel p-6 rounded-3xl border border-white/5">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-pink-400" />Distribution</h2>
                <div className="h-64 flex justify-center"><Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} /></div>
              </div>
            </div>

            <motion.div className="glass-panel rounded-3xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-6">Real-time Meeting Requests</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="text-gray-400 text-sm border-b border-white/5"><th className="pb-3">Topic</th><th className="pb-3">User</th><th className="pb-3">Status</th><th className="pb-3 text-right">Action</th></tr></thead>
                  <tbody>
                    {meetings.map((m) => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 font-medium">{m.title}</td>
                        <td className="py-4 text-gray-400">{m.userName}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${m.status === 'Approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : m.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {m.status === 'Pending' && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleMeetingStatus(m.id, 'Approved')} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleMeetingStatus(m.id, 'Rejected')} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><XCircle className="w-4 h-4" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        {activeTab === 'Users' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 glass-panel rounded-3xl p-6 h-fit border border-purple-500/30">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-400" />Provision User</h2>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <input type="text" required value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" placeholder="Full Name" />
                <input type="email" required value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" placeholder="Email" />
                <select value={newEmployee.role} onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})} className="w-full bg-[#1c1c22] border border-white/10 rounded-xl p-3 text-white">
                  <option value="User">User</option><option value="Admin">Admin</option>
                </select>
                <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">Deploy User</button>
              </form>
            </div>
            <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-6">Directory</h2>
              <div className="space-y-3">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">{emp.name[0]}</div>
                      <div><h4 className="font-semibold">{emp.name}</h4><p className="text-xs text-gray-500">{emp.email}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${emp.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{emp.role}</span>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 opacity-0 group-hover:opacity-100 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
