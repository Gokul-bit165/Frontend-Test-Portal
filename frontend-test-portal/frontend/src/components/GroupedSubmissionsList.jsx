import { useState } from 'react';

export default function GroupedSubmissionsList({ sessions, onViewDetails }) {
  const [expandedSessions, setExpandedSessions] = useState(new Set());

  const toggleSession = (sessionId) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      passed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500 text-lg">No test sessions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const isExpanded = expandedSessions.has(session.session_id);
        const completionRate = session.total_questions > 0 
          ? Math.round((session.passed_count / session.total_questions) * 100)
          : 0;

        return (
          <div key={session.session_id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {/* Session Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSession(session.session_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.user.name}
                    </h3>
                    {getStatusBadge(session.overall_status)}
                    <span className="text-sm text-gray-500">
                      Level {session.level}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-700">{session.user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Course:</span>
                      <span className="ml-2 text-gray-700">{session.course_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Passed:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {session.passed_count} / {session.total_questions}
                      </span>
                      <span className={`ml-2 text-xs ${completionRate === 100 ? 'text-green-600' : 'text-red-600'}`}>
                        ({completionRate}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <span className="ml-2 text-gray-700">{formatDate(session.started_at)}</span>
                    </div>
                  </div>

                  {session.user_feedback && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <span className="text-blue-700 font-medium">Feedback: </span>
                      <span className="text-gray-700">{session.user_feedback}</span>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <svg 
                    className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Submissions Details */}
            {isExpanded && (
              <div className="border-t bg-gray-50 p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Question Submissions:</h4>
                
                {session.submissions && session.submissions.length > 0 ? (
                  <div className="space-y-2">
                    {session.submissions.map((submission, index) => (
                      <div 
                        key={submission.id} 
                        className="bg-white p-3 rounded border flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-700">
                              Question {index + 1}
                            </span>
                            <span className="text-sm text-gray-500">
                              {submission.challenge_id}
                            </span>
                            {getStatusBadge(submission.status)}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <span>Score: </span>
                            <span className={`font-semibold ${submission.final_score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                              {submission.final_score}%
                            </span>
                            <span className="ml-4 text-gray-400">
                              {formatDate(submission.submitted_at)}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(submission.id);
                          }}
                          className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No submissions in this session</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
