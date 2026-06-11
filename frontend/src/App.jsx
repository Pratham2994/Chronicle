import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ErasTimeline from './components/ErasTimeline';
import GeoSoundtrack from './components/GeoSoundtrack';
import Navigation from './components/Navigation';

function App() {
  const [globalLoading, setGlobalLoading] = useState(true);

  return (
    <div className="App bg-black min-h-screen text-white relative">
      <Navigation />
      
      {globalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-highlight-cyan border-t-transparent rounded-full animate-spin"></div>
            <p className="font-mono text-highlight-cyan text-xs tracking-[0.3em] uppercase animate-pulse">
              Initializing Chronicle Engine
            </p>
          </div>
        </div>
      )}

      <div id="telemetry-section" className={globalLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 transition-opacity duration-1000'}>
        <Dashboard onLoaded={() => setGlobalLoading(false)} />
      </div>
      
      {!globalLoading && (
        <>
          <div id="eras-section">
            <ErasTimeline />
          </div>
          <div id="geo-section">
            <GeoSoundtrack />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
