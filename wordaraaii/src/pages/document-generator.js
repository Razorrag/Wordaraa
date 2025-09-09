// src/pages/document-generator.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import VantaBackground from '@/components/shared/VantaBackground';
import dynamic from 'next/dynamic';

// --- DYNAMIC IMPORT: Load the PDF viewer only on the client-side ---
const PdfViewer = dynamic(() => import('@/components/shared/PdfViewer'), {
  ssr: false,
  loading: () => <p className="text-white/50 animate-pulse">Loading PDF Viewer...</p>,
});

// --- Helper: Sanitize LaTeX before sending to compiler ---
function sanitizeLatex(raw, engine = 'pdflatex') {
  let code = raw || '';
  // Remove BOM
  code = code.replace(/^\uFEFF/, '');
  // Strip triple backticks and language markers
  code = code.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
  // Remove stray markdown fences if any remain
  code = code.replace(/```/g, '');
  // If the content starts with a language token left from code fences, drop it
  code = code.replace(/^(?:\s*(?:latex|tex)\s*\n)/i, '');
  // Avoid external images which break online compilers
  code = code.replace(/\\includegraphics\s*\[[^\]]*\]\s*\{https?:[^}]+\}/gi, '% external image removed');
  code = code.replace(/\\includegraphics\s*\{https?:[^}]+\}/gi, '% external image removed');
  // Avoid \input or \include of missing local files
  code = code.replace(/\\(input|include)\s*\{[^}]+\}/gi, '% include/input removed');
  // Engine-specific package cleanup
  const eng = (engine || 'pdflatex').toLowerCase();
  if (eng === 'xelatex' || eng === 'lualatex') {
    // Remove inputenc (not needed and can warn)
    code = code.replace(/\\usepackage\s*(\[[^\]]*\])?\s*\{\s*inputenc\s*\}/gi, '% inputenc removed for XeLaTeX/LuaLaTeX');
  } else {
    // Remove fontspec directives which would fail under pdfLaTeX
    code = code.replace(/\\usepackage\s*\{\s*fontspec\s*\}/gi, '% fontspec removed for pdfLaTeX');
    code = code.replace(/\\setmainfont\s*\{[^}]+\}/gi, '% setmainfont removed for pdfLaTeX');
  }
  code = code.trim();
  // If missing documentclass, wrap with a minimal preamble
  if (!/\\documentclass/.test(code)) {
    if (eng === 'xelatex' || eng === 'lualatex') {
      code = String.raw`\\documentclass{article}
\\usepackage{fontspec}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{hyperref}
\\title{Wordara AI Document}
\\author{Wordara AI}
\\date{\\today}
\\begin{document}
\\maketitle

` + code + `

\\end{document}`;
    } else {
      code = String.raw`\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{hyperref}
\\title{Wordara AI Document}
\\author{Wordara AI}
\\date{\\today}
\\begin{document}
\\maketitle

` + code + `

\\end{document}`;
    }
  }
  return code;
}

// --- Helper Components & Icons ---
const IconButton = ({ children, label, onClick, disabled }) => (
    <button title={label} onClick={onClick} disabled={disabled} className="p-2 rounded-md text-white/70 hover:bg-slate-700/50 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
      {children}
    </button>
  );
  
const PdfPreviewPlaceholder = ({ status, errorLog, onFixWithAI, isFixing }) => (
<div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-4 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-24 w-24 mb-4 ${status === 'compiling' ? 'text-blue-500 animate-pulse' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <h3 className="text-lg font-semibold text-white/80">{status === 'compiling' ? 'Compiling Document...' : 'Live PDF Preview'}</h3>
    <p className="text-sm text-white/50 mt-1">{status === 'failed' ? 'Compilation Failed' : 'Your compiled document will appear here.'}</p>
    {errorLog && (
        <div className="w-full mt-4">
            <pre className="p-2 bg-black/30 rounded-md text-left text-xs text-red-400 max-h-40 overflow-auto w-full">
                {errorLog}
            </pre>
            <button
            onClick={onFixWithAI}
            disabled={isFixing}
            className="mt-4 primary-button flex items-center gap-2 mx-auto text-sm !py-2 !px-4"
            >
            {isFixing ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            )}
            {isFixing ? 'Fixing with AI...' : 'Fix with AI'}
            </button>
        </div>
    )}
</div>
);


export default function DocumentGeneratorPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [latexCode, setLatexCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationLog, setCompilationLog] = useState('Ready to compile.');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(0);

  const [dividerPos, setDividerPos] = useState(50);
  const containerRef = useRef(null);
  const pdfWrapperRef = useRef(null);
  
  const [compiler, setCompiler] = useState('pdflatex');
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [genText, setGenText] = useState('');

  const handleCompile = useCallback(async (code) => {
    if (!code || isCompiling) return;
    setIsCompiling(true);
    setCompilationLog('Compiling...');
    setPdfUrl(null);
    setPageNumber(1);
    setNumPages(null);

    try {
      const safeCode = sanitizeLatex(code, compiler);
      if (safeCode !== code) {
        setLatexCode(safeCode);
      }
      const response = await fetch('/api/compile-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: safeCode, engine: compiler }),
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setCompilationLog('Compilation successful.');
        // ensure PDF panel is visible (we always show PDF now)
      } else {
        // --- START: CORRECTED ERROR HANDLING LOGIC ---
        // Read the response body ONCE as text.
        const errorText = await response.text();
        let errorLog;
        
        // Now, TRY to parse the text we already have as JSON.
        try {
            const errorData = JSON.parse(errorText);
            // If it's valid JSON, get the log property or stringify it.
            errorLog = errorData.log || JSON.stringify(errorData);
        } catch (parseError) {
            // If it's not JSON, the text itself is the error message (e.g., an HTML error page).
            errorLog = errorText;
        }
        
        // Throw the clean errorLog string.
        throw new Error(errorLog);
        // --- END: CORRECTED ERROR HANDLING LOGIC ---
      }
    } catch (error) {
      setCompilationLog(`Error: ${error.message}`);
      console.error('Compilation failed:', error);
      // show PDF placeholder with error log
    } finally {
      setIsCompiling(false);
    }
  }, [isCompiling]);

  const handleFixWithAI = async () => {
    if (!compilationLog.startsWith('Error:') || isFixing) return;
    
    setIsFixing(true);
    setGenerationStatus('Asking AI to fix compilation errors...');
    setLatexCode(prev => `${prev}\n\n% Attempting to fix compilation errors with AI...`);

    try {
      const response = await fetch('/api/fix-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: latexCode,
          errorLog: compilationLog.substring(7)
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || `AI fix failed. Status: ${response.status}`);
      }

      setGenerationStatus('Receiving corrected code from AI...');
      let fixedCode = '';
      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fixedCode += chunk;
        }
      } else {
        fixedCode = await response.text();
      }
      
      const cleaned = sanitizeLatex(fixedCode, compiler);
      setLatexCode(cleaned);
      setGenerationStatus('AI fix complete. Re-compiling...');
      await handleCompile(cleaned);

    } catch (error) {
      console.error('Error fixing LaTeX with AI:', error);
      setGenerationStatus(`Error during AI fix: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newDividerPos = ((e.clientX - rect.left) / rect.width) * 100;
      if (newDividerPos > 20 && newDividerPos < 80) setDividerPos(newDividerPos);
    }
  }, []);
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const updatePdfWidth = () => {
      if (pdfWrapperRef.current) {
        setPdfWidth(pdfWrapperRef.current.clientWidth - 32);
      }
    };
    updatePdfWidth();
    window.addEventListener('resize', updatePdfWidth);
    return () => window.removeEventListener('resize', updatePdfWidth);
  }, [dividerPos]);

  // Recompute width when a new PDF is set
  useEffect(() => {
    if (pdfWrapperRef.current) {
      setPdfWidth(pdfWrapperRef.current.clientWidth - 32);
    }
  }, [pdfUrl]);

  // --- Reusable: generate LaTeX from text content via AI ---
  const generateFromContent = useCallback(async (content) => {
    setIsGenerating(true);
    setGenerationStatus('Initializing AI document generation...');
    setLatexCode(`% Generating LaTeX code from your content...\n% Please wait.`);

    try {
      const response = await fetch('/api/generate-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || `Failed to generate LaTeX. Status: ${response.status}`);
      }

      let finalCode = '';
      if (response.body && response.body.getReader) {
        setGenerationStatus('Receiving LaTeX code from AI...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          finalCode += chunk;
        }
      } else {
        // Fallback: non-streaming
        setGenerationStatus('Receiving LaTeX code (non-stream)...');
        finalCode = await response.text();
      }
      const cleaned = sanitizeLatex(finalCode, compiler);
      setGenerationStatus('AI generation complete. Starting compilation...');
      setLatexCode(cleaned);
      await handleCompile(cleaned);

    } catch (error) {
      console.error('Error generating LaTeX:', error);
      setGenerationStatus(`Error: ${error.message}`);
      setLatexCode(`% An error occurred during LaTeX generation.`);
    } finally {
      setIsGenerating(false);
    }
  }, [handleCompile]);

  useEffect(() => {
    const initializePage = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (!sessionUser) {
        router.push('/login');
        return;
      }
      setUser(sessionUser);

      const generatedContent = localStorage.getItem('wordaraDocumentContent');
      if (generatedContent) {
        localStorage.removeItem('wordaraDocumentContent');
        await generateFromContent(generatedContent);
      } else {
        setLatexCode(String.raw`\documentclass{article}
\title{My New Document}
\author{Wordara AI}
\date{\today}
\begin{document}
\maketitle
\section{Introduction}
This is a sample document. Click 'Compile PDF' to see it on the right.

You can write math inline like $E=mc^2$ or as a display block:
\[ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} \]

\subsection{A List}
\begin{itemize}
    \item First item
    \item Second item
\end{itemize}
\end{document}`);
      }
      setLoading(false);
    };

    initializePage();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.push('/login'); else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white bg-gray-900"><p className="text-xl animate-pulse">Authenticating...</p></div>;
  if (!user) return null;

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
      <div className="absolute inset-0 -z-10"><VantaBackground /></div>
      
      <header className="flex-shrink-0 relative z-20 flex items-center justify-between p-3 border-b border-white/10 bg-black/30">
        <h1 className="text-xl font-bold mother-of-pearl-text">LaTeX Document Editor</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGenPanel((s) => !s)} disabled={isCompiling || isGenerating} className="pearl-button flex items-center gap-2 text-sm !py-2 !px-4">
            {showGenPanel ? 'Hide AI Generator' : 'Generate with AI'}
          </button>
          <button onClick={() => handleCompile(latexCode)} disabled={isCompiling || isGenerating || isFixing} className="pearl-button flex items-center gap-2 text-sm !py-2 !px-4">
            {isCompiling ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            {isCompiling ? 'Compiling...' : 'Compile PDF'}
          </button>
        </div>
      </header>
      {showGenPanel && (
        <div className="relative z-20 border-b border-white/10 bg-black/20 p-3 flex gap-3 items-start">
          <textarea
            className="w-full h-24 p-2 rounded bg-black/30 border border-white/10 text-white text-sm"
            placeholder="Paste content or markdown here..."
            value={genText}
            onChange={(e) => setGenText(e.target.value)}
          />
          <button
            onClick={() => genText.trim() && generateFromContent(genText.trim())}
            disabled={isGenerating || !genText.trim()}
            className="primary-button text-sm !py-2 !px-4"
          >
            {isGenerating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      )}
      
      <main ref={containerRef} className="flex-grow flex flex-col md:flex-row min-h-0 relative p-4 gap-4">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="glass-card flex flex-col h-full w-full md:w-auto" style={{ width: `calc(${dividerPos}% - 8px)` }}>
          <div className="flex-shrink-0 p-2 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80 px-2">Source Code (main.tex)</h2>
          </div>
          <div className="flex-grow min-h-0">
            <Editor height="100%" language="latex" theme="vs-dark" value={latexCode} onChange={(value) => setLatexCode(value || '')} options={{ minimap: { enabled: true }, wordWrap: 'on', fontSize: 14, readOnly: isGenerating || isFixing }}/>
          </div>
          <div className="flex-shrink-0 p-2 text-xs border-t border-white/10 text-white/50">{(isGenerating || isFixing) ? <span className="animate-pulse">{generationStatus}</span> : <span>{generationStatus || 'Ready.'}</span>}</div>
        </motion.div>

        <div onMouseDown={handleMouseDown} className="hidden md:flex flex-shrink-0 w-2 h-full cursor-col-resize items-center justify-center group"><div className="w-0.5 h-1/4 bg-slate-600 group-hover:bg-blue-500 transition-colors rounded-full" /></div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="glass-card flex flex-col h-full w-full md:w-auto" style={{ width: `calc(${100 - dividerPos}% - 8px)` }}>
          <div className="flex-shrink-0 p-2 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-white/70">Compiler</label>
              <select
                className="bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white"
                value={compiler}
                onChange={(e) => setCompiler(e.target.value)}
              >
                <option value="pdflatex">pdfLaTeX</option>
                <option value="xelatex">XeLaTeX</option>
                <option value="lualatex">LuaLaTeX</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <IconButton label="Previous Page" onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber <= 1}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></IconButton>
              <span className="text-sm text-white/80">Page {pageNumber} of {numPages || '–'}</span>
              <IconButton label="Next Page" onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} disabled={!numPages || pageNumber >= numPages}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></IconButton>
              <a href={pdfUrl} download="document.pdf" className={`${!pdfUrl ? 'pointer-events-none' : ''}`}>
                <IconButton label="Download PDF" disabled={!pdfUrl}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></IconButton>
              </a>
            </div>
          </div>
          
          <div ref={pdfWrapperRef} className="flex-grow min-h-0 p-4 flex items-center justify-center overflow-auto scrollbar-themed">
            {pdfUrl ? (
                <PdfViewer
                    pdfUrl={pdfUrl}
                    pdfWidth={pdfWidth}
                    pageNumber={pageNumber}
                    onDocumentLoadSuccess={onDocumentLoadSuccess}
                />
            ) : (
                <PdfPreviewPlaceholder 
                    status={isCompiling ? 'compiling' : (compilationLog.startsWith('Error:') ? 'failed' : 'idle')}
                    errorLog={compilationLog.startsWith('Error:') ? compilationLog.substring(7) : null}
                    onFixWithAI={handleFixWithAI}
                    isFixing={isFixing}
                />
            )}
          </div>
          <div className="flex-shrink-0 p-2 text-xs border-t border-white/10 text-white/50 truncate">{`Compilation Log: ${compilationLog}`}</div>
        </motion.div>
      </main>
    </div>
  );
}