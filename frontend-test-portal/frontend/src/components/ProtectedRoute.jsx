import { Navigate } from 'react-router-dom';

// Protected Route Component - Requires user to be logged in
export default function ProtectedRoute({ children }) {
  const userId = localStorage.getItem('userId');
  const userToken = localStorage.getItem('userToken');
  
  // If no user is logged in, redirect to login page
  if (!userId || !userToken) {
    return <Navigate to="/login" replace />;
  }
  
  // User is logged in, allow access
  return children;
}
