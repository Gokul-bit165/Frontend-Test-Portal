export default function ResultsPanel({ result }) {
  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className={`p-6 rounded-lg text-center ${
        result.passed
          ? 'bg-green-100 border-2 border-green-500'
          : 'bg-red-100 border-2 border-red-500'
      }`}>
        <h3 className="text-2xl font-bold mb-2">
          {result.passed ? '🎉 Congratulations!' : '📝 Keep Trying!'}
        </h3>
        <p className="text-4xl font-bold mb-2">
          {result.finalScore}%
        </p>
        <p className="text-lg">
          {result.passed ? 'You passed the challenge!' : 'Review the feedback below'}
        </p>
      </div>

      {/* Encouragement Messages */}
      {result.feedback?.encouragement && result.feedback.encouragement.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="space-y-2">
            {result.feedback.encouragement.map((msg, index) => (
              <p key={index} className="text-purple-800 font-medium">{msg}</p>
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Content</div>
          <div className="text-2xl font-bold text-purple-600">
            {result.contentScore}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.content?.passed ? '✓ Passed' : '✗ Failed'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Weight: 50%
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Visual</div>
          <div className="text-2xl font-bold text-green-600">
            {result.visualScore}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.visual?.passed ? '✓ Passed' : '✗ Failed'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Weight: 50%
          </div>
        </div>
      </div>

      {/* Content Validation Results (NEW) */}
      {result.content && result.content.details && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">📝 Content Validation (Question-Specific)</h4>
          
          <div className="space-y-3">
            {result.content.details.map((item, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-2 ${
                  item.passed 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {item.passed ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <h5 className="font-semibold mb-1">
                      {item.description}
                    </h5>
                    <div className="text-sm mb-2">
                      <span className={`font-bold ${item.passed ? 'text-green-700' : 'text-red-700'}`}>
                        {Math.round(item.score)}%
                      </span>
                      <span className="text-gray-600"> (Weight: {item.weight}%)</span>
                    </div>
                    {item.details && (
                      typeof item.details === 'string' ? (
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {item.details}
                        </p>
                      ) : (
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white/60 border border-gray-200 rounded p-3">
                          {JSON.stringify(item.details, null, 2)}
                        </pre>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Feedback Summary */}
          {result.content.feedback && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-semibold text-blue-900 mb-2">📋 Detailed Feedback:</h5>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {result.content.feedback}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Semantic Role Detection Results - HIDDEN (Generic/Not Question-Specific) */}
      {false && result.feedback?.categories && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Element Detection Results (Generic)</h4>
          
          {/* Matching Elements */}
          {result.feedback.categories.matching.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span>✅</span>
                <span>Correctly Implemented ({result.feedback.categories.matching.length})</span>
              </h5>
              <div className="space-y-2">
                {result.feedback.categories.matching.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-green-200">
                    <p className="font-medium text-green-800">{item.message}</p>
                    {item.details && (
                      <p className="text-sm text-gray-600 mt-1">{item.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Minor Differences */}
          {result.feedback.categories.minorDifferences.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h5 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>Minor Improvements Needed ({result.feedback.categories.minorDifferences.length})</span>
              </h5>
              <div className="space-y-2">
                {result.feedback.categories.minorDifferences.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-medium text-yellow-800">{item.message}</p>
                    {item.suggestion && (
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>💡 Suggestion:</strong> {item.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Elements */}
          {result.feedback.categories.missing.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <span>❌</span>
                <span>Missing Elements ({result.feedback.categories.missing.length})</span>
              </h5>
              <div className="space-y-2">
                {result.feedback.categories.missing.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-red-200">
                    <p className="font-medium text-red-800">{item.message}</p>
                    {item.suggestion && (
                      <p className="text-sm text-gray-700 mt-2">
                        <strong>💡 How to fix:</strong> {item.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Improvement Suggestions */}
      {result.feedback?.improvements && result.feedback.improvements.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-indigo-900 mb-3">📋 Action Items</h4>
          <ul className="space-y-2">
            {result.feedback.improvements.map((improvement, index) => {
              const isObject = improvement && typeof improvement === 'object';
              const title = isObject
                ? improvement.description || improvement.type || 'Review the detailed feedback'
                : improvement;

              return (
                <li
                  key={index}
                  className="text-indigo-800 bg-white/40 rounded border border-indigo-100 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span className="font-medium leading-snug">{title}</span>
                  </div>

                  {isObject && (
                    <div className="mt-2 ml-5 space-y-1 text-sm text-gray-700">
                      {(improvement.score !== undefined || improvement.weight !== undefined || improvement.passed !== undefined) && (
                        <div className="text-xs text-gray-500">
                          {improvement.score !== undefined && (
                            <span>Score: {Math.round(Number(improvement.score) || 0)}%</span>
                          )}
                          {improvement.weight !== undefined && (
                            <span>{improvement.score !== undefined ? ' • ' : ''}Weight: {improvement.weight}%</span>
                          )}
                          {typeof improvement.passed === 'boolean' && (
                            <span>
                              {(improvement.score !== undefined || improvement.weight !== undefined) ? ' • ' : ''}
                              {improvement.passed ? 'Passed' : 'Failed'}
                            </span>
                          )}
                        </div>
                      )}

                      {improvement.details && (
                        typeof improvement.details === 'string' ? (
                          <p className="leading-snug">{improvement.details}</p>
                        ) : (
                          <pre className="text-xs whitespace-pre-wrap font-mono bg-white/60 p-2 rounded">
                            {JSON.stringify(improvement.details, null, 2)}
                          </pre>
                        )
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Screenshots */}
      {result.visual?.screenshots && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-3">📸 Visual Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Your Output</p>
              <img
                src={`http://localhost:5000${result.visual.screenshots.candidate}`}
                alt="Candidate output"
                className="w-full border-2 border-gray-300 rounded shadow-sm"
              />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Expected Output</p>
              <img
                src={`http://localhost:5000${result.visual.screenshots.expected}`}
                alt="Expected output"
                className="w-full border-2 border-gray-300 rounded shadow-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600 mb-2 font-medium">Differences Highlighted</p>
            <img
              src={`http://localhost:5000${result.visual.screenshots.diff}`}
              alt="Diff"
              className="w-full border-2 border-red-300 rounded shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              {result.visual.diffPercentage}% of pixels differ
            </p>
          </div>
        </div>
      )}

      {/* Technical Details - Timestamp Only */}
      {result.timestamp && (
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Evaluated:</strong> {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
