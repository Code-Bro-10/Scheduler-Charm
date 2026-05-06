import React from 'react';
import { motion } from 'framer-motion';
import { Users, Megaphone, FileText, Share2, Activity } from 'lucide-react';

export default function TeamCollaboration() {
  const teamMembers = [
    { name: "Sarah Connor", role: "Product Manager", status: "online" },
    { name: "John Wick", role: "DevOps Engineer", status: "away" },
    { name: "Tony Stark", role: "Architect", status: "online" },
  ];

  const announcements = [
    { title: "Quarterly Planning", date: "2 hours ago", content: "Don't forget to sync your calendars for the upcoming planning session." },
    { title: "New Integration", date: "Yesterday", content: "Zoom integration is now live for all team members." },
  ];

  return (
    <div className="flex-grow flex flex-col z-10 pt-4 px-4 pb-8 max-w-[1400px] w-full mx-auto gap-8">
      <header>
        <h1 className="text-4xl font-bold mb-2">Team Workspace</h1>
        <p className="text-gray-400">Collaboration tools for high-performing teams.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Team Members */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-panel p-6 rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Active Team
            </h2>
            <div className="space-y-4">
              {teamMembers.map((member, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold">{member.name[0]}</div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#09090b] ${member.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{member.name}</h4>
                      <p className="text-[10px] text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <Activity className="w-4 h-4 text-gray-600" />
                </div>
              ))}
            </div>
          </motion.div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-purple-600/10 to-transparent">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Share2 className="w-4 h-4 text-purple-400" />Quick Share</h3>
            <p className="text-xs text-gray-400 mb-4">Share your calendar availability link with external guests.</p>
            <button className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-xs">Copy Invite Link</button>
          </div>
        </div>

        {/* Announcements & Notes */}
        <div className="lg:col-span-8 space-y-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-8 rounded-[2.5rem] border border-white/5">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-pink-400" />
              Announcements
            </h2>
            <div className="space-y-6">
              {announcements.map((a, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 relative group">
                  <span className="text-[10px] text-gray-500 absolute top-6 right-6">{a.date}</span>
                  <h3 className="font-bold text-lg mb-2 text-pink-300">{a.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">Meeting Notes</h4>
                <p className="text-[10px] text-gray-500">Collaborate on shared documents</p>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">Group Rooms</h4>
                <p className="text-[10px] text-gray-500">Persistent video chat spaces</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
