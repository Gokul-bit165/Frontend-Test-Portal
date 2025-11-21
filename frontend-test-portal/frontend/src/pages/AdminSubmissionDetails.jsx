import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const SectionCard = ({ title, children }) => (
  <section className="bg-white rounded-xl shadow border border-gray-100">
    <header className="px-6 py-4 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </header>
    <div className="p-6 space-y-4 text-sm text-gray-700">
      {children}
    </div>
  </section>
);

const ScoreBadge = ({ label, value }) => (
  <div className="flex flex-col rounded-lg border px-4 py-3 bg-gray-50">
    <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
    <span className={`text-xl font-semibold ${value >= 70 ? 'text-green-600' : 'text-rose-500'}`}>
      {value ?? 0}%
    </span>
  </div>
);

export default function AdminSubmissionDetails() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/submissions/${submissionId}`);
        setSubmission(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to load submission details:', err);
        setError(err.response?.data?.error || 'Unable to load submission details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const evaluation = submission?.result || {};
  const finalScore = evaluation.finalScore ?? submission?.total_score ?? 0;
  const structureScore = evaluation.structureScore ?? submission?.structure_score ?? 0;
  const visualScore = evaluation.visualScore ?? submission?.visual_score ?? 0;
  const contentScore = evaluation.contentScore ?? submission?.content_score ?? 0;

  const codeBlocks = [
    { label: 'HTML', content: submission?.code?.html },
    { label: 'CSS', content: submission?.code?.css },
    { label: 'JavaScript', content: submission?.code?.js },
  ];

  const renderStatusBadge = () => {
    const status = submission?.status;
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold';

    if (status === 'passed') {
      return <span className={`${baseClasses} bg-green-100 text-green-700`}>PASSED</span>;
    }
    if (status === 'failed') {
      return <span className={`${baseClasses} bg-rose-100 text-rose-700`}>FAILED</span>;
    }
    return <span className={`${baseClasses} bg-amber-100 text-amber-700`}>{status?.toUpperCase() || 'PENDING'}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-indigo-600 mx-auto" />
          <p className="text-gray-600">Loading submission details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow text-center space-y-4">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Submission ID</p>
            <h1 className="text-3xl font-bold text-gray-900">{submission.id}</h1>
          </div>
          <div className="flex items-center gap-3">
            {renderStatusBadge()}
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <SectionCard title="Candidate Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Candidate</p>
              <p className="text-base text-gray-900 font-medium">
                {submission.candidateName || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-500">User ID: {submission.userId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Challenge</p>
              <p className="text-base text-gray-900 font-medium">{submission.challengeId}</p>
              <p className="text-sm text-gray-500">Submitted at {new Date(submission.submittedAt).toLocaleString()}</p>
              {submission.evaluatedAt && (
                <p className="text-sm text-gray-500">Evaluated at {new Date(submission.evaluatedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Evaluation Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreBadge label="Final Score" value={Math.round(finalScore ?? 0)} />
            <ScoreBadge label="Content" value={Math.round(contentScore ?? 0)} />
            <ScoreBadge label="Visual" value={Math.round(visualScore ?? 0)} />
            <ScoreBadge label="Structure" value={Math.round(structureScore ?? 0)} />
          </div>
          {evaluation.feedback && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{evaluation.feedback}</p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Code Snapshot">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {codeBlocks.map(({ label, content }) => (
              <div key={label} className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 tracking-wide">{label}</span>
                  <span className="text-xs text-gray-400">
                    {(content || '').length} chars
                  </span>
                </div>
                <pre className="flex-1 rounded-lg bg-slate-900 text-green-200 text-xs p-3 overflow-auto shadow-inner">
                  {content && content.trim().length > 0 ? content : '// No code submitted'}
                </pre>
              </div>
            ))}
          </div>
        </SectionCard>

        {submission.user_screenshot || submission.expected_screenshot ? (
          <SectionCard title="Visual Comparison">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {submission.user_screenshot && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Candidate Output</p>
                  <img
                    src={submission.user_screenshot}
                    alt="Candidate screenshot"
                    className="rounded-lg border shadow-sm"
                  />
                </div>
              )}
              {submission.expected_screenshot && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Expected Output</p>
                  <img
                    src={submission.expected_screenshot}
                    alt="Expected screenshot"
                    className="rounded-lg border shadow-sm"
                  />
                </div>
              )}
            </div>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}
