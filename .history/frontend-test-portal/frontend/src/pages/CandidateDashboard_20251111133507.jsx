import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChallenges } from '../services/api';
import ChallengeCard from '../components/ChallengeCard';

export default function CandidateDashboard() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const response = await getChallenges();
      setChallenges(response.data);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (filter === 'all') return true;
    return challenge.difficulty.toLowerCase() === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Frontend Test Portal</h1>
              <p className="text-gray-600 mt-1">Master HTML, CSS & JavaScript through hands-on challenges</p>
            </div>
            {/* <button
              onClick={() => navigate('/admin/login')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Admin Login
            </button> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Challenges
          </button>
          <button
            onClick={() => setFilter('easy')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'easy'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Easy
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'medium'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setFilter('hard')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'hard'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Hard
          </button>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading challenges...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClick={() => navigate(`/challenge/${challenge.id}`)}
              />
            ))}
          </div>
        )}

        {!loading && filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No challenges found for this filter.</p>
          </div>
        )}
      </main>
    </div>
  );
}
