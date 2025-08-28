// src/components/chatbot/Chatbot.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button'; // Critical Import

export default function Chatbot({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showInputOptions, setShowInputOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const optionsContainerRef = useRef(null);

  // Scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close options menu when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (optionsContainerRef.current && !optionsContainerRef.current.contains(event.target)) {
        setShowInputOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [optionsContainerRef]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const newUserMessage = { id: Date.now(), text: input, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setInput('');
      setShowInputOptions(false); // Close menu on send

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          text: `You said: "${input}". This is a placeholder response.`,
          sender: 'ai',
        };
        setMessages((prevMessages) => [...prevMessages, aiResponse]);
      }, 1000);
    }
  };

  const handleOptionClick = (option) => {
    const aiResponse = {
      id: Date.now(),
      text: `You selected "${option}". This feature is a placeholder.`,
      sender: 'ai',
    };
    setMessages((prev) => [...prev, aiResponse]);
    setShowInputOptions(false); // Close menu after selection
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card flex flex-col h-[85vh] max-h-[800px] w-full max-w-3xl mx-auto p-4 md:p-6"
    >
      <h2 className="text-3xl font-bold mother-of-pearl-text mb-4 pb-2 border-b border-white/10 text-center">
        Your AI Assistant
      </h2>

      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto scrollbar-themed pr-2">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-white/60 text-lg text-center p-4"
            >
              <p>Start a conversation or use the '+' to add content.</p>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-xl shadow-md ${msg.sender === 'user' ? 'bg-blue-600/70 text-white rounded-br-none' : 'bg-slate-700/70 text-white rounded-bl-none'}`}
                >
                  <p className="text-sm md:text-base">{msg.text}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <form onSubmit={handleSendMessage} className="relative mt-4 pt-4 border-t border-white/10 flex gap-3 items-center">
        <div ref={optionsContainerRef} className="relative">
          {/* THE PLUS BUTTON */}
          <motion.button
            type="button"
            onClick={() => setShowInputOptions(!showInputOptions)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700/50 border border-slate-600 text-white text-3xl transition-all duration-300 hover:bg-slate-600/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <motion.span animate={{ rotate: showInputOptions ? 45 : 0 }} className="leading-none -mt-1">+</motion.span>
          </motion.button>

          {/* THE ATTACHMENT MENU */}
          <AnimatePresence>
            {showInputOptions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-full left-0 mb-3 w-64 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg p-3 space-y-2 z-20"
              >
                <Button
                  onClick={() => handleOptionClick('Upload your files')}
                  className="w-full text-left justify-start !h-auto py-2 px-3 text-sm"
                >
                  <span className="mr-3 text-lg">📁</span> Upload your files
                </Button>
                <Button
                  onClick={() => handleOptionClick('Add from your drive')}
                  className="w-full text-left justify-start !h-auto py-2 px-3 text-sm"
                >
                  <span className="mr-3 text-lg">☁️</span> Add from your drive
                </Button>
                <Button
                  onClick={() => handleOptionClick('Import your code (GitHub)')}
                  className="w-full text-left justify-start !h-auto py-2 px-3 text-sm"
                >
                  <span className="mr-3 text-lg">🔗</span> Import your code (GitHub)
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 h-12 p-3 rounded-full bg-slate-700/50 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-white/50 outline-none transition-colors duration-200"
        />
        <Button type="submit" className="px-5 text-sm">
          Send
        </Button>
      </form>
    </motion.div>
  );
}