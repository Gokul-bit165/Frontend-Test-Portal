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
  getLevelSettings
} from '../services/api';
import QuestionEditModal from './QuestionEditModal';
import axios from 'axios';

export default function QuestionManagerModal({ courseId, courseName, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Level upload modal state
  const [showLevelUpload, setShowLevelUpload] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [levelQuestionData, setLevelQuestionData] = useState('');
  const [currentRandomizeCount, setCurrentRandomizeCount] = useState(2);
  const [uploading, setUploading] = useState(false);
  
  // Restrictions modal state
  const [showRestrictions, setShowRestrictions] = useState(false);
  const [restrictions, setRestrictions] = useState({
    blockCopy: false,
    blockPaste: false,
    forceFullscreen: false,
    maxViolations: 3,
    timeLimit: 0 // in minutes, 0 = no limit
  });
  
  // Level settings
  const [levelSettings, setLevelSettings] = useState({});

  useEffect(() => {
    loadQuestions();
    loadRestrictions();
    loadLevelSettings();
  }, [courseId]);

  const loadQuestions = async () => {
    try {
      const response = await getCourseQuestions(courseId);
      setQuestions(response.data);
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
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      await loadQuestions();
      alert('Question deleted successfully!');
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
        // Update existing
        await updateQuestion(questionData.id, questionData);
        alert('Question updated successfully!');
      } else {
        // Create new
        await createQuestion(courseId, questionData);
        alert('Question created successfully!');
      }
      setShowEditModal(false);
      setEditingQuestion(null);
      await loadQuestions();
    } catch (error) {
      alert('Failed to save question: ' + error.message);
    }
  };

  // Download template for specific level
  const handleDownloadTemplate = async (level) => {
    try {
      const response = await downloadLevelTemplate(courseId, level);
      // response.data is already a Blob from the backend
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${courseId}-level-${level}-template.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert(`Template for Level ${level} downloaded! Edit it and upload back.`);
    } catch (error) {
      alert('Failed to download template: ' + error.message);
    }
  };

  // Open upload modal for specific level
  const handleOpenLevelUpload = (level) => {
    setSelectedLevel(level);
    setCurrentRandomizeCount(levelSettings[level]?.randomizeCount || 2);
    setLevelQuestionData('');
    setShowLevelUpload(true);
  };

  // Upload question bank for specific level
  const handleLevelUpload = async () => {
    if (!levelQuestionData.trim()) {
      alert('Please paste JSON data');
      return;
    }

    try {
      setUploading(true);
      const questions = JSON.parse(levelQuestionData);
      
      if (!Array.isArray(questions)) {
        throw new Error('Data must be an array of questions');
      }

      const response = await uploadLevelQuestionBank(
        courseId, 
        selectedLevel, 
        questions, 
        currentRandomizeCount
      );
      
      alert(`Level ${selectedLevel} updated successfully!\n\n` +
            `Added: ${response.data.added || questions.length} questions\n` +
            `Randomize Count: ${currentRandomizeCount}`);
      
      setShowLevelUpload(false);
      setLevelQuestionData('');
      await loadQuestions();
      await loadLevelSettings();
    } catch (error) {
      alert('Failed to upload: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  // Save restrictions
  const handleSaveRestrictions = async () => {
    try {
      await updateCourseRestrictions(courseId, restrictions);
      alert('Restrictions updated successfully!');
      setShowRestrictions(false);
    } catch (error) {
      alert('Failed to save restrictions: ' + error.message);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (filter === 'all') return true;
    return q.level === parseInt(filter);
  });

  const questionsByLevel = {};
  questions.forEach(q => {
    if (!questionsByLevel[q.level]) {
      questionsByLevel[q.level] = [];
    }
    questionsByLevel[q.level].push(q);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              📚 Manage Questions: {courseName}
            </h2>
            <p className="text-sm text-gray-600">Total: {questions.length} questions</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Level-Based Question Management */}
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">📝 Upload Questions by Level</h3>
              <button
                onClick={() => setShowRestrictions(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                🔒 Manage Restrictions
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(level => (
                <div key={level} className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-indigo-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-lg text-gray-900">Level {level}</h4>
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-semibold">
                      {questionsByLevel[level]?.length || 0} Q's
                    </span>
                  </div>
                  
                  {levelSettings[level] && (
                    <div className="text-xs text-gray-600 mb-3">
                      🎲 Randomize: {levelSettings[level].randomizeCount} questions
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownloadTemplate(level)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
                    >
                      ⬇️ Download Template
                    </button>
                    <button
                      onClick={() => handleOpenLevelUpload(level)}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                    >
                      ⬆️ Upload Questions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                All Levels
              </button>
              {[1, 2, 3, 4, 5, 6].map(level => (
                <button
                  key={level}
                  onClick={() => setFilter(level.toString())}
                  className={`px-4 py-2 rounded-lg ${filter === level.toString() ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  L{level} ({questionsByLevel[level]?.length || 0})
                </button>
              ))}
            </div>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Question
            </button>
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No questions found for this filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <div key={question.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                          Level {question.level} - Q{question.questionNumber}
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                          {question.points} pts
                        </span>
                        {question.isLocked && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {question.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {question.description}
                      </p>

                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📝 ID: {question.id}</span>
                        {question.assets?.images?.length > 0 && (
                          <span>🖼️ {question.assets.images.length} asset(s)</span>
                        )}
                        {question.hints?.length > 0 && (
                          <span>💡 {question.hints.length} hint(s)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(question)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Assets Preview */}
                  {question.assets?.images?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">Assets:</div>
                      <div className="flex flex-wrap gap-2">
                        {question.assets.images.map((img, idx) => (
                          <span key={idx} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                            {img.name} - {img.path}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📘 How to Use Level-Based Management</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Download Template:</strong> Click to get a JSON template for that level with sample questions</li>
              <li>• <strong>Edit Template:</strong> Open the JSON file and add/edit your questions following the structure</li>
              <li>• <strong>Upload Questions:</strong> Paste the edited JSON and set how many questions to randomize</li>
              <li>• <strong>Manage Restrictions:</strong> Set exam security rules (copy/paste blocking, fullscreen mode, violations)</li>
              <li>• <strong>Individual Edit:</strong> Use Edit button on any question below for detailed editing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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

      {/* Level Upload Modal */}
      {showLevelUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">� Upload Questions for Level {selectedLevel}</h2>
              <button
                onClick={() => setShowLevelUpload(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Instructions:</h3>
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                  <li>Download the template for this level using the button above</li>
                  <li>Edit the JSON file to add/modify questions (keep the structure)</li>
                  <li>Copy the entire JSON array and paste it below</li>
                  <li>Set how many questions should be randomized for students</li>
                  <li>Click Upload to save all questions for this level</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Randomize Count for Level {selectedLevel}:
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={currentRandomizeCount}
                    onChange={(e) => setCurrentRandomizeCount(parseInt(e.target.value) || 1)}
                    className="px-4 py-2 border rounded-lg w-32"
                  />
                  <span className="text-sm text-gray-600">
                    Students will get {currentRandomizeCount} random question(s) from this level
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste JSON Array of Questions:
                </label>
                <textarea
                  value={levelQuestionData}
                  onChange={(e) => setLevelQuestionData(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
                  rows="15"
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
                  disabled={uploading || !levelQuestionData.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : '⬆️ Upload Questions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restrictions Modal */}
      {showRestrictions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">🔒 Exam Restrictions</h2>
              <button
                onClick={() => setShowRestrictions(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">⚠️ Security Settings</h3>
                <p className="text-sm text-orange-800">
                  Configure exam security restrictions for this course. These settings will apply to all students taking tests.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">Block Copy</label>
                    <p className="text-sm text-gray-600">Prevent students from copying text from the exam</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restrictions.blockCopy}
                      onChange={(e) => setRestrictions({...restrictions, blockCopy: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">Block Paste</label>
                    <p className="text-sm text-gray-600">Prevent students from pasting text into the code editor</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restrictions.blockPaste}
                      onChange={(e) => setRestrictions({...restrictions, blockPaste: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-gray-900">Force Fullscreen</label>
                    <p className="text-sm text-gray-600">Require fullscreen mode throughout the exam</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restrictions.forceFullscreen}
                      onChange={(e) => setRestrictions({...restrictions, forceFullscreen: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="font-semibold text-gray-900 block mb-2">Max Violations</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Number of times a student can exit fullscreen or switch tabs before test auto-finishes
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={restrictions.maxViolations}
                    onChange={(e) => setRestrictions({...restrictions, maxViolations: parseInt(e.target.value) || 3})}
                    className="px-4 py-2 border rounded-lg w-32"
                  />
                  <span className="ml-3 text-sm text-gray-600">violations allowed</span>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <label className="font-semibold text-gray-900 block mb-2">⏱️ Time Limit</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Set a time limit for the entire test (0 = no time limit)
                  </p>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={restrictions.timeLimit}
                    onChange={(e) => setRestrictions({...restrictions, timeLimit: parseInt(e.target.value) || 0})}
                    className="px-4 py-2 border rounded-lg w-32"
                  />
                  <span className="ml-3 text-sm text-gray-600">minutes</span>
                  {restrictions.timeLimit > 0 && (
                    <div className="mt-2 text-sm font-semibold text-blue-600">
                      Total time: {restrictions.timeLimit} minutes
                    </div>
                  )}
                  {restrictions.timeLimit === 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      No time limit set
                    </div>
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
    </div>
  );
}
