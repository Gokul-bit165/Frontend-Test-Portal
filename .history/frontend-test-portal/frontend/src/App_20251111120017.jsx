import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CoursesHome from './pages/CoursesHome';
import CourseDetail from './pages/CourseDetail';
import LevelPage from './pages/LevelPage';
import LevelChallenge from './pages/LevelChallenge';
import LevelChallengeNew from './pages/LevelChallengeNew';
import LevelChallengeOld from './pages/LevelChallengeOld';
import LevelChallengeTest from './pages/LevelChallengeTest';
import LevelResults from './pages/LevelResults';
import CandidateDashboard from './pages/CandidateDashboard';
import ChallengeView from './pages/ChallengeView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboardNew';
import CourseManager from './pages/CourseManager';
import UserLogin from './pages/UserLogin';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

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
          {/* Public Routes - Only Login Pages */}
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin/login" 
            element={<Login onLogin={() => setIsAdmin(true)} />} 
          />
          
          {/* Protected Student Routes - Require Login */}
          <Route path="/" element={<ProtectedRoute><CoursesHome /></ProtectedRoute>} />
          <Route path="/course/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/course/:courseId/level/:level" element={<ProtectedRoute><LevelPage /></ProtectedRoute>} />
          <Route path="/level/:courseId/:level" element={<ProtectedRoute><LevelChallengeOld /></ProtectedRoute>} />
          <Route path="/level-results/:courseId/:level" element={<ProtectedRoute><LevelResults /></ProtectedRoute>} />
          <Route path="/old-challenges" element={<ProtectedRoute><CandidateDashboard /></ProtectedRoute>} />
          <Route path="/challenge/:id" element={<ProtectedRoute><ChallengeView /></ProtectedRoute>} />
          
          {/* Admin Routes - Require Admin Login */}
          <Route 
            path="/admin/dashboard" 
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/courses" 
            element={isAdmin ? <CourseManager /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/users" 
            element={isAdmin ? <UserManagement /> : <Navigate to="/admin/login" />} 
          />
          
          {/* Fallback - Redirect to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
