import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import PreviewFrame from '../components/PreviewFrame';
import ResultsPanel from '../components/ResultsPanel';
import axios from 'axios';

export default function LevelChallengeNew() {
  const { courseId, level } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || 'default-user';
  const previewRef = useRef();
  
  const [assignedQuestions, setAssignedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [showExpectedOutput, setShowExpectedOutput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [testSessionId, setTestSessionId] = useState(null);

  useEffect(() => {
    if (courseId && level) {
      loadLevelQuestions();
    } else {
      setError('Missing course or level parameter');
      setLoading(false);
    }
  }, [courseId, level]);

  // Exam restriction state
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);

  useEffect(() => {
    // Request fullscreen on mount
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn('Could not enter fullscreen:', err.message);
      }
    };

    requestFullscreen();

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Exited fullscreen
        handleViolation('exit-fullscreen');
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('visibilitychange');
      }
    };

    const onKeyDown = (e) => {
      // Catch Escape key
      if (e.key === 'Escape' || e.key === 'Esc') {
        handleViolation('escape');
      }
      // Block common copy/paste shortcuts (Ctrl/Cmd+C/V/X)
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        handleViolation('copy-paste-shortcut');
      }
    };

    const onCopy = (e) => {
      e.preventDefault();
      handleViolation('copy');
    };

    const onPaste = (e) => {
      e.preventDefault();
      handleViolation('paste');
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('copy', onCopy);
    window.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('paste', onPaste);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (assignedQuestions.length > 0) {
      loadCurrentQuestion();
    }
  }, [currentQuestionIndex, assignedQuestions]);

  const loadLevelQuestions = async () => {
    try {
      // Use course-based endpoint which assigns 2 random questions per user/level
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}/levels/${level}/questions`, {
        params: { userId }
      });

      const questions = Array.isArray(response.data) ? response.data : response.data.assignedQuestions || [];
      
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
      
      // Create test session
      await createTestSession();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load level questions:', error);
      setError('Failed to load questions: ' + error.message);
      setLoading(false);
    }
  };

  const createTestSession = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/test-sessions', {
        user_id: userId,
        course_id: courseId,
        level: parseInt(level)
      });
      
      console.log('Test session created:', response.data.id);
      setTestSessionId(response.data.id);
    } catch (error) {
      console.error('Failed to create test session:', error);
      // Don't block the test if session creation fails
    }
  };

  const handleViolation = (reason) => {
    setViolations((v) => {
      const next = v + 1;
      // show temporary warning
      setShowViolationWarning(true);
      setTimeout(() => setShowViolationWarning(false), 3500);

      if (next > 3) {
        // Finish the test and exit
        alert('Too many violations detected. The test will finish now.');
        // Optionally send an event to server here (not implemented)
        handleFinishLevel();
      }

      return next;
    });
  };

  const loadCurrentQuestion = async () => {
    if (!assignedQuestions[currentQuestionIndex]) {
      return;
    }
    
    const questionId = assignedQuestions[currentQuestionIndex].id;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/challenges/${questionId}`);
      setCurrentQuestion(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load question:', error);
      setError('Failed to load question details: ' + error.message);
    }
  };

  const handleRunCode = () => {
    const questionId = currentQuestion.id;
    const answer = userAnswers[questionId];
    
    if (previewRef.current) {
      previewRef.current.updatePreview(answer);
    }
  };

  const handleSubmitQuestion = async () => {
    const questionId = currentQuestion.id;
    const answer = userAnswers[questionId];

    if (!answer.html.trim()) {
      alert('Please write some HTML code before submitting!');
      return;
    }

    setEvaluating(true);

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

      // Add submission to test session
      if (testSessionId && result.submissionId) {
        try {
          await axios.post(`http://localhost:5000/api/test-sessions/${testSessionId}/submissions`, {
            submission_id: result.submissionId
          });
          console.log('Added submission to test session');
        } catch (err) {
          console.error('Failed to add submission to session:', err);
        }
      }

      setEvaluating(false);
      
      // Check if all questions are submitted
      const allSubmitted = assignedQuestions.every(q => 
        q.id === questionId ? true : userAnswers[q.id]?.submitted
      );
      
      if (allSubmitted && testSessionId) {
        // Navigate to results page
        setTimeout(() => {
          navigate(`/test-results/${testSessionId}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit. Please try again.');
      setEvaluating(false);
    }
  };

  const handleFinishLevel = () => {
    if (testSessionId) {
      // Navigate to new test session results page
      navigate(`/test-results/${testSessionId}`);
    } else {
      // Fallback to old results page if no session
      navigate(`/level-results/${courseId}/${level}`, {
        state: { userAnswers, assignedQuestions }
      });
    }
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    setShowExpectedOutput(false);
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl">Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Level</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  if (assignedQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">No questions available for this level</p>
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
        </div>
      </div>
    );
  }

  if (!userAnswers || Object.keys(userAnswers).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Initializing answers...</p>
        </div>
      </div>
    );
  }

  const questionId = currentQuestion.id;
  const currentAnswer = userAnswers[questionId] || { 
    html: '', 
    css: '', 
    js: '', 
    submitted: false, 
    result: null 
  };

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
                ✓ Finish & View Results
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {/* Question Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-6">
          <h2 className="text-2xl font-bold mb-2">{currentQuestion.title}</h2>
          <p className="text-blue-100">Question {currentQuestionIndex + 1} of {assignedQuestions.length}</p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-b-lg shadow-lg">
          {/* Left Side - Instructions & Code */}
          <div className="space-y-4">
            {/* Instructions Panel */}
            {showInstructions && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">📝 Instructions</h3>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Hide
                  </button>
                </div>
                <p className="text-gray-700 mb-3">
                  {currentQuestion.description || currentQuestion.instructions || 'No description available'}
                </p>

                {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">💡 Hints</h4>
                    <ul className="space-y-1">
                      {currentQuestion.hints.map((hint, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentQuestion.assets && currentQuestion.assets.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold mb-2">📁 Assets</h4>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      {currentQuestion.assets.map((asset, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">📄</span>
                          <a 
                            href={`http://localhost:5000/${asset}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {asset.split('/').pop()}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showInstructions && (
              <button
                onClick={() => setShowInstructions(true)}
                className="w-full bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg text-blue-700 font-medium"
              >
                📖 Show Instructions
              </button>
            )}

            {/* Code Editor */}
            <div style={{ height: showInstructions ? '550px' : '700px' }}>
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
                onClick={handleRunCode}
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                ▶️ Run Code
              </button>

              <button
                onClick={handleSubmitQuestion}
                disabled={currentAnswer.submitted || evaluating}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  currentAnswer.submitted || evaluating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {evaluating ? '⏳ Evaluating...' : currentAnswer.submitted ? '✓ Submitted' : '📤 Submit Answer'}
              </button>

              {currentQuestionIndex < assignedQuestions.length - 1 && (
                <button
                  onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* Right Side - Preview & Results */}
          <div className="space-y-4">
            {/* Preview */}
            <div>
              <h3 className="font-semibold text-lg mb-3">👁️ Live Preview</h3>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <PreviewFrame ref={previewRef} code={currentAnswer} />
              </div>
            </div>

            {/* Expected Output Toggle */}
            <div>
              <button
                onClick={() => setShowExpectedOutput(!showExpectedOutput)}
                className="w-full flex items-center justify-between bg-green-50 hover:bg-green-100 px-4 py-3 rounded-lg transition-colors border border-green-200"
              >
                <span className="font-semibold text-green-900">
                  {showExpectedOutput ? '🔽 Hide Expected Output' : '▶️ Show Expected Output'}
                </span>
              </button>

              {showExpectedOutput && currentQuestion.expectedSolution && (
                <div className="mt-2 border-2 border-green-300 rounded-lg overflow-hidden bg-green-50" style={{ height: '350px' }}>
                  <PreviewFrame code={currentQuestion.expectedSolution} />
                </div>
              )}
            </div>

            {/* Results Panel */}
            {currentAnswer.submitted && currentAnswer.result && (
              <div className="mt-4">
                <ResultsPanel result={currentAnswer.result} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
