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

  // UI State for Split View & Full Screen
  const [splitRatio, setSplitRatio] = useState(0.5); // 0.5 = 50% split
  const [isDragging, setIsDragging] = useState(false);
  const [fullScreenView, setFullScreenView] = useState(null); // 'live' | 'expected' | null

  const previewRef = useRef();
  const splitContainerRef = useRef();

  // Drag Handlers for Resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !splitContainerRef.current) return;

      const containerRect = splitContainerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - containerRect.top;
      const newRatio = Math.max(0.2, Math.min(0.8, relativeY / containerRect.height)); // Limit between 20% and 80%
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging]);

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
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">📝 Instructions</h2>
              </div>

              {/* Course/Level Breadcrumb */}
              {challenge.courseId && (
                <div className="mb-3 text-sm text-gray-600">
                  <span className="font-medium">Course:</span> {challenge.courseId.toUpperCase()} •
                  <span className="ml-2 font-medium">Level:</span> {challenge.level}
                  {challenge.points && <span> • <span className="ml-2 font-medium">Points:</span> {challenge.points}</span>}
                </div>
              )}

              {/* Title from Description */}
              {challenge.description && (
                <h4 className="font-bold text-lg mb-3 pb-2 border-b border-gray-200">
                  {challenge.description}
                </h4>
              )}

              <div className="text-gray-700 whitespace-pre-wrap mb-4">{challenge.instructions}</div>

              {/* Assets Section */}
              {challenge.assets && (challenge.assets.images?.length > 0 || (Array.isArray(challenge.assets) && challenge.assets.length > 0)) && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Assets for this challenge:
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {(Array.isArray(challenge.assets) ? challenge.assets : challenge.assets.images).map((asset, index) => {
                      // Handle both string paths and object formats
                      const assetPath = typeof asset === 'string' ? asset : asset.path;
                      const assetName = typeof asset === 'string' ? asset.split('/').pop() : asset.name;
                      // Ensure full URL
                      const fullUrl = assetPath.startsWith('http') ? assetPath : `${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;

                      if (!assetPath) return null;

                      return (
                        <div key={index} className="bg-white p-3 rounded border border-purple-100 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{assetName}</div>
                            <code className="text-xs text-purple-700 block mt-1">{assetPath}</code>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { navigator.clipboard.writeText(assetPath); alert('Copied path: ' + assetPath); }}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300"
                            >
                              Copy Path
                            </button>
                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded border border-blue-300">
                              View
                            </a>
                          </div>
                        </div>
                      );
                    })}
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

        {/* Right Panel: Preview & Results - Resizable Split View */}
        <div
          ref={splitContainerRef}
          className="flex flex-col h-full overflow-hidden relative"
        >
          {/* Top Pane: Live Preview */}
          <div
            className="flex flex-col min-h-0"
            style={{ height: showExpectedScreenshot ? `${splitRatio * 100}%` : '100%' }}
          >
            <div className="card flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
              <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold">Live Preview</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFullScreenView('live')}
                    className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center gap-1"
                    title="Full Screen Preview"
                  >
                    ⤢ Full Screen
                  </button>
                  <button
                    onClick={() => setShowExpectedScreenshot(!showExpectedScreenshot)}
                    className={`text-xs px-3 py-1 rounded transition-colors ${showExpectedScreenshot ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}
                    title="Toggle expected result view"
                  >
                    {showExpectedScreenshot ? '👁️ Hide Expected' : '🎯 Show Expected'}
                  </button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <PreviewFrame ref={previewRef} code={code} />
              </div>
            </div>
          </div>

          {/* Drag Handle */}
          {showExpectedScreenshot && (
            <div
              className="h-2 bg-gray-200 hover:bg-blue-400 cursor-row-resize shrink-0 flex items-center justify-center transition-colors z-10"
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
            </div>
          )}

          {/* Bottom Pane: Expected Screenshot */}
          {showExpectedScreenshot && challenge?.expectedSolution && (
            <div
              className="flex flex-col min-h-0"
              style={{ height: `${(1 - splitRatio) * 100}%` }}
            >
              <div className="card flex-1 flex flex-col min-h-0 p-0 overflow-hidden mt-0">
                <div className="p-3 border-b flex justify-between items-center bg-green-50">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-green-700">Expected Result</h2>
                    <span className="text-xs text-gray-500 hidden sm:inline">Match this design</span>
                  </div>
                  <button
                    onClick={() => setFullScreenView('expected')}
                    className="text-xs px-2 py-1 rounded bg-green-200 hover:bg-green-300 text-green-800 flex items-center gap-1"
                  >
                    ⤢ Full Screen
                  </button>
                </div>
                <div className="flex-1 relative overflow-auto bg-gray-100">
                  <div className="h-full border-2 border-transparent">
                    <PreviewFrame
                      code={{
                        html: challenge.expectedSolution.html || '',
                        css: challenge.expectedSolution.css || '',
                        js: challenge.expectedSolution.js || ''
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Modal */}
      {fullScreenView && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className={`p-4 border-b flex justify-between items-center ${fullScreenView === 'expected' ? 'bg-green-50' : 'bg-gray-50'}`}>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {fullScreenView === 'live' ? '🖥️ Live Preview (Full Screen)' : '✅ Expected Result (Full Screen)'}
              <span className="text-sm font-normal text-gray-500">
                {fullScreenView === 'live' ? '- Your Code' : '- Target Design'}
              </span>
            </h2>
            <button
              onClick={() => setFullScreenView(null)}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit Full Screen
            </button>
          </div>
          <div className="flex-1 relative bg-gray-100 overflow-hidden p-4">
            <div className="h-full w-full bg-white shadow-xl rounded-lg overflow-hidden border">
              {fullScreenView === 'live' ? (
                <PreviewFrame ref={previewRef} code={code} />
              ) : (
                <PreviewFrame
                  code={{
                    html: challenge.expectedSolution.html || '',
                    css: challenge.expectedSolution.css || '',
                    js: challenge.expectedSolution.js || ''
                  }}
                />
              )}
            </div>
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


      {/* Name Modal */}
      {
        showNameModal && (
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
        )
      }
    </div >
  );
}
