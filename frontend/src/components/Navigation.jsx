import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('telemetry');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const erasEl = document.getElementById('eras-section');
      const geoEl = document.getElementById('geo-section');

      if (geoEl && scrollY >= geoEl.offsetTop - 300) {
        setActiveSection('spatial');
      } else if (erasEl && scrollY >= erasEl.offsetTop - 300) {
        setActiveSection('eras');
      } else {
        setActiveSection('telemetry');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'telemetry', label: '[01] TELEMETRY CORE', target: 'telemetry-section' },
    { id: 'eras', label: '[02] CHRONOLOGICAL JOURNEY', target: 'eras-section' },
    { id: 'spatial', label: '[03] SPATIAL ANALYTICS', target: 'geo-section' }
  ];

  return (
    <div className="fixed top-1/2 right-6 -translate-y-1/2 z-50 flex flex-col gap-4 items-end pointer-events-none hidden lg:flex">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollTo(item.target)}
          className={`font-mono text-[9px] uppercase tracking-[0.2em] transition-all duration-300 pointer-events-auto flex items-center gap-3 ${
            activeSection === item.id 
              ? 'text-highlight-cyan font-bold scale-110 origin-right' 
              : 'text-white/30 hover:text-white hover:scale-105 origin-right'
          }`}
        >
          {item.label}
          <div className={`w-1 h-1 rounded-full ${activeSection === item.id ? 'bg-highlight-cyan shadow-[0_0_8px_#00f0ff]' : 'bg-white/30'}`}></div>
        </button>
      ))}
    </div>
  );
}
