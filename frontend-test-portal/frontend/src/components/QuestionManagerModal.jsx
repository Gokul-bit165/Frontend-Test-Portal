import { useState, useEffect } from 'react';
import { getCourseQuestions, deleteQuestion, updateQuestion, createQuestion, bulkUploadQuestions } from '../services/api';
import QuestionEditModal from './QuestionEditModal';

export default function QuestionManagerModal({ courseId, courseName, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadQuestions();
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

  const handleBulkUpload = async () => {
    if (!bulkData.trim()) {
      alert('Please paste JSON data');
      return;
    }

    try {
      setUploading(true);
      const questions = JSON.parse(bulkData);
      
      if (!Array.isArray(questions)) {
        throw new Error('Data must be an array of questions');
      }

      const response = await bulkUploadQuestions(courseId, questions);
      alert(`Bulk upload complete!\n\nAdded: ${response.data.added}\nSkipped: ${response.data.skipped}\nTotal: ${response.data.total}`);
      
      setShowBulkUpload(false);
      setBulkData('');
      await loadQuestions();
    } catch (error) {
      alert('Failed to upload: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleJSON = () => {
    window.open('http://localhost:5000/api/courses/sample/json', '_blank');
  };

  const downloadSampleCSV = () => {
    window.open('http://localhost:5000/api/courses/sample/csv', '_blank');
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
              Manage Questions: {courseName}
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
          {/* Filter */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
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
                  Level {level} ({questionsByLevel[level]?.length || 0})
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                📦 Bulk Upload
              </button>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Question
              </button>
            </div>
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
            <h4 className="font-semibold text-blue-900 mb-2">📘 How to Manage Questions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Add/Edit:</strong> Use the buttons above to create or modify questions</li>
              <li>• <strong>Bulk Upload:</strong> Import multiple questions from JSON</li>
              <li>• <strong>Download Samples:</strong> Get template files to create bulk questions</li>
              <li>• <strong>Assets:</strong> Add images to backend/assets/images/ and reference in question</li>
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                onClick={downloadSampleJSON}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                ⬇️ Download Sample JSON
              </button>
              <button
                onClick={downloadSampleCSV}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                ⬇️ Download Sample CSV
              </button>
            </div>
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

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">📦 Bulk Upload Questions</h2>
              <button
                onClick={() => setShowBulkUpload(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">📝 Instructions:</h3>
                <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                  <li>Download a sample file using the buttons below</li>
                  <li>Edit the file with your questions (keep the same structure)</li>
                  <li>Copy the JSON content and paste it in the text area</li>
                  <li>Click "Upload Questions" to import</li>
                </ol>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={downloadSampleJSON}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    ⬇️ Download JSON Template
                  </button>
                  <button
                    onClick={downloadSampleCSV}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    ⬇️ Download CSV Info
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste JSON Array of Questions:
                </label>
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
                  rows="15"
                  placeholder='[\n  {\n    "id": "course-html-css-l1-q3",\n    "courseId": "course-html-css",\n    "level": 1,\n    "title": "Your Question",\n    ...\n  }\n]'
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowBulkUpload(false);
                    setBulkData('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={uploading || !bulkData.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : '📦 Upload Questions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
