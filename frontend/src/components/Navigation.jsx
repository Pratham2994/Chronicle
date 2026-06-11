import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('telemetry');
  const [showRecalibrateModal, setShowRecalibrateModal] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);

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

  const handleRecalibrate = async () => {
    setIsRecalibrating(true);
    try {
      const res = await fetch('http://localhost:8000/api/recalibrate', {
        method: 'POST'
      });
      if (res.ok) {
        // Hard refresh the application to trigger global lock and fetch new data
        window.location.reload();
      } else {
        console.error("Recalibration failed");
        setIsRecalibrating(false);
      }
    } catch (e) {
      console.error(e);
      setIsRecalibrating(false);
    }
  };

  const navItems = [
    { id: 'telemetry', label: '[01] TELEMETRY CORE', target: 'telemetry-section' },
    { id: 'eras', label: '[02] CHRONOLOGICAL JOURNEY', target: 'eras-section' },
    { id: 'spatial', label: '[03] SPATIAL ANALYTICS', target: 'geo-section' }
  ];

  return (
    <>
      <div className="fixed top-1/2 right-6 -translate-y-1/2 z-40 flex flex-col gap-4 items-end pointer-events-none hidden lg:flex">
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

        <div className="w-full h-[1px] bg-white/10 my-4 pointer-events-none"></div>

        <button
          onClick={() => setShowRecalibrateModal(true)}
          className="font-mono text-[9px] text-highlight-yellow/60 hover:text-highlight-yellow transition-colors pointer-events-auto flex items-center gap-2 uppercase tracking-[0.2em]"
        >
          [ Recalibrate Engine ]
        </button>
      </div>

      {/* Recalibration Warning Modal */}
      <AnimatePresence>
        {showRecalibrateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !isRecalibrating && setShowRecalibrateModal(false)}
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="relative w-full max-w-lg glass-panel border border-highlight-yellow/30 p-8 shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-highlight-yellow"></div>
              
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
                <span className="text-highlight-yellow text-4xl">⚠</span> Terminal Warning
              </h2>
              
              <p className="text-white/60 font-mono text-sm leading-relaxed mb-6">
                You are about to initiate a complete engine recalibration. This action will obliterate the current compiled `.duckdb` database.
              </p>
              
              <div className="bg-black/50 border border-white/5 p-4 rounded mb-8 font-mono text-xs text-white/80 leading-relaxed">
                <span className="text-highlight-cyan font-bold">Execution Path:</span><br/>
                1. DROP ALL SCHEMAS.<br/>
                2. SCAN <span className="text-white">/data/</span> DIRECTORY.<br/>
                3. RE-INGEST ALL <span className="text-electric-amethyst">Streaming_History_Audio_*.json</span> FILES.<br/>
                4. CALCULATE NEW BEHAVIORAL MODELS.
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowRecalibrateModal(false)}
                  disabled={isRecalibrating}
                  className="px-6 py-2 font-mono text-xs text-white/50 hover:text-white uppercase tracking-widest disabled:opacity-30"
                >
                  Abort
                </button>
                <button 
                  onClick={handleRecalibrate}
                  disabled={isRecalibrating}
                  className="px-6 py-2 bg-highlight-yellow/10 border border-highlight-yellow text-highlight-yellow font-mono text-xs uppercase tracking-widest hover:bg-highlight-yellow hover:text-black transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-50"
                >
                  {isRecalibrating ? 'Recalibrating...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Massive Full Screen Recalibration Lock */}
      <AnimatePresence>
        {isRecalibrating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center pointer-events-auto"
          >
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
               className="w-32 h-32 border-2 border-dashed border-highlight-yellow/50 rounded-full flex items-center justify-center mb-8 relative"
            >
              <div className="w-24 h-24 border border-highlight-cyan rounded-full animate-pulse absolute"></div>
            </motion.div>
            <div className="font-mono text-highlight-yellow text-sm tracking-[0.5em] uppercase mb-2">
              Dropping Schemas
            </div>
            <div className="font-mono text-highlight-cyan text-2xl tracking-[0.2em] uppercase font-bold animate-pulse">
              Recompiling Telemetry
            </div>
            <div className="text-white/30 font-mono text-xs mt-6 tracking-widest uppercase">
              Please do not close window
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
