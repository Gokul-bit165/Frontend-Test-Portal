import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminChallenges, createChallenge, updateChallenge, deleteChallenge } from '../services/api';

export default function ChallengeManager() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const emptyChallenge = {
    title: '',
    difficulty: 'Easy',
    description: '',
    instructions: '',
    tags: [],
    timeLimit: 15,
    passingThreshold: {
      structure: 70,
      visual: 80,
      overall: 75
    },
    expectedSolution: {
      html: '',
      css: '',
      js: ''
    }
  };

  const [formData, setFormData] = useState(emptyChallenge);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const response = await getAdminChallenges();
      setChallenges(response.data);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData(emptyChallenge);
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (challenge) => {
    setFormData(challenge);
    setEditing(challenge.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this challenge?')) return;
    try {
      await deleteChallenge(id);
      await loadChallenges();
    } catch (error) {
      alert('Failed to delete challenge');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateChallenge(editing, formData);
      } else {
        await createChallenge(formData);
      }
      setShowForm(false);
      await loadChallenges();
    } catch (error) {
      alert('Failed to save challenge');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Challenge Manager</h1>
            <p className="text-sm text-gray-600">Create and edit coding challenges</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="btn-success"
            >
              + Create Challenge
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{challenge.title}</h3>
                      <span className={`badge badge-${challenge.difficulty.toLowerCase()}`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{challenge.description}</p>
                    <div className="flex gap-2 text-sm text-gray-500">
                      <span>⏱️ {challenge.timeLimit} min</span>
                      <span>•</span>
                      <span>📝 {challenge.tags?.length || 0} tags</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(challenge)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(challenge.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {editing ? 'Edit Challenge' : 'Create New Challenge'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="input"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions *
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="input"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                    className="input"
                    min="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Structure Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={formData.passingThreshold.structure}
                    onChange={(e) => setFormData({
                      ...formData,
                      passingThreshold: { ...formData.passingThreshold, structure: parseInt(e.target.value) }
                    })}
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visual Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={formData.passingThreshold.visual}
                    onChange={(e) => setFormData({
                      ...formData,
                      passingThreshold: { ...formData.passingThreshold, visual: parseInt(e.target.value) }
                    })}
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected HTML Solution *
                </label>
                <textarea
                  value={formData.expectedSolution.html}
                  onChange={(e) => setFormData({
                    ...formData,
                    expectedSolution: { ...formData.expectedSolution, html: e.target.value }
                  })}
                  className="input font-mono text-sm"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected CSS Solution *
                </label>
                <textarea
                  value={formData.expectedSolution.css}
                  onChange={(e) => setFormData({
                    ...formData,
                    expectedSolution: { ...formData.expectedSolution, css: e.target.value }
                  })}
                  className="input font-mono text-sm"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected JS Solution
                </label>
                <textarea
                  value={formData.expectedSolution.js}
                  onChange={(e) => setFormData({
                    ...formData,
                    expectedSolution: { ...formData.expectedSolution, js: e.target.value }
                  })}
                  className="input font-mono text-sm"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" className="btn-success flex-1">
                  {editing ? 'Update Challenge' : 'Create Challenge'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
