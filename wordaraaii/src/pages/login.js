import AuthForm from "@/components/auth/AuthForm";
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';
import VantaBackground from '@/components/shared/VantaBackground';
import { useRef, useState } from 'react';

export default function LoginPage() {
  const [view, setView] = useState('signIn'); // 'signIn' | 'signUp' | 'forgotPassword'
  const containerRef = useRef(null);

  // Subtle 3D tilt (Nether-like)
  const x = useMotionValue(200);
  const y = useMotionValue(200);
  const rotateX = useTransform(y, [0, 600], [5, -5]);
  const rotateY = useTransform(x, [0, 600], [-5, 5]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <VantaBackground />
      </div>

      {/* Content container: stacked on mobile, side-by-side on desktop */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative z-10 flex flex-col md:flex-row items-center w-full max-w-6xl md:gap-12"
      >
        {/* Branding - visible on all sizes (right on desktop) */}
        <div className="order-1 md:order-2 flex flex-col items-center justify-center p-6 text-center md:w-1/2">
          <div className="max-w-md">
            <div className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80 mb-6">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true"></span>
              <span>Live · Beta access</span>
            </div>

            <h1 className="helvetica-bold text-4xl md:text-6xl tracking-[0.05em] wordara-gradient text-glow mb-2">WORDARA AI</h1>
            <div className="text-white/60 text-sm mb-1">by</div>
            <div className="w-fit mx-auto -mb-8 md:-mb-12">
              <Image src="/logo.png" alt="WORDARA AI" width={300} height={300} priority className="block mx-auto md:w-[400px] md:h-[400px]" />
            </div>
            <p className="text-white/80 leading-relaxed max-w-sm mx-auto">
              The future of documents. Create, organize, and transform docs with AI—fast and beautifully.
            </p>
          </div>
        </div>

        {/* Auth Card (left on desktop) */}
        <div className="order-2 md:order-1 flex items-center justify-center w-full md:w-1/2 p-4 min-h-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`w-full max-w-md rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl flex flex-col min-h-0 overflow-hidden h-[85vh] md:h-[80vh]`}
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
              background: 'rgba(30, 41, 59, 0.4)',
              borderColor: 'rgba(51, 65, 85, 0.5)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="flex-1 min-h-0" style={{ transform: 'translateZ(20px)' }}>
              <AuthForm view={view} setView={setView} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

