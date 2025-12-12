import { useState, useEffect } from 'react';
import {
  getCourseQuestions,
  deleteQuestion,
  updateQuestion,
  createQuestion,
  downloadLevelTemplate,
  downloadCsvTemplate,
  uploadLevelQuestionBank,
  updateCourseRestrictions,
  getCourseRestrictions,
  getLevelSettings,
} from '../services/api';
import QuestionEditModal from './QuestionEditModal';
import ToastContainer from './Toast';

// Helper to extract assets from code
const extractAssetsFromCode = (html, css) => {
  const combined = (html || '') + (css || '');
  // Matches src="..." or url(...) with optional spaces
  const regex = /(?:src\s*=\s*["']|url\(\s*["']?)([^"')]+\.(?:png|jpg|jpeg|gif|svg|webp))["')]/gi;
  const matches = [...combined.matchAll(regex)];
  const paths = new Set();


  matches.forEach(match => {
    let path = match[1];
    if (!path.startsWith('http') && !path.startsWith('/') && !path.startsWith('assets')) {
      path = path.replace(/^(\.\/)?(images\/)?/, '');
      path = `/assets/images/${path}`;
    } else if (path.startsWith('images/')) {
      path = `/assets/${path}`;
    }
    paths.add(path);
  });
  return Array.from(paths);
};

const LEVELS = [1, 2, 3, 4, 5, 6];

export default function QuestionManagerModal({ courseId, courseName, onClose, standalone = false }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState({});

  const [showLevelUpload, setShowLevelUpload] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [levelQuestionData, setLevelQuestionData] = useState('');
  const [currentRandomizeCount, setCurrentRandomizeCount] = useState(2);
  const [uploading, setUploading] = useState(false);

  const [showRestrictions, setShowRestrictions] = useState(false);
  const [restrictions, setRestrictions] = useState({
    blockCopy: false,
    blockPaste: false,
    forceFullscreen: false,
    maxViolations: 3,
    timeLimit: 0,
  });

  const [levelSettings, setLevelSettings] = useState({});
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    loadQuestions();
    loadRestrictions();
    loadLevelSettings();
  }, [courseId]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getCourseQuestions(courseId);
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
      addToast('Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRestrictions = async () => {
    try {
      const response = await getCourseRestrictions(courseId);
      if (response.data) {
        setRestrictions(response.data);
      }
    } catch (error) {
      console.error('Failed to load restrictions:', error);
    }
  };

  const loadLevelSettings = async () => {
    try {
      const response = await getLevelSettings(courseId);
      if (response.data) {
        setLevelSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load level settings:', error);
    }
  };

  const handleDelete = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question? This cannot be undone.')) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      // Optimistic update
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      addToast('Question deleted successfully', 'success');
      // Reload to ensure sync
      loadQuestions();
    } catch (error) {
      addToast('Failed to delete question: ' + error.message, 'error');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  const handleAddNew = () => {
    setEditingQuestion(null);
    setShowEditModal(true);
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      if (editingQuestion) {
        await updateQuestion(questionData.id, questionData);
        addToast('Question updated successfully', 'success');
      } else {
        await createQuestion(courseId, questionData);
        addToast('Question created successfully', 'success');
      }

      setShowEditModal(false);
      setEditingQuestion(null);
      await loadQuestions();
    } catch (error) {
      addToast('Failed to save question: ' + error.message, 'error');
    }
  };

  const handleDownloadTemplate = async (level) => {
    try {
      const response = await downloadLevelTemplate(courseId, level);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${courseId}-level-${level}-template.json`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      addToast('Template downloaded', 'success');
    } catch (error) {
      addToast('Failed to download template: ' + error.message, 'error');
    }
  };

  const handleDownloadCsvTemplate = async () => {
    try {
      const response = await downloadCsvTemplate(courseId, selectedLevel);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${courseId}-level-${selectedLevel}-template.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      addToast('CSV Template downloaded', 'success');
    } catch (error) {
      addToast('Failed to download CSV template: ' + error.message, 'error');
    }
  };

  const handleOpenLevelUpload = (level) => {
    setSelectedLevel(level);
    setCurrentRandomizeCount(levelSettings[level]?.randomizeCount || 2);
    setLevelQuestionData('');
    setShowLevelUpload(true);
  };

  // Robust CSV/TSV parser with Schema inflation
  const parseCSV = (text) => {
    if (!text || !text.trim()) return [];

    // Remove Byte Order Mark (BOM) if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    // Auto-detect delimiter
    const firstLineEnd = text.indexOf('\n');
    const firstLine = text.slice(0, firstLineEnd > -1 ? firstLineEnd : text.length);

    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    console.log(`[CSV Parse] Detected delimiter: "${delimiter === '\t' ? '\\t' : delimiter}"`);

    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuote = false;

    // character-by-character parsing to handle newlines inside quotes
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuote && nextChar === '"') {
          // Escaped quote ("") -> literal quote
          currentVal += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuote = !inQuote;
        }
      } else if (char === delimiter && !inQuote) {
        // End of field
        currentRow.push(currentVal);
        currentVal = '';
      } else if ((char === '\n' || char === '\r') && !inQuote) {
        // End of row
        // Handle \r\n
        if (char === '\r' && nextChar === '\n') i++;

        currentRow.push(currentVal);
        if (currentRow.length > 0 || currentVal) { // Avoid processing empty lines if unintentional
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    // Push last row if exists
    if (currentRow.length > 0 || currentVal) {
      currentRow.push(currentVal);
      rows.push(currentRow);
    }

    if (rows.length < 2) return [];

    // Extract headers (clean them up)
    const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, '').replace(/^\ufeff/, ''));
    console.log('[CSV Parse] Headers:', headers);

    // Map rows to objects
    return rows.slice(1).map(values => {
      const row = {
        hints: [],
        tags: [],
        passingThreshold: {},
        expectedSolution: {},
        assets: { images: [], reference: '' }
      };

      headers.forEach((header, index) => {
        let value = values[index] ? values[index].trim() : '';

        // Schema Inflation Logic
        if (header.startsWith('hints/')) {
          if (value) row.hints.push(value);
        } else if (header.startsWith('tags/')) {
          if (value) row.tags.push(value);
        } else if (header.startsWith('passingThreshold/')) {
          const key = header.split('/')[1];
          row.passingThreshold[key] = parseInt(value) || 0;
        } else if (header.startsWith('expectedSolution/')) {
          const key = header.split('/')[1];
          row.expectedSolution[key] = value;
        } else if (header === 'assets/reference') {
          row.assets.reference = value;
        } else {
          // Standard fields
          row[header] = value;
        }
      });
      return row;
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setLevelQuestionData(content);
      addToast('File loaded! Click "Upload Bank" to process.', 'success');
    };
    reader.onerror = () => {
      addToast('Failed to read file', 'error');
    };
    reader.readAsText(file);
  };

  const handleLevelUpload = async () => {
    if (!levelQuestionData.trim()) {
      addToast('Please paste data or upload a file.', 'warning');
      return;
    }

    try {
      setUploading(true);
      let parsedData;

      try {
        parsedData = JSON.parse(levelQuestionData);
      } catch (e) {
        console.log('JSON parse failed, trying CSV/TSV...');
        const csvRows = parseCSV(levelQuestionData);
        if (csvRows.length > 0) {
          parsedData = csvRows.map((row, idx) => {
            // Helper to find value by checking multiple possible keys case-insensitively
            const getValue = (keys) => {
              if (typeof keys === 'string') keys = [keys];
              const rowKeys = Object.keys(row);
              for (const key of keys) {
                // Exact match
                if (row[key] !== undefined) return row[key];
                // Case-insensitive match
                const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
                if (foundKey && row[foundKey] !== undefined) return row[foundKey];
                // Check for keys that start with the search term (handling truncated headers like 'descriptior')
                const partialKey = rowKeys.find(k => k.toLowerCase().startsWith(key.toLowerCase()));
                if (partialKey && row[partialKey] !== undefined) return row[partialKey];
              }
              return undefined;
            };

            const instructions = getValue(['instructions', 'instruction', 'instr']);
            const description = getValue(['description', 'desc', 'descriptior', 'descript']);

            // Debug missing crucial fields
            const title = getValue(['title', 'name']);
            if (!title) console.warn(`[CSV Map] Row ${idx} missing title. Keys present:`, Object.keys(row));

            return {
              id: getValue(['id', 'questionId']) || `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              courseId: getValue(['courseId', 'course']) || courseId,
              level: parseInt(getValue(['level']) || selectedLevel),
              questionNumber: parseInt(getValue(['questionNumber', 'questionN', 'qNo', 'num']) || 0),
              title: title,
              description: description || '',
              instructions: instructions || '',
              points: parseInt(getValue(['points', 'score']) || 100),
              timeLimit: parseInt(getValue(['timeLimit', 'time']) || 15),
              isLocked: String(getValue(['isLocked', 'locked'])).toUpperCase() === 'TRUE',
              prerequisite: getValue(['prerequisite', 'prereq', 'prerequisit']),
              tags: row.tags.length ? row.tags : (getValue(['tags_legacy'])?.split(/[;,]/) || []),
              hints: row.hints.length ? row.hints : (getValue(['hints_legacy'])?.split('|') || []),
              passingThreshold: {
                structure: row.passingThreshold?.structure || parseInt(getValue(['passingThresholdStructure']) || 70),
                visual: row.passingThreshold?.visual || parseInt(getValue(['passingThresholdVisual']) || 80),
                functional: row.passingThreshold?.functional || row.passingThreshold?.functionality || row.passingThreshold?.overall || 75
              },
              expectedSolution: {
                html: row.expectedSolution?.html || getValue(['expectedHtml']) || '',
                css: row.expectedSolution?.css || getValue(['expectedCss']) || '',
                js: row.expectedSolution?.js || getValue(['expectedJs']) || ''
              },
              assets: row.assets
            };
          });
        } else {
          throw new Error('Could not parse data as JSON or CSV/TSV.');
        }
      }

      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('Data must be an array of questions (parsing returned 0 items).');
      }

      console.log(`[Upload] Sending ${parsedData.length} items to backend...`);
      const response = await uploadLevelQuestionBank(courseId, selectedLevel, parsedData, currentRandomizeCount);
      console.log('[Upload] Response:', response.data);

      const { added, updated, skipped, errors } = response.data || {};

      if (skipped > 0 || (errors && errors.length > 0)) {
        let msg = `Completed with issues: ${added || 0} added, ${updated || 0} updated, ${skipped || 0} skipped.`;
        if (errors && errors.length > 0) {
          msg += ` First error: ${errors[0]}`;
          console.error('Upload errors:', errors);
        }
        addToast(msg, 'warning');
      } else {
        addToast(`Success! ${added || 0} added, ${updated || 0} updated.`, 'success');
      }

      setShowLevelUpload(false);
      setLevelQuestionData('');
      await loadQuestions();
      await loadLevelSettings();
    } catch (error) {
      console.error('Upload catch:', error);
      addToast('Upload failed: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveRestrictions = async () => {
    try {
      await updateCourseRestrictions(courseId, restrictions);
      addToast('Restrictions saved successfully.', 'success');
      setShowRestrictions(false);
    } catch (error) {
      addToast('Failed to save restrictions: ' + error.message, 'error');
    }
  };

  const handleBulkFixAssets = async () => {
    if (!confirm('This will scan all questions and auto-add missing image assets found in their code. Continue?')) return;

    let updatedCount = 0;
    const total = questions.length;
    addToast(`Scanning ${total} questions...`, 'info');

    try {
      for (const q of questions) {
        const html = q.expectedSolution?.html || q.expectedHtml || '';
        const css = q.expectedSolution?.css || q.expectedCss || '';

        const extracted = extractAssetsFromCode(html, css);
        if (extracted.length === 0) continue;

        // Get existing assets
        let currentAssets = [];
        if (Array.isArray(q.assets)) {
          currentAssets = q.assets.map(a => (typeof a === 'string' ? a : a.path));
        } else if (q.assets?.images) {
          currentAssets = q.assets.images.map(img => img.path || img);
        }

        // Check if any new assets found
        const combined = new Set(currentAssets);
        let changed = false;

        extracted.forEach(path => {
          if (!combined.has(path)) {
            combined.add(path);
            changed = true;
          }
        });

        if (changed) {
          const newAssetsArray = Array.from(combined);
          // Convert to object structure if that's what we want to standardize on, 
          // OR iterate and keep existing object structure if complex.
          // Ideally we unify. Let's use the object structure since backend supports it now.
          const newAssetsObj = {
            images: newAssetsArray.map(p => ({
              name: p.split('/').pop(),
              path: p,
              description: 'Auto-extracted'
            })),
            reference: q.assets?.reference || ''
          };

          await updateQuestion(q.id, { ...q, assets: newAssetsObj });
          updatedCount++;
        }
      }
      addToast(`Done! Updated assets for ${updatedCount} questions.`, 'success');
      loadQuestions();
    } catch (error) {
      addToast('Bulk fix failed: ' + error.message, 'error');
    }
  };

  const questionsByLevel = questions.reduce((acc, question) => {
    if (!acc[question.level]) {
      acc[question.level] = [];
    }
    acc[question.level].push(question);
    return acc;
  }, {});

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  const header = (
    <div
      className={`${standalone ? 'sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b' : 'sticky top-0 bg-white border-b'
        } px-8 py-5 flex items-center justify-between shadow-sm`}
    >
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">
          Manage Questions
        </h2>
        <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mt-1">
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded textxs">{courseName}</span>
          <span>•</span>
          <span>{questions.length} Total Questions</span>
        </p>
      </div>
      {!standalone && (
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all text-xl font-bold"
        >
          ×
        </button>
      )}
    </div>
  );

  const body = (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-[600px]">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">⚡ Quick Actions</h3>
          <p className="text-gray-500 text-sm mt-1">
            Create new questions or configure course-wide settings.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>➕</span> Add New Question
          </button>
          <button
            onClick={() => setShowRestrictions(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>🔒</span> Restrictions
          </button>
          <button
            onClick={handleBulkFixAssets}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            title="Auto-scan all questions and fix missing assets"
          >
            <span>🪄</span> Fix Assets
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 px-1">
          <span>📚</span> Course Syllabus
        </h3>

        {loading ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading questions library...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {LEVELS.map((level) => {
              const levelQuestions = questionsByLevel[level] || [];
              const isExpanded = expandedLevels[level];
              const hasSettings = levelSettings[level];

              return (
                <div key={level} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                  <div
                    className={`p-5 cursor-pointer transition-colors duration-200 flex items-center justify-between ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                    onClick={() => toggleLevel(level)}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${isExpanded ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {level}
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className={`text-lg font-bold text-gray-900`}>Level {level}</h4>
                          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold uppercase tracking-wide">
                            {levelQuestions.length} Questions
                          </span>
                        </div>
                        {hasSettings && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <span>🎲</span>
                            Students receive {hasSettings.randomizeCount} random questions
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(level); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download Template"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenLevelUpload(level); }}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Bulk Upload"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      </button>

                      <div className={`transform transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-white animate-fade-in">
                      {levelQuestions.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📭</div>
                          <p className="text-gray-900 font-medium">No questions yet</p>
                          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                            Add individual questions or upload a JSON question bank to populate this level.
                          </p>
                          <button
                            onClick={() => {
                              setEditingQuestion(null);
                              setShowEditModal(true);
                            }}
                            className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
                          >
                            + Add Question
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {levelQuestions.map((question, idx) => (
                            <div key={question.id} className="p-5 hover:bg-gray-50/80 transition-colors group">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">
                                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold">
                                    {question.questionNumber || idx + 1}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-bold text-gray-900 truncate">{question.title}</h5>
                                    {question.isLocked && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border">Locked</span>}
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{question.description}</p>

                                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500">
                                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                      <span>⏱️</span> {question.timeLimit || 15} min
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-md">
                                      <span>⭐</span> {question.points || 100} pts
                                    </span>
                                    {question.tags?.length > 0 && (
                                      <div className="flex gap-1 ml-1 border-l pl-3">
                                        {question.tags.slice(0, 3).map((tag) => (
                                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                                            {tag}
                                          </span>
                                        ))}
                                        {question.tags.length > 3 && <span>+{question.tags.length - 3}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEdit(question)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(question.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const mainContent = standalone ? (
    <div className="bg-white rounded-3xl shadow-xl border w-full overflow-hidden">
      {header}
      {body}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  ) : (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden relative">
        {header}
        {body}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );

  return (
    <>
      {mainContent}

      {showEditModal && (
        <QuestionEditModal
          question={editingQuestion}
          courseId={courseId}
          onSave={handleSaveQuestion}
          onClose={() => {
            setShowEditModal(false);
            setEditingQuestion(null);
          }}
        />
      )}

      {showLevelUpload && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📤</span>
                Upload Questions (Level {selectedLevel})
              </h2>
              <button
                onClick={() => setShowLevelUpload(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-gray-50/50">
              <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <span>✅</span> Bulk Upload Guide
                </h3>
                <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside font-medium">
                  <li>Download the <strong>CSV</strong> or <strong>JSON</strong> template.</li>
                  <li>Fill in the questions (use Excel to edit the CSV).</li>
                  <li><strong>Upload the file</strong> or paste the content below.</li>
                </ol>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDownloadTemplate(selectedLevel)}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-bold transition-colors"
                  >
                    Download JSON Template
                  </button>
                  <button
                    onClick={handleDownloadCsvTemplate}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-bold transition-colors"
                  >
                    Download CSV Template
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload File OR Paste Data</label>

                  {/* Native File Input */}
                  <div className="mb-4">
                    <input
                      type="file"
                      accept=".csv,.json,.txt,.tsv"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100
                        cursor-pointer border border-gray-300 rounded-xl bg-white"
                    />
                  </div>

                  <textarea
                    value={levelQuestionData}
                    onChange={(event) => setLevelQuestionData(event.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    rows={12}
                    placeholder={`Paste content manually if you prefer...\n\nSupports:\n- JSON Arrays\n- CSV (Comma Separated)\n- TSV (Excel Copy-Paste)`}
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Randomization Settings
                    </label>
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                      <p className="text-xs text-gray-500 mb-3">
                        How many questions from this bank should each student get?
                      </p>

                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={currentRandomizeCount}
                          onChange={(event) => setCurrentRandomizeCount(parseInt(event.target.value, 10) || 1)}
                          className="px-4 py-2 border rounded-lg w-20 text-center font-bold text-indigo-600"
                        />
                        <span className="text-sm font-medium text-gray-700">Questions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLevelUpload(false);
                  setLevelQuestionData('');
                }}
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleLevelUpload}
                disabled={uploading}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-lg shadow-green-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Upload Bank
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestrictions && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">🔒 Exam Restrictions</h2>
              <button onClick={() => setShowRestrictions(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">Security Configuration</h3>
                  <p className="text-xs text-amber-800 mt-1">
                    These settings apply to <strong>every student</strong> taking this course. Be careful with strict limits.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <ToggleRow
                  label="Block Copy / Paste"
                  description="Prevent students from copying exam content or pasting code."
                  checked={restrictions.blockCopy}
                  onChange={(value) => setRestrictions({ ...restrictions, blockCopy: value, blockPaste: value })}
                />

                <ToggleRow
                  label="Force Fullscreen"
                  description="Exam auto-submits if fullscreen is exited too many times."
                  checked={restrictions.forceFullscreen}
                  onChange={(value) => setRestrictions({ ...restrictions, forceFullscreen: value })}
                />

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-gray-50 rounded-xl border hover:border-indigo-300 transition-colors">
                    <label className="font-bold text-gray-900 block mb-1 text-sm">Violations Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={restrictions.maxViolations}
                      onChange={(event) =>
                        setRestrictions({
                          ...restrictions,
                          maxViolations: parseInt(event.target.value, 10) || 3,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg md:text-lg font-bold text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-2">Allowed tab switches</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 transition-colors">
                    <label className="font-bold text-blue-900 block mb-1 text-sm">Time Limit (mins)</label>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      value={restrictions.timeLimit}
                      onChange={(event) =>
                        setRestrictions({ ...restrictions, timeLimit: parseInt(event.target.value, 10) || 0 })
                      }
                      className="w-full px-3 py-2 border rounded-lg md:text-lg font-bold text-gray-900"
                    />
                    <p className="text-xs text-blue-600 mt-2">0 = No limit</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button
                  onClick={() => setShowRestrictions(false)}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRestrictions}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-indigo-200 transition-colors shadow-sm">
      <div>
        <p className="font-bold text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  );
}
