import { useParams, useNavigate } from 'react-router-dom';

export default function LevelChallengeTest() {
  const { courseId, level } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4">🎯 Level Challenge Test Page</h1>
        <div className="space-y-4">
          <p className="text-lg">
            <strong>Course ID:</strong> {courseId}
          </p>
          <p className="text-lg">
            <strong>Level:</strong> {level}
          </p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            ← Back to Course
          </button>
        </div>
      </div>
    </div>
  );
}
