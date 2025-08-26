'use client';

import { useState, useEffect } from 'react';

export default function Footer() {
  const [year, setYear] = useState(2024);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-black/20 border-t border-white/10 p-4 text-center text-sm text-white/60 relative z-10">
      <p>© {year} Wordara. All rights reserved.</p>
    </footer>
  );
}
