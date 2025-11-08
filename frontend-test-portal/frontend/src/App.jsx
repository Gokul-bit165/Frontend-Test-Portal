import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CoursesHome from './pages/CoursesHome';
import CourseDetail from './pages/CourseDetail';
import LevelPage from './pages/LevelPage';
import CandidateDashboard from './pages/CandidateDashboard';
import ChallengeView from './pages/ChallengeView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CourseManager from './pages/CourseManager';
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
          <Route path="/" element={<CoursesHome />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/course/:courseId/level/:level" element={<LevelPage />} />
          <Route path="/old-challenges" element={<CandidateDashboard />} />
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
            path="/admin/courses" 
            element={isAdmin ? <CourseManager /> : <Navigate to="/admin/login" />} 
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
