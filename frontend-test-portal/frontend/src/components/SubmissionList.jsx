import { useState } from 'react';

export default function SubmissionList({ submissions, onReEvaluate }) {
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
          </div>

          {expandedId === submission.id && (
            <div className="mt-4 space-y-6">
              {/* Screenshot Comparison Section */}
              {submission.result && submission.result.pixel && submission.result.pixel.screenshots && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🖼️ Visual Comparison
                    <button
                      onClick={() => {
                        downloadScreenshot(`http://localhost:5000${submission.result.pixel.screenshots.candidate}`, `${submission.candidateName}-output.png`);
                        downloadScreenshot(`http://localhost:5000${submission.result.pixel.screenshots.expected}`, `expected-output.png`);
                        downloadScreenshot(`http://localhost:5000${submission.result.pixel.screenshots.diff}`, `diff-output.png`);
                      }}
                      className="ml-auto text-xs bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded"
                    >
                      ⬇️ Download All
                    </button>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Candidate Output */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="bg-blue-600 text-white px-3 py-2 text-sm font-semibold">
                        📸 Candidate's Output
                      </div>
                      <div 
                        className="p-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setScreenshotModal({
                          src: `http://localhost:5000${submission.result.pixel.screenshots.candidate}`,
                          title: `📸 ${submission.candidateName}'s Output - Full View`
                        })}
                      >
                        <img 
                          src={`http://localhost:5000${submission.result.pixel.screenshots.candidate}`}
                          alt="Candidate Output"
                          className="w-full border border-gray-200 rounded"
                          onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="gray">No Image</text></svg>'}
                        />
                      </div>
                      <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600">
                        User's rendered code • Click to enlarge
                      </div>
                    </div>

                    {/* Expected Output */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="bg-green-600 text-white px-3 py-2 text-sm font-semibold">
                        ✅ Expected Output
                      </div>
                      <div 
                        className="p-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setScreenshotModal({
                          src: `http://localhost:5000${submission.result.pixel.screenshots.expected}`,
                          title: '✅ Expected Output - Full View'
                        })}
                      >
                        <img 
                          src={`http://localhost:5000${submission.result.pixel.screenshots.expected}`}
                          alt="Expected Output"
                          className="w-full border border-gray-200 rounded"
                          onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="gray">No Image</text></svg>'}
                        />
                      </div>
                      <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600">
                        Correct solution • Click to enlarge
                      </div>
                    </div>

                    {/* Diff Image */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="bg-red-600 text-white px-3 py-2 text-sm font-semibold">
                        🔍 Difference Map
                      </div>
                      <div 
                        className="p-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setScreenshotModal({
                          src: `http://localhost:5000${submission.result.pixel.screenshots.diff}`,
                          title: '🔍 Difference Map - Full View (Red = Different)'
                        })}
                      >
                        <img 
                          src={`http://localhost:5000${submission.result.pixel.screenshots.diff}`}
                          alt="Difference Map"
                          className="w-full border border-gray-200 rounded"
                          onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="gray">No Image</text></svg>'}
                        />
                      </div>
                      <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600">
                        Red = Different pixels • Click to enlarge
                      </div>
                    </div>
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
                      {submission.result.pixel.diffPixels !== undefined && (
                        <>
                          <div>
                            <span className="text-gray-600">Different Pixels:</span>
                            <span className="ml-2 font-bold text-red-600">
                              {submission.result.pixel.diffPixels.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Pixels:</span>
                            <span className="ml-2 font-bold text-gray-700">
                              {submission.result.pixel.totalPixels.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Match Rate:</span>
                            <span className="ml-2 font-bold text-green-600">
                              {((1 - submission.result.pixel.diffPixels / submission.result.pixel.totalPixels) * 100).toFixed(2)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Code Section */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  💻 Submitted Code
                </h4>
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">HTML:</div>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {submission.code.html}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">CSS:</div>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {submission.code.css}
                  </pre>
                </div>
                {submission.code.js && (
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-1">JavaScript:</div>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      {submission.code.js}
                    </pre>
                  </div>
                )}
              </div>

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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
