import { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';

const PreviewFrame = forwardRef(({ code }, ref) => {
  const iframeRef = useRef(null);

  const updatePreview = (codeToRender) => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const document = iframe.contentDocument || iframe.contentWindow.document;

    // Inject base tag for assets or rewrite paths
    // We rewrite paths to use the root-relative /assets path, which Nginx proxies to the backend
    // This avoids CORS issues and works inside docker/dev environments consistently
    const processedHtml = (codeToRender.html || '')
      // Regex 1: Explicit localhost:5000 or assets/ prefix -> rewrite to /assets
      .replace(/src=["'](?:http:\/\/localhost:5000)?\/?assets\/([^"']+)["']/g, `src="/assets/$1"`)
      .replace(/url\(["']?(?:http:\/\/localhost:5000)?\/?assets\/([^"']+)["']?\)/g, `url("/assets/$1")`)
      // Regex 2: Fallback for relative paths like "foo.jpg" (common in seed data) -> rewrite to /assets/images/foo.jpg
      // Only matches if it DOES NOT start with http, /, assets, or images, and ends with image extension
      .replace(/src=["'](?!(?:http|\/|assets|images))([^"']+\.(?:png|jpg|jpeg|gif|svg|webp))["']/g, `src="/assets/images/$1"`)
      .replace(/url\(["']?(?!(?:http|\/|assets|images))([^"']+\.(?:png|jpg|jpeg|gif|svg|webp))["']?\)/g, `url("/assets/images/$1")`);

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
        ${processedHtml}
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
