// src/components/chatbot/Chatbot.js

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from 'ai/react';
import Button from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import UrlImportModal from '@/components/ui/UrlImportModal'; // <-- Import the new modal component

// Helper components (no changes needed)
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

export default function Chatbot({ user, chatId, onNewChatCreated }) {
  const [showInputOptions, setShowInputOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false); // <-- NEW state for modal
  const [urlImportSource, setUrlImportSource] = useState('');   // <-- NEW state for modal source
  const messagesEndRef = useRef(null);
  const inputOptionsRef = useRef(null);
  const fileInputRef = useRef(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    api: '/api/chat',
    id: chatId,
    body: { chatId: chatId },
    onResponse: (response) => {
      const newChatIdFromHeader = response.headers.get('x-wordara-chat-id');
      if (newChatIdFromHeader && !chatId) {
        onNewChatCreated(newChatIdFromHeader);
      }
    },
  });
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) {
        setMessages([]);
        return;
      }
      const { data, error } = await supabase
        .from('messages').select('id, role, content')
        .eq('chat_id', chatId).order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error);
      else setMessages(data);
    };
    fetchMessages();
  }, [chatId, setMessages]);


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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inputOptionsRef]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setShowInputOptions(false);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'File upload failed');
        }
        const { content } = await response.json();
        const fullPrompt = `Here is the content of the file "${file.name}":\n\n${content}\n\n---\n\nPlease summarize this file or answer questions about it.`;
        append({ role: 'user', content: fullPrompt });
    } catch (error) {
        console.error('Error uploading or processing file:', error);
        append({ role: 'assistant', content: `Sorry, I couldn't process the file "${file.name}". Error: ${error.message}` });
    } finally {
        setIsUploading(false);
        event.target.value = '';
    }
  };
  
  // --- NEW: Function to open the URL modal ---
  const handleOpenUrlModal = (source) => {
    setUrlImportSource(source);
    setIsUrlModalOpen(true);
    setShowInputOptions(false);
  };

  // --- NEW: Function to process the URL from the modal ---
  const processUrlImport = async (url) => {
    if (!url) return;
    setIsUrlModalOpen(false);

    try {
        const res = await fetch('/api/fetch-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to fetch URL (status: ${res.status})`);
        }

        const { content } = await res.json();
        const fullPrompt = `Here is the content from the URL (${url}):\n\n${content}\n\n---\n\nPlease summarize this content or answer questions about it.`;
        append({ role: 'user', content: fullPrompt });

    } catch (error) {
        console.error('URL import failed:', error);
        append({ role: 'assistant', content: `Sorry, I couldn't process the URL. Error: ${error.message}` });
    }
  };

  const getPlaceholderText = () => {
    if (isUploading) return "Uploading file...";
    if (isLoading) return "Waiting for response...";
    return "Type your message...";
  };

  const isDisabled = isLoading || isUploading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full w-full"
    >
        <input
            type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"
            accept=".txt,.js,.py,.html,.css,.md,.json,.csv"
        />

        {/* --- NEW: Render the modal --- */}
        <UrlImportModal
          isOpen={isUrlModalOpen}
          onClose={() => setIsUrlModalOpen(false)}
          onSubmit={processUrlImport}
          title={`Import from ${urlImportSource}`}
        />

        <div className="flex-1 overflow-y-auto scrollbar-themed">
            <div className="max-w-4xl mx-auto w-full px-4 pt-4">
                <AnimatePresence>
                {messages.map((msg) => (
                    <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-md ${msg.role === 'user' ? 'bg-blue-600/70 text-white rounded-br-none' : 'bg-slate-700/70 text-white rounded-bl-none'}`}>
                        <div className="markdown-content text-base">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                    </motion.div>
                ))}
                </AnimatePresence>
                {isUploading && (
                    <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex justify-start mb-4"
                    >
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl shadow-md bg-slate-700/70 text-white rounded-bl-none">
                        <p className="text-base animate-pulse">Processing your file...</p>
                    </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>

      <div className="mt-auto pt-2 pb-4 bg-gradient-to-t from-black/30 to-transparent">
        <div className="max-w-4xl mx-auto w-full px-4">
            
            {messages.length === 0 && !isDisabled && (
                <StarterPrompts onPromptClick={(text) => append({ role: 'user', content: text })} />
            )}

            <form onSubmit={handleSubmit} className="relative flex gap-3">
            <div className="relative" ref={inputOptionsRef}>
              <motion.button type="button" onClick={() => setShowInputOptions(!showInputOptions)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isDisabled} className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/70 text-white text-2xl font-bold transition-colors duration-200 hover:bg-blue-500/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-slate-500/50 disabled:cursor-not-allowed">
                  {showInputOptions ? '−' : '+'}
              </motion.button>
              <AnimatePresence>
                  {showInputOptions && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-lg shadow-lg p-3 space-y-2 z-20">
                      <Button onClick={handleUploadClick} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">📁</span> Upload your files</Button>
                      {/* --- UPDATED BUTTONS --- */}
                      <Button onClick={() => handleOpenUrlModal('Google Drive')} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">☁️</span> Add from your drive</Button>
                      <Button onClick={() => handleOpenUrlModal('GitHub')} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">🗃️</span> Import your code (GitHub link)</Button>
                  </motion.div>
                  )}
              </AnimatePresence>
            </div>
            <input type="text" value={input} onChange={handleInputChange} placeholder={getPlaceholderText()} disabled={isDisabled} className="flex-1 p-3 rounded-full bg-slate-700/50 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-white/50 outline-none transition-colors duration-200 disabled:bg-slate-600/50" />
            <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={isDisabled || !input} className="primary-button px-5 py-2.5 text-sm disabled:bg-blue-800/60 disabled:cursor-not-allowed">Send</motion.button>
            </form>
        </div>
      </div>
    </motion.div>
  );
}