// src/pages/index.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import VantaBackground from '@/components/shared/VantaBackground';
import Chatbot from '@/components/chatbot/Chatbot';

// A simple Icon component for the UI
const Icon = ({ path }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Dummy history data for the sidebar UI
  const chatHistory = [
    { id: 1, title: 'Brainstorming session for Q3...' },
    { id: 2, title: 'Drafting a marketing email' },
    { id: 3, title: 'Code debugging help' },
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative flex w-full h-screen overflow-hidden bg-gray-900/50">
      <div className="absolute inset-0 -z-10">
        <VantaBackground />
      </div>

      {/* --- Left Sidebar --- */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900/40 border-r border-white/10 p-4">
        <div className="flex-shrink-0">
          <button className="w-full primary-button flex items-center justify-center gap-2 text-sm !py-2.5">
            <Icon path="M12 4v16m8-8H4" />
            New Chat
          </button>
        </div>

        <div className="relative my-4 flex-shrink-0">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 rounded-md bg-slate-800/60 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-white/50 outline-none transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
            <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-themed pr-1">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">History</h3>
          <ul className="space-y-1">
            {chatHistory.map((chat) => (
              <li key={chat.id}>
                <a href="#" className="flex items-center gap-2 p-2 rounded-md text-sm text-white/80 hover:bg-slate-800/70 transition-colors truncate">
                  <Icon path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  <span className="truncate">{chat.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-shrink-0 w-full max-w-3xl mx-auto pt-6 px-4">
          {/* Generate Document Button (remains at the top of the main content) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm mx-auto mb-6"
          >
            <Link href="/document-generator" passHref>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0px 0px 12px rgba(59, 130, 246, 0.7)' }}
                whileTap={{ scale: 0.95 }}
                className="primary-button w-full text-lg font-semibold py-3 px-6 shadow-lg flex items-center justify-center gap-3"
              >
                <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                Generate New Document
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Chatbot container that fills remaining space */}
        <div className="flex-1 min-h-0 w-full max-w-3xl mx-auto px-4 pb-4">
          <Chatbot user={user} />
        </div>
      </main>
    </div>
  );
}