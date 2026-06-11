import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function Dashboard({ onLoaded }) {
  const [coreStats, setCoreStats] = useState(null);
  const [behavioralStats, setBehavioralStats] = useState(null);
  const [genreStats, setGenreStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSkipperInfo, setShowSkipperInfo] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coreRes, behaviorRes, genreRes] = await Promise.all([
          fetch('http://localhost:8000/api/core_stats'),
          fetch('http://localhost:8000/api/behavioral_stats'),
          fetch('http://localhost:8000/api/genre_stats')
        ]);
        const core = await coreRes.json();
        const behavior = await behaviorRes.json();
        const genres = await genreRes.json();
        setCoreStats(core);
        setBehavioralStats(behavior);
        setGenreStats(genres);
        if (onLoaded) onLoaded();
      } catch (e) {
        console.error("Failed to fetch telemetry:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-12 font-mono flex flex-col gap-8 items-center justify-center bg-noise">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-electric-amethyst tracking-[0.5em] text-sm font-bold"
        >
          CONNECTING TO TELEMETRY STREAM
        </motion.div>
        <div className="w-64 h-[1px] bg-carbon-muted overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-electric-ultraviolet"
            animate={{ width: ["0%", "100%", "0%"], x: ["0%", "0%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  if (!coreStats || !behavioralStats || !genreStats) return <div className="text-white font-mono p-12 bg-black min-h-screen flex items-center justify-center">[ ERR: INSUFFICIENT TELEMETRY DATA ]</div>;

  const { coefficients, insight } = behavioralStats.skipper_psychology;

  return (
    <div className="min-h-screen bg-black text-[#E2E8F0] overflow-x-hidden bg-noise pb-24">
      
      {/* Magazine-style Header Spread */}
      <header className="px-8 md:px-16 pt-24 pb-16 relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#4D008C]/10 to-transparent pointer-events-none"></div>
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto relative z-10">
          <motion.p variants={itemVariants} className="font-mono text-electric-amethyst tracking-[0.3em] text-sm mb-4 uppercase">
            Listener Behavioral Profile
          </motion.p>
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none mb-12">
            Chronicle <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-amethyst to-highlight-cyan">Telemetry</span>
          </motion.h1>
          
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-8 font-mono border-t border-white/10 pt-8 mt-8">
            <div>
              <div className="text-white/40 text-xs mb-2 tracking-widest">LIFETIME PLAYTIME</div>
              <div className="text-3xl text-white">{coreStats.total_hours.toLocaleString()} <span className="text-sm text-white/50">HRS</span></div>
              <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wide">Total raw audio processed</p>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-2 tracking-widest">LIFETIME DAYS</div>
              <div className="text-3xl text-white">{coreStats.total_days.toLocaleString()} <span className="text-sm text-white/50">DAYS</span></div>
              <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wide">Consecutive 24/7 playback</p>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-2 tracking-widest">VAMPIRE/SUN RATIO</div>
              <div className="text-3xl text-electric-amethyst">{behavioralStats.vampire_vs_sunlight.ratio}x</div>
              <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wide">Night (11pm-5am) vs Day listening</p>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-2 tracking-widest">LOYALTY INDEX</div>
              <div className="text-3xl text-highlight-cyan">{behavioralStats.loyalty_index.loyalty_percent}%</div>
              <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wide">Playtime by top 5 artists</p>
            </div>
            <div>
              <div className="text-white/40 text-xs mb-2 tracking-widest">LONGEST STREAK</div>
              <div className="text-3xl text-highlight-yellow">{coreStats.longest_streak || 0}</div>
              <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wide">Consecutive Days Active</p>
            </div>
          </motion.div>
        </motion.div>
      </header>

      <motion.main 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="max-w-7xl mx-auto px-8 md:px-16 space-y-24"
      >
        
        {/* The Skipper Profile */}
        <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Skip Prediction Engine</h2>
            <p className="text-white/60 leading-relaxed">
              We trained a machine learning model on your raw listening history to understand exactly what triggers you to abandon a track.
            </p>
            <div className="p-4 border-l-2 border-highlight-yellow bg-highlight-yellow/5 text-highlight-yellow font-mono text-sm leading-relaxed">
              {insight}
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={() => setShowSkipperInfo(!showSkipperInfo)}
                className="text-xs font-mono uppercase tracking-widest text-electric-amethyst hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                {showSkipperInfo ? "[-] Hide Calculation details" : "[+] How is this calculated?"}
              </button>
              <AnimatePresence>
                {showSkipperInfo && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-white/40 text-xs mt-4 leading-relaxed font-mono">
                      This is an all-time analysis, not based on the current time right now. The model looks at your entire listening history to find statistical correlations. 
                      <br/><br/>
                      For example, if 'hour_of_day' is positive, it means that historically, the later it gets in the day, the more likely you are to skip a track. If 'shuffle_True' is positive, it means historically, when shuffle was on, your skip rate went up. 
                      <br/><br/>
                      It is a reflection of your overall lifetime habits, not a live real-time prediction.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="md:col-span-7 glass-panel p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-electric-amethyst/10 blur-[50px] rounded-full group-hover:bg-electric-amethyst/20 transition-colors"></div>
            <h3 className="font-mono text-white/40 text-xs tracking-[0.2em] mb-8 border-b border-white/5 pb-4">LIFETIME MODEL COEFFICIENTS</h3>
            <div className="space-y-6 relative z-10">
              {Object.entries(coefficients).map(([key, value]) => {
                const isPositive = value > 0;
                const widthPercentage = Math.min(Math.abs(value) * 50, 100); 
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white uppercase">{key.replace('_', ' ')}</span>
                      <span className={isPositive ? "text-highlight-yellow" : "text-highlight-cyan"}>
                        {value > 0 ? '+' : ''}{value.toFixed(4)}
                      </span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden flex items-center">
                      <div className="w-1/2 h-full flex justify-end pr-1 border-r border-white/10">
                        {!isPositive && <div className="h-full bg-highlight-cyan rounded-l-full" style={{ width: widthPercentage + '%' }}></div>}
                      </div>
                      <div className="w-1/2 h-full flex justify-start pl-1">
                         {isPositive && <div className="h-full bg-highlight-yellow rounded-r-full" style={{ width: widthPercentage + '%' }}></div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex justify-between text-[10px] font-mono text-white/30 uppercase tracking-widest">
              <span>← Less Likely to Skip</span>
              <span>More Likely to Skip →</span>
            </div>
          </div>
        </motion.section>

        {/* The Expanded Metrics Grid */}
        <motion.section variants={itemVariants} className="space-y-12 border-t border-white/10 pt-16">
          <div className="max-w-2xl">
             <h2 className="text-3xl font-bold tracking-tight mb-4">Deep Behavioral Stats</h2>
             <p className="text-white/60 leading-relaxed">
               Advanced pattern recognition applied to your listening metadata. We look for loop fixations, forgotten tracks, and extreme binge consumption curves.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* The Short Attention Span */}
            <div className="glass-panel p-6">
              <h3 className="font-mono text-electric-amethyst text-xs tracking-widest mb-2">01 // THE TIKTOK EFFECT</h3>
              <p className="text-white/40 text-[10px] uppercase mb-6 font-mono leading-relaxed">Percentage of skipped tracks that were skipped in under 30 seconds.</p>
              <div className="text-5xl font-black tracking-tighter text-white mb-2">{behavioralStats.short_attention.ratio_percent}%</div>
              <div className="text-white/50 text-xs font-mono">{behavioralStats.short_attention.instant_skips.toLocaleString()} instant skips total</div>
            </div>

            {/* Weekend Warrior */}
            <div className="glass-panel p-6">
              <h3 className="font-mono text-electric-amethyst text-xs tracking-widest mb-2">02 // TEMPORAL SPLIT</h3>
              <p className="text-white/40 text-[10px] uppercase mb-6 font-mono leading-relaxed">Weekend vs Weekday listening volume.</p>
              <div className="flex gap-4 items-end mb-2">
                <div className="text-3xl font-black tracking-tighter text-white">{behavioralStats.temporal_splits.weekday_plays.toLocaleString()}</div>
                <div className="text-white/40 text-xs font-mono mb-1 uppercase">Weekday Plays</div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="text-3xl font-black tracking-tighter text-highlight-cyan">{behavioralStats.temporal_splits.weekend_plays.toLocaleString()}</div>
                <div className="text-white/40 text-xs font-mono mb-1 uppercase">Weekend Plays</div>
              </div>
            </div>

            {/* Private Sessions */}
            <div className="glass-panel p-6">
              <h3 className="font-mono text-electric-amethyst text-xs tracking-widest mb-2">03 // INCOGNITO MODE</h3>
              <p className="text-white/40 text-[10px] uppercase mb-6 font-mono leading-relaxed">Number of times you actively enabled private listening sessions to hide your tracks.</p>
              <div className="text-5xl font-black tracking-tighter text-highlight-yellow mb-2">{behavioralStats.incognito_sessions.toLocaleString()}</div>
              <div className="text-white/50 text-xs font-mono">Guilty pleasure sessions</div>
            </div>

            {/* Time Preferences */}
            <div className="glass-panel p-6 group md:col-span-2 lg:col-span-1 border-t border-t-highlight-yellow">
              <h3 className="font-mono text-highlight-yellow text-xs tracking-widest mb-2">04 // CHRONO HABITS</h3>
              <p className="text-white/40 text-[10px] uppercase mb-6 font-mono leading-relaxed">Your absolute peak historical listening hour and day of the week.</p>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-3xl font-black tracking-tighter text-white">{behavioralStats.time_preferences.top_hour}</div>
                  <div className="text-white/50 text-[10px] font-mono uppercase tracking-widest">Peak Listening Hour</div>
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tighter text-highlight-cyan">{behavioralStats.time_preferences.top_day}</div>
                  <div className="text-white/50 text-[10px] font-mono uppercase tracking-widest">Peak Listening Day</div>
                </div>
              </div>
            </div>

            {/* Loop Obsession */}
            <div className="glass-panel p-8 group md:col-span-2 lg:col-span-2">
              <h3 className="font-mono text-white text-lg tracking-widest mb-2">Loop Obsession</h3>
              <p className="text-white/40 text-xs font-mono mb-6">Instances where playback explicitly ended naturally, but you immediately restarted the exact same track.</p>
              <div className="space-y-4">
                {behavioralStats.loop_obsession.slice(0, 4).map((t, idx) => (
                   <div key={idx} className="flex items-center gap-4">
                     <div className="font-mono text-sm truncate w-1/3 text-white/80">{t.name}</div>
                     <div className="flex-1 h-3 bg-black flex rounded-sm overflow-hidden border border-white/5">
                        {Array.from({length: Math.min(t.loop_count, 30)}).map((_, i) => (
                          <div key={i} className="flex-1 border-r border-black/50 bg-gradient-to-r from-electric-ultraviolet to-electric-amethyst opacity-80"></div>
                        ))}
                     </div>
                     <div className="font-mono text-sm text-electric-amethyst w-8 text-right font-bold">{t.loop_count}</div>
                   </div>
                ))}
              </div>
            </div>

            {/* Ghost Tracks */}
            <div className="glass-panel p-8 border-l-2 border-l-white/20 hover:border-l-white transition-colors md:col-span-2">
              <h3 className="font-mono text-white text-lg tracking-widest mb-2">The Ghost Tracks</h3>
              <p className="text-white/40 text-xs font-mono mb-6">Songs you fixated on heavily in the past (over 50 plays), but haven't played a single time in the last 2 years.</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {behavioralStats.ghost_tracks.slice(0, 6).map((t, idx) => (
                   <li key={idx} className="flex justify-between items-center group/item pb-3 border-b border-white/5 last:border-0">
                     <div className="truncate pr-4">
                       <div className="text-sm font-medium text-white/90 group-hover/item:text-white transition-colors truncate">{t.name}</div>
                       <div className="text-xs text-white/40 font-mono truncate">{t.artist}</div>
                     </div>
                     <div className="text-right whitespace-nowrap">
                       <span className="text-xs font-mono text-white/30 line-through mr-2">{t.total_plays}</span>
                       <span className="text-xs font-mono text-highlight-yellow">DEAD</span>
                     </div>
                   </li>
                ))}
              </ul>
            </div>

            {/* One Hit Fixations */}
            <div className="glass-panel p-8 md:col-span-2 lg:col-span-3">
              <h3 className="font-mono text-white text-lg tracking-widest mb-2">One-Hit Fixations</h3>
              <p className="text-white/40 text-xs font-mono mb-6">Artists where you have only ever listened to exactly ONE track from them, but you abused the replay button heavily.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {behavioralStats.one_hit_fixations.map((item, idx) => (
                  <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded">
                    <div className="text-highlight-cyan font-mono text-2xl font-bold mb-2">{item.total_plays} plays</div>
                    <div className="text-white font-medium truncate">{item.track}</div>
                    <div className="text-white/40 text-xs font-mono mt-1">by {item.artist}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Binge Listen Curve */}
            <div className="md:col-span-2 lg:col-span-3 glass-panel p-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div className="max-w-md">
                   <h3 className="font-mono text-white text-xl tracking-widest mb-3">Hyper-Fixation Binge Curve</h3>
                   <p className="text-white/50 text-sm leading-relaxed mb-6">
                     The highest recorded volume of plays for a single track within a concentrated 24-hour window. This represents the absolute peak of your musical obsession.
                   </p>
                   <div className="inline-block border border-highlight-cyan/30 bg-highlight-cyan/10 text-highlight-cyan px-4 py-2 font-mono text-xs uppercase rounded">
                     Peak recorded on: {behavioralStats.binge_listen.date}
                   </div>
                 </div>
                 
                 <div className="text-right">
                   <div className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/20 mb-2">
                     {behavioralStats.binge_listen.max_plays_in_24h} <span className="text-xl md:text-3xl text-white/30">PLAYS</span>
                   </div>
                   <div className="text-xl font-mono text-highlight-cyan break-words max-w-sm ml-auto">
                     {behavioralStats.binge_listen.name}
                   </div>
                 </div>
               </div>
            </div>

          </div>
        </motion.section>

        {/* The Baseline Metrics: Power Rankings */}
        <motion.section variants={itemVariants} className="space-y-12 border-t border-white/10 pt-16">
          <div className="max-w-2xl">
             <h2 className="text-3xl font-bold tracking-tight mb-4">The Baseline Core</h2>
             <p className="text-white/60 leading-relaxed">
               Your fundamental sonic identity. These are the pillars of your listening history, stripped of all algorithms.
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6">
              <h3 className="font-mono text-electric-amethyst text-xs tracking-widest mb-6">01 // TOP ARTISTS</h3>
              <div className="max-h-[500px] overflow-y-auto pr-4">
                <table className="telemetry-table">
                  <tbody>
                    {coreStats.top_artists.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="text-white/30 w-8 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="text-white font-medium truncate max-w-[120px]">{item.name}</td>
                        <td className="text-right text-white/50 font-mono text-xs group-hover:text-electric-amethyst transition-colors">{item.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="font-mono text-electric-amethyst text-xs tracking-widest mb-6">02 // TOP TRACKS</h3>
              <div className="max-h-[500px] overflow-y-auto pr-4">
                <table className="telemetry-table">
                  <tbody>
                    {coreStats.top_tracks.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="text-white/30 w-8 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="text-white font-medium truncate max-w-[120px]">{item.name}</td>
                        <td className="text-right text-white/50 font-mono text-xs group-hover:text-electric-amethyst transition-colors">{item.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-panel p-6 border-t-2 border-t-highlight-cyan">
              <h3 className="font-mono text-highlight-cyan text-xs tracking-widest mb-2">03 // OFFLINE SURVIVAL POD</h3>
              <p className="text-white/40 text-[10px] uppercase mb-6 font-mono leading-relaxed">Tracks hard-cached to your device, played when entirely disconnected from the grid.</p>
              <div className="max-h-[440px] overflow-y-auto pr-4">
                <table className="telemetry-table">
                  <tbody>
                    {coreStats.offline_survival_tracks.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="text-white/30 w-8 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="text-white font-medium truncate max-w-[120px]">{item.name}</td>
                        <td className="text-right text-highlight-cyan/70 font-mono text-xs group-hover:text-highlight-cyan transition-colors">{item.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Core Genre Breakdown */}
          <div className="glass-panel p-8 mt-8 border-t-2 border-t-highlight-yellow">
             <h3 className="font-mono text-highlight-yellow text-xs tracking-widest mb-2">04 // GENRE ARCHITECTURE</h3>
             <p className="text-white/40 text-[10px] uppercase mb-8 font-mono leading-relaxed">Aggregated sonic taxonomy based on your top 150 historically most played artists via Spotify API.</p>
             
             <div className="space-y-4">
               {genreStats.top_genres.map((item, idx) => {
                 const maxHours = genreStats.top_genres[0].hours;
                 const widthPct = Math.max(5, (item.hours / maxHours) * 100);
                 return (
                   <div key={idx} className="flex flex-col gap-2 group">
                     <div className="flex items-center gap-4">
                       <div className="w-1/4 font-mono text-xs uppercase text-white/80 group-hover:text-white truncate pr-4 text-right">
                         {item.genre}
                       </div>
                       <div className="flex-1 h-3 bg-black/50 rounded-sm overflow-hidden flex items-center">
                         <div 
                           className="h-full bg-gradient-to-r from-highlight-yellow/50 to-highlight-yellow" 
                           style={{ width: widthPct + '%' }}
                         ></div>
                       </div>
                       <div className="w-20 font-mono text-xs text-highlight-yellow font-bold text-left">
                         {item.hours} <span className="text-white/30 font-normal">HRS</span>
                       </div>
                     </div>
                     <div className="w-full flex justify-end">
                       <div className="w-3/4 font-mono text-[9px] text-white/30 uppercase tracking-widest pl-4">
                         {item.artists && item.artists.length > 0 ? `e.g. ${item.artists.join(', ')}` : ''}
                       </div>
                     </div>
                   </div>
                 )
               })}
             </div>
             
             {/* Sub-genre stats cross-referenced with time and Culture */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/5">
                <div>
                  <h4 className="font-mono text-electric-amethyst text-[10px] tracking-widest uppercase mb-4">Vampire Soundscapes</h4>
                  <p className="text-[9px] text-white/30 mb-4 font-mono">Top genres played 11PM - 5AM</p>
                  <ul className="space-y-2">
                    {genreStats.vampire_genres.map((g, idx) => (
                      <li key={idx} className="flex justify-between font-mono text-xs">
                        <span className="text-white/80">{g.genre}</span>
                        <span className="text-electric-amethyst">{g.hours}h</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-mono text-highlight-cyan text-[10px] tracking-widest uppercase mb-4">Sunlight Soundscapes</h4>
                  <p className="text-[9px] text-white/30 mb-4 font-mono">Top genres played 9AM - 5PM</p>
                  <ul className="space-y-2">
                    {genreStats.sunlight_genres.map((g, idx) => (
                      <li key={idx} className="flex justify-between font-mono text-xs">
                        <span className="text-white/80">{g.genre}</span>
                        <span className="text-highlight-cyan">{g.hours}h</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-mono text-highlight-yellow text-[10px] tracking-widest uppercase mb-4">Cultural Footprint</h4>
                  <p className="text-[9px] text-white/30 mb-4 font-mono">Global Western vs Regional/World splits</p>
                  <ul className="space-y-2">
                    {genreStats.cultural_split.map((c, idx) => {
                      const totalMs = genreStats.cultural_split.reduce((acc, curr) => acc + curr.ms_played, 0);
                      const pct = Math.round((c.ms_played / totalMs) * 100) || 0;
                      return (
                        <li key={idx} className="flex flex-col gap-1 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-white/80">{c.cultural_category}</span>
                            <span className="text-highlight-yellow">{pct}%</span>
                          </div>
                          <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                            <div className="h-full bg-highlight-yellow/50" style={{ width: `${pct}%` }}></div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
             </div>
          </div>
        </motion.section>

      </motion.main>
    </div>
  );
}
