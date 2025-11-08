import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChallenge, submitSolution, evaluateSolution, getSubmissionResult } from '../services/api';
import CodeEditor from '../components/CodeEditor';
import PreviewFrame from '../components/PreviewFrame';
import ResultsPanel from '../components/ResultsPanel';

export default function ChallengeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState({ html: '', css: '', js: '' });
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  
  const previewRef = useRef();

  useEffect(() => {
    loadChallenge();
  }, [id]);

  const loadChallenge = async () => {
    try {
      const response = await getChallenge(id);
      setChallenge(response.data);
    } catch (error) {
      console.error('Failed to load challenge:', error);
    } finally {
      setLoading(false);
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
      
      // Start evaluation
      setEvaluating(true);
      setEvaluationStep('Starting evaluation...');
      
      try {
        await evaluateSolution(submissionId);
        setEvaluationStep('Running hybrid evaluation...');
      } catch (evalError) {
        console.warn('Evaluation request failed, will poll for results:', evalError);
        setEvaluationStep('Checking evaluation status...');
        // Continue to polling even if evaluation endpoint fails
        // The submission was saved, so we can still check for results
        
        // If 404 or connection refused, likely server needs restart
        if (evalError.code === 'ERR_NETWORK' || evalError.response?.status === 404) {
          console.error('⚠️ Backend evaluation endpoint not responding.');
          console.error('💡 Solution: Restart the backend server (npm run dev)');
          setEvaluationStep('⚠️ Evaluation service not responding - polling for results...');
        }
      }

      // Poll for results
      let pollCount = 0;
      const maxPolls = 30; // 60 seconds max (30 polls × 2 seconds)
      
      const pollResult = async () => {
        try {
          pollCount++;
          
          // Update progress message
          if (pollCount <= 3) {
            setEvaluationStep('📸 Rendering screenshots...');
          } else if (pollCount <= 6) {
            setEvaluationStep('🔍 Comparing DOM structure...');
          } else if (pollCount <= 10) {
            setEvaluationStep('🎨 Matching pixel-by-pixel...');
          } else if (pollCount <= 15) {
            setEvaluationStep('📊 Calculating scores...');
          } else {
            setEvaluationStep(`⏳ Still evaluating... (${pollCount * 2}s)`);
          }
          
          const resultResponse = await getSubmissionResult(submissionId);
          if (resultResponse.data.status !== 'pending') {
            setEvaluationStep('✅ Complete!');
            setResult(resultResponse.data.result);
            setEvaluating(false);
          } else {
            if (pollCount >= maxPolls) {
              throw new Error('Evaluation timeout');
            }
            setTimeout(pollResult, 2000);
          }
        } catch (error) {
          console.error('Error fetching result:', error);
          // If polling fails after multiple attempts, show error
          setEvaluating(false);
          setEvaluationStep('');
          alert('⚠️ Evaluation is taking longer than expected.\n\n' +
                'Your submission was saved successfully.\n\n' +
                'Possible causes:\n' +
                '• Backend server needs restart\n' +
                '• Evaluation process is slow\n\n' +
                'Solutions:\n' +
                '1. Check the admin panel for your submission\n' +
                '2. Ask admin to re-evaluate\n' +
                '3. Restart backend server if you have access');
        }
      };

      setTimeout(pollResult, 1000);

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
              <p className="text-sm text-gray-600">{challenge.difficulty} • {challenge.timeLimit} min</p>
            </div>
          </div>
          <div className="flex gap-3">
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
          {/* Instructions */}
          <div className="card">
            <h2 className="text-lg font-bold mb-3">Challenge Instructions</h2>
            <div className="text-gray-700 whitespace-pre-wrap">{challenge.instructions}</div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Passing Criteria:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Structure Score: ≥ {challenge.passingThreshold.structure}%</li>
                <li>• Visual Score: ≥ {challenge.passingThreshold.visual}%</li>
                <li>• Overall Score: ≥ {challenge.passingThreshold.overall}%</li>
              </ul>
            </div>
          </div>

          {/* Code Editors */}
          <div className="card flex-1">
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
            <h2 className="text-lg font-bold mb-3">Live Preview</h2>
            <PreviewFrame ref={previewRef} code={code} />
          </div>

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
