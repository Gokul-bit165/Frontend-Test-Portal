import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getCourseLevels, getUserProgress } from '../services/api';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [levels, setLevels] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default-user';
      
      const [courseRes, levelsRes, progressRes] = await Promise.all([
        getCourse(courseId),
        getCourseLevels(courseId),
        getUserProgress(userId)
      ]);
      
      setCourse(courseRes.data);
      setLevels(levelsRes.data);
      setUserProgress(progressRes.data);
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelStatus = (levelNumber) => {
    // Level 1 is always unlocked
    if (levelNumber === 1) return 'unlocked';
    
    // Check if user has completed previous level
    if (userProgress) {
      const courseProgress = userProgress.courses?.find(c => c.courseId === courseId);
      if (courseProgress) {
        const completedLevels = courseProgress.completedLevels || [];
        // Level is unlocked if previous level is completed
        if (completedLevels.includes(levelNumber - 1)) {
          return 'unlocked';
        }
      }
    }
    
    return 'locked';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Course not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Courses
          </button>
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
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              ← Back to Courses
            </button>
            <button
              onClick={() => navigate('/admin/login')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Admin Login
            </button>
          </div>
        </div>
      </header>

      {/* Course Hero */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-8">
            {/* Course Icon/Thumbnail */}
            <div 
              className="w-32 h-32 rounded-xl flex items-center justify-center text-6xl font-bold text-white shadow-lg"
              style={{ backgroundColor: course.color }}
            >
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-6xl">${course.icon}</span>`;
                }}
              />
            </div>

            {/* Course Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {course.icon} {course.title}
              </h1>
              <p className="text-xl text-gray-600 mb-4">{course.description}</p>
              
              <div className="flex gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-2xl">⏱️</span>
                  <span className="text-gray-700">{course.estimatedTime}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  <span className="text-gray-700">{course.totalLevels} Levels</span>
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                  course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.difficulty}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {course.tags && course.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Levels Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Course Levels</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((level) => {
            const status = getLevelStatus(level.level);
            const isLocked = status === 'locked';
            
            return (
              <div
                key={level.level}
                onClick={() => !isLocked && navigate(`/level/${courseId}/${level.level}`)}
                className={`bg-white rounded-xl shadow-lg p-6 ${
                  isLocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl'
                }`}
              >
                {/* Level Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Level {level.level}
                  </h3>
                  {isLocked ? (
                    <span className="text-3xl">🔒</span>
                  ) : (
                    <span className="text-3xl">🎯</span>
                  )}
                </div>

                {isLocked && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      🔒 Complete Level {level.level - 1} to unlock
                    </p>
                  </div>
                )}

                {/* Questions Count */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">
                    📝 {level.totalQuestions} Question{level.totalQuestions !== 1 ? 's' : ''} Available
                  </span>
                  {level.totalPoints > 0 && (
                    <span className="text-indigo-600 font-semibold">
                      ⭐ {level.totalPoints} pts
                    </span>
                  )}
                </div>

                {/* Progress Bar (if any questions completed) */}
                {level.completedQuestions > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {level.completedQuestions}/{level.questions.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(level.completedQuestions / level.questions.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Questions Preview */}
                <div className="space-y-2">
                  {level.questions.slice(0, 3).map((q) => (
                    <div key={q.id} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className={q.completed ? '✅' : '⭕'}>
                        {q.completed ? '✅' : '⭕'}
                      </span>
                      <span className="truncate">{q.title}</span>
                    </div>
                  ))}
                  {level.questions.length > 3 && (
                    <div className="text-sm text-gray-500 italic">
                      +{level.questions.length - 3} more...
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  disabled={isLocked}
                  className={`w-full mt-4 py-2 rounded-lg font-semibold transition-colors ${
                    isLocked
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isLocked ? '🔒 Locked' : 'Start Level →'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">How it works</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span>🎯</span>
              <span>Complete challenges in Level 1 to unlock Level 2</span>
            </li>
            <li className="flex items-start gap-2">
              <span>💻</span>
              <span>Write HTML/CSS code and see instant visual results</span>
            </li>
            <li className="flex items-start gap-2">
              <span>⭐</span>
              <span>Earn points for completing challenges</span>
            </li>
            <li className="flex items-start gap-2">
              <span>🏆</span>
              <span>Complete all levels to master this course</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
