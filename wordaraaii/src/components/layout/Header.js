'use client';
import React from 'react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="text-xl font-bold mother-of-pearl-text">Wordara</div>
        <div>
          {/* Add navigation or user profile button here */}
        </div>
      </div>
    </header>
  );
}
