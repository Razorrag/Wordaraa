// src/components/chatbot/Chatbot.js

'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import UrlImportModal from '@/components/ui/UrlImportModal';
import { useRouter } from 'next/router';

// Helper components
const Icon = ({ path, className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const StarterPrompts = ({ onPromptClick }) => {
    const prompts = [
        { title: "Draft an email", text: "Draft an email to my team about the Q3 project kickoff.", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
        { title: "Explain a concept", text: "Explain the concept of neural networks in simple terms.", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
        { title: "Brainstorm ideas", text: "Brainstorm some creative names for a new tech startup focused on AI.", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
        { title: "Write some code", text: "Write a python function to check if a string is a palindrome.", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {prompts.map((prompt, index) => (
                <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onPromptClick(prompt.text)}
                    className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/70 transition-colors text-left border border-slate-700"
                >
                    <div className="flex items-center gap-3">
                        <Icon path={prompt.icon} className="h-6 w-6 text-white/70" />
                        <p className="font-semibold text-white/90">{prompt.title}</p>
                    </div>
                </motion.button>
            ))}
        </div>
    );
};

// NEW: Advanced Attachment Card component
const attachmentIcons = {
  github: (props) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.19.01-.82.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
    </svg>
  ),
  file: (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  url: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0 0 12 15c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 0 3 12c0 .778.099 1.533.284 2.253m0 0A11.953 11.953 0 0 1 12 12.75c-2.998 0-5.74-1.1-7.843-2.918" />
    </svg>
  ),
};

const AttachmentCard = ({ attachment, onRemove }) => {
  const IconComponent = attachmentIcons[attachment.type] || attachmentIcons.file;
  const sourceName = {
    github: 'GitHub',
    file: 'File Upload',
    url: 'Web Link'
  }[attachment.type] || 'Attachment';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
      className="relative flex items-start gap-3 bg-slate-800/70 border border-slate-700 rounded-lg p-3 w-full"
    >
      <div className="flex-shrink-0 text-slate-400 mt-0.5">
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{attachment.name}</p>
        <p className="text-xs text-slate-400">{sourceName}</p>
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-600 hover:bg-red-500 transition-colors focus:outline-none text-white text-lg font-bold"
        aria-label={`Remove ${attachment.name}`}
      >
        &times;
      </button>
    </motion.div>
  );
};


export default function Chatbot({ user, chatId, onNewChatCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const [attachments, setAttachments] = useState([]);
  const [showInputOptions, setShowInputOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlImportSource, setUrlImportSource] = useState('');

  const messagesEndRef = useRef(null);
  const inputOptionsRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const router = useRouter();

  // Auto-resize textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto'; // Reset height
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChatId) {
        setMessages([]);
        return;
      }
      const { data, error } = await supabase
        .from('messages').select('id, role, content')
        .eq('chat_id', currentChatId).order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error);
      else setMessages(data.map(m => ({ id: m.id, text: m.content, sender: m.role === 'user' ? 'user' : 'ai' })));
    };
    fetchMessages();
  }, [currentChatId]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isUploading]);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (inputOptionsRef.current && !inputOptionsRef.current.contains(event.target)) {
        setShowInputOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputOptionsRef]);

  const sendMessage = async (userPrompt) => {
    const trimmedPrompt = userPrompt.trim();
    if (!trimmedPrompt && attachments.length === 0) return;

    setIsLoading(true);

    // Create a user-facing message that includes attachment info
    let attachmentPreamble = '';
    if (attachments.length > 0) {
        const attachmentNames = attachments.map(a => a.name).join(', ');
        attachmentPreamble = `**Attachments:** _${attachmentNames}_\n\n`;
    }
    const displayMessage = `${attachmentPreamble}${trimmedPrompt || `Please analyze the attached content.`}`;

    // Construct the full context for the AI
    let fullPromptForAI = '';
    if (attachments.length > 0) {
      const attachmentContext = attachments.map(att => 
        `--- START OF ${att.type.toUpperCase()} CONTENT: ${att.name} ---\n${att.content}\n--- END OF ${att.type.toUpperCase()} CONTENT: ${att.name} ---`
      ).join('\n\n');
      fullPromptForAI = `Based on the following context from attachments:\n\n${attachmentContext}\n\nPlease answer the user's request: ${trimmedPrompt}`;
    } else {
      fullPromptForAI = trimmedPrompt;
    }
    
    setMessages(prev => [...prev, { id: Date.now(), text: displayMessage, sender: 'user' }]);
    setInput('');
    setAttachments([]);

    let tempChatId = currentChatId;

    if (!tempChatId) {
      const title = trimmedPrompt.substring(0, 50) || "Chat about attachments";
      const { data, error } = await supabase.from('chats').insert({ user_id: user.id, title }).select().single();
      
      if (error) {
        console.error("Error creating chat:", error);
        setIsLoading(false);
        return;
      }
      tempChatId = data.id;
      setCurrentChatId(tempChatId);
      onNewChatCreated(tempChatId);
    }

    await supabase.from('messages').insert({ chat_id: tempChatId, role: 'user', content: displayMessage });

    const aiMessageId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);
    let fullResponse = "";

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullPromptForAI, chatId: tempChatId }),
      });

      if (!response.body) throw new Error("Response has no body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        fullResponse += decoder.decode(value);
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: fullResponse } : msg));
      }

      await supabase.from('messages').insert({ chat_id: tempChatId, role: 'assistant', content: fullResponse });

    } catch (error) {
      console.error('Streaming failed:', error);
      setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: "Sorry, an error occurred." } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowInputOptions(false);
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error((await response.json()).error || 'File upload failed');
        const { content } = await response.json();
        setAttachments(prev => [...prev, { name: file.name, content, type: 'file' }]);
    } catch (error) {
        console.error('Error uploading file:', error);
        setMessages(prev => [...prev, { id: Date.now(), text: `Sorry, I couldn't process "${file.name}".`, sender: 'ai' }]);
    } finally {
        setIsUploading(false);
        event.target.value = '';
    }
  };
  
  const handleOpenUrlModal = (source) => {
    setUrlImportSource(source);
    setIsUrlModalOpen(true);
    setShowInputOptions(false);
  };

  const processUrlImport = async (url) => {
    if (!url) return;
    setIsUrlModalOpen(false);
    setIsUploading(true);

    try {
        const res = await fetch('/api/fetch-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
        if (!res.ok) throw new Error((await res.json()).error || `Failed to fetch URL`);
        
        const { content } = await res.json();
        const GITHUB_URL_REGEX = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = url.match(GITHUB_URL_REGEX);
        let displayName, attachmentType;

        if (match) {
            displayName = `${match[1]}/${match[2]}`;
            attachmentType = 'github';
        } else {
            displayName = new URL(url).hostname + (new URL(url).pathname.length > 1 ? '/...' : '');
            attachmentType = 'url';
        }

        setAttachments(prev => [...prev, { name: displayName, content, type: attachmentType, source: url }]);
    } catch (error) {
        console.error('URL import failed:', error);
        setMessages(prev => [...prev, { id: Date.now(), text: `Sorry, I couldn't process the URL. Error: ${error.message}`, sender: 'ai' }]);
    } finally {
        setIsUploading(false);
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const getPlaceholderText = () => {
    if (isUploading) return "Processing attachment...";
    if (isLoading) return "Waiting for response...";
    if (attachments.length > 0) return "Ask something about the attached content...";
    return "Type your message...";
  };

  const isDisabled = isLoading || isUploading;
  const canSubmit = !isDisabled && (input.trim().length > 0 || attachments.length > 0);

  const handleGenerateDocumentClick = (content) => {
    const cleanedContent = content.replace(/\[GENERATE_DOCUMENT\]/g, '').trim();
    localStorage.setItem('wordaraDocumentContent', cleanedContent);
    router.push('/document-generator');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col h-full w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.js,.py,.html,.css,.md,.json,.csv,.pdf,.docx" />
      <UrlImportModal isOpen={isUrlModalOpen} onClose={() => setIsUrlModalOpen(false)} onSubmit={processUrlImport} title={`Import from ${urlImportSource}`} />

      <div className="flex-1 overflow-y-auto scrollbar-themed">
        <div className="max-w-4xl mx-auto w-full px-4 pt-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-blue-600/70 text-white rounded-br-none' : 'bg-slate-700/70 text-white rounded-bl-none'}`}>
                  <div className="markdown-content text-base">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => {
                          const child = node.children[0];
                          if (child && child.type === 'text' && child.value === '[GENERATE_DOCUMENT]') {
                            return (
                              <div className="mt-4 flex justify-start">
                                <Button
                                  onClick={() => handleGenerateDocumentClick(msg.text)}
                                  className="primary-button !py-2 !px-4 text-sm"
                                >
                                  <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-4 h-4 mr-2" />
                                  Generate Document
                                </Button>
                              </div>
                            );
                          }
                          return <p {...props} />;
                        },
                      }}
                    >
                      {msg.text || "..."}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isUploading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-4">
              <div className="max-w-[85%] px-4 py-3 rounded-2xl shadow-md bg-slate-700/70 text-white rounded-bl-none">
                <p className="text-base animate-pulse">Processing attachment...</p>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="mt-auto pt-2 pb-4 bg-gradient-to-t from-black/30 to-transparent">
        <div className="max-w-4xl mx-auto w-full px-4">
          {messages.length === 0 && !isDisabled && attachments.length === 0 && <StarterPrompts onPromptClick={sendMessage} />}
          
          <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
            <div className="relative" ref={inputOptionsRef}>
              <motion.button type="button" onClick={() => setShowInputOptions(!showInputOptions)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isDisabled} className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/70 text-white text-2xl font-bold transition-colors duration-200 hover:bg-blue-500/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-slate-500/50 disabled:cursor-not-allowed">
                {showInputOptions ? '−' : '+'}
              </motion.button>
              <AnimatePresence>
                {showInputOptions && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-lg shadow-lg p-3 space-y-2 z-20">
                    <Button onClick={handleUploadClick} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">📁</span> Upload your files</Button>
                    <Button onClick={() => handleOpenUrlModal('Google Drive')} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">☁️</span> Add from your drive</Button>
                    <Button onClick={() => handleOpenUrlModal('GitHub')} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">🗃️</span> Import your code (GitHub link)</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex-1 p-3 rounded-2xl bg-slate-700/50 border border-slate-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 text-white transition-colors duration-200 flex flex-col gap-3">
              <AnimatePresence>
                {attachments.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {attachments.map((att, index) => (
                            <AttachmentCard key={index} attachment={att} onRemove={() => removeAttachment(index)} />
                        ))}
                    </div>
                )}
              </AnimatePresence>
              <textarea
                ref={textareaRef}
                rows="1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if(canSubmit) handleSubmit(e);
                  }
                }}
                placeholder={getPlaceholderText()}
                disabled={isDisabled}
                className="w-full bg-transparent placeholder-white/50 outline-none resize-none max-h-48 scrollbar-themed"
              />
            </div>

            <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={!canSubmit} className="primary-button !w-12 !h-12 !p-0 !rounded-full flex-shrink-0 disabled:bg-blue-800/60 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}