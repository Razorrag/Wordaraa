import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import VantaBackground from '@/components/shared/VantaBackground';

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Dynamic background */}
      <div className="absolute inset-0 -z-10">
        <VantaBackground />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center p-8 glass-card rounded-lg shadow-lg max-w-2xl w-full"
      >
        <h1 className="text-5xl font-bold mother-of-pearl-text mb-4">
          Welcome to Wordara!
        </h1>
        <p className="text-xl text-white/80 mb-2">
          Hello, {user.user_metadata?.first_name || user.email}!
        </p>
        <p className="text-lg text-white/60 mb-8">
          Your AI-powered assistant is ready to help you.
        </p>
        <div className="border-t border-white/10 pt-6 mt-6">
          <ul className="space-y-3 text-white/80 text-base text-left max-w-xs mx-auto">
            <li className="flex items-center gap-3">
              <span className="text-lg">✨</span>
              <span>Chat with AI assistants</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg">📝</span>
              <span>Generate and edit documents</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-lg">🎯</span>
              <span>Boost your productivity</span>
            </li>
          </ul>
        </div>

        <div className="mt-10">
          <Button onClick={handleLogout} className="px-6 py-3">
            Logout
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
