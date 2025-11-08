import { useState } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ code, onChange }) {
  const [activeTab, setActiveTab] = useState('html');

  const tabs = [
    { id: 'html', label: 'HTML', language: 'html' },
    { id: 'css', label: 'CSS', language: 'css' },
    { id: 'js', label: 'JavaScript', language: 'javascript' }
  ];

  const handleEditorChange = (value) => {
    onChange({ ...code, [activeTab]: value || '' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          language={tabs.find(t => t.id === activeTab)?.language}
          value={code[activeTab]}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2
          }}
        />
      </div>
    </div>
  );
}
