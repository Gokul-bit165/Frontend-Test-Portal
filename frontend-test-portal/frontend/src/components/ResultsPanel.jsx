export default function ResultsPanel({ result }) {
  if (!result) return null;

  const getFeedbackIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getFeedbackColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

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

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Structure (DOM)</div>
          <div className="text-2xl font-bold text-blue-600">
            {result.structureScore}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.dom?.passed ? '✓ Passed' : '✗ Failed'}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Visual (Pixel)</div>
          <div className="text-2xl font-bold text-purple-600">
            {result.visualScore}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.pixel?.passed ? '✓ Passed' : '✗ Failed'}
          </div>
        </div>
      </div>

      {/* Screenshots */}
      {result.pixel?.screenshots && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-3">Visual Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-2">Your Output</p>
              <img
                src={`http://localhost:5000${result.pixel.screenshots.candidate}`}
                alt="Candidate output"
                className="w-full border border-gray-300 rounded"
              />
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">Expected Output</p>
              <img
                src={`http://localhost:5000${result.pixel.screenshots.expected}`}
                alt="Expected output"
                className="w-full border border-gray-300 rounded"
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600 mb-2">Differences Highlighted</p>
            <img
              src={`http://localhost:5000${result.pixel.screenshots.diff}`}
              alt="Diff"
              className="w-full border border-gray-300 rounded"
            />
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {result.feedback && result.feedback.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold">Detailed Feedback</h4>
          {result.feedback.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getFeedbackColor(item.type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getFeedbackIcon(item.type)}</span>
                <div className="flex-1">
                  <p className="font-medium">{item.message}</p>
                  {item.category && (
                    <span className="text-xs opacity-75 mt-1 inline-block">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOM Details (Collapsible) */}
      {result.dom?.details && (
        <details className="bg-white p-4 rounded-lg border border-gray-200">
          <summary className="font-semibold cursor-pointer">
            DOM Structure Details (Click to expand)
          </summary>
          <div className="mt-4 space-y-2 text-sm">
            {result.dom.details.tagMatches?.length > 0 && (
              <div>
                <p className="font-medium text-green-700">✓ Matching Elements:</p>
                <ul className="ml-4 text-gray-600">
                  {result.dom.details.tagMatches.slice(0, 5).map((match, i) => (
                    <li key={i} className="text-xs">{match}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.dom.details.tagMismatches?.length > 0 && (
              <div>
                <p className="font-medium text-red-700">✗ Mismatched Elements:</p>
                <ul className="ml-4 text-gray-600">
                  {result.dom.details.tagMismatches.slice(0, 5).map((mismatch, i) => (
                    <li key={i} className="text-xs">{mismatch}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
