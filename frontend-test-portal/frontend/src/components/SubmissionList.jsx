import { useState } from 'react';

export default function SubmissionList({ submissions, onReEvaluate, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [screenshotModal, setScreenshotModal] = useState(null); // { src, title }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadScreenshot = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const classes = {
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No submissions yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {/* Full Screen Screenshot Modal */}
      {screenshotModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setScreenshotModal(null)}
        >
          <div className="relative max-w-6xl w-full">
            <button
              onClick={() => setScreenshotModal(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold hover:bg-gray-200 z-10"
            >
              ×
            </button>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="bg-gray-900 text-white px-6 py-3 text-lg font-semibold">
                {screenshotModal.title}
              </div>
              <div className="p-4 bg-gray-100 max-h-[80vh] overflow-auto">
                <img 
                  src={screenshotModal.src}
                  alt={screenshotModal.title}
                  className="w-full border-4 border-white shadow-2xl rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {submissions.map((submission) => (
        <div key={submission.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {submission.candidateName}
              </h3>
              <p className="text-sm text-gray-600">
                Challenge ID: {submission.challengeId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Submitted: {formatDate(submission.submittedAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(submission.status)}
              {submission.result && (
                <div className="text-2xl font-bold text-blue-600">
                  {submission.result.finalScore}%
                </div>
              )}
            </div>
          </div>

          {submission.result && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600">Structure Score</div>
                <div className="text-xl font-bold text-blue-600">
                  {submission.result.structureScore}%
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600">Visual Score</div>
                <div className="text-xl font-bold text-purple-600">
                  {submission.result.visualScore}%
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {expandedId === submission.id ? '▼ Hide Details' : '▶ View Code & Screenshots'}
            </button>
            <button
              onClick={() => onReEvaluate(submission.id)}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              🔄 Re-evaluate
            </button>
            <button
              onClick={() => onDelete(submission.id)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              🗑️ Delete
            </button>
          </div>

          {expandedId === submission.id && (
            <div className="mt-4 space-y-6">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border-2 border-indigo-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📊 Submission Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">Final Score</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {submission.result?.finalScore || submission.total_score || 0}%
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">Structure</div>
                    <div className="text-2xl font-bold text-green-600">
                      {submission.result?.structureScore || 0}%
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">Visual Match</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {submission.result?.visualScore || 0}%
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-xs text-gray-600 mb-1">Status</div>
                    <div className="text-xl font-bold">
                      {submission.status === 'passed' ? (
                        <span className="text-green-600">✅ PASSED</span>
                      ) : (
                        <span className="text-red-600">❌ FAILED</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">👤 Candidate:</span>
                    <span className="font-semibold text-gray-900">{submission.candidateName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📝 Challenge:</span>
                    <span className="font-semibold text-gray-900">{submission.challengeId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🕐 Submitted:</span>
                    <span className="font-semibold text-gray-900">{formatDate(submission.submittedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🆔 ID:</span>
                    <span className="font-mono text-xs text-gray-600">{submission.id}</span>
                  </div>
                </div>
              </div>

              {/* Screenshot Comparison Section */}
              {((submission.result && submission.result.visual && submission.result.visual.screenshots) || 
                (submission.user_screenshot && submission.expected_screenshot)) && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🖼️ Visual Comparison
                    <button
                      onClick={() => {
                        const userScreenshot = submission.user_screenshot || submission.result?.visual?.screenshots?.candidate;
                        const expectedScreenshot = submission.expected_screenshot || submission.result?.visual?.screenshots?.expected;
                        const diffScreenshot = submission.result?.visual?.screenshots?.diff;
                        
                        if (userScreenshot) downloadScreenshot(`http://localhost:5000${userScreenshot}`, `${submission.candidateName}-output.png`);
                        if (expectedScreenshot) downloadScreenshot(`http://localhost:5000${expectedScreenshot}`, `expected-output.png`);
                        if (diffScreenshot) downloadScreenshot(`http://localhost:5000${diffScreenshot}`, `diff-output.png`);
                      }}
                      className="ml-auto text-xs bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded"
                    >
                      ⬇️ Download All
                    </button>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Candidate Output */}
                    {(submission.user_screenshot || submission.result?.visual?.screenshots?.candidate) && (
                      <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="bg-blue-600 text-white px-3 py-2 text-sm font-semibold">
                          📸 Candidate's Output
                        </div>
                        <div 
                          className="p-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setScreenshotModal({
                            src: `http://localhost:5000${submission.user_screenshot || submission.result.visual.screenshots.candidate}`,
                            title: `📸 ${submission.candidateName}'s Output - Full View`
                          })}
                        >
                          <img 
                            src={`http://localhost:5000${submission.user_screenshot || submission.result.visual.screenshots.candidate}`}
                            alt="Candidate Output"
                            className="w-full border border-gray-200 rounded"
                            onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="gray">No Image</text></svg>'}
                          />
                        </div>
                        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600">
                          User's rendered code • Click to enlarge
                        </div>
                      </div>
                    )}

                    {/* Expected Output */}
                    {(submission.expected_screenshot || submission.result?.visual?.screenshots?.expected) && (
                      <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="bg-green-600 text-white px-3 py-2 text-sm font-semibold">
                          ✅ Expected Output
                        </div>
                        <div 
                          className="p-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setScreenshotModal({
                            src: `http://localhost:5000${submission.expected_screenshot || submission.result.visual.screenshots.expected}`,
                            title: '✅ Expected Output - Full View'
                          })}
                        >
                          <img 
                            src={`http://localhost:5000${submission.expected_screenshot || submission.result.visual.screenshots.expected}`}
                            alt="Expected Output"
                            className="w-full border border-gray-200 rounded"
                            onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="gray">No Image</text></svg>'}
                          />
                        </div>
                        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600">
                          Correct solution • Click to enlarge
                        </div>
                      </div>
                    )}

                    {/* Diff Image */}
                    {submission.result?.visual?.screenshots?.diff && (
                      <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="bg-red-600 text-white px-3 py-2 text-sm font-semibold">
                          🔍 Difference Map
                        </div>
                        <div 
                          className="p-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setScreenshotModal({
                            src: `http://localhost:5000${submission.result.visual.screenshots.diff}`,
                            title: '🔍 Difference Map - Full View (Red = Different)'
                          })}
                        >
                          <img 
                            src={`http://localhost:5000${submission.result.visual.screenshots.diff}`}
                            alt="Difference Map"
                            className="w-full border border-gray-200 rounded"
                            onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="gray">No Image</text></svg>'}
                          />
                        </div>
                        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600">
                          Red = Different pixels • Click to enlarge
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pixel Match Statistics */}
                  <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                    <h5 className="font-semibold text-gray-800 mb-2">📊 Pixel Match Statistics:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Visual Score:</span>
                        <span className="ml-2 font-bold text-purple-600">
                          {submission.result.visualScore}%
                        </span>
                      </div>
                      {submission.result.visual?.diffPixels !== undefined && (
                        <>
                          <div>
                            <span className="text-gray-600">Different Pixels:</span>
                            <span className="ml-2 font-bold text-red-600">
                              {submission.result.visual.diffPixels.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Pixels:</span>
                            <span className="ml-2 font-bold text-gray-700">
                              {submission.result.visual.totalPixels.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Match Rate:</span>
                            <span className="ml-2 font-bold text-green-600">
                              {((1 - submission.result.visual.diffPixels / submission.result.visual.totalPixels) * 100).toFixed(2)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Code Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  💻 Submitted Code
                  <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                    {submission.code.html ? 'HTML' : ''} 
                    {submission.code.css ? ' • CSS' : ''} 
                    {submission.code.js ? ' • JS' : ''}
                  </span>
                </h4>
                
                <div className="space-y-4">
                  {/* HTML Code */}
                  {submission.code.html && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-orange-100 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
                        <span className="text-orange-600 font-bold text-sm">📄 HTML</span>
                        <span className="ml-auto text-xs text-gray-600">
                          {submission.code.html.split('\n').length} lines
                        </span>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
                        <code>{submission.code.html}</code>
                      </pre>
                    </div>
                  )}

                  {/* CSS Code */}
                  {submission.code.css && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-100 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
                        <span className="text-blue-600 font-bold text-sm">🎨 CSS</span>
                        <span className="ml-auto text-xs text-gray-600">
                          {submission.code.css.split('\n').length} lines
                        </span>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
                        <code>{submission.code.css}</code>
                      </pre>
                    </div>
                  )}

                  {/* JavaScript Code */}
                  {submission.code.js && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 flex items-center gap-2">
                        <span className="text-yellow-600 font-bold text-sm">⚡ JavaScript</span>
                        <span className="ml-auto text-xs text-gray-600">
                          {submission.code.js.split('\n').length} lines
                        </span>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
                        <code>{submission.code.js}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Evaluation Results */}
              {submission.result && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    📈 Detailed Evaluation Results
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Structure Analysis */}
                    {submission.result.structure && (
                      <div className="border-l-4 border-green-500 pl-4">
                        <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          🏗️ Structure Analysis
                          <span className="ml-2 text-sm font-bold text-green-600">
                            {submission.result.structureScore}%
                          </span>
                        </h5>
                        <div className="text-sm text-gray-700 space-y-1">
                          {submission.result.structure.missingTags?.length > 0 && (
                            <div>
                              <span className="font-medium">Missing Tags:</span>
                              <span className="ml-2 text-red-600">
                                {submission.result.structure.missingTags.join(', ')}
                              </span>
                            </div>
                          )}
                          {submission.result.structure.extraTags?.length > 0 && (
                            <div>
                              <span className="font-medium">Extra Tags:</span>
                              <span className="ml-2 text-orange-600">
                                {submission.result.structure.extraTags.join(', ')}
                              </span>
                            </div>
                          )}
                          {submission.result.structure.matchedTags?.length > 0 && (
                            <div>
                              <span className="font-medium">Matched Tags:</span>
                              <span className="ml-2 text-green-600">
                                {submission.result.structure.matchedTags.length} correct
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Visual Analysis */}
                    {submission.result.visual && (
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          🎨 Visual Analysis
                          <span className="ml-2 text-sm font-bold text-purple-600">
                            {submission.result.visualScore}%
                          </span>
                        </h5>
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                          {submission.result.visual.diffPixels !== undefined && (
                            <>
                              <div>
                                <span className="font-medium">Different Pixels:</span>
                                <span className="ml-2 text-red-600 font-mono">
                                  {submission.result.visual.diffPixels.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Total Pixels:</span>
                                <span className="ml-2 text-gray-600 font-mono">
                                  {submission.result.visual.totalPixels.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Accuracy:</span>
                                <span className="ml-2 text-green-600 font-bold">
                                  {((1 - submission.result.visual.diffPixels / submission.result.visual.totalPixels) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Difference:</span>
                                <span className="ml-2 text-red-600 font-bold">
                                  {((submission.result.visual.diffPixels / submission.result.visual.totalPixels) * 100).toFixed(2)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Raw Result Data (for debugging) */}
                    <details className="bg-gray-50 rounded p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                        🔍 View Raw Evaluation Data (JSON)
                      </summary>
                      <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                        {JSON.stringify(submission.result, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              {submission.result && submission.result.feedback && submission.result.feedback.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    💡 Evaluation Feedback
                  </h4>
                  <ul className="space-y-2">
                    {submission.result.feedback.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-lg">{item.type === 'success' ? '✅' : item.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                        <span className="text-gray-700">{item.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* User Feedback Section */}
              {submission.user_feedback && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    💬 User Feedback
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{submission.user_feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
