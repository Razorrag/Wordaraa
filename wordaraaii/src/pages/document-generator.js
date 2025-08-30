import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { createTypstCompiler } from '@myriaddreamin/typst.ts';
import VantaBackground from '@/components/shared/VantaBackground';

const defaultTypstCode = `= Welcome to the AI Document Generator!
Use the input below to describe the document you want, and the AI will generate the Typst code for you.

Or, you can start writing your own Typst code right here!
`;

export default function DocumentGeneratorPage() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();

  // State for AI prompt, generator, editor, and preview
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [typstCode, setTypstCode] = useState(defaultTypstCode);
  const [previewContent, setPreviewContent] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerError, setCompilerError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const compilerRef = useRef(null);
  const debounceTimer = useRef(null);

  // --- Authentication Logic (Unchanged) ---
  useEffect(() => {
    // (This part remains the same)
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login'); else setUser(user);
      setLoadingAuth(false);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.push('/login'); else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);
  
  // --- Initialize Typst Compiler & Load Fonts ---
  useEffect(() => {
    const initializeCompiler = async () => {
      try {
        console.log("Initializing Typst compiler...");
        const compiler = await createTypstCompiler();
        compilerRef.current = compiler;
        
        // Correctly initialize without hardcoded CDN
        await compiler.init();

        // CORRECT FIX: Fetch the font from /public and register it in the virtual file system
        console.log("Loading font...");
        const response = await fetch('/fonts/LinLibertine_R.ttf');
        const fontBuffer = await response.arrayBuffer();
        const fontData = new Uint8Array(fontBuffer);

        // Add the font file to the compiler's memory
        await compiler.addSource('/fonts/LinLibertine_R.ttf', fontData);
        console.log("Font loaded successfully.");

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Typst compiler:", error);
        setCompilerError("Could not initialize document engine. Please refresh.");
      }
    };
    initializeCompiler();
    return () => compilerRef.current?.dispose();
  }, []);

  // --- Render Typst Code ---
  const renderTypst = useCallback(async (code) => {
    if (!compilerRef.current || !isInitialized) return;
    setIsCompiling(true);
    setCompilerError('');
    try {
      // CORRECT FIX: Use renderSvg and a simple try/catch for error handling
      const svgResult = await compilerRef.current.renderSvg({
        mainContent: code,
        fontPath: '/fonts' // Tell the compiler where the registered fonts are
      });
      setPreviewContent(svgResult);
    } catch (error) {
      console.error("Typst compilation error:", error);
      setCompilerError("Error in Typst code. Check syntax.");
    } finally {
      setIsCompiling(false);
    }
  }, [isInitialized]);

  // --- Debounce re-rendering on code change ---
  useEffect(() => {
    if (!isInitialized) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { renderTypst(typstCode) }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [typstCode, isInitialized, renderTypst]);
  
  // --- NEW: AI Generation Handler ---
  const handleGenerateTypst = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setCompilerError('');
    try {
      const response = await fetch('/api/generate-typst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const data = await response.json();
      setTypstCode(data.typstCode); // Update editor with AI-generated code
    } catch (error) {
      console.error('Failed to generate Typst:', error);
      setCompilerError('AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };


  if (loadingAuth || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
        <p className="text-xl animate-pulse">
            {loadingAuth ? "Authenticating..." : "Loading Document Engine..."}
        </p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="relative flex flex-col h-screen overflow-hidden text-white bg-gray-900">
      <div className="absolute inset-0 -z-10"><VantaBackground /></div>

      <motion.header /* ... Header remains the same ... */ >
        <h1 className="text-xl font-bold mother-of-pearl-text">AI Document Generator</h1>
        <div className="text-sm text-white/70">{isCompiling ? 'Compiling...' : compilerError ? 'Error' : 'Ready'}</div>
      </motion.header>
      
      {/* NEW: AI Prompt Section */}
      <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="relative z-10 p-4 border-b border-white/10 bg-black/20">
        <form onSubmit={handleGenerateTypst} className="flex gap-4 max-w-4xl mx-auto">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., a simple resume for a software engineer..."
            disabled={isGenerating}
            className="flex-grow p-3 rounded-md bg-slate-700/50 border border-slate-600 placeholder-white/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
          <button type="submit" disabled={isGenerating} className="primary-button px-6 py-2.5 font-semibold">
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </motion.div>

      {/* Main Content: Editor + Preview */}
      <div className="flex-grow flex min-h-0">
        {/* Left: Editor */}
        <div className="w-1/2 h-full flex flex-col border-r border-white/10">
          <Editor
            height="100%"
            // CORRECT FIX: Language set to a neutral default
            language="plaintext" 
            theme="vs-dark"
            value={typstCode}
            onChange={(value) => setTypstCode(value || '')}
            options={{ minimap: { enabled: false }, wordWrap: 'on' }}
          />
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 h-full p-6 overflow-y-auto scrollbar-themed">
          <div className="bg-white rounded-md shadow-lg min-h-full p-4">
            {compilerError ? (
              <div className="text-red-600 p-4"><p className="font-bold">Error</p><p>{compilerError}</p></div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: previewContent }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}