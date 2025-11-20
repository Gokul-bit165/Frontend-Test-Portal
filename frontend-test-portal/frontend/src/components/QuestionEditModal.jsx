import { useState, useEffect } from 'react';

export default function QuestionEditModal({ question, courseId, onSave, onClose }) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    instructions: '',
    level: 1,
    questionNumber: 1,
    timeLimit: 15,
    points: 100,
    tags: '',
    hints: '',
    isLocked: false,
    assetImages: '',
    assetReference: '',
    expectedSolutionHtml: '',
    expectedSolutionCss: '',
    expectedSolutionJs: '',
    thresholdStructure: 70,
    thresholdVisual: 80,
    thresholdOverall: 75
  });

  useEffect(() => {
    if (question) {
      // Convert assets array to string paths
      const imagePaths = question.assets?.images?.map(img => img.path || img).join('\n') || '';
      const referencePath = question.assets?.reference || '';
      
      setFormData({
        id: question.id || '',
        title: question.title || '',
        description: question.description || '',
        instructions: question.instructions || '',
        level: question.level || 1,
        questionNumber: question.questionNumber || 1,
        timeLimit: question.timeLimit || 15,
        points: question.points || 100,
        tags: Array.isArray(question.tags) ? question.tags.join(', ') : '',
        hints: Array.isArray(question.hints) ? question.hints.join('\n') : '',
        isLocked: question.isLocked || false,
        assetImages: imagePaths,
        assetReference: referencePath,
        expectedSolutionHtml: question.expectedSolution?.html || '',
        expectedSolutionCss: question.expectedSolution?.css || '',
        expectedSolutionJs: question.expectedSolution?.js || '',
        thresholdStructure: question.passingThreshold?.structure || 70,
        thresholdVisual: question.passingThreshold?.visual || 80,
        thresholdOverall: question.passingThreshold?.overall || 75
      });
    } else {
      // New question - generate ID
      const timestamp = Date.now();
      const newId = `${courseId}-l${formData.level}-q${timestamp}`;
      setFormData(prev => ({ ...prev, id: newId }));
    }
  }, [question, courseId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert asset paths to proper format
    const imagePaths = formData.assetImages
      .split('\n')
      .map(path => path.trim())
      .filter(path => path);
    
    const assetImages = imagePaths.map(path => {
      const filename = path.split('/').pop();
      return {
        name: filename,
        path: path,
        description: `${filename} image`
      };
    });
    
    const questionData = {
      id: formData.id,
      courseId: courseId,
      level: parseInt(formData.level),
      questionNumber: parseInt(formData.questionNumber),
      title: formData.title,
      description: formData.description,
      instructions: formData.instructions,
      timeLimit: parseInt(formData.timeLimit),
      points: parseInt(formData.points),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      hints: formData.hints.split('\n').filter(h => h.trim()),
      isLocked: formData.isLocked,
      passingThreshold: {
        structure: parseInt(formData.thresholdStructure) || 70,
        visual: parseInt(formData.thresholdVisual) || 80,
        overall: parseInt(formData.thresholdOverall) || 75
      },
      expectedSolution: {
        html: formData.expectedSolutionHtml,
        css: formData.expectedSolutionCss,
        js: formData.expectedSolutionJs
      },
      assets: {
        images: assetImages,
        reference: formData.assetReference.trim()
      },
      prerequisite: question?.prerequisite || null,
      createdAt: question?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(questionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {question ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
                disabled={!!question}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows="2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
              rows="5"
              required
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question #</label>
              <input
                type="number"
                min="1"
                value={formData.questionNumber}
                onChange={(e) => setFormData({ ...formData, questionNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time (min)</label>
              <input
                type="number"
                min="5"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
              <input
                type="number"
                min="50"
                step="50"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          {/* Passing Thresholds */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <span>🎯</span> Passing Thresholds (Scoring)
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Structure %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.thresholdStructure}
                  onChange={(e) => setFormData({ ...formData, thresholdStructure: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="70"
                />
                <p className="text-xs text-gray-500 mt-1">HTML structure match</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Visual %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.thresholdVisual}
                  onChange={(e) => setFormData({ ...formData, thresholdVisual: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="80"
                />
                <p className="text-xs text-gray-500 mt-1">Visual appearance</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Overall %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.thresholdOverall}
                  onChange={(e) => setFormData({ ...formData, thresholdOverall: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="75"
                />
                <p className="text-xs text-gray-500 mt-1">Combined score</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="HTML, CSS, Flexbox"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isLocked}
                  onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                  className="mr-2 w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">🔒 Lock Question</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hints (one per line)</label>
            <textarea
              value={formData.hints}
              onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows="3"
              placeholder="Hint 1&#10;Hint 2&#10;Hint 3"
            />
          </div>

          {/* Assets Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🖼️ Assets</span>
              <span className="text-sm font-normal text-gray-500">(Images & Reference Screenshots)</span>
            </h3>
            
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Asset Paths (one per line)
                </label>
                <textarea
                  value={formData.assetImages}
                  onChange={(e) => setFormData({ ...formData, assetImages: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  rows="4"
                  placeholder="/assets/images/avatar-1.png&#10;/assets/images/product-1.png&#10;/assets/images/hero-bg-1.jpg"
                />
                <p className="text-xs text-gray-600 mt-1">
                  💡 Upload images in <strong>Asset Manager</strong>, then copy their paths here
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Screenshot Path (expected output)
                </label>
                <input
                  type="text"
                  value={formData.assetReference}
                  onChange={(e) => setFormData({ ...formData, assetReference: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  placeholder="/assets/references/html-css-l1-q1-ref.png"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📸 Screenshot showing what the final result should look like
                </p>
              </div>
            </div>
          </div>

          {/* Expected Solution */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-4">Expected Solution</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HTML</label>
                <textarea
                  value={formData.expectedSolutionHtml}
                  onChange={(e) => setFormData({ ...formData, expectedSolutionHtml: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  rows="6"
                  placeholder="<!DOCTYPE html>..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CSS</label>
                <textarea
                  value={formData.expectedSolutionCss}
                  onChange={(e) => setFormData({ ...formData, expectedSolutionCss: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  rows="6"
                  placeholder="body { margin: 0; }..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">JavaScript (optional)</label>
                <textarea
                  value={formData.expectedSolutionJs}
                  onChange={(e) => setFormData({ ...formData, expectedSolutionJs: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  rows="4"
                  placeholder="// Optional JavaScript"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {question ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
