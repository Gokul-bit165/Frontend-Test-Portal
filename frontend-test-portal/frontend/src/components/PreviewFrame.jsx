import { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';

const PreviewFrame = forwardRef(({ code }, ref) => {
  const iframeRef = useRef(null);

  const updatePreview = (codeToRender) => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const document = iframe.contentDocument || iframe.contentWindow.document;

    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          ${codeToRender.css || ''}
        </style>
      </head>
      <body>
        ${codeToRender.html || ''}
        <script>
          try {
            ${codeToRender.js || ''}
          } catch (error) {
            console.error('JavaScript Error:', error);
          }
        </script>
      </body>
      </html>
    `;

    document.open();
    document.write(fullHTML);
    document.close();
  };

  useImperativeHandle(ref, () => ({
    updatePreview
  }));

  useEffect(() => {
    // Initial render
    updatePreview(code);
  }, []); // Only on mount

  return (
    <div className="w-full h-full border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
        className="w-full h-full"
        style={{ minHeight: '400px' }}
        title="Preview"
      />
    </div>
  );
});

PreviewFrame.displayName = 'PreviewFrame';

export default PreviewFrame;
