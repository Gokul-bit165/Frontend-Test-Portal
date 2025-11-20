import { useState, useEffect } from 'react';
import {
  getCourseQuestions,
  deleteQuestion,
  updateQuestion,
  createQuestion,
  downloadLevelTemplate,
  uploadLevelQuestionBank,
  updateCourseRestrictions,
  getCourseRestrictions,
  getLevelSettings,
} from '../services/api';
import QuestionEditModal from './QuestionEditModal';

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

  useEffect(() => {
    loadQuestions();
    loadRestrictions();
    loadLevelSettings();
  }, [courseId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getCourseQuestions(courseId);
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
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
    if (!confirm('Delete this question? This cannot be undone.')) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      await loadQuestions();
      alert('Question deleted successfully.');
    } catch (error) {
      alert('Failed to delete question: ' + error.message);
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
        alert('Question updated successfully.');
      } else {
        await createQuestion(courseId, questionData);
        alert('Question created successfully.');
      }

      setShowEditModal(false);
      setEditingQuestion(null);
      await loadQuestions();
    } catch (error) {
      alert('Failed to save question: ' + error.message);
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
    } catch (error) {
      alert('Failed to download template: ' + error.message);
    }
  };

  const handleOpenLevelUpload = (level) => {
    setSelectedLevel(level);
    setCurrentRandomizeCount(levelSettings[level]?.randomizeCount || 2);
    setLevelQuestionData('');
    setShowLevelUpload(true);
  };

  const handleLevelUpload = async () => {
    if (!levelQuestionData.trim()) {
      alert('Please paste the JSON array of questions.');
      return;
    }

    try {
      setUploading(true);
      const parsed = JSON.parse(levelQuestionData);
      if (!Array.isArray(parsed)) {
        throw new Error('The pasted data must be a JSON array.');
      }

      await uploadLevelQuestionBank(courseId, selectedLevel, parsed, currentRandomizeCount);

      alert(`Level ${selectedLevel} questions uploaded successfully.`);
      setShowLevelUpload(false);
      setLevelQuestionData('');
      await loadQuestions();
      await loadLevelSettings();
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveRestrictions = async () => {
    try {
      await updateCourseRestrictions(courseId, restrictions);
      alert('Restrictions saved successfully.');
      setShowRestrictions(false);
    } catch (error) {
      alert('Failed to save restrictions: ' + error.message);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    if (filter === 'all') {
      return true;
    }
    return question.level === parseInt(filter, 10);
  });

  const questionsByLevel = questions.reduce((acc, question) => {
    if (!acc[question.level]) {
      acc[question.level] = [];
    }
    acc[question.level].push(question);
    return acc;
  }, {});

  const header = (
    <div
      className={`${
        standalone ? 'sticky top-0 z-10 bg-white border-b' : 'sticky top-0 bg-white border-b'
      } px-6 py-4 flex items-center justify-between`}
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📚 Manage Questions: {courseName}</h2>
        <p className="text-sm text-gray-600">Total: {questions.length} questions</p>
      </div>
      {!standalone && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
          ×
        </button>
      )}
    </div>
  );

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  const body = (
    <div className="p-6 space-y-6">
      {/* Quick Actions Bar */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">⚡ Quick Actions</h3>
            <p className="text-indigo-100 text-sm mt-1">
              Manage all questions, upload in bulk, or configure restrictions
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAddNew}
              className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 font-semibold shadow-md transition-all"
            >
              ➕ Add Single Question
            </button>
            <button
              onClick={() => setShowRestrictions(true)}
              className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow-md transition-all"
            >
              🔒 Restrictions
            </button>
          </div>
        </div>
      </div>

      {/* Level-by-Level Organization */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>📚</span> Questions by Level
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({questions.length} total)
          </span>
        </h3>

        {loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions…</p>
          </div>
        ) : (
          <div className="space-y-3">
            {LEVELS.map((level) => {
              const levelQuestions = questionsByLevel[level] || [];
              const isExpanded = expandedLevels[level];
              
              return (
                <div key={level} className="border-2 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Level Header */}
                  <div 
                    className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 cursor-pointer hover:from-indigo-50 hover:to-purple-50 transition-colors"
                    onClick={() => toggleLevel(level)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{isExpanded ? '📂' : '📁'}</span>
                          <h4 className="text-lg font-bold text-gray-900">Level {level}</h4>
                        </div>
                        <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-semibold">
                          {levelQuestions.length} Question{levelQuestions.length !== 1 ? 's' : ''}
                        </span>
                        {levelSettings[level] && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                            🎲 Randomize: {levelSettings[level].randomizeCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(level); }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          title="Download template"
                        >
                          ⬇️ Template
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenLevelUpload(level); }}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          title="Upload questions"
                        >
                          📤 Upload
                        </button>
                        <button className="text-gray-400 text-2xl font-bold px-2">
                          {isExpanded ? '−' : '+'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Level Content */}
                  {isExpanded && (
                    <div className="p-4 bg-white">
                      {levelQuestions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <p className="text-lg mb-2">📭 No questions yet</p>
                          <p className="text-sm">Add a question or upload questions for this level</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {levelQuestions.map((question, idx) => (
                            <div key={question.id} className="border rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all bg-gray-50">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                                      Q{question.questionNumber || idx + 1}
                                    </span>
                                    <h5 className="font-semibold text-gray-900">{question.title}</h5>
                                    {question.isLocked && <span className="text-sm">🔒</span>}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{question.description}</p>
                                  <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      ⏱️ {question.timeLimit || 15} min
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      ⭐ {question.points || 100} pts
                                    </span>
                                    {question.tags?.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <div className="flex gap-1">
                                          {question.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => handleEdit(question)}
                                    className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
                                    title="Edit question"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDelete(question.id)}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                    title="Delete question"
                                  >
                                    🗑️
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
    <div className="bg-white rounded-xl shadow-lg w-full">
      {header}
      {body}
    </div>
  ) : (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {header}
        {body}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                📤 Upload Questions for Level {selectedLevel}
              </h2>
              <button onClick={() => setShowLevelUpload(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Instructions</h3>
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                  <li>Download the template for the level and update the JSON.</li>
                  <li>Paste the entire JSON array below.</li>
                  <li>Set the randomize count students should receive.</li>
                  <li>Click Upload to save the new question bank.</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Randomize Count for Level {selectedLevel}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={currentRandomizeCount}
                    onChange={(event) => setCurrentRandomizeCount(parseInt(event.target.value, 10) || 1)}
                    className="px-4 py-2 border rounded-lg w-32"
                  />
                  <span className="text-sm text-gray-600">
                    Students will receive {currentRandomizeCount} random question(s).
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paste JSON Array</label>
                <textarea
                  value={levelQuestionData}
                  onChange={(event) => setLevelQuestionData(event.target.value)}
                  className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
                  rows={15}
                  placeholder={`[\n  {\n    "id": "course-${courseId}-l${selectedLevel}-q1",\n    "courseId": "${courseId}",\n    "level": ${selectedLevel},\n    "title": "Your Question Title",\n    "description": "Description",\n    "instructions": "Instructions...",\n    "tags": ["HTML", "CSS"],\n    "timeLimit": 15,\n    "expectedSolution": {\n      "html": "<div>...</div>",\n      "css": ".class { ... }",\n      "js": ""\n    }\n  }\n]`}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowLevelUpload(false);
                    setLevelQuestionData('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLevelUpload}
                  disabled={uploading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : '⬆️ Upload Questions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRestrictions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">🔒 Exam Restrictions</h2>
              <button onClick={() => setShowRestrictions(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">⚠️ Security Settings</h3>
                <p className="text-sm text-orange-800">
                  Configure exam restrictions that apply to every test in this course.
                </p>
              </div>

              <div className="space-y-4">
                <ToggleRow
                  label="Block Copy"
                  description="Prevent students from copying text from the exam."
                  checked={restrictions.blockCopy}
                  onChange={(value) => setRestrictions({ ...restrictions, blockCopy: value })}
                />
                <ToggleRow
                  label="Block Paste"
                  description="Prevent students from pasting into the editor."
                  checked={restrictions.blockPaste}
                  onChange={(value) => setRestrictions({ ...restrictions, blockPaste: value })}
                />
                <ToggleRow
                  label="Force Fullscreen"
                  description="Require fullscreen mode throughout the exam."
                  checked={restrictions.forceFullscreen}
                  onChange={(value) => setRestrictions({ ...restrictions, forceFullscreen: value })}
                />

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="font-semibold text-gray-900 block mb-2">Max Violations</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Number of times a student can exit fullscreen or switch tabs before the test auto-submits.
                  </p>
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
                    className="px-4 py-2 border rounded-lg w-32"
                  />
                  <span className="ml-3 text-sm text-gray-600">violations allowed</span>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <label className="font-semibold text-gray-900 block mb-2">⏱️ Time Limit</label>
                  <p className="text-sm text-gray-600 mb-3">Set a time limit for the entire test (0 = no limit).</p>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={restrictions.timeLimit}
                    onChange={(event) =>
                      setRestrictions({ ...restrictions, timeLimit: parseInt(event.target.value, 10) || 0 })
                    }
                    className="px-4 py-2 border rounded-lg w-32"
                  />
                  <span className="ml-3 text-sm text-gray-600">minutes</span>
                  {restrictions.timeLimit > 0 ? (
                    <div className="mt-2 text-sm font-semibold text-blue-600">
                      Total time: {restrictions.timeLimit} minutes
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-500">No time limit set</div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowRestrictions(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRestrictions}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  💾 Save Restrictions
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
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}
