import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChallenge, submitSolution, evaluateSolution, getSubmissionResult, getLevelQuestions, completeQuestion } from '../services/api';
import CodeEditor from '../components/CodeEditor';
import PreviewFrame from '../components/PreviewFrame';
import ResultsPanel from '../components/ResultsPanel';

export default function ChallengeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [challenge, setChallenge] = useState(null);
  const [allLevelQuestions, setAllLevelQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState({ html: '', css: '', js: '' });
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState(''); // Track evaluation progress
  const [result, setResult] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showExpectedScreenshot, setShowExpectedScreenshot] = useState(false);
  const [expectedScreenshotUrl, setExpectedScreenshotUrl] = useState('');
  const [showInstructions, setShowInstructions] = useState(true); // Toggle for instructions
  
  const previewRef = useRef();

  useEffect(() => {
    loadChallenge();
  }, [id]);

  const loadChallenge = async () => {
    try {
      const response = await getChallenge(id);
      const challengeData = response.data;
      setChallenge(challengeData);
      
      // Load all questions from the same level for navigation
      if (challengeData.courseId && challengeData.level) {
        try {
          const levelQuestionsRes = await getLevelQuestions(challengeData.courseId, challengeData.level);
          const questions = levelQuestionsRes.data;
          setAllLevelQuestions(questions);
          
          // Find current question index
          const currentIndex = questions.findIndex(q => q.id === id);
          setCurrentQuestionIndex(currentIndex);
        } catch (err) {
          console.error('Failed to load level questions:', err);
        }
      }
      
      // Generate expected screenshot URL if available
      if (challengeData.expectedSolution) {
        // Create a preview URL for the expected solution
        const blob = new Blob([challengeData.expectedSolution.html || ''], { type: 'text/html' });
        setExpectedScreenshotUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error('Failed to load challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = allLevelQuestions[currentQuestionIndex - 1];
      navigate(`/challenge/${prevQuestion.id}`);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < allLevelQuestions.length - 1) {
      const nextQuestion = allLevelQuestions[currentQuestionIndex + 1];
      navigate(`/challenge/${nextQuestion.id}`);
    }
  };

  const handleRunCode = () => {
    if (previewRef.current) {
      previewRef.current.updatePreview(code);
    }
  };

  const handleSubmit = () => {
    setShowNameModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!candidateName.trim()) {
      alert('Please enter your name');
      return;
    }

    setShowNameModal(false);
    setSubmitting(true);
    setResult(null);
    setEvaluationStep('Submitting...');

    try {
      // Submit solution
      setEvaluationStep('Saving your code...');
      const submitResponse = await submitSolution({
        challengeId: id,
        candidateName: candidateName.trim(),
        code
      });

      const submissionId = submitResponse.data.submissionId;
      
      // Start evaluation with real-time progress
      setEvaluating(true);
      setEvaluationStep('🚀 Starting evaluation...');
      
      try {
        // Show progress stages
        setTimeout(() => setEvaluationStep('📸 Rendering screenshots...'), 500);
        setTimeout(() => setEvaluationStep('🔍 Comparing DOM structure...'), 2000);
        setTimeout(() => setEvaluationStep('🎨 Matching pixels...'), 4000);
        setTimeout(() => setEvaluationStep('📊 Calculating final score...'), 6000);
        
        // Call evaluation and WAIT for the result (same as admin panel)
        const evalResponse = await evaluateSolution(submissionId);
        
        // Evaluation complete - show result immediately
        setEvaluationStep('✅ Complete!');
        const evaluationResult = evalResponse.data.result;
        setResult(evaluationResult);
        setEvaluating(false);
        
        // If passed, mark question as complete
        if (evaluationResult.passed && challenge.courseId && challenge.level) {
          try {
            const userId = localStorage.getItem('userId') || 'default-user';
            const completeResponse = await completeQuestion(userId, {
              questionId: id,
              courseId: challenge.courseId,
              level: challenge.level,
              score: evaluationResult.finalScore
            });
            
            // Show level completion message
            if (completeResponse.data.levelComplete) {
              setTimeout(() => {
                const message = completeResponse.data.nextLevelUnlocked 
                  ? `🎉 Congratulations!\n\nYou completed ${completeResponse.data.completedQuestions}/${completeResponse.data.totalQuestions} questions!\n\n✅ Level ${challenge.level} Complete!\n🔓 Level ${completeResponse.data.nextLevel} Unlocked!\n\n📊 Points earned: ${completeResponse.data.points}\n🏆 Total points: ${completeResponse.data.totalPoints}`
                  : `✅ Question Complete!\n\n📊 Score: ${evaluationResult.finalScore}%\n💰 Points: ${completeResponse.data.points}`;
                
                alert(message);
                
                // Navigate to course detail to see unlocked level
                if (completeResponse.data.nextLevelUnlocked) {
                  navigate(`/course/${challenge.courseId}`);
                }
              }, 1000);
            }
          } catch (progressError) {
            console.error('Failed to update progress:', progressError);
            // Don't show error to user, just log it
          }
        }
        
      } catch (evalError) {
        console.error('Evaluation failed:', evalError);
        setEvaluating(false);
        setEvaluationStep('');
        
        const errorMsg = evalError.response?.data?.details || evalError.message;
        alert(
          `❌ Evaluation failed: ${errorMsg}\n\n` +
          'Your submission was saved, but evaluation encountered an error.\n\n' +
          'Solutions:\n' +
          '1. Check the admin panel for your submission\n' +
          '2. Ask admin to re-evaluate\n' +
          '3. Check if backend server is running (port 5000)\n' +
          '4. Check browser console for details'
        );
      }

    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Failed to submit solution: ${errorMessage}\n\nPlease check:\n- Backend server is running on port 5000\n- Browser console for more details`);
      setEvaluating(false);
      setEvaluationStep('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Challenge not found</h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{challenge.title}</h1>
              <p className="text-sm text-gray-600">
                {challenge.difficulty && `${challenge.difficulty} • `}
                {challenge.timeLimit ? `${challenge.timeLimit} min` : '30 min'}
                {allLevelQuestions.length > 0 && ` • Question ${currentQuestionIndex + 1} of ${allLevelQuestions.length}`}
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* Question Navigation */}
            {allLevelQuestions.length > 1 && (
              <div className="flex gap-2 mr-4">
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
                  disabled={currentQuestionIndex === allLevelQuestions.length - 1}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6" style={{ height: 'calc(100vh - 80px)' }}>
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
            
            {/* Course/Level Breadcrumb (for new format) */}
            {challenge.courseId && (
              <div className="mb-3 text-sm text-gray-600">
                <span className="font-medium">Course:</span> {challenge.courseId.toUpperCase()} • 
                <span className="ml-2 font-medium">Level:</span> {challenge.level} • 
                <span className="ml-2 font-medium">Points:</span> {challenge.points || 100}
              </div>
            )}
            
            <div className="text-gray-700 whitespace-pre-wrap mb-4">{challenge.instructions}</div>
            
            {/* Assets Section (for new format) */}
            {challenge.assets?.images && challenge.assets.images.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Assets for this challenge:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {challenge.assets.images.map((img, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-purple-100">
                      <img 
                        src={img.path} 
                        alt={img.name}
                        className="w-full h-32 object-cover rounded mb-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div style={{display: 'none'}} className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400 text-xs">
                        Image not found
                      </div>
                      <p className="text-xs font-medium text-gray-900">{img.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{img.description}</p>
                      <code className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded mt-2 block">
                        {img.path}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Hints Section (for new format) */}
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
            
            {/* Passing Criteria (for old format with passingThreshold) */}
            {challenge.passingThreshold && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Passing Criteria:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Structure Score: ≥ {challenge.passingThreshold.structure}%</li>
                  <li>• Visual Score: ≥ {challenge.passingThreshold.visual}%</li>
                  <li>• Overall Score: ≥ {challenge.passingThreshold.overall}%</li>
                </ul>
              </div>
            )}
          </div>
          )}

          {/* Code Editors */}
          <div className={`card ${showInstructions ? 'flex-1' : 'flex-1'}`} style={!showInstructions ? { minHeight: 'calc(100vh - 200px)' } : {}}>
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
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>💡 Tip:</strong> Your solution will be compared against this expected result using:
                </p>
                <ul className="text-xs text-green-700 mt-2 space-y-1 ml-4">
                  <li>• <strong>DOM Structure</strong> (40%) - HTML elements and hierarchy</li>
                  <li>• <strong>Visual Appearance</strong> (60%) - Pixel-by-pixel comparison (921,600 pixels)</li>
                </ul>
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
                      <li>• Comparing DOM structure (40%)</li>
                      <li>• Comparing pixels (921,600 pixels - 60%)</li>
                      <li>• Generating difference map</li>
                      <li>• Calculating final score</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <ResultsPanel result={result} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Ready to Submit?</h2>
            <p className="text-gray-600 mb-6">Enter your name to submit your solution for evaluation.</p>
            <input
              type="text"
              placeholder="Your name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="input mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="btn-success flex-1"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
