import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import PreviewFrame from '../components/PreviewFrame';
import ResultsPanel from '../components/ResultsPanel';
import axios from 'axios';

export default function LevelChallenge() {
  const { courseId, level } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || 'default-user';
  
  const [assignedQuestions, setAssignedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState({ html: '', css: '', js: '' });
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState('');
  const [result, setResult] = useState(null);
  const [showExpectedScreenshot, setShowExpectedScreenshot] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [testSessionId, setTestSessionId] = useState(null);
  const [finishingLevel, setFinishingLevel] = useState(false);
  
  // Restrictions and Timer State
  const [restrictions, setRestrictions] = useState({
    blockCopy: false,
    blockPaste: false,
    forceFullscreen: false,
    maxViolations: 3,
    timeLimit: 0
  });
  const [violations, setViolations] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showViolationToast, setShowViolationToast] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [lastViolationTime, setLastViolationTime] = useState(0);
  
  const previewRef = useRef();

  useEffect(() => {
    if (courseId && level) {
      loadLevelQuestions();
      loadRestrictions();
    }
  }, [courseId, level]);

  useEffect(() => {
    if (assignedQuestions.length > 0) {
      loadCurrentQuestion();
    }
  }, [currentQuestionIndex, assignedQuestions]);

  const loadLevelQuestions = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/challenges/level-questions`, {
        params: { 
          userId, 
          courseId, 
          level: parseInt(level),
          forceNew: 'true' // Always get new random questions on each test entry
        }
      });
      
      let questions = response.data.assignedQuestions || [];
      
      if (questions.length === 0) {
        alert('No questions assigned for this level');
        navigate(`/course/${courseId}`);
        return;
      }
      
      // Shuffle questions array to randomize order every time
      questions = shuffleArray(questions);
      
      setAssignedQuestions(questions);
      
      // Initialize answers
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
      alert('Failed to load questions');
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

  // Fisher-Yates shuffle algorithm for randomizing question order
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadCurrentQuestion = async () => {
    if (!assignedQuestions[currentQuestionIndex]) return;
    
    const questionId = assignedQuestions[currentQuestionIndex].id;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/challenges/${questionId}`);
      const challengeData = response.data;
      setChallenge(challengeData);
      
      // Load saved answer if exists
      const savedAnswer = userAnswers[questionId];
      if (savedAnswer) {
        setCode({ html: savedAnswer.html, css: savedAnswer.css, js: savedAnswer.js });
        setResult(savedAnswer.result);
      } else {
        setCode({ html: '', css: '', js: '' });
        setResult(null);
      }
    } catch (error) {
      console.error('Failed to load question:', error);
    }
  };

  // Load restrictions from API
  const loadRestrictions = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}/restrictions`);
      if (response.data) {
        setRestrictions(response.data);
        // Initialize timer if timeLimit is set
        if (response.data.timeLimit > 0) {
          setTimeRemaining(response.data.timeLimit * 60); // Convert minutes to seconds
        }
      }
    } catch (error) {
      console.error('Failed to load restrictions:', error);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          alert('Time is up! Your test will be submitted automatically.');
          handleFinishLevel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle violations
  const handleViolation = (type) => {
    const now = Date.now();
    if (now - lastViolationTime < 2000) return; // 2 second cooldown
    
    setLastViolationTime(now);
    const newViolations = violations + 1;
    setViolations(newViolations);
    
    setViolationMessage(`${type}`);
    setShowViolationToast(true);
    setTimeout(() => setShowViolationToast(false), 3000);
    
    if (newViolations >= restrictions.maxViolations) {
      setTimeout(() => {
        alert('Maximum violations reached! Test will be submitted.');
        handleFinishLevel();
      }, 500);
    }
  };

  // Restriction enforcement
  useEffect(() => {
    if (!restrictions.blockCopy && !restrictions.blockPaste && !restrictions.forceFullscreen) return;

    const handleCopy = (e) => { if (restrictions.blockCopy) { e.preventDefault(); handleViolation('Copy blocked'); } };
    const handlePaste = (e) => { if (restrictions.blockPaste) { e.preventDefault(); handleViolation('Paste blocked'); } };
    const handleContextMenu = (e) => { if (restrictions.blockCopy || restrictions.blockPaste) { e.preventDefault(); } };
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && restrictions.blockCopy && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault(); handleViolation('Copy shortcut blocked');
      }
      if ((e.ctrlKey || e.metaKey) && restrictions.blockPaste && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault(); handleViolation('Paste shortcut blocked');
      }
    };
    const handleVisibilityChange = () => { if (restrictions.forceFullscreen && document.hidden) handleViolation('Tab switched'); };
    const handleFullscreenChange = () => {
      if (restrictions.forceFullscreen && !document.fullscreenElement && violations < restrictions.maxViolations) {
        handleViolation('Exited fullscreen');
        // Aggressively try to re-enter fullscreen
        const reenterFullscreen = () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
              .catch(() => {
                // If first attempt fails, keep trying every 500ms
                setTimeout(reenterFullscreen, 500);
              });
          }
        };
        setTimeout(reenterFullscreen, 100);
      }
    };

    document.addEventListener('copy', handleCopy, { capture: true });
    document.addEventListener('cut', handleCopy, { capture: true });
    document.addEventListener('paste', handlePaste, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Auto-enter fullscreen on click if not in fullscreen
    const handleClickForFullscreen = () => {
      if (restrictions.forceFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    document.addEventListener('click', handleClickForFullscreen);

    if (restrictions.blockCopy) document.body.style.userSelect = 'none';
    
    // Initial fullscreen entry
    if (restrictions.forceFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        console.log('Initial fullscreen request failed - user must interact first');
      });
    }

    return () => {
      document.removeEventListener('click', handleClickForFullscreen);
      document.removeEventListener('copy', handleCopy, { capture: true });
      document.removeEventListener('cut', handleCopy, { capture: true });
      document.removeEventListener('paste', handlePaste, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (restrictions.blockCopy) document.body.style.userSelect = '';
    };
  }, [restrictions, violations]);

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current code
      const currentId = assignedQuestions[currentQuestionIndex].id;
      setUserAnswers(prev => ({
        ...prev,
        [currentId]: { ...prev[currentId], html: code.html, css: code.css, js: code.js }
      }));
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setResult(null);
      setShowExpectedScreenshot(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < assignedQuestions.length - 1) {
      // Save current code
      const currentId = assignedQuestions[currentQuestionIndex].id;
      setUserAnswers(prev => ({
        ...prev,
        [currentId]: { ...prev[currentId], html: code.html, css: code.css, js: code.js }
      }));
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setResult(null);
      setShowExpectedScreenshot(false);
    }
  };

  const handleRunCode = () => {
    if (previewRef.current) {
      previewRef.current.updatePreview(code);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setEvaluating(true);
    setResult(null);
    setEvaluationStep('Submitting your solution...');

    const questionId = challenge.id;

    try {
      // Step 1: Create submission
      setEvaluationStep('Creating submission...');
      const submitResponse = await axios.post('http://localhost:5000/api/submissions', {
        challengeId: questionId,
        candidateName: userId,
        code: {
          html: code.html,
          css: code.css,
          js: code.js
        }
      });

      const submissionId = submitResponse.data.submissionId;
      
      setEvaluationStep('Launching browser environment...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEvaluationStep('Rendering your code...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEvaluationStep('Comparing with expected solution...');
      
      // Step 2: Evaluate submission
      const evalResponse = await axios.post('http://localhost:5000/api/evaluate', {
        submissionId: submissionId
      });

      const evalResult = evalResponse.data.result;
      setResult(evalResult);
      
      // Save result
      setUserAnswers(prev => ({
        ...prev,
        [questionId]: {
          html: code.html,
          css: code.css,
          js: code.js,
          submitted: true,
          result: evalResult
        }
      }));

      // Add submission to test session
      if (testSessionId && submissionId) {
        try {
          await axios.post(`http://localhost:5000/api/test-sessions/${testSessionId}/submissions`, {
            submission_id: submissionId
          });
          console.log('Added submission to test session');
        } catch (err) {
          console.error('Failed to add submission to session:', err);
        }
      }
      
      setEvaluationStep('');
    } catch (error) {
      console.error('Submission failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to submit: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      setEvaluationStep('');
    } finally {
      setSubmitting(false);
      setEvaluating(false);
    }
  };

  const handleFinishLevel = async () => {
    if (finishingLevel) return;

    setFinishingLevel(true);

    try {
      if (testSessionId) {
        console.log('Completing test session:', testSessionId);
        
        // MUST wait for completion before navigating
        await axios.put(`http://localhost:5000/api/test-sessions/${testSessionId}/complete`, {
          user_feedback: null
        });
        
        console.log('Test session completed successfully');
        
        // Small delay to ensure database write is committed
        await new Promise(resolve => setTimeout(resolve, 300));

        navigate(`/test-results/${testSessionId}`);
      } else {
        // Fallback to old results page if no session
        navigate(`/level-results/${courseId}/${level}`, {
          state: { userAnswers, assignedQuestions }
        });
      }
    } catch (error) {
      console.error('Error finishing level:', error);
      alert('Failed to finalize test results. Please try again.');
      setFinishingLevel(false);
    }
  };

  const handleFinishTest = () => {
    // Calculate overall results
    const results = assignedQuestions.map(q => ({
      questionId: q.id,
      questionTitle: q.title,
      submitted: userAnswers[q.id]?.submitted || false,
      passed: userAnswers[q.id]?.result?.passed || false,
      score: userAnswers[q.id]?.result?.finalScore || 0
    }));

    const submittedCount = results.filter(r => r.submitted).length;
    const passedCount = results.filter(r => r.passed).length;
    const avgScore = submittedCount > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / assignedQuestions.length)
      : 0;

    setFinalScore({
      submittedCount,
      passedCount,
      totalQuestions: assignedQuestions.length,
      avgScore,
      allSubmitted: submittedCount === assignedQuestions.length,
      allPassed: passedCount === assignedQuestions.length,
      results
    });

    setShowFinishModal(true);
  };

  const handleSubmitFeedback = async () => {
    try {
      // Save level completion data
      const completionData = {
        userId,
        courseId,
        level: parseInt(level),
        completedAt: new Date().toISOString(),
        finalScore: finalScore.avgScore,
        passed: finalScore.allPassed,
        questionsSubmitted: finalScore.submittedCount,
        questionsPassed: finalScore.passedCount,
        totalQuestions: finalScore.totalQuestions,
        feedback: feedback,
        results: finalScore.results
      };

      // Save to backend
      await axios.post('http://localhost:5000/api/level-completion', completionData);

      // Close modal and navigate
      setShowFinishModal(false);
      navigate(`/level-results/${courseId}/${level}`, {
        state: { 
          userAnswers, 
          assignedQuestions,
          completionData 
        }
      });
    } catch (error) {
      console.error('Failed to save completion:', error);
      // Still navigate even if save fails
      setShowFinishModal(false);
      navigate(`/level-results/${courseId}/${level}`, {
        state: { userAnswers, assignedQuestions }
      });
    }
  };

  const allQuestionsSubmitted = () => {
    return assignedQuestions.every(q => userAnswers[q.id]?.submitted);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Violation Toast Notification */}
      {showViolationToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-semibold">{violationMessage}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Course
              </button>
              <h1 className="text-2xl font-bold">{challenge.title}</h1>
              <p className="text-gray-600">
                Level {level} • Question {currentQuestionIndex + 1} of {assignedQuestions.length}
              </p>
            </div>
            
            {/* Question Navigator with Timer */}
            <div className="flex items-center gap-3">
              {/* Small Timer */}
              {restrictions.timeLimit > 0 && timeRemaining !== null && (
                <div className={`px-3 py-2 rounded border font-mono font-bold ${
                  timeRemaining <= 300 ? 'bg-red-50 border-red-300 text-red-600' : 'bg-blue-50 border-blue-300 text-blue-600'
                }`}>
                  ⏱️ {formatTime(timeRemaining)}
                </div>
              )}
              
              {/* Question Number Boxes */}
              <div className="flex gap-2">
                {assignedQuestions.map((q, index) => {
                  const isSubmitted = userAnswers[q.id]?.submitted;
                  return (
                    <div
                      key={q.id}
                      className={`w-10 h-10 rounded flex items-center justify-center font-semibold ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : isSubmitted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                      title={`Question ${index + 1} - ${isSubmitted ? 'Submitted' : 'Not Submitted'}`}
                    >
                      {index + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {allQuestionsSubmitted() && (
              <button
                onClick={handleFinishLevel}
                disabled={finishingLevel}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {finishingLevel ? 'Finishing...' : '✓ Finish & View Results'}
              </button>
            )}
            {assignedQuestions.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Previous Question"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === assignedQuestions.length - 1}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Next Question"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            <button onClick={handleRunCode} className="btn-secondary">
              ▶ Run Code
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || evaluating}
              className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting || evaluating ? 'Evaluating...' : '✓ Submit & Evaluate'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Left Panel: Instructions & Code Editors */}
        <div className="flex flex-col gap-4 overflow-auto">
          {/* Toggle Instructions Button */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-between px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="font-semibold">
              {showInstructions ? '📖 Hide Instructions' : '📖 Show Instructions'}
            </span>
            <svg 
              className={`w-5 h-5 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Instructions */}
          {showInstructions && (
          <div className="card">
            <h2 className="text-lg font-bold mb-3">Challenge Instructions</h2>
            
            <div className="text-gray-700 whitespace-pre-wrap mb-4">{challenge.instructions || challenge.description}</div>
            
            {/* Assets Section */}
            {challenge.assets && challenge.assets.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Assets for this challenge:
                </h3>
                <div className="space-y-2">
                  {challenge.assets.map((asset, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-purple-100">
                      <a 
                        href={`http://localhost:5000/${asset}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-700 hover:underline"
                      >
                        📄 {asset.split('/').pop()}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Hints Section */}
            {challenge.hints && challenge.hints.length > 0 && (
              <details className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer">
                <summary className="font-semibold text-yellow-900 cursor-pointer flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  💡 Hints ({challenge.hints.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {challenge.hints.map((hint, index) => (
                    <p key={index} className="text-sm text-yellow-800 pl-4 border-l-2 border-yellow-300">
                      {index + 1}. {hint}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
          )}

          {/* Code Editors */}
          <div className={`card ${showInstructions ? 'flex-1' : 'flex-1'}`} style={!showInstructions ? { minHeight: 'calc(100vh - 250px)' } : {}}>
            <CodeEditor
              code={code}
              onChange={setCode}
            />
          </div>
        </div>

        {/* Right Panel: Preview & Results */}
        <div className="flex flex-col gap-4 overflow-auto">
          {/* Preview */}
          <div className="card flex-1">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Live Preview</h2>
              <button
                onClick={() => setShowExpectedScreenshot(!showExpectedScreenshot)}
                className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                title="Toggle expected result view"
              >
                {showExpectedScreenshot ? '👁️ Hide' : '🎯 Show'} Expected Result
              </button>
            </div>
            <PreviewFrame ref={previewRef} code={code} />
          </div>

          {/* Expected Screenshot */}
          {showExpectedScreenshot && challenge?.expectedSolution && (
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-green-700">✅ Expected Result</h2>
                <span className="text-xs text-gray-500">This is what your solution should look like</span>
              </div>
              <div className="border-2 border-green-200 rounded-lg overflow-hidden bg-white">
                <PreviewFrame 
                  code={{
                    html: challenge.expectedSolution.html || '',
                    css: challenge.expectedSolution.css || '',
                    js: challenge.expectedSolution.js || ''
                  }} 
                />
              </div>
            </div>
          )}

          {/* Results */}
          {(evaluating || result) && (
            <div className="card">
              <h2 className="text-lg font-bold mb-3">Evaluation Results</h2>
              {evaluating ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">{evaluationStep || 'Evaluating...'}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    This may take 5-10 seconds
                  </p>
                  <div className="max-w-md mx-auto text-left bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-blue-900 mb-2">🔄 Evaluation Process:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Launching headless browser (Chrome)</li>
                      <li>• Rendering your code as screenshot</li>
                      <li>• Rendering expected solution</li>
                      <li>• Comparing DOM structure</li>
                      <li>• Comparing visual appearance (pixels)</li>
                      <li>• Calculating final score</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <ResultsPanel result={result} />
              )}
            </div>
          )}
          {/* Finish Test Modal */}
          {showFinishModal && finalScore && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowFinishModal(false)}></div>
              <div className="bg-white rounded-lg shadow-lg z-20 w-full max-w-lg mx-4">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Finish Test — Summary & Feedback</h3>
                  <p className="text-sm text-gray-600 mb-4">Questions submitted: {finalScore.submittedCount}/{finalScore.totalQuestions}</p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">Questions Passed</div>
                      <div className="font-bold">{finalScore.passedCount}/{finalScore.totalQuestions}</div>
                    </div>
                    <div className="mb-2">Average Score: <span className="font-bold">{finalScore.avgScore}%</span></div>
                    <div className="mt-3 border rounded p-2 max-h-40 overflow-auto">
                      {finalScore.results.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <div className="text-sm">{idx + 1}. {r.questionTitle}</div>
                          <div className={`text-sm font-semibold ${r.passed ? 'text-green-600' : 'text-red-600'}`}>{r.passed ? 'Passed' : 'Failed'} ({r.score}%)</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="block text-sm font-medium mb-2">Any feedback for this level (optional)</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full border rounded p-2 mb-4"
                    rows={4}
                    placeholder="Tell us what went well or what was unclear..."
                  />

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowFinishModal(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                    <button onClick={handleSubmitFeedback} className="px-4 py-2 rounded bg-blue-600 text-white">Submit & Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
