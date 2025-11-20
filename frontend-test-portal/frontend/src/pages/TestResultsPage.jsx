import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const TestResultsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSessionResults();
  }, [sessionId]);

  const fetchSessionResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/test-sessions/${sessionId}/details`);
      setSessionData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching session results:', err);
      setError(err.response?.data?.error || 'Failed to load test results');
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback before submitting');
      return;
    }

    try {
      setSubmitting(true);
      await axios.put(`${API_BASE}/test-sessions/${sessionId}/complete`, {
        user_feedback: feedback
      });
      
      alert('Thank you for your feedback!');
      
      // Redirect back to course or dashboard
      const courseId = sessionData?.course_id;
      if (courseId) {
        navigate(`/course/${courseId}`);
      } else {
        navigate('/courses');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback: ' + (err.response?.data?.error || err.message));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">Error</div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) return null;

  const { submissions = [], overall_status, passed_count, total_questions } = sessionData;
  const isSessionCompleted = Boolean(sessionData.completed_at);
  const computedPassedCount = submissions.filter(sub => sub.passed === 1 || sub.status === 'passed').length;
  const computedTotalQuestions = submissions.length;
  const hasStoredCounts = isSessionCompleted && typeof total_questions === 'number' && total_questions > 0;
  const finalTotalQuestions = hasStoredCounts ? total_questions : computedTotalQuestions;
  const finalPassedCount = hasStoredCounts ? passed_count : computedPassedCount;
  const overallPassed = hasStoredCounts
    ? overall_status === 'passed'
    : (computedTotalQuestions > 0 && computedPassedCount === computedTotalQuestions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Overall Result Header */}
        <div className={`rounded-lg shadow-xl p-8 mb-8 ${
          overallPassed 
            ? 'bg-gradient-to-r from-green-400 to-green-600' 
            : 'bg-gradient-to-r from-red-400 to-red-600'
        }`}>
          <div className="text-center text-white">
            <div className="text-6xl mb-4">
              {overallPassed ? '🎉' : '📝'}
            </div>
            <h1 className="text-4xl font-bold mb-2">
              {overallPassed ? 'Congratulations!' : 'Keep Learning!'}
            </h1>
            <p className="text-xl mb-4">
              {overallPassed 
                ? 'You passed all questions!' 
                : 'You need to pass all questions to complete this test'}
            </p>
            <div className="text-3xl font-bold">
              {finalPassedCount} / {finalTotalQuestions} Questions Passed
            </div>
          </div>
        </div>

        {/* Individual Question Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Question Results</h2>
          
          <div className="space-y-4">
            {submissions.map((submission, index) => {
              const isPassed = submission.passed === 1 || submission.status === 'passed';
              
              return (
                <div
                  key={submission.id}
                  className={`border-2 rounded-lg p-5 transition-all ${
                    isPassed
                      ? 'border-green-400 bg-green-50'
                      : submission.status === 'pending'
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-red-400 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {isPassed ? '✅' : submission.status === 'pending' ? '⏳' : '❌'}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Question {index + 1}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {submission.challenge_id}
                          </p>
                        </div>
                      </div>
                      
                      {submission.status !== 'pending' && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-600">Content</div>
                            <div className="text-lg font-bold text-indigo-600">
                              {submission.content_score || 0}%
                            </div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-600">Visual</div>
                            <div className="text-lg font-bold text-indigo-600">
                              {submission.visual_score || 0}%
                            </div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-600">Structure</div>
                            <div className="text-lg font-bold text-indigo-600">
                              {submission.structure_score || 0}%
                            </div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-600">Final</div>
                            <div className={`text-lg font-bold ${
                              (submission.final_score || 0) >= 70 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {submission.final_score || 0}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      isPassed
                        ? 'bg-green-600 text-white'
                        : submission.status === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {isPassed ? 'PASSED' : submission.status === 'pending' ? 'PENDING' : 'FAILED'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Section */}
        {!sessionData.completed_at && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Share Your Feedback</h2>
            <p className="text-gray-600 mb-4">
              Help us improve! Tell us about your experience with this test.
            </p>
            
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you think about this test? Any suggestions?"
              className="w-full border-2 border-gray-300 rounded-lg p-3 min-h-[120px] focus:border-indigo-500 focus:outline-none"
            />
            
            <button
              onClick={handleFeedbackSubmit}
              disabled={submitting || !feedback.trim()}
              className={`w-full mt-4 py-3 rounded-lg font-semibold transition-all ${
                submitting || !feedback.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback & Continue'}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/course/${sessionData.course_id}`)}
            className="flex-1 bg-white text-indigo-600 border-2 border-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all"
          >
            Back to Course
          </button>
          
          {!overallPassed && (
            <button
              onClick={() => navigate(`/level/${sessionData.course_id}/${sessionData.level}`)}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
            >
              Retry Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResultsPage;
