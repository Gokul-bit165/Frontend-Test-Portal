import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login({ isAdmin = false, onLogin }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const endpoint = isAdmin 
        ? 'http://localhost:5000/api/auth/admin/login'
        : 'http://localhost:5000/api/auth/login';
      
      const response = await axios.post(endpoint, credentials);
      
      if (isAdmin) {
        // Store admin info
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        
        // Call onLogin callback
        if (onLogin) onLogin();
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        // Store user info
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('username', response.data.user.username);
        localStorage.setItem('userToken', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        
        // Redirect to courses
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isAdmin 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${
            isAdmin ? 'text-white' : 'text-gray-900'
          }`}>
            {isAdmin ? 'Admin Portal' : 'Frontend Test Portal'}
          </h1>
          <p className={isAdmin ? 'text-gray-400' : 'text-gray-600'}>
            {isAdmin ? 'Frontend Test Platform Management' : 'Sign in to continue learning'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isAdmin ? 'Admin Login' : 'Student Login'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                onKeyPress={handleKeyPress}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                  isAdmin ? 'focus:ring-gray-500' : 'focus:ring-indigo-500'
                }`}
                placeholder={isAdmin ? 'Enter admin username' : 'Enter your username'}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                onKeyPress={handleKeyPress}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                  isAdmin ? 'focus:ring-gray-500' : 'focus:ring-indigo-500'
                }`}
                placeholder={isAdmin ? 'Enter admin password' : 'Enter your password'}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdmin 
                  ? 'bg-gray-900 hover:bg-gray-800' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          {/* Demo Credentials (Admin Only) */}
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Demo Credentials:<br />
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">admin / admin123</span>
              </p>
            </div>
          )}

          {/* Navigation Link */}
          <div className={`text-center ${isAdmin ? 'mt-4' : 'mt-6 pt-6 border-t border-gray-200'}`}>
            <button
              onClick={() => navigate(isAdmin ? '/login' : '/admin/login')}
              className={`text-sm font-medium transition-colors ${
                isAdmin 
                  ? 'text-gray-600 hover:text-gray-900' 
                  : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              {isAdmin ? '← Back to Student Login' : 'Admin Login →'}
            </button>
          </div>
        </div>

        {/* Help Text (Student Only) */}
        {!isAdmin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account? Contact your administrat
            </p>
          </div>
        )}
      </div>
    </div>
  );
}