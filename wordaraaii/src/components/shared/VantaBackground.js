'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Vanta.js FOG configuration with a blue color scheme
const FOG_CONFIG = {
  highlightColor: 0x3b82f6, // Tailwind's blue-500
  midtoneColor: 0x1e40af,   // Tailwind's blue-800
  lowlightColor: 0x1e3a8a,  // Tailwind's blue-900
  baseColor: 0x000000,      // Black
  blurFactor: 0.6,
  speed: 0.8,
  zoom: 0.8,
};

const VantaBackground = () => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const initializeVanta = useCallback(async () => {
    if (isLoading || vantaEffect || !vantaRef.current) return;
    
    setIsLoading(true);
    
    try {
      // Load Three.js if not already loaded
      if (!window.THREE) {
        const threeScript = document.createElement('script');
        threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
        document.head.appendChild(threeScript);
        
        await new Promise((resolve, reject) => {
          threeScript.onload = resolve;
          threeScript.onerror = reject;
          setTimeout(reject, 10000); // 10s timeout
        });
      }

      // Load Vanta.js if not already loaded
      if (!window.VANTA) {
        const vantaScript = document.createElement('script');
        vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.fog.min.js';
        document.head.appendChild(vantaScript);
        
        await new Promise((resolve, reject) => {
          vantaScript.onload = resolve;
          vantaScript.onerror = reject;
          setTimeout(reject, 10000); // 10s timeout
        });
      }

      // Initialize Vanta effect
      if (window.VANTA && window.THREE && vantaRef.current && !vantaEffect) {
        const effect = window.VANTA.FOG({
          el: vantaRef.current,
          THREE: window.THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          ...FOG_CONFIG,
        });
        setVantaEffect(effect);
      }
    } catch (error) {
      console.warn('Failed to load Vanta.js:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vantaEffect, isLoading]);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined' && !vantaEffect && !isLoading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(initializeVanta, 100);
      return () => clearTimeout(timer);
    }
  }, [isMounted, vantaEffect, isLoading, initializeVanta]);

  useEffect(() => {
    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
        setVantaEffect(null);
      }
    };
  }, [vantaEffect]);

  // Don't render anything on server side
  if (!isMounted) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-gray-900 to-black" style={{ zIndex: -1 }} />
    );
  }

  return (
    <>
      <div ref={vantaRef} className="fixed inset-0 w-full h-full" style={{ zIndex: -2 }} />
      <div className="fixed inset-0 w-full h-full bg-black/60" style={{ zIndex: -1 }} />
    </>
  );
};

export default VantaBackground;
