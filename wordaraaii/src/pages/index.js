// src/pages/index.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import VantaBackground from '@/components/shared/VantaBackground';
import Chatbot from '@/components/Chatbot/Chatbot';

// A simple Icon component for the UI
const Icon = ({ path, className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

// Sidebar Component for better organization
const Sidebar = ({ chatHistory, onSelectChat, onNewChat }) => {
  return (
    <aside className="hidden md:flex flex-col w-72 bg-slate-900/40 border-r border-white/10 p-4 shrink-0">
      <div className="flex-shrink-0">
        <button onClick={onNewChat} className="w-full primary-button flex items-center justify-center gap-2 text-sm !py-2.5">
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
              <button onClick={() => onSelectChat(chat.id)} className="w-full flex items-center gap-2 p-2 rounded-md text-sm text-white/80 hover:bg-slate-800/70 transition-colors text-left truncate">
                <Icon path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                <span className="truncate">{chat.title || 'New Chat'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

       <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-white/50">
          <p> 2023 Wordara. All rights reserved.</p>
      </div>
    </aside>
  );
};

// User Profile Dropdown Component
const UserProfile = ({ user, onSignOut }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <div className="relative">
        <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center text-white/80 hover:bg-slate-700 transition-colors">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-12 right-0 w-56 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-lg shadow-lg z-20"
            >
              <div className="p-2">
                <p className="px-2 py-1 text-sm text-white/50">Signed in as</p>
                <p className="px-2 py-1 text-sm font-semibold text-white truncate">{user?.email}</p>
              </div>
              <div className="border-t border-slate-700/60 my-1"></div>
              <div className="p-2">
                <button onClick={onSignOut} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-red-400 hover:bg-red-500/20 transition-colors">
                  <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
export default function MainPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const router = useRouter();

  // Function to fetch chat history
  const fetchChatHistory = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('chats')
      .select('id, title')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching chat history:', error);
    } else {
      setChatHistory(data);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        fetchChatHistory(user.id); // Fetch history once user is loaded
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNewChat = () => {
    setActiveChatId(null); // Set to null to start a new chat
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-lg animate-pulse">Loading Wordara...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative flex w-full h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <VantaBackground />
      </div>

      <Sidebar 
        chatHistory={chatHistory} 
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
      />

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* --- Main Header --- */}
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-4">
                <div className="text-xl font-bold mother-of-pearl-text">Wordara</div>
            </div>
            <div className="flex items-center gap-4">
                <UserProfile user={user} onSignOut={handleSignOut} />
            </div>
        </header>

        {/* --- Chatbot takes all remaining space --- */}
        <div className="flex-1 min-h-0">
          <Chatbot 
            key={activeChatId} // Add key to re-mount component on chat change
            user={user} 
            chatId={activeChatId}
            onNewChatCreated={(newId) => {
              setActiveChatId(newId);
              fetchChatHistory(user.id); // Refresh history list
            }}
          />
        </div>
      </main>
    </div>
  );
}