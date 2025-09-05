// src/components/shared/PdfViewer.js

'use client'; // This directive is helpful but dynamic import is the key fix.

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure the PDF.js worker to render PDFs.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PdfViewer({ pdfUrl, pdfWidth, pageNumber, onDocumentLoadSuccess }) {
  if (!pdfUrl || !pdfWidth) {
    return null;
  }

  return (
    <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading="">
      <Page pageNumber={pageNumber} width={pdfWidth} />
    </Document>
  );
}
