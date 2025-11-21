import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAllSubmissions, reEvaluateSubmission, deleteSubmission } from '../services/api';
import SubmissionList from '../components/SubmissionList';
import GroupedSubmissionsList from '../components/GroupedSubmissionsList';
import { clearAdminSession } from '../utils/session';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [groupedSessions, setGroupedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, pending: 0, totalSessions: 0 });
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'individual'
  const navigate = useNavigate();

  useEffect(() => {
    if (viewMode === 'grouped') {
      loadGroupedSubmissions();
    } else {
      loadSubmissions();
    }
  }, [viewMode]);

  const loadGroupedSubmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/submissions/grouped');
      const sessions = response.data;
      setGroupedSessions(sessions);
      
      // Calculate stats from sessions
      let totalSubmissions = 0;
      let passedSubmissions = 0;
      let failedSubmissions = 0;
      
      sessions.forEach(session => {
        totalSubmissions += session.total_questions || 0;
        passedSubmissions += session.passed_count || 0;
        failedSubmissions += (session.total_questions - session.passed_count) || 0;
      });
      
      setStats({
        totalSessions: sessions.length,
        total: totalSubmissions,
        passed: passedSubmissions,
        failed: failedSubmissions,
        pending: 0
      });
    } catch (error) {
      console.error('Failed to load grouped submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await getAllSubmissions();
      const data = response.data;
      setSubmissions(data);
      
      // Calculate stats
      setStats({
        total: data.length,
        passed: data.filter(s => s.status === 'passed').length,
        failed: data.filter(s => s.status === 'failed').length,
        pending: data.filter(s => s.status === 'pending').length,
        totalSessions: 0
      });
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReEvaluate = async (submissionId) => {
    if (!confirm('Re-evaluate this submission?')) return;
    
    try {
      await reEvaluateSubmission(submissionId);
      await loadSubmissions();
      alert('Re-evaluation complete!');
    } catch (error) {
      alert('Re-evaluation failed: ' + error.message);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) return;
    
    try {
      await deleteSubmission(submissionId);
      await loadSubmissions();
      alert('Submission deleted successfully!');
    } catch (error) {
      alert('Failed to delete submission: ' + error.message);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login');
  };

  const handleViewDetails = (submissionId) => {
    // Navigate to submission details or open modal
    window.open(`/admin/submission/${submissionId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Manage challenges and review submissions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/courses')}
              className="btn-primary"
            >
              📚 Manage Courses
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              👥 Manage Users
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {viewMode === 'grouped' && (
            <div className="bg-indigo-50 rounded-lg shadow p-6">
              <div className="text-indigo-700 text-sm mb-1">Total Test Sessions</div>
              <div className="text-3xl font-bold text-indigo-600">{stats.totalSessions}</div>
            </div>
          )}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm mb-1">Total Submissions</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-green-700 text-sm mb-1">Passed</div>
            <div className="text-3xl font-bold text-green-600">{stats.passed}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6">
            <div className="text-red-700 text-sm mb-1">Failed</div>
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            📋 Grouped by Test Session
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'individual'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            📄 Individual Submissions
          </button>
        </div>

        {/* Submissions Display */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {viewMode === 'grouped' ? 'Test Sessions' : 'Recent Submissions'}
            </h2>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading submissions...</p>
            </div>
          ) : viewMode === 'grouped' ? (
            <div className="p-6">
              <GroupedSubmissionsList
                sessions={groupedSessions}
                onViewDetails={handleViewDetails}
              />
            </div>
          ) : (
            <SubmissionList
              submissions={submissions}
              onReEvaluate={handleReEvaluate}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
