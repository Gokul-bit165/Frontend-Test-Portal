import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CandidateDashboard from './pages/CandidateDashboard';
import ChallengeView from './pages/ChallengeView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ChallengeManager from './pages/ChallengeManager';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    setIsAdmin(!!token);
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<CandidateDashboard />} />
          <Route path="/challenge/:id" element={<ChallengeView />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/login" 
            element={<AdminLogin onLogin={() => setIsAdmin(true)} />} 
          />
          <Route 
            path="/admin/dashboard" 
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/challenges" 
            element={isAdmin ? <ChallengeManager /> : <Navigate to="/admin/login" />} 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
