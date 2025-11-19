import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, updateCourse, createCourse, deleteCourse } from '../services/api';
import CourseEditModal from '../components/CourseEditModal';
import QuestionManagerModal from '../components/QuestionManagerModal';
import { clearAdminSession } from '../utils/session';

export default function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [managingQuestions, setManagingQuestions] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async (courseData) => {
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
        alert('Course updated successfully!');
      } else {
        await createCourse(courseData);
        alert('Course created successfully!');
      }
      setEditingCourse(null);
      setShowCreateModal(false);
      await loadCourses();
    } catch (error) {
      alert('Failed to save course: ' + error.message);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCourse(courseId);
      alert('Course deleted successfully!');
      await loadCourses();
    } catch (error) {
      alert('Failed to delete course: ' + error.message);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Manager</h1>
              <p className="text-sm text-gray-600">Manage courses, levels, and questions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            onClick={() => setShowCreateModal(true)}
          >
            + Add New Course
          </button>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Course Header */}
                <div 
                  className="p-6 text-white"
                  style={{ backgroundColor: course.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">{course.icon}</div>
                      <div>
                        <h2 className="text-2xl font-bold">{course.title}</h2>
                        <p className="opacity-90">{course.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-90">ID: {course.id}</div>
                      <div className="text-lg font-semibold">{course.difficulty}</div>
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Levels</div>
                      <div className="text-2xl font-bold text-gray-900">{course.totalLevels}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Estimated Time</div>
                      <div className="text-lg font-semibold text-gray-900">{course.estimatedTime}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Thumbnail</div>
                      <div className="text-sm text-gray-700 truncate">{course.thumbnail}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {course.tags && course.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/course/${course.id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      👁️ Preview Course
                    </button>
                    <button
                      onClick={() => setEditingCourse(course)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setManagingQuestions({ id: course.id, name: course.title })}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      📝 Manage Questions
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      �️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">📘 Quick Guide</h3>
          <div className="space-y-2 text-blue-800">
            <p><strong>✏️ Edit Course:</strong> Click "Edit" button to modify course details</p>
            <p><strong>📝 Manage Questions:</strong> Click "Manage Questions" to view/edit/delete questions</p>
            <p><strong>🗑️ Delete:</strong> Click "Delete" to remove a course (careful!)</p>
            <p><strong>🎨 Assets:</strong> Upload images to <code className="bg-blue-100 px-2 py-1 rounded">backend/assets/images/</code></p>
            <p><strong>🔄 Apply Changes:</strong> Changes are saved immediately to JSON files</p>
          </div>
        </div>

        {/* Current Question Structure */}
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">📊 Question Structure Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg p-4 shadow">
                <div className="text-2xl mb-2">{course.icon}</div>
                <div className="text-sm font-semibold text-gray-900">{course.title}</div>
                <div className="text-xs text-gray-600 mt-2">
                  {/* This would need to query questions per course */}
                  Click "Manage Questions" to view
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(editingCourse || showCreateModal) && (
        <CourseEditModal
          course={editingCourse}
          onClose={() => {
            setEditingCourse(null);
            setShowCreateModal(false);
          }}
          onSave={handleSaveCourse}
        />
      )}

      {managingQuestions && (
        <QuestionManagerModal
          courseId={managingQuestions.id}
          courseName={managingQuestions.name}
          onClose={() => setManagingQuestions(null)}
        />
      )}
    </div>
  );
}
