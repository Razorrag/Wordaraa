// src/components/chatbot/Chatbot.js

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';

export default function Chatbot({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showInputOptions, setShowInputOptions] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputOptionsRef = useRef(null);

  // ... (all other functions like scrollToBottom, useEffects, handleSendMessage, handleOptionClick remain exactly the same) ...

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      const newUserMessage = { id: Date.now(), text: input, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setInput('');
      setShowInputOptions(false);
      setIsThinking(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const aiResponse = { id: Date.now() + 1, text: data.reply, sender: 'ai' };
        setMessages((prevMessages) => [...prevMessages, aiResponse]);
      } catch (error) {
        console.error('Failed to fetch AI response:', error);
        const errorResponse = {
          id: Date.now() + 1,
          text: 'Sorry, I encountered an error. Please try again.',
          sender: 'ai',
        };
        setMessages((prevMessages) => [...prevMessages, errorResponse]);
      } finally {
        setIsThinking(false);
      }
    }
  };

  const handleOptionClick = (option) => {
    const aiResponse = {
      id: Date.now() + 1,
      text: `You selected to "${option}". This feature is currently under development!`,
      sender: 'ai',
    };
    setMessages((prevMessages) => [...prevMessages, aiResponse]);
    setShowInputOptions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      // --- MODIFICATION: Removed card styling and fixed height ---
      className="flex flex-col h-full w-full"
    >
      <h2 className="text-3xl font-bold mother-of-pearl-text mb-4 pb-2 border-b border-white/10 text-center">
        Your AI Assistant
      </h2>

      <div className="flex-1 overflow-y-auto scrollbar-themed pr-2">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-xl shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-600/70 text-white rounded-br-none'
                    : 'bg-slate-700/70 text-white rounded-bl-none'
                }`}
              >
                <div className="markdown-content">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start mb-4"
            >
              <div className="max-w-[75%] px-4 py-2 rounded-xl shadow-md bg-slate-700/70 text-white rounded-bl-none">
                <p className="text-sm md:text-base animate-pulse">Thinking...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="relative mt-4 pt-4 border-t border-white/10 flex gap-3">
        <div className="relative" ref={inputOptionsRef}>
          <motion.button type="button" onClick={() => setShowInputOptions(!showInputOptions)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isThinking} className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/70 text-white text-2xl font-bold transition-colors duration-200 hover:bg-blue-500/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-slate-500/50 disabled:cursor-not-allowed">
            {showInputOptions ? '−' : '+'}
          </motion.button>
          <AnimatePresence>
            {showInputOptions && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-lg shadow-lg p-3 space-y-2 z-20">
                <Button onClick={() => handleOptionClick('Upload your files')} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">📁</span> Upload your files</Button>
                <Button onClick={() => handleOptionClick('Add from your drive')} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">☁️</span> Add from your drive</Button>
                <Button onClick={() => handleOptionClick('Import your code')} className="w-full text-left justify-start primary-button py-2 px-3 text-sm"><span className="mr-2">🗃️</span> Import your code (GitHub link)</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isThinking ? "Waiting for response..." : "Type your message..."} disabled={isThinking} className="flex-1 p-3 rounded-full bg-slate-700/50 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-white/50 outline-none transition-colors duration-200 disabled:bg-slate-600/50" />
        <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={isThinking} className="primary-button px-5 py-2.5 text-sm disabled:bg-blue-800/60 disabled:cursor-not-allowed">Send</motion.button>
      </form>
    </motion.div>
  );
}