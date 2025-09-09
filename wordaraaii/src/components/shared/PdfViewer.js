// src/components/shared/PdfViewer.js

'use client'; // This directive is helpful but dynamic import is the key fix.

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useState } from 'react';

// Configure the PDF.js worker to render PDFs.
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfViewer({ pdfUrl }) {
  if (!pdfUrl) return null;
  return (
    <div className="w-full h-full flex flex-col gap-2">
      <object data={pdfUrl} type="application/pdf" className="w-full h-full" style={{ border: 'none' }}>
        <p className="text-white/80 text-sm">
          Your browser cannot display the PDF inline.
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="underline ml-1">Open in new tab</a>
          or
          <a href={pdfUrl} download="document.pdf" className="underline ml-1">Download</a>.
        </p>
      </object>
    </div>
  );
}
