import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import PreviewFrame from '../components/PreviewFrame';
import axios from 'axios';

export default function LevelChallenge() {
  const { courseId, level } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || 'default-user';
  
  const [assignedQuestions, setAssignedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submissions, setSubmissions] = useState({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseId && level) {
      loadLevelQuestions();
    } else {
      setError('Missing course or level parameter');
      setLoading(false);
    }
  }, [courseId, level]);

  useEffect(() => {
    if (assignedQuestions.length > 0) {
      loadCurrentQuestion();
    }
  }, [currentQuestionIndex, assignedQuestions]);

  const loadLevelQuestions = async () => {
    try {
      console.log('Loading questions for:', { userId, courseId, level });
      
      // Get assigned questions for this user and level
      const response = await axios.get(`http://localhost:5000/api/challenges/level-questions`, {
        params: { userId, courseId, level: parseInt(level) }
      });
      
      console.log('Questions loaded:', response.data);
      
      const questions = response.data.assignedQuestions || [];
      
      if (questions.length === 0) {
        setError('No questions assigned for this level');
        setLoading(false);
        return;
      }
      
      setAssignedQuestions(questions);
      
      // Initialize answers object
      const initialAnswers = {};
      questions.forEach(q => {
        initialAnswers[q.id] = {
          html: '',
          css: '',
          js: '',
          submitted: false,
          result: null
        };
      });
      setUserAnswers(initialAnswers);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load level questions:', error);
      setError('Failed to load questions: ' + error.message);
      setLoading(false);
    }
  };

  const loadCurrentQuestion = async () => {
    if (!assignedQuestions[currentQuestionIndex]) {
      console.log('No question at index:', currentQuestionIndex);
      return;
    }
    
    const questionId = assignedQuestions[currentQuestionIndex].id;
    console.log('Loading question details for:', questionId);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/challenges/${questionId}`);
      console.log('Question details loaded:', response.data);
      setCurrentQuestion(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question details: ' + error.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Level</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <p>User: {userId}</p>
            <p>Course: {courseId}</p>
            <p>Level: {level}</p>
          </div>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const handleCodeChange = (type, value) => {
    const questionId = assignedQuestions[currentQuestionIndex].id;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type]: value
      }
    }));
  };

  const handleSubmitQuestion = async () => {
    const questionId = assignedQuestions[currentQuestionIndex].id;
    const answer = userAnswers[questionId];

    if (!answer.html.trim()) {
      alert('Please write some HTML code before submitting!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/evaluate', {
        userId,
        challengeId: questionId,
        candidateCode: {
          html: answer.html,
          css: answer.css,
          js: answer.js
        }
      });

      const result = response.data;
      
      setUserAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          submitted: true,
          result: result
        }
      }));

      setSubmissions(prev => ({
        ...prev,
        [questionId]: result
      }));

      alert(`Question ${currentQuestionIndex + 1} submitted! Score: ${result.finalScore}%`);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  const handleFinishLevel = () => {
    // Navigate to results page
    navigate(`/level-results/${courseId}/${level}`, {
      state: { submissions, assignedQuestions }
    });
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const getQuestionStatus = (questionId) => {
    const answer = userAnswers[questionId];
    if (!answer) return 'not-answered';
    return answer.submitted ? 'answered' : 'not-answered';
  };

  const allQuestionsSubmitted = () => {
    return assignedQuestions.every(q => userAnswers[q.id]?.submitted);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading challenges...</p>
          <p className="text-sm text-gray-500 mt-2">User: {userId}</p>
          <p className="text-sm text-gray-500">Course: {courseId}</p>
          <p className="text-sm text-gray-500">Level: {level}</p>
        </div>
      </div>
    );
  }

  if (assignedQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">No questions available for this level.</p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Loading question details...</p>
          <p className="text-sm text-gray-500">Question ID: {assignedQuestions[currentQuestionIndex]?.id}</p>
        </div>
      </div>
    );
  }

  // Make sure userAnswers is initialized before rendering
  if (!userAnswers || Object.keys(userAnswers).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Initializing answers...</p>
          <p className="text-sm text-gray-500">Setting up your coding environment</p>
        </div>
      </div>
    );
  }

  // Use currentQuestion.id instead of assignedQuestions to avoid undefined errors
  const questionId = currentQuestion.id;
  console.log('Current state:', { questionId, userAnswers, hasAnswer: !!userAnswers[questionId] });
  
  const currentAnswer = userAnswers[questionId] || { 
    html: '', 
    css: '', 
    js: '', 
    submitted: false, 
    result: null 
  };
  
  console.log('Current answer:', currentAnswer);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Back to Course
            </button>
            <h1 className="text-2xl font-bold">Level {level} Challenges</h1>
            <p className="text-gray-600">Complete all questions to unlock the next level</p>
          </div>
          
          {/* Question Navigator */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {assignedQuestions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-12 h-12 rounded font-semibold transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : status === 'answered'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={`Question ${index + 1} - ${status === 'answered' ? 'Answered' : 'Not Answered'}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            {allQuestionsSubmitted() && (
              <button
                onClick={handleFinishLevel}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Finish & Submit Level
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Question Info */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{currentQuestion.title}</h2>
                <p className="text-blue-100">Question {currentQuestionIndex + 1} of {assignedQuestions.length}</p>
              </div>
              {currentAnswer.submitted && (
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <div className="text-sm text-blue-100">Your Score</div>
                  <div className="text-2xl font-bold">{currentAnswer.result?.finalScore}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Side - Instructions & Code */}
            <div className="space-y-4">
              {/* Instructions Toggle */}
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-lg transition-colors"
              >
                <span className="font-semibold text-blue-900">
                  {showInstructions ? '📖 Hide Instructions' : '📖 Show Instructions'}
                </span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${showInstructions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Instructions Panel */}
              {showInstructions && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-lg mb-3 text-blue-900">📋 Instructions</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p>{currentQuestion.description || currentQuestion.instructions || 'No description available'}</p>
                    
                    {currentQuestion.instructions && currentQuestion.instructions !== currentQuestion.description && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Details:</h4>
                        <p>{currentQuestion.instructions}</p>
                      </div>
                    )}
                    
                    {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">💡 Hints:</h4>
                        <ul className="space-y-1">
                          {currentQuestion.hints.map((hint, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assets Folder */}
              {showInstructions && currentQuestion.assets && currentQuestion.assets.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">📁 Assets Available</h4>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    {currentQuestion.assets.map((asset, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <span className="text-gray-500">📄</span>
                        <a 
                          href={`http://localhost:5000/${asset}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {asset.split('/').pop()}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Editors - Much Taller */}
              <div style={{ height: showInstructions ? '700px' : '900px' }}>
                <CodeEditor
                  code={currentAnswer}
                  onChange={(newCode) => {
                    setUserAnswers({
                      ...userAnswers,
                      [questionId]: {
                        ...currentAnswer,
                        ...newCode
                      }
                    });
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitQuestion}
                  disabled={currentAnswer.submitted}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    currentAnswer.submitted
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {currentAnswer.submitted ? '✓ Submitted' : '📤 Submit Answer'}
                </button>

                {/* Next Question Button */}
                {currentQuestionIndex < assignedQuestions.length - 1 && (
                  <button
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Next →
                  </button>
                )}

                {/* Finish Test Button */}
                {currentQuestionIndex === assignedQuestions.length - 1 && allQuestionsSubmitted() && (
                  <button
                    onClick={handleFinishLevel}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <span>✓</span> Finish Test
                  </button>
                )}
              </div>
            </div>

            {/* Right Side - Preview & Expected Output */}
            <div className="space-y-4">
              {/* Live Preview */}
              <div>
                <h3 className="font-semibold text-lg mb-3">👁️ Your Output (Live Preview)</h3>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '40vh' }}>
                  <PreviewFrame code={currentAnswer} />
                </div>
              </div>

              {/* Expected Output */}
              {currentQuestion.expectedSolution && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">✨ Expected Output</h3>
                  <div className="border-2 border-green-300 rounded-lg overflow-hidden bg-green-50" style={{ height: '40vh' }}>
                    <PreviewFrame code={currentQuestion.expectedSolution} />
                  </div>
                </div>
              )}

              {/* Result Display */}
              {currentAnswer.submitted && currentAnswer.result && (
                <div className={`p-4 rounded-lg border-2 ${
                  currentAnswer.result.finalScore >= 70 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Your Score:</span>
                    <span className="text-2xl font-bold">{currentAnswer.result.finalScore}%</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentAnswer.result.finalScore >= 70 
                      ? '✓ Great job! You passed this question.' 
                      : '⚠️ Keep practicing to improve your score.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
