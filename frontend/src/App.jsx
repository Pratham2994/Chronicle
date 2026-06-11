import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ErasTimeline from './components/ErasTimeline';

function App() {
  return (
    <div className="App bg-black min-h-screen">
      <Dashboard />
      <ErasTimeline />
    </div>
  );
}

export default App;
