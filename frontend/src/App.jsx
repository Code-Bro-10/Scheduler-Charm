import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import UserLogin from './pages/UserLogin';
import AdminRegister from './pages/AdminRegister';
import UserRegister from './pages/UserRegister';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import TeamCollaboration from './pages/TeamCollaboration';
import ThreeBackground from './components/ThreeBackground';
import AIChatbot from './components/AIChatbot';
import ProtectedRoute from './components/ProtectedRoute';
import FirebaseStatus from './components/FirebaseStatus';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="relative min-h-screen bg-background text-white overflow-hidden">
          <ThreeBackground />
          <FirebaseStatus />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/user-login" element={<UserLogin />} />
                <Route path="/admin-register" element={<AdminRegister />} />
                <Route path="/user-register" element={<UserRegister />} />
                
                {/* Protected Routes */}
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute requiredRole="Admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/user-dashboard" element={
                  <ProtectedRoute requiredRole="User">
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/team" element={
                  <ProtectedRoute>
                    <TeamCollaboration />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <AIChatbot />
          </div>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
