import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QuestionManagerModal from '../components/QuestionManagerModal';
import SubmissionList from '../components/SubmissionList';
import GroupedSubmissionsList from '../components/GroupedSubmissionsList';
import { clearAdminSession, notifySessionChange } from '../utils/session';

const OPEN_SOURCE_RESOURCES = [
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Utility-first CSS for rapid UI building',
    url: 'https://tailwindcss.com/docs'
  },
  {
    id: 'alpine',
    name: 'Alpine.js',
    description: 'Lightweight interactivity without heavy frameworks',
    url: 'https://alpinejs.dev'
  },
  {
    id: 'lucide',
    name: 'Lucide Icons',
    description: 'Open-source iconography set',
    url: 'https://lucide.dev'
  },
  {
    id: 'gsap',
    name: 'GSAP Animations',
    description: 'Battle-tested animation toolkit',
    url: 'https://greensock.com/gsap'
  }
];

const buildFallbackAiQuestion = ({ prompt, screenshotName, assets, libraries }) => {
  const safePrompt = (prompt || '').trim() || 'responsive dashboard hero section';
  const keywords = safePrompt.split(/\s+/).slice(0, 4).join(' ');
  const recommendedAssets = assets.map(asset => ({
    filename: asset.filename,
    url: asset.url,
    path: asset.path || asset.relativePath || asset.url,
    category: asset.category || 'general'
  }));
  const resourceDetails = OPEN_SOURCE_RESOURCES.filter(lib => libraries.includes(lib.id));

  return {
    title: `AI Draft: ${keywords.charAt(0).toUpperCase() + keywords.slice(1)}`,
    summary: `Generate a coding challenge that recreates "${safePrompt}"${
      screenshotName ? ` using the screenshot ${screenshotName} as the primary reference.` : '.'
    }`,
    instructions: [
      'Study the uploaded screenshot and outline the semantic sections you observe.',
      'Use any highlighted assets plus the selected open-source libraries to stay faithful to the reference.',
      'Deliver both desktop and mobile breakpoints with clear spacing, typography, and interaction states.'
    ],
    acceptanceCriteria: [
      'Structure mirrors the reference layout with semantic HTML landmarks.',
      'Responsive behavior confirmed at 320px, 768px, and 1280px breakpoints.',
      'Visual language (colors, spacing, iconography) stays within 5% variance of the reference screenshot.',
      'Includes validation steps that describe how to evaluate the submission programmatically.'
    ],
    htmlOutline: [
      'Hero wrapper containing headline, subtitle, CTA cluster, and media pane.',
      'Support section with metric cards or feature grid depending on the screenshot composition.',
      'Footer or auxiliary strip referencing any badges/assets the designer supplied.'
    ],
    cssFocus: [
      'Use CSS custom properties to centralize palette and spacing.',
      'Adopt fluid type scales (`clamp`) to keep text legible across breakpoints.',
      'Add motion/hover affordances for CTAs, icons, and cards.'
    ],
    recommendedAssets,
    libraries: resourceDetails,
    promptEcho: safePrompt,
    screenshotName: screenshotName || null
  };
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Overview data
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubmissions: 0,
    totalCourses: 0,
    totalChallenges: 0
  });

  // Users data
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Submissions data
  const [submissions, setSubmissions] = useState([]);
  const [groupedSessions, setGroupedSessions] = useState([]);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionViewMode, setSubmissionViewMode] = useState('grouped'); // 'grouped' or 'individual'
  const [detailModal, setDetailModal] = useState({
    open: false,
    loading: false,
    error: '',
    submission: null,
    submissionId: null
  });

  // Courses data
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedQuestionCourseId, setSelectedQuestionCourseId] = useState(null);

  // Challenges data
  const [challenges, setChallenges] = useState([]);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // Assets data
  const [assets, setAssets] = useState([]);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');

  // AI agent data
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiScreenshot, setAiScreenshot] = useState({ file: null, preview: '' });
  const [aiSelectedAssets, setAiSelectedAssets] = useState([]);
  const [aiSelectedLibraries, setAiSelectedLibraries] = useState([]);
  const [aiGeneratedQuestion, setAiGeneratedQuestion] = useState(null);
  const [aiError, setAiError] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [submissionViewMode]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadSubmissions(),
        loadCourses(),
        loadChallenges(),
        loadAssets()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data || []);
      setStats(prev => ({ ...prev, totalUsers: res.data?.length || 0 }));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      if (submissionViewMode === 'grouped') {
        const res = await axios.get('http://localhost:5000/api/admin/submissions/grouped');
        setGroupedSessions(res.data || []);
        
        // Calculate stats from sessions
        let totalSubmissions = 0;
        res.data.forEach(session => {
          totalSubmissions += session.total_questions || 0;
        });
        setStats(prev => ({ ...prev, totalSubmissions }));
      } else {
        const res = await axios.get('http://localhost:5000/api/submissions');
        setSubmissions(res.data || []);
        setStats(prev => ({ ...prev, totalSubmissions: res.data?.length || 0 }));
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const closeDetailModal = () => {
    setDetailModal({
      open: false,
      loading: false,
      error: '',
      submission: null,
      submissionId: null
    });
  };

  const fetchSubmissionDetails = async (submissionId) => {
    setDetailModal({
      open: true,
      loading: true,
      error: '',
      submission: null,
      submissionId
    });

    try {
      const res = await axios.get(`http://localhost:5000/api/submissions/${submissionId}`);
      setDetailModal({
        open: true,
        loading: false,
        error: '',
        submission: res.data,
        submissionId
      });
    } catch (error) {
      console.error('Failed to load submission details:', error);
      setDetailModal({
        open: true,
        loading: false,
        error: error.response?.data?.error || 'Failed to load submission details',
        submission: null,
        submissionId
      });
    }
  };

  const renderStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold';
    if (status === 'passed') {
      return <span className={`${baseClasses} bg-green-100 text-green-700`}>PASSED</span>;
    }
    if (status === 'failed') {
      return <span className={`${baseClasses} bg-rose-100 text-rose-700`}>FAILED</span>;
    }
    if (!status) {
      return <span className={`${baseClasses} bg-amber-100 text-amber-700`}>PENDING</span>;
    }
    return <span className={`${baseClasses} bg-amber-100 text-amber-700`}>{status.toUpperCase()}</span>;
  };

  const renderSubmissionDetailBody = () => {
    try {
      if (detailModal.loading) {
        return (
          <div className="py-16 text-center space-y-4">
            <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500">Loading submission details…</p>
          </div>
        );
      }

      if (detailModal.error) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold mb-4">{detailModal.error}</p>
            <button
              onClick={() => fetchSubmissionDetails(detailModal.submissionId)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        );
      }

      if (!detailModal.submission) {
        return <p className="text-gray-500">No submission data available.</p>;
      }

      const submission = detailModal.submission;
      const parsedCode = parseJSONSafe(submission.code, submission.code) || {};
      const safeCode = {
        html: typeof parsedCode.html === 'string' ? parsedCode.html : (typeof parsedCode === 'string' ? parsedCode : ''),
        css: typeof parsedCode.css === 'string' ? parsedCode.css : '',
        js: typeof parsedCode.js === 'string' ? parsedCode.js : ''
      };
      const evaluationPayload = parseJSONSafe(submission.result, submission.result) || {};
      const evaluation = typeof evaluationPayload === 'object' && !Array.isArray(evaluationPayload)
        ? evaluationPayload
        : {};
      const finalScore = Math.round(evaluation.finalScore ?? submission.total_score ?? 0);
      const contentScore = Math.round(evaluation.contentScore ?? submission.content_score ?? 0);
      const visualScore = Math.round(evaluation.visualScore ?? submission.visual_score ?? 0);
      const structureScore = Math.round(evaluation.structureScore ?? submission.structure_score ?? 0);
      const codeBlocks = [
        { label: 'HTML', content: safeCode.html },
        { label: 'CSS', content: safeCode.css },
        { label: 'JavaScript', content: safeCode.js }
      ];
      const rawFeedback = evaluation.feedback;
      const feedbackIsObject = rawFeedback && typeof rawFeedback === 'object' && !Array.isArray(rawFeedback);
      const feedbackString = typeof rawFeedback === 'string' ? rawFeedback : '';
      const encouragementList = (() => {
        if (feedbackIsObject) {
          const values = normalizeList(rawFeedback.encouragement);
          if (values.length) return values;
        }
        return feedbackString ? [feedbackString] : ['Great progress!'];
      })();
      const improvementsList = (() => {
        if (feedbackIsObject) {
          const values = normalizeList(rawFeedback.improvements);
          if (values.length) return values;
        }
        return ['Review semantic structure and styling to match the expected output.'];
      })();
      const contentValidation = feedbackIsObject ? rawFeedback.contentValidation : '';
      const contentDetails = feedbackIsObject ? normalizeList(rawFeedback.contentDetails) : [];
      const shouldShowContentValidation = !!contentValidation || contentDetails.length > 0;

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Final Score', value: finalScore, color: 'text-blue-600' },
              { label: 'Content', value: contentScore, color: 'text-green-600' },
              { label: 'Visual', value: visualScore, color: 'text-purple-600' },
              { label: 'Structure', value: structureScore, color: 'text-rose-600' }
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-xs uppercase text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-semibold ${color}`}>{Number.isFinite(value) ? value : 0}%</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-xl border p-5">
            <div>
              <p className="text-xs uppercase text-gray-500">Candidate</p>
              <p className="text-lg font-semibold text-gray-900">{submission.candidateName || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">User ID: {submission.userId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Challenge</p>
              <p className="text-lg font-semibold text-gray-900">{submission.challengeId}</p>
              <p className="text-sm text-gray-500">
                Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
              </p>
              {submission.evaluatedAt && (
                <p className="text-sm text-gray-500">
                  Evaluated {new Date(submission.evaluatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {codeBlocks.map(({ label, content }) => (
              <div key={label} className="bg-slate-900 rounded-xl p-3 text-xs text-green-100 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="uppercase tracking-wide text-slate-300">{label}</span>
                  <span className="text-slate-500 text-[10px]">{(content || '').length} chars</span>
                </div>
                <pre className="overflow-auto max-h-64 whitespace-pre-wrap">
                  {content && typeof content === 'string' && content.trim().length > 0 ? content : '// No code submitted'}
                </pre>
              </div>
            ))}
          </div>

          {(submission.user_screenshot || submission.expected_screenshot) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submission.user_screenshot && (
                <div>
                  <p className="text-xs uppercase text-gray-500 mb-2">Candidate Output</p>
                  <img
                    src={submission.user_screenshot}
                    alt="Candidate screenshot"
                    className="rounded-xl border"
                  />
                </div>
              )}
              {submission.expected_screenshot && (
                <div>
                  <p className="text-xs uppercase text-gray-500 mb-2">Expected Output</p>
                  <img
                    src={submission.expected_screenshot}
                    alt="Expected screenshot"
                    className="rounded-xl border"
                  />
                </div>
              )}
            </div>
          )}

          {rawFeedback && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Encouragement</p>
                <ul className="space-y-2 text-sm text-blue-900">
                  {encouragementList.map((msg, idx) => {
                    const isObject = msg && typeof msg === 'object';
                    const title = isObject
                      ? msg.description || msg.type || 'Feedback'
                      : msg;

                    return (
                      <li key={`enc-${idx}`} className="border-l-2 border-blue-300 pl-3 py-1">
                        <div className="font-medium">{title}</div>
                        {isObject && msg.details && (
                          <div className="mt-1 text-xs text-gray-600">
                            {typeof msg.details === 'string' ? (
                              <p className="text-blue-800">{msg.details}</p>
                            ) : (
                              <pre className="text-[10px] whitespace-pre-wrap font-mono bg-white/60 p-2 rounded">
                                {JSON.stringify(msg.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Improvements</p>
                <ul className="space-y-2 text-sm text-amber-900">
                  {improvementsList.map((msg, idx) => {
                    const isObject = msg && typeof msg === 'object';
                    const title = isObject
                      ? msg.description || msg.type || 'Review feedback'
                      : msg;

                    return (
                      <li key={`imp-${idx}`} className="border-l-2 border-amber-300 pl-3 py-1">
                        <div className="font-medium">{title}</div>
                        {isObject && (
                          <div className="mt-1 space-y-1 text-xs text-gray-600">
                            {(msg.score !== undefined || msg.weight !== undefined || msg.passed !== undefined) && (
                              <div>
                                {msg.score !== undefined && (
                                  <span>Score: {Math.round(Number(msg.score) || 0)}%</span>
                                )}
                                {msg.weight !== undefined && (
                                  <span>{msg.score !== undefined ? ' • ' : ''}Weight: {msg.weight}%</span>
                                )}
                                {typeof msg.passed === 'boolean' && (
                                  <span>
                                    {(msg.score !== undefined || msg.weight !== undefined) ? ' • ' : ''}
                                    {msg.passed ? 'Passed' : 'Failed'}
                                  </span>
                                )}
                              </div>
                            )}
                            {msg.details && (
                              typeof msg.details === 'string' ? (
                                <p className="text-gray-700">{msg.details}</p>
                              ) : (
                                <pre className="text-[10px] whitespace-pre-wrap font-mono bg-white/60 p-2 rounded">
                                  {JSON.stringify(msg.details, null, 2)}
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
              {shouldShowContentValidation && (
                <div className="md:col-span-2 p-4 bg-white rounded-xl border">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Content Validation</p>
                  {contentValidation && (
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                      {contentValidation}
                    </p>
                  )}
                  {contentDetails.length > 0 && (
                    <ul className="text-sm text-gray-700 space-y-2">
                      {contentDetails.map((detail, idx) => {
                        const isObject = detail && typeof detail === 'object';
                        const title = isObject
                          ? detail.description || detail.type || 'Content validation item'
                          : detail;

                        return (
                          <li key={`detail-${idx}`} className="border-l-2 border-gray-300 pl-3 py-1">
                            <div className="font-medium">{title}</div>
                            {isObject && (
                              <div className="mt-1 space-y-1 text-xs text-gray-600">
                                {(detail.score !== undefined || detail.weight !== undefined || detail.passed !== undefined) && (
                                  <div>
                                    {detail.score !== undefined && (
                                      <span>Score: {Math.round(Number(detail.score) || 0)}%</span>
                                    )}
                                    {detail.weight !== undefined && (
                                      <span>{detail.score !== undefined ? ' • ' : ''}Weight: {detail.weight}%</span>
                                    )}
                                    {typeof detail.passed === 'boolean' && (
                                      <span>
                                        {(detail.score !== undefined || detail.weight !== undefined) ? ' • ' : ''}
                                        {detail.passed ? 'Passed' : 'Failed'}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {detail.details && (
                                  typeof detail.details === 'string' ? (
                                    <p className="text-gray-700">{detail.details}</p>
                                  ) : (
                                    <pre className="text-[10px] whitespace-pre-wrap font-mono bg-white/60 p-2 rounded border">
                                      {JSON.stringify(detail.details, null, 2)}
                                    </pre>
                                  )
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Failed to render submission detail view:', error, detailModal.submission);
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-3">
          <p className="text-red-700 font-semibold">Something went wrong while rendering this submission.</p>
          <p className="text-sm text-red-600">{error.message}</p>
          <button
            onClick={() => {
              if (detailModal.submissionId) {
                fetchSubmissionDetails(detailModal.submissionId);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload submission details
          </button>
          <button
            onClick={() => navigate(`/admin/submission/${detailModal.submissionId || detailModal.submission?.id || ''}`)}
            className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Open full detail page ↗
          </button>
        </div>
      );
    }
  };

  const loadCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses');
      setCourses(res.data || []);
      setStats(prev => ({ ...prev, totalCourses: res.data?.length || 0 }));
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  useEffect(() => {
    if (!selectedQuestionCourseId && courses.length) {
      setSelectedQuestionCourseId(courses[0].id);
    }
  }, [courses, selectedQuestionCourseId]);

  const selectedQuestionCourse = courses.find(course => course.id === selectedQuestionCourseId);

  const loadChallenges = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/challenges');
      setChallenges(res.data || []);
      setStats(prev => ({ ...prev, totalChallenges: res.data?.length || 0 }));
    } catch (error) {
      console.error('Failed to load challenges:', error);
    }
  };

  const loadAssets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/assets');
      setAssets(res.data || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleUploadAsset = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAsset(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('asset', file);
        formData.append('category', 'general'); // Can be changed to dropdown value

        await axios.post('http://localhost:5000/api/assets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      await loadAssets();
      alert('Asset(s) uploaded successfully!');
      e.target.value = ''; // Reset file input
    } catch (error) {
      alert('Failed to upload asset: ' + error.message);
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleDeleteAsset = async (filename) => {
    if (!confirm('Delete this asset? This cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/assets/${filename}`);
      await loadAssets();
      alert('Asset deleted successfully');
    } catch (error) {
      alert('Failed to delete asset: ' + error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Path copied to clipboard!');
  };

  const normalizeList = (value) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (!value && value !== 0) {
      return [];
    }
    return [value];
  };

  const parseJSONSafe = (value, fallback = null) => {
    if (value === undefined || value === null) {
      return fallback;
    }
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn('Failed to parse JSON payload', error);
        return fallback;
      }
    }
    return value;
  };

  const handleAiScreenshotUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAiScreenshot({ file, preview: reader.result?.toString() || '' });
    };
    reader.readAsDataURL(file);
  };

  const clearAiScreenshot = () => {
    setAiScreenshot({ file: null, preview: '' });
  };

  const handleAiAssetToggle = (filename) => {
    setAiSelectedAssets((prev) =>
      prev.includes(filename)
        ? prev.filter((item) => item !== filename)
        : prev.length >= 6
          ? prev
          : [...prev, filename]
    );
  };

  const handleAiLibraryToggle = (libraryId) => {
    setAiSelectedLibraries((prev) =>
      prev.includes(libraryId)
        ? prev.filter((item) => item !== libraryId)
        : [...prev, libraryId]
    );
  };

  const handleAiReset = () => {
    setAiPrompt('');
    setAiScreenshot({ file: null, preview: '' });
    setAiSelectedAssets([]);
    setAiSelectedLibraries([]);
    setAiGeneratedQuestion(null);
    setAiError('');
  };

  const generateQuestionWithAgent = async () => {
    if (!aiPrompt.trim()) {
      alert('Describe the experience you want before asking the AI agent to generate it.');
      return;
    }

    setAiGenerating(true);
    setAiError('');
    setAiGeneratedQuestion(null);

    const payload = new FormData();
    payload.append('prompt', aiPrompt.trim());
    payload.append('assets', JSON.stringify(aiSelectedAssets));
    payload.append('libraries', JSON.stringify(aiSelectedLibraries));
    if (aiScreenshot.file) {
      payload.append('screenshot', aiScreenshot.file);
    }

    try {
      const response = await axios.post('http://localhost:5000/api/ai/generate-question', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAiGeneratedQuestion(response.data);
    } catch (error) {
      console.warn('AI endpoint unavailable, using fallback generator', error);
      setAiError(error.response?.data?.error || 'AI endpoint unavailable. Generated an offline draft instead.');
      const selectedAssetObjects = assets.filter((asset) => aiSelectedAssets.includes(asset.filename));
      setAiGeneratedQuestion(
        buildFallbackAiQuestion({
          prompt: aiPrompt,
          screenshotName: aiScreenshot.file?.name,
          assets: selectedAssetObjects,
          libraries: aiSelectedLibraries
        })
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate('/login');
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadUsers();

      const currentUserId = (localStorage.getItem('userId') || '').toString();
      if (currentUserId && currentUserId === (userId || '').toString()) {
        localStorage.setItem('userRole', newRole);

        if (newRole === 'admin') {
          const userToken = localStorage.getItem('userToken');
          if (userToken) {
            localStorage.setItem('adminToken', userToken);
          }
          if (response?.data) {
            localStorage.setItem('adminUser', JSON.stringify(response.data));
          }
          notifySessionChange();
          navigate('/admin/dashboard');
        } else {
          clearAdminSession();
          notifySessionChange();
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            navigate('/');
          }
        }
      }

      alert('User role updated successfully');
    } catch (error) {
      alert('Failed to update user role: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This will remove all their progress.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  const handleViewSubmissionDetails = (submissionId) => {
    fetchSubmissionDetails(submissionId);
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!confirm('Delete this submission?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/submissions/${submissionId}`);
      await loadSubmissions();
      alert('Submission deleted successfully');
    } catch (error) {
      alert('Failed to delete submission: ' + error.message);
    }
  };

  const handleReEvaluate = async (submissionId) => {
    if (!confirm('Re-evaluate this submission?')) return;
    try {
      await axios.post(`http://localhost:5000/api/evaluate`, { submissionId });
      await loadSubmissions();
      alert('Re-evaluation complete!');
    } catch (error) {
      alert('Failed to re-evaluate: ' + error.message);
    }
  };

  const handleSaveCourse = async (courseData) => {
    try {
      if (editingCourse?.id) {
        await axios.put(`http://localhost:5000/api/courses/${editingCourse.id}`, courseData);
      } else {
        await axios.post('http://localhost:5000/api/courses', courseData);
      }
      await loadCourses();
      setShowCourseModal(false);
      setEditingCourse(null);
      alert('Course saved successfully');
    } catch (error) {
      alert('Failed to save course: ' + error.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course? This will affect all users enrolled.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`);
      await loadCourses();
      alert('Course deleted successfully');
    } catch (error) {
      alert('Failed to delete course: ' + error.message);
    }
  };

  const handleSaveChallenge = async (challengeData) => {
    try {
      if (editingChallenge?.id) {
        await axios.put(`http://localhost:5000/api/challenges/${editingChallenge.id}`, challengeData);
      } else {
        await axios.post('http://localhost:5000/api/challenges', challengeData);
      }
      await loadChallenges();
      setShowChallengeModal(false);
      setEditingChallenge(null);
      alert('Challenge saved successfully');
    } catch (error) {
      alert('Failed to save challenge: ' + error.message);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!confirm('Delete this challenge?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/challenges/${challengeId}`);
      await loadChallenges();
      alert('Challenge deleted successfully');
    } catch (error) {
      alert('Failed to delete challenge: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.userId?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(s =>
    s.candidateName?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
    s.challengeId?.toLowerCase().includes(submissionSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🛡️ Admin Dashboard</h1>
              <p className="text-indigo-100 mt-1">Comprehensive platform management</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                🏠 Home
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'users', label: '👥 Users', icon: '👥' },
              { id: 'courses', label: '📚 Courses', icon: '📚' },
              { id: 'questions', label: '❓ Questions', icon: '❓' },
              { id: 'submissions', label: '📝 Submissions', icon: '📝' },
              // { id: 'ai-agent', label: '🤖 Question AI Agent', icon: '🤖' },
              { id: 'assets', label: '📁 Assets', icon: '📁' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold transition-colors border-b-4 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Platform Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-sm opacity-90 mb-2">Total Users</div>
                    <div className="text-4xl font-bold">{stats.totalUsers}</div>
                    <div className="mt-2 text-xs opacity-75">Registered accounts</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-sm opacity-90 mb-2">Total Courses</div>
                    <div className="text-4xl font-bold">{stats.totalCourses}</div>
                    <div className="mt-2 text-xs opacity-75">Available courses</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="text-sm opacity-90 mb-2">Submissions</div>
                    <div className="text-4xl font-bold">{stats.totalSubmissions}</div>
                    <div className="mt-2 text-xs opacity-75">Total attempts</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        setEditingCourse(null);
                        setShowCourseModal(true);
                      }}
                      className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <div className="text-3xl mb-2">➕</div>
                      <div className="font-semibold">Add Course</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <div className="text-3xl mb-2">👥</div>
                      <div className="font-semibold">View Users</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('submissions')}
                      className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <div className="text-3xl mb-2">📝</div>
                      <div className="font-semibold">View Submissions</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold mb-4">Recent Submissions</h3>
                  <div className="space-y-2">
                    {submissions.slice(0, 5).map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold">{sub.candidateName}</div>
                          <div className="text-sm text-gray-600">{sub.challengeId}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          sub.status === 'passed' ? 'bg-green-100 text-green-700' :
                          sub.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sub.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Users Management</h2>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map(user => (
                        <tr key={user.id || user.userId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-600">{user.id || user.userId}</td>
                          <td className="px-6 py-4 text-sm font-semibold">{user.username || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm">
                            <select
                              value={user.role || 'student'}
                              onChange={(e) => handleChangeUserRole(user.id || user.userId, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800 border-purple-300' 
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}
                            >
                              <option value="student">Student</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.id || user.userId)}
                              className="text-red-600 hover:text-red-800 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Courses Management</h2>
                  <button
                    onClick={() => {
                      setEditingCourse(null);
                      setShowCourseModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Add New Course
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{course.totalLevels || 0} Levels</span>
                          <span>{course.difficulty || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedQuestionCourseId(course.id);
                              setActiveTab('questions');
                            }}
                            className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                          >
                            📝 Manage Questions
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCourse(course);
                                setShowCourseModal(true);
                              }}
                              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-72 bg-white rounded-lg shadow p-4 h-fit">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Courses</h3>
                      <span className="text-xs text-gray-500">{courses.length}</span>
                    </div>
                    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                      {courses.map(course => (
                        <button
                          key={course.id}
                          onClick={() => setSelectedQuestionCourseId(course.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                            selectedQuestionCourseId === course.id
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="font-semibold leading-tight">{course.title}</div>
                          <div className="text-xs text-gray-500">{course.totalLevels || 0} levels</div>
                        </button>
                      ))}
                      {courses.length === 0 && (
                        <p className="text-sm text-gray-500">No courses available.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    {selectedQuestionCourse ? (
                      <QuestionManagerModal
                        courseId={selectedQuestionCourse.id}
                        courseName={selectedQuestionCourse.title}
                        standalone
                        onClose={() => {}}
                      />
                    ) : (
                      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
                        Select a course to start managing questions.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Submissions Management</h2>
                  <div className="flex gap-3 items-center">
                    <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => {
                          setSubmissionViewMode('grouped');
                          loadSubmissions();
                        }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          submissionViewMode === 'grouped'
                            ? 'bg-white text-indigo-600 shadow'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        📋 Grouped by Test
                      </button>
                      <button
                        onClick={() => {
                          setSubmissionViewMode('individual');
                          loadSubmissions();
                        }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          submissionViewMode === 'individual'
                            ? 'bg-white text-indigo-600 shadow'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        📄 Individual
                      </button>
                    </div>
                    {submissionViewMode === 'individual' && (
                      <input
                        type="text"
                        placeholder="Search submissions..."
                        value={submissionSearch}
                        onChange={(e) => setSubmissionSearch(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                      />
                    )}
                  </div>
                </div>
                
                {submissionViewMode === 'grouped' ? (
                  <GroupedSubmissionsList 
                    sessions={groupedSessions}
                    onViewDetails={handleViewSubmissionDetails}
                  />
                ) : (
                  <SubmissionList 
                    submissions={filteredSubmissions}
                    onReEvaluate={handleReEvaluate}
                    onDelete={handleDeleteSubmission}
                  />
                )}
              </div>
            )}

            {/* AI Agent Tab - Hidden for now */}
            {false && activeTab === 'ai-agent' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section className="bg-white rounded-lg shadow p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">Question Generation Agent</h2>
                        <p className="text-sm text-gray-600">Upload a visual reference and feed the agent curated assets.</p>
                      </div>
                      <button
                        onClick={handleAiReset}
                        className="text-sm px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Reset
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Screenshot reference</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                        {aiScreenshot.preview ? (
                          <div className="space-y-3">
                            <img src={aiScreenshot.preview} alt="Screenshot preview" className="mx-auto max-h-64 rounded-lg shadow" />
                            <div className="flex justify-center gap-3">
                              <span className="text-sm text-gray-600">{aiScreenshot.file?.name}</span>
                              <button
                                onClick={clearAiScreenshot}
                                className="text-sm text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="block cursor-pointer">
                            <div className="text-gray-500">
                              <p className="text-lg font-semibold">Drop screenshot or browse</p>
                              <p className="text-sm">PNG, JPG up to 5MB</p>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleAiScreenshotUpload} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-800">Attach assets from Asset Manager</label>
                        <span className="text-xs text-gray-500">Pick up to 6</span>
                      </div>
                      {assets.length === 0 ? (
                        <p className="text-sm text-gray-500">No assets yet. Upload items inside the Asset tab to reference them here.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                          {assets.slice(0, 10).map((asset) => (
                            <label
                              key={asset.filename}
                              className={`border rounded-lg p-3 cursor-pointer flex items-start gap-3 transition ${
                                aiSelectedAssets.includes(asset.filename)
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={aiSelectedAssets.includes(asset.filename)}
                                onChange={() => handleAiAssetToggle(asset.filename)}
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{asset.filename}</p>
                                <p className="text-xs text-gray-500 truncate">{asset.path}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="bg-white rounded-lg shadow p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Describe the experience</label>
                      <textarea
                        rows={6}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Example: Dashboard hero with gradient background, KPI cards, collaboration avatars, and a sticky action bar."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">Open-source helpers</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {OPEN_SOURCE_RESOURCES.map((resource) => (
                          <button
                            key={resource.id}
                            onClick={() => handleAiLibraryToggle(resource.id)}
                            type="button"
                            className={`text-left border rounded-lg p-3 transition ${
                              aiSelectedLibraries.includes(resource.id)
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-gray-900 text-sm">{resource.name}</span>
                              <span className="text-xs text-gray-500">{aiSelectedLibraries.includes(resource.id) ? 'Selected' : 'Tap to add'}</span>
                            </div>
                            <p className="text-xs text-gray-600">{resource.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={generateQuestionWithAgent}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        disabled={aiGenerating}
                      >
                        {aiGenerating ? 'Generating...' : 'Generate Question'}
                      </button>
                      {aiScreenshot.file && (
                        <span className="text-xs text-gray-500">Screenshot attached: {aiScreenshot.file.name}</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      The agent tries the backend endpoint first and falls back to an offline draft when AI services are unavailable.
                    </p>
                  </section>
                </div>

                {aiError && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                    {aiError}
                  </div>
                )}

                {aiGeneratedQuestion ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                      <div>
                        <p className="text-xs uppercase text-indigo-500 font-semibold">Challenge Draft</p>
                        <h3 className="text-xl font-bold">{aiGeneratedQuestion.title || 'AI Draft'}</h3>
                        <p className="text-sm text-gray-600 mt-2">{aiGeneratedQuestion.summary || aiGeneratedQuestion.description}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">Instructions</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {normalizeList(aiGeneratedQuestion.instructions).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                      <div>
                        <p className="text-xs uppercase text-indigo-500 font-semibold">Acceptance criteria</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {normalizeList(aiGeneratedQuestion.acceptanceCriteria || aiGeneratedQuestion.criteria).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-indigo-500 font-semibold">HTML Outline</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {normalizeList(aiGeneratedQuestion.htmlOutline).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-indigo-500 font-semibold">CSS Focus</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {normalizeList(aiGeneratedQuestion.cssFocus).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                      <div>
                        <p className="text-xs uppercase text-indigo-500 font-semibold">Assets referenced</p>
                        {aiGeneratedQuestion.recommendedAssets?.length ? (
                          <ul className="space-y-2 text-sm text-gray-700">
                            {aiGeneratedQuestion.recommendedAssets.map((asset, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span>📁</span>
                                <div>
                                  <p className="font-semibold">{asset.filename}</p>
                                  <p className="text-xs text-gray-500">{asset.path || asset.url}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No assets were attached.</p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs uppercase text-indigo-500 font-semibold">Open-source resources</p>
                        {aiGeneratedQuestion.libraries?.length ? (
                          <ul className="space-y-2 text-sm">
                            {aiGeneratedQuestion.libraries.map((lib) => (
                              <li key={lib.id}>
                                <a href={lib.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                  {lib.name}
                                </a>
                                <p className="text-xs text-gray-500">{lib.description}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No open-source helpers selected.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    The agent output will show here once you generate a draft.
                  </div>
                )}
              </div>
            )}

            {/* Assets Tab */}
            {activeTab === 'assets' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Asset Manager</h2>
                  <label className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition">
                    {uploadingAsset ? 'Uploading...' : '📤 Upload Asset'}
                    <input
                      type="file"
                      multiple
                      onChange={handleUploadAsset}
                      disabled={uploadingAsset}
                      className="hidden"
                      accept="image/*,.html,.css,.js,.json"
                    />
                  </label>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search assets by filename..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* Assets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets
                    .filter(asset => 
                      asset.filename.toLowerCase().includes(assetSearch.toLowerCase())
                    )
                    .map((asset, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Preview */}
                        <div className="h-48 bg-gray-100 flex items-center justify-center">
                          {asset.type?.startsWith('image/') ? (
                            <img 
                              src={asset.url} 
                              alt={asset.filename}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-center text-gray-500">
                              <div className="text-4xl mb-2">
                                {asset.filename.endsWith('.html') ? '📄' : 
                                 asset.filename.endsWith('.css') ? '🎨' : 
                                 asset.filename.endsWith('.js') ? '⚡' : 
                                 asset.filename.endsWith('.json') ? '📋' : '📁'}
                              </div>
                              <div className="text-sm">{asset.filename.split('.').pop().toUpperCase()}</div>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-semibold truncate mb-2">{asset.filename}</h3>
                          <div className="text-xs text-gray-600 mb-3">
                            <div>Size: {(asset.size / 1024).toFixed(2)} KB</div>
                            <div>Uploaded: {new Date(asset.uploadedAt).toLocaleDateString()}</div>
                            <div className="text-blue-600 font-mono truncate mt-1">
                              {asset.path}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(asset.path)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            >
                              📋 Copy Path
                            </button>
                            <button
                              onClick={() => copyToClipboard(asset.url)}
                              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                            >
                              🔗 Copy URL
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.filename)}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Empty State */}
                {assets.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="text-xl font-semibold mb-2">No Assets Yet</h3>
                    <p className="text-gray-600 mb-4">Upload images, HTML, CSS, or JS files to get started</p>
                    <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition">
                      Upload Your First Asset
                      <input
                        type="file"
                        multiple
                        onChange={handleUploadAsset}
                        disabled={uploadingAsset}
                        className="hidden"
                        accept="image/*,.html,.css,.js,.json"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Submission Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
            <button
              onClick={closeDetailModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 rounded-full w-10 h-10 flex items-center justify-center bg-gray-100"
            >
              ✕
            </button>
            <div className="border-b px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500">Submission ID</p>
                <p className="text-lg font-semibold text-gray-900">
                  {detailModal.submissionId || detailModal.submission?.id || '—'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {detailModal.submission && renderStatusBadge(detailModal.submission.status)}
                <button
                  onClick={() => navigate(`/admin/submission/${detailModal.submissionId || detailModal.submission?.id || ''}`)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Open Full Page ↗
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {renderSubmissionDetailBody()}
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <CourseModal
          course={editingCourse}
          onSave={handleSaveCourse}
          onClose={() => {
            setShowCourseModal(false);
            setEditingCourse(null);
          }}
        />
      )}

      {/* Question Manager Modal */}

      {/* Challenge Modal */}
      {showChallengeModal && (
        <ChallengeModal
          challenge={editingChallenge}
          courses={courses}
          onSave={handleSaveChallenge}
          onClose={() => {
            setShowChallengeModal(false);
            setEditingChallenge(null);
          }}
        />
      )}
    </div>
  );
}

// Course Modal Component
function CourseModal({ course, onSave, onClose }) {
  const [formData, setFormData] = useState({
    id: course?.id || '',
    title: course?.title || '',
    description: course?.description || '',
    difficulty: course?.difficulty || 'Beginner',
    totalLevels: course?.totalLevels || 1,
    icon: course?.icon || '📚'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4">{course ? 'Edit Course' : 'Add New Course'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Course ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
                disabled={!!course}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Total Levels</label>
                <input
                  type="number"
                  value={formData.totalLevels}
                  onChange={(e) => setFormData({ ...formData, totalLevels: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Icon (Emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                maxLength={2}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Course
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Challenge Modal Component
function ChallengeModal({ challenge, courses, onSave, onClose }) {
  const [formData, setFormData] = useState({
    id: challenge?.id || '',
    title: challenge?.title || '',
    courseId: challenge?.courseId || '',
    level: challenge?.level || 1,
    difficulty: challenge?.difficulty || 'Easy',
    description: challenge?.description || '',
    instructions: challenge?.instructions || '',
    expectedSolution: {
      html: challenge?.expectedSolution?.html || '',
      css: challenge?.expectedSolution?.css || '',
      js: challenge?.expectedSolution?.js || ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4">{challenge ? 'Edit Challenge' : 'Add New Challenge'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Challenge ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                  disabled={!!challenge}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Course</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Level</label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Expected HTML</label>
              <textarea
                value={formData.expectedSolution.html}
                onChange={(e) => setFormData({ ...formData, expectedSolution: { ...formData.expectedSolution, html: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Expected CSS</label>
              <textarea
                value={formData.expectedSolution.css}
                onChange={(e) => setFormData({ ...formData, expectedSolution: { ...formData.expectedSolution, css: e.target.value } })}
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Challenge
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
