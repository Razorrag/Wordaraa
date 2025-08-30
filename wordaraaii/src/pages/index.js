import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Import Link for navigation
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion'; // Import motion for animations
import VantaBackground from '@/components/shared/VantaBackground';
import Chatbot from '@/components/chatbot/Chatbot';

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Dynamic background */}
      <div className="absolute inset-0 -z-10">
        <VantaBackground />
      </div>

      {/* New container to stack the button and chatbot vertically */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-3xl gap-6">
        
        {/* Generate Document Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link href="/document-generator" passHref>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0px 0px 12px rgba(59, 130, 246, 0.7)' }}
              whileTap={{ scale: 0.95 }}
              className="primary-button w-full text-lg font-semibold py-3 px-6 shadow-lg flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate New Document
            </motion.button>
          </Link>
        </motion.div>
        
        {/* Chatbot Component (unchanged) */}
        <Chatbot user={user} />

      </div>
    </div>
  );
}