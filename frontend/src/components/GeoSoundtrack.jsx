import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';

export default function GeoSoundtrack() {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(null);
  
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    async function fetchGeo() {
      try {
        const res = await fetch('http://localhost:8000/api/geo');
        const data = await res.json();
        data.sort((a, b) => {
          if (!a.first_visit) return 1;
          if (!b.first_visit) return -1;
          return a.first_visit.localeCompare(b.first_visit);
        });
        setGeoData(data);
      } catch (e) {
        console.error("Failed to fetch geo stats:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchGeo();
  }, []);

  useEffect(() => {
    if (!geoData || geoData.length === 0 || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 800;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("width", width)
       .attr("height", height);

    const nodes = geoData.map(d => ({ ...d, radius: Math.max(15, Math.min(60, Math.sqrt(d.hours) * 3)) }));
    const links = [];
    
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({ source: nodes[i].id, target: nodes[i+1].id, value: 1 });
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(200))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => d.radius + 15).iterations(2));

    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(255, 255, 255, 0.1)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4");

    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "crosshair")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        event.stopPropagation(); // prevent SVG click from closing it immediately
        setActiveNode(d);
      });

    // Close inspector if clicking background
    svg.on("click", () => setActiveNode(null));

    // Outer aura
    nodeGroup.append("circle")
      .attr("r", d => d.radius + 8)
      .attr("fill", "rgba(0, 240, 255, 0.05)")
      .style("filter", "url(#glow)");

    // Inner core
    nodeGroup.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", "rgba(10, 10, 10, 0.95)")
      .attr("stroke", "#00f0ff")
      .attr("stroke-width", 1.5)
      .style("filter", "url(#glow)");

    // Labels
    nodeGroup.append("text")
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("fill", "#ffffff")
      .attr("font-family", "monospace")
      .attr("font-size", d => Math.max(12, d.radius / 2) + "px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      nodes.forEach(d => {
        d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
        d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
      });

      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();

  }, [geoData]);

  if (loading) return null; // Let global loading handle this.
  if (!geoData || geoData.length === 0) return null;

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 py-32 z-10 border-t border-white/5">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <p className="font-mono text-electric-amethyst text-xs tracking-[0.2em] uppercase mb-4">
          Phase 03 // Spatial Analytics
        </p>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-6">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-highlight-cyan to-electric-amethyst">Geo-Soundtrack</span>
        </h2>
        <p className="text-white/40 font-mono text-sm max-w-2xl leading-relaxed">
          An abstract D3 constellation mapping your geographical listening footprint. Click a glowing node to lock the Deep Dive Spatial Inspector.
        </p>
      </motion.div>

      {/* Interactive Map Area */}
      <div className="relative w-full rounded-xl overflow-hidden glass-panel border border-white/10 bg-gradient-to-br from-[#4D008C]/20 to-black" style={{ minHeight: '800px' }} ref={containerRef}>
        
        {/* CSS Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-screen" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        {/* D3 Canvas */}
        <svg ref={svgRef} className="w-full h-full absolute inset-0 z-0"></svg>

        {/* Click Inspector Panel */}
        <AnimatePresence>
          {activeNode && (
            <motion.div
              initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 right-0 h-full w-[400px] bg-black/80 border-l border-highlight-cyan/30 p-8 z-20 shadow-2xl backdrop-blur-xl overflow-y-auto overflow-x-hidden"
            >
              <button 
                onClick={() => setActiveNode(null)}
                className="absolute top-6 right-6 font-mono text-[10px] text-white/40 hover:text-white uppercase tracking-widest"
              >
                [X] Close
              </button>

              <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/10 mt-6">
                <h3 className="text-6xl font-black text-white">{activeNode.id}</h3>
                <div className="text-right">
                  <div className="font-mono text-lg text-highlight-cyan">{activeNode.hours.toFixed(1)}h</div>
                  <div className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-1">Total Hrs</div>
                </div>
              </div>

              {/* Exploration & Hardware Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-2xl font-black text-white">{activeNode.unique_artists}</div>
                  <div className="font-mono text-[9px] text-white/50 uppercase tracking-widest mt-1">Unique Artists</div>
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[9px] text-white/50 mb-2 tracking-widest uppercase">
                    <span>Mobile {activeNode.mobile_pct}%</span>
                    <span>Desk {activeNode.desktop_pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden flex">
                    <div className="h-full bg-highlight-yellow" style={{ width: `${activeNode.mobile_pct}%` }}></div>
                    <div className="h-full bg-white/20" style={{ width: `${activeNode.desktop_pct}%` }}></div>
                  </div>
                  <div className="font-mono text-[8px] text-white/30 uppercase tracking-widest mt-2 text-right">Hardware Shift</div>
                </div>
              </div>

              {/* Circadian Shifts (Vampire vs Sunlight) */}
              <div className="mb-10 bg-white/5 p-4 border border-white/5 rounded">
                <h4 className="font-mono text-[10px] text-white/70 tracking-widest uppercase mb-4">Circadian Shift</h4>
                <div className="flex justify-between items-center font-mono text-xs mb-2">
                  <span className="text-electric-amethyst">Vampire (11P-5A)</span>
                  <span className="text-white font-bold">{activeNode.vampire_hours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-highlight-yellow">Sunlight (9A-5P)</span>
                  <span className="text-white font-bold">{activeNode.sunlight_hours.toFixed(1)}h</span>
                </div>
              </div>

              {/* The Local Soundtrack */}
              <div className="mb-10">
                <h4 className="font-mono text-[10px] text-highlight-cyan tracking-widest uppercase mb-4">The Local Soundtrack</h4>
                <ul className="space-y-4">
                  {activeNode.top_tracks.map((t, idx) => (
                    <li key={idx} className="flex justify-between items-start font-mono text-xs">
                      <div className="flex flex-col text-left max-w-[70%]">
                        <span className="text-white/90 truncate">{t.track}</span>
                        <span className="text-white/40 text-[9px] mt-0.5 truncate">{t.artist}</span>
                      </div>
                      <span className="text-highlight-cyan font-bold">{t.hours.toFixed(1)}h</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Regional Signature Artists */}
              <div className="mb-10">
                <h4 className="font-mono text-[10px] text-white/50 tracking-widest uppercase mb-3">Regional Signature</h4>
                <ul className="space-y-3">
                  {activeNode.top_artists.map((artist, idx) => (
                    <li key={idx} className="flex flex-col font-mono text-xs">
                      <span className="text-white/90 truncate">{artist}</span>
                      <div className="h-[1px] w-full bg-gradient-to-r from-highlight-cyan/30 to-transparent mt-1"></div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dominant Frequencies */}
              {activeNode.top_genres && activeNode.top_genres.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-mono text-[10px] text-electric-amethyst tracking-widest uppercase mb-3">Dominant Frequencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeNode.top_genres.map((genre, idx) => (
                      <span key={idx} className="px-2 py-1 border border-electric-amethyst/30 text-electric-amethyst text-[9px] font-mono uppercase tracking-widest rounded-sm bg-black/40">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {activeNode.first_visit && (
                <div className="mt-8 pt-4 border-t border-white/10 text-right">
                  <div className="font-mono text-[9px] text-white/30 uppercase tracking-widest mb-1">Chronological Entry</div>
                  <div className="font-mono text-xs text-white/60">First Visited: {activeNode.first_visit}</div>
                  <div className="font-mono text-xs text-white/60 mt-1">Last Visited: {activeNode.last_visit}</div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
