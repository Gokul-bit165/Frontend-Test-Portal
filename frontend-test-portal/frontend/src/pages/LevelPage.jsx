import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getLevelQuestions } from '../services/api';

export default function LevelPage() {
  const { courseId, level } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevelData();
  }, [courseId, level]);

  const loadLevelData = async () => {
    try {
      const [courseRes, questionsRes] = await Promise.all([
        getCourse(courseId),
        getLevelQuestions(courseId, level)
      ]);
      setCourse(courseRes.data);
      setQuestions(questionsRes.data);
    } catch (error) {
      console.error('Failed to load level:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading level...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              ← Back to {course?.title}
            </button>
            <div className="text-xl font-bold text-gray-900">
              Level {level}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {course?.icon} Level {level} Challenges
          </h1>
          <p className="text-gray-600">
            Complete all challenges to unlock the next level
          </p>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questions.map((question, index) => {
            const isLocked = question.isLocked || false;
            
            return (
              <div
                key={question.id}
                onClick={() => !isLocked && navigate(`/challenge/${question.id}`)}
                className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                  isLocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl'
                }`}
              >
                {/* Question Header */}
                <div 
                  className="h-3"
                  style={{ backgroundColor: course?.color }}
                ></div>

                <div className="p-6">
                  {/* Title and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-gray-700">
                          #{index + 1}
                        </span>
                        {isLocked && <span className="text-2xl">🔒</span>}
                        {question.completed && <span className="text-2xl">✅</span>}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {question.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {question.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>⭐ {question.points} pts</span>
                      {question.assets?.images?.length > 0 && (
                        <span>🖼️ {question.assets.images.length} asset{question.assets.images.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Assets Preview */}
                  {question.assets?.images?.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">Assets included:</div>
                      <div className="flex flex-wrap gap-2">
                        {question.assets.images.map((img, idx) => (
                          <div key={idx} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                            📎 {img.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hints */}
                  {question.hints?.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600">
                        💡 {question.hints.length} hint{question.hints.length !== 1 ? 's' : ''} available
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    disabled={isLocked}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      isLocked
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : question.completed
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isLocked 
                      ? '🔒 Complete previous challenge' 
                      : question.completed 
                      ? '✅ Completed - Review' 
                      : 'Start Challenge →'
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {questions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No challenges in this level yet</p>
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Course
            </button>
          </div>
        )}

        {/* Progress Summary */}
        {questions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Level Progress</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-gray-900">
                {questions.filter(q => q.completed).length} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(questions.filter(q => q.completed).length / questions.length) * 100}%` 
                }}
              ></div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {questions.filter(q => q.completed).length === questions.length ? (
                <span className="text-green-600 font-semibold">
                  🎉 Level Complete! Next level unlocked.
                </span>
              ) : (
                <span>
                  Complete all challenges to unlock Level {parseInt(level) + 1}
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
