import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionManagerModal from '../components/QuestionManagerModal';
import SubmissionList from '../components/SubmissionList';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Overview data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubmissions: 0,
    totalCourses: 0,
    totalChallenges: 0
  });

  // Users data
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Submissions data
  const [submissions, setSubmissions] = useState([]);
  const [submissionSearch, setSubmissionSearch] = useState('');

  // Courses data
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  
  // Question Manager
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Challenges data
  const [challenges, setChallenges] = useState([]);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // Progress data
  const [progressData, setProgressData] = useState([]);

  // Assets data
  const [assets, setAssets] = useState([]);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadSubmissions(),
        loadCourses(),
        loadChallenges(),
        loadProgress(),
        loadAssets()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data || []);
      setStats(prev => ({ ...prev, totalUsers: res.data?.length || 0 }));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/submissions');
      setSubmissions(res.data || []);
      setStats(prev => ({ ...prev, totalSubmissions: res.data?.length || 0 }));
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses');
      setCourses(res.data || []);
      setStats(prev => ({ ...prev, totalCourses: res.data?.length || 0 }));
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const loadChallenges = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/challenges');
      setChallenges(res.data || []);
      setStats(prev => ({ ...prev, totalChallenges: res.data?.length || 0 }));
    } catch (error) {
      console.error('Failed to load challenges:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/progress');
      setProgressData(res.data || []);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const loadAssets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/assets');
      setAssets(res.data || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleUploadAsset = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAsset(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('asset', file);
        formData.append('category', 'general'); // Can be changed to dropdown value

        await axios.post('http://localhost:5000/api/assets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      await loadAssets();
      alert('Asset(s) uploaded successfully!');
      e.target.value = ''; // Reset file input
    } catch (error) {
      alert('Failed to upload asset: ' + error.message);
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleDeleteAsset = async (filename) => {
    if (!confirm('Delete this asset? This cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/assets/${filename}`);
      await loadAssets();
      alert('Asset deleted successfully');
    } catch (error) {
      alert('Failed to delete asset: ' + error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Path copied to clipboard!');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This will remove all their progress.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
      await loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/submissions/${submissionId}`);
      await loadSubmissions();
      alert('Submission deleted successfully');
    } catch (error) {
      alert('Failed to delete submission: ' + error.message);
    }
  };

  const handleReEvaluate = async (submissionId) => {
    if (!confirm('Re-evaluate this submission?')) return;
    try {
      await axios.post(`http://localhost:5000/api/evaluate`, { submissionId });
      await loadSubmissions();
      alert('Re-evaluation complete!');
    } catch (error) {
      alert('Failed to re-evaluate: ' + error.message);
    }
  };

  const handleSaveCourse = async (courseData) => {
    try {
      if (editingCourse?.id) {
        await axios.put(`http://localhost:5000/api/courses/${editingCourse.id}`, courseData);
      } else {
        await axios.post('http://localhost:5000/api/courses', courseData);
      }
      await loadCourses();
      setShowCourseModal(false);
      setEditingCourse(null);
      alert('Course saved successfully');
    } catch (error) {
      alert('Failed to save course: ' + error.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course? This will affect all users enrolled.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`);
      await loadCourses();
      alert('Course deleted successfully');
    } catch (error) {
      alert('Failed to delete course: ' + error.message);
    }
  };

  const handleSaveChallenge = async (challengeData) => {
    try {
      if (editingChallenge?.id) {
        await axios.put(`http://localhost:5000/api/challenges/${editingChallenge.id}`, challengeData);
      } else {
        await axios.post('http://localhost:5000/api/challenges', challengeData);
      }
      await loadChallenges();
      setShowChallengeModal(false);
      setEditingChallenge(null);
      alert('Challenge saved successfully');
    } catch (error) {
      alert('Failed to save challenge: ' + error.message);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!confirm('Delete this challenge?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/challenges/${challengeId}`);
      await loadChallenges();
      alert('Challenge deleted successfully');
    } catch (error) {
      alert('Failed to delete challenge: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.userId?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(s =>
    s.candidateName?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
    s.challengeId?.toLowerCase().includes(submissionSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🛡️ Admin Dashboard</h1>
              <p className="text-indigo-100 mt-1">Comprehensive platform management</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                🏠 Home
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'users', label: '👥 Users', icon: '👥' },
              { id: 'courses', label: '📚 Courses', icon: '📚' },
              { id: 'submissions', label: '📝 Submissions', icon: '📝' },
              { id: 'progress', label: '📈 Progress', icon: '📈' },
              { id: 'assets', label: '📁 Assets', icon: '📁' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold transition-colors border-b-4 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Platform Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-sm opacity-90 mb-2">Total Users</div>
                    <div className="text-4xl font-bold">{stats.totalUsers}</div>
                    <div className="mt-2 text-xs opacity-75">Registered accounts</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-sm opacity-90 mb-2">Total Courses</div>
                    <div className="text-4xl font-bold">{stats.totalCourses}</div>
                    <div className="mt-2 text-xs opacity-75">Available courses</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-sm opacity-90 mb-2">Submissions</div>
                    <div className="text-4xl font-bold">{stats.totalSubmissions}</div>
                    <div className="mt-2 text-xs opacity-75">Total attempts</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setEditingCourse(null);
                        setShowCourseModal(true);
                      }}
                      className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <div className="text-3xl mb-2">➕</div>
                      <div className="font-semibold">Add Course</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <div className="text-3xl mb-2">👥</div>
                      <div className="font-semibold">View Users</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('submissions')}
                      className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <div className="text-3xl mb-2">📝</div>
                      <div className="font-semibold">View Submissions</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">Recent Submissions</h3>
                  <div className="space-y-2">
                    {submissions.slice(0, 5).map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold">{sub.candidateName}</div>
                          <div className="text-sm text-gray-600">{sub.challengeId}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          sub.status === 'passed' ? 'bg-green-100 text-green-700' :
                          sub.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sub.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Users Management</h2>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Courses</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map(user => (
                        <tr key={user.userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{user.userId}</td>
                          <td className="px-6 py-4 text-sm font-semibold">{user.username || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm">{user.courses?.length || 0}</td>
                          <td className="px-6 py-4 text-sm">{user.totalPoints || 0}</td>
                          <td className="px-6 py-4 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.userId)}
                              className="text-red-600 hover:text-red-800 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Courses Management</h2>
                  <button
                    onClick={() => {
                      setEditingCourse(null);
                      setShowCourseModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Add New Course
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{course.totalLevels || 0} Levels</span>
                          <span>{course.difficulty || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowQuestionManager(true);
                            }}
                            className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                          >
                            📝 Manage Questions
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCourse(course);
                                setShowCourseModal(true);
                              }}
                              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Submissions Management</h2>
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <SubmissionList 
                  submissions={filteredSubmissions}
                  onReEvaluate={handleReEvaluate}
                  onDelete={handleDeleteSubmission}
                />
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">User Progress</h2>
                <div className="space-y-4">
                  {progressData.map(user => (
                    <div key={user.userId} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold">{user.username || user.userId}</h3>
                          <p className="text-sm text-gray-600">Total Points: {user.totalPoints || 0}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.courses?.map(course => (
                          <div key={course.courseId} className="border rounded-lg p-4">
                            <div className="font-semibold mb-2">{course.courseId}</div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Current Level: {course.currentLevel || 1}</div>
                              <div>Completed Levels: {course.completedLevels?.join(', ') || 'None'}</div>
                              <div>Points: {course.totalPoints || 0}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assets Tab */}
            {activeTab === 'assets' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Asset Manager</h2>
                  <label className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition">
                    {uploadingAsset ? 'Uploading...' : '📤 Upload Asset'}
                    <input
                      type="file"
                      multiple
                      onChange={handleUploadAsset}
                      disabled={uploadingAsset}
                      className="hidden"
                      accept="image/*,.html,.css,.js,.json"
                    />
                  </label>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search assets by filename..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* Assets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets
                    .filter(asset => 
                      asset.filename.toLowerCase().includes(assetSearch.toLowerCase())
                    )
                    .map((asset, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Preview */}
                        <div className="h-48 bg-gray-100 flex items-center justify-center">
                          {asset.type?.startsWith('image/') ? (
                            <img 
                              src={asset.url} 
                              alt={asset.filename}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-center text-gray-500">
                              <div className="text-4xl mb-2">
                                {asset.filename.endsWith('.html') ? '📄' : 
                                 asset.filename.endsWith('.css') ? '🎨' : 
                                 asset.filename.endsWith('.js') ? '⚡' : 
                                 asset.filename.endsWith('.json') ? '📋' : '📁'}
                              </div>
                              <div className="text-sm">{asset.filename.split('.').pop().toUpperCase()}</div>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-semibold truncate mb-2">{asset.filename}</h3>
                          <div className="text-xs text-gray-600 mb-3">
                            <div>Size: {(asset.size / 1024).toFixed(2)} KB</div>
                            <div>Uploaded: {new Date(asset.uploadedAt).toLocaleDateString()}</div>
                            <div className="text-blue-600 font-mono truncate mt-1">
                              {asset.path}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(asset.path)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            >
                              📋 Copy Path
                            </button>
                            <button
                              onClick={() => copyToClipboard(asset.url)}
                              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                            >
                              🔗 Copy URL
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.filename)}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Empty State */}
                {assets.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="text-xl font-semibold mb-2">No Assets Yet</h3>
                    <p className="text-gray-600 mb-4">Upload images, HTML, CSS, or JS files to get started</p>
                    <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition">
                      Upload Your First Asset
                      <input
                        type="file"
                        multiple
                        onChange={handleUploadAsset}
                        disabled={uploadingAsset}
                        className="hidden"
                        accept="image/*,.html,.css,.js,.json"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <CourseModal
          course={editingCourse}
          onSave={handleSaveCourse}
          onClose={() => {
            setShowCourseModal(false);
            setEditingCourse(null);
          }}
        />
      )}

      {/* Question Manager Modal */}
      {showQuestionManager && selectedCourse && (
        <QuestionManagerModal
          courseId={selectedCourse.id}
          courseName={selectedCourse.title}
          onClose={() => {
            setShowQuestionManager(false);
            setSelectedCourse(null);
          }}
        />
      )}

      {/* Challenge Modal */}
      {showChallengeModal && (
        <ChallengeModal
          challenge={editingChallenge}
          courses={courses}
          onSave={handleSaveChallenge}
          onClose={() => {
            setShowChallengeModal(false);
            setEditingChallenge(null);
          }}
        />
      )}
    </div>
  );
}

// Course Modal Component
function CourseModal({ course, onSave, onClose }) {
  const [formData, setFormData] = useState({
    id: course?.id || '',
    title: course?.title || '',
    description: course?.description || '',
    difficulty: course?.difficulty || 'Beginner',
    totalLevels: course?.totalLevels || 1,
    icon: course?.icon || '📚'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4">{course ? 'Edit Course' : 'Add New Course'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Course ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
                disabled={!!course}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Total Levels</label>
                <input
                  type="number"
                  value={formData.totalLevels}
                  onChange={(e) => setFormData({ ...formData, totalLevels: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Icon (Emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                maxLength={2}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Course
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Challenge Modal Component
function ChallengeModal({ challenge, courses, onSave, onClose }) {
  const [formData, setFormData] = useState({
    id: challenge?.id || '',
    title: challenge?.title || '',
    courseId: challenge?.courseId || '',
    level: challenge?.level || 1,
    difficulty: challenge?.difficulty || 'Easy',
    description: challenge?.description || '',
    instructions: challenge?.instructions || '',
    expectedSolution: {
      html: challenge?.expectedSolution?.html || '',
      css: challenge?.expectedSolution?.css || '',
      js: challenge?.expectedSolution?.js || ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4">{challenge ? 'Edit Challenge' : 'Add New Challenge'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Challenge ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                  disabled={!!challenge}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Course</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Level</label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Expected HTML</label>
              <textarea
                value={formData.expectedSolution.html}
                onChange={(e) => setFormData({ ...formData, expectedSolution: { ...formData.expectedSolution, html: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Expected CSS</label>
              <textarea
                value={formData.expectedSolution.css}
                onChange={(e) => setFormData({ ...formData, expectedSolution: { ...formData.expectedSolution, css: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Challenge
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
