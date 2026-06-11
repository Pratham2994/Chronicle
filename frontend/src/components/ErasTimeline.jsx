import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SparklineChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxHours = Math.max(...data.map(d => d.hours));
  
  return (
    <div className="flex items-end gap-1 h-16 w-full mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
          {/* Tooltip */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[8px] font-mono text-white/50 whitespace-nowrap bg-black px-1 py-0.5 rounded pointer-events-none transition-opacity">
            {d.month}: {d.hours}h
          </div>
          <div 
            className="w-full bg-electric-amethyst/30 group-hover:bg-electric-amethyst transition-colors rounded-t-[1px]"
            style={{ height: `${Math.max(2, (d.hours / maxHours) * 100)}%` }}
          ></div>
        </div>
      ))}
    </div>
  );
}

function EraCard({ era, isLeft }) {
  const [expanded, setExpanded] = useState(false);

  // Sharp, precise, mechanical easing curve
  const mechanicalEase = [0.16, 1, 0.3, 1];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`relative flex flex-col md:flex-row w-full mb-32 ${isLeft ? 'md:flex-row-reverse' : ''}`}
    >
      
      {/* Center Dot */}
      <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-black border-2 border-highlight-yellow rounded-full transform -translate-x-[7px] md:-translate-x-1/2 mt-8 md:mt-10 z-10 shadow-[0_0_10px_rgba(229,255,0,0.5)]"></div>

      {/* Spacer for alternating layout */}
      <div className="hidden md:block md:w-1/2"></div>
      
      {/* Content Card */}
      <div className={`w-full pl-8 md:pl-0 md:w-1/2 ${isLeft ? 'md:pr-16 text-left md:text-right' : 'md:pl-16 text-left'}`}>
        
        <h3 className="text-3xl font-black tracking-tighter uppercase text-white mb-2">{era.era_name}</h3>
        
        {/* Defining Artists */}
        <p className="font-mono text-electric-amethyst text-xs tracking-widest uppercase mb-8">
          Defining Artists: <span className="text-white/80">{era.top_artists.join(', ')}</span>
        </p>

        <motion.div 
          layout
          transition={{ duration: 0.4, ease: mechanicalEase }}
          className="glass-panel p-6 overflow-hidden"
        >
          {/* Top Level Summary (Always visible) */}
          <div className="grid grid-cols-2 gap-6">
            <div className={`flex flex-col ${isLeft ? 'md:items-end' : 'items-start'}`}>
              <div className="text-2xl font-black tracking-tighter text-white">
                {(era.discovery_ratio * 100).toFixed(1)}%
              </div>
              <div className="text-[9px] text-white/50 font-mono uppercase tracking-widest mt-1">Exploration Rate</div>
              <p className="text-[9px] text-white/40 mt-2 font-mono text-left w-full leading-relaxed">Ratio of unique artists to total plays. A low number means familiar rotation.</p>
            </div>

            <div className={`flex flex-col ${isLeft ? 'md:items-end' : 'items-start'}`}>
              <div className="text-2xl font-black tracking-tighter text-highlight-cyan">
                {era.rut_variance}
              </div>
              <div className="text-[9px] text-white/50 font-mono uppercase tracking-widest mt-1">Habitual Rut (StdDev)</div>
              <p className="text-[9px] text-white/40 mt-2 font-mono text-left w-full leading-relaxed">High variance = chaotic listening. Low variance = highly scheduled habits.</p>
            </div>

            <div className="col-span-2 mt-2 pt-4 border-t border-white/10">
              <div className="flex justify-between font-mono text-[9px] text-white/50 mb-2 tracking-widest uppercase">
                <span>Mobile ({era.mobile_pct}%)</span>
                <span>Desktop ({era.desktop_pct}%)</span>
              </div>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden flex">
                <div className="h-full bg-highlight-yellow transition-all duration-1000" style={{ width: `${era.mobile_pct}%` }}></div>
                <div className="h-full bg-white/20 transition-all duration-1000" style={{ width: `${era.desktop_pct}%` }}></div>
              </div>
            </div>
          </div>

          {/* Deep Dive Toggle Button */}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-6 py-3 border border-white/10 rounded font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-white hover:border-white/30 transition-colors focus:outline-none"
          >
            {expanded ? '[- Collapse Analytics]' : '[+ Expand Era Deep Dive]'}
          </button>

          {/* Deep Dive Expandable Section */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: mechanicalEase }}
                className="mt-6 pt-6 border-t border-highlight-yellow/30"
              >
                {/* Monthly Activity Sparkline */}
                <div className="mb-8">
                  <h4 className="font-mono text-highlight-yellow text-[10px] tracking-widest uppercase mb-1">Monthly Volatility</h4>
                  <p className="text-[9px] text-white/40 font-mono mb-2">Raw hours played per month inside this era</p>
                  <SparklineChart data={era.deep_dive.sparkline} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Top Tracks */}
                  <div>
                    <h4 className="font-mono text-highlight-cyan text-[10px] tracking-widest uppercase mb-4">The Era Soundtrack</h4>
                    <ul className="space-y-4">
                      {era.deep_dive.top_tracks.map((track, i) => (
                        <li key={i} className="flex justify-between items-start font-mono text-xs group">
                          <div className="flex flex-col text-left max-w-[70%]">
                            <span className="text-white/90 truncate" title={track.track}>{track.track}</span>
                            <span className="text-white/40 text-[9px] truncate">{track.artist}</span>
                            {track.is_loop_obsession && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-highlight-yellow text-black text-[7px] font-bold uppercase tracking-widest w-max rounded-sm">
                                LOOP OBSESSION
                              </span>
                            )}
                          </div>
                          <span className="text-highlight-cyan font-bold">{track.hours.toFixed(1)}h</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column: Discovery & Genres */}
                  <div className="flex flex-col gap-8">
                    {/* Top Discovery */}
                    {era.deep_dive.top_discovery && (
                      <div>
                        <h4 className="font-mono text-highlight-yellow text-[10px] tracking-widest uppercase mb-2">The Top Discovery</h4>
                        <p className="text-[9px] text-white/40 font-mono mb-3 leading-relaxed">
                          The most played artist in this era that you had NEVER listened to before.
                        </p>
                        <div className="bg-black/30 border border-white/5 p-4 rounded-md">
                          <div className="text-xl font-black text-white truncate">{era.deep_dive.top_discovery.artist}</div>
                          <div className="font-mono text-xs text-highlight-yellow mt-1">{era.deep_dive.top_discovery.hours.toFixed(1)} HRS</div>
                        </div>
                      </div>
                    )}

                    {/* Top Genres */}
                    {era.deep_dive.top_genres && era.deep_dive.top_genres.length > 0 && (
                      <div>
                        <h4 className="font-mono text-electric-amethyst text-[10px] tracking-widest uppercase mb-4">Era-Specific Genres</h4>
                        <ul className="space-y-2">
                          {era.deep_dive.top_genres.map((g, i) => (
                            <li key={i} className="flex justify-between font-mono text-xs">
                              <span className="text-white/70">{g.genre}</span>
                              <span className="text-electric-amethyst">{g.hours.toFixed(1)}h</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </motion.div>
  );
}

export default function ErasTimeline() {
  const [erasData, setErasData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEras() {
      try {
        const res = await fetch('http://localhost:8000/api/eras');
        const data = await res.json();
        setErasData(data);
      } catch (e) {
        console.error("Failed to fetch eras:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchEras();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-highlight-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!erasData || erasData.length === 0) return null;

  return (
    <section className="relative w-full max-w-6xl mx-auto px-6 py-24 z-10">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-24"
      >
        <p className="font-mono text-highlight-cyan text-xs tracking-[0.2em] uppercase mb-4">
          Phase 02 // Chronological Journey
        </p>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-6">
          Eras & <span className="text-transparent bg-clip-text bg-gradient-to-r from-highlight-yellow to-highlight-cyan">Evolution</span>
        </h2>
        <p className="text-white/40 font-mono text-sm max-w-2xl leading-relaxed">
          Your life sliced into distinct academic and cultural chapters. Each era reveals its own sonic taxonomy.
          <br/><br/>
          <span className="text-highlight-yellow/50 text-[10px] uppercase tracking-widest">* Note: Chronological boundaries are calibrated approximately for a 2004 birth year.</span>
        </p>
      </motion.div>

      {/* Vertical Timeline */}
      <div className="relative">
        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent transform md:-translate-x-1/2"></div>
        
        {erasData.map((era, idx) => (
          <EraCard key={idx} era={era} isLeft={idx % 2 === 0} />
        ))}
      </div>
    </section>
  );
}
