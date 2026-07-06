import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { TrainingSession } from './pages/TrainingSession';
import { TopicSpeaking } from './pages/TopicSpeaking';
import { SessionHistory } from './pages/SessionHistory';
import { Login } from './pages/Login';
import { Sparkles, LayoutDashboard, Volume2, HelpCircle, History, LogOut } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <nav className="navbar">
          <div className="brand">
            <Sparkles size={24} style={{ color: 'var(--accent-blue)' }} /> NEPALISH COACH
          </div>
        </nav>
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Global Glassmorphic Premium Navbar */}
      <nav className="navbar">
        <div 
          className="brand" 
          onClick={() => setCurrentPage('dashboard')}
          style={{ cursor: 'pointer' }}
        >
          <Sparkles size={24} style={{ color: 'var(--accent-blue)' }} /> NEPALISH COACH
        </div>

        <div className="nav-links">
          <button 
            onClick={() => setCurrentPage('dashboard')} 
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          
          <button 
            onClick={() => setCurrentPage('drill')} 
            className={`nav-item ${currentPage === 'drill' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Volume2 size={16} /> Pronunciation Drills
          </button>
          
          <button 
            onClick={() => setCurrentPage('topic')} 
            className={`nav-item ${currentPage === 'topic' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <HelpCircle size={16} /> Spontaneous Topics
          </button>
          
          <button 
            onClick={() => setCurrentPage('history')} 
            className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={16} /> Session History
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
              Hi, {user.username}
            </span>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-excellent)' }}>🔥 3 Day Active Streak</p>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Exit
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, background: 'transparent' }}>
        {currentPage === 'dashboard' && (
          <Dashboard userId={user.id} navigateTo={setCurrentPage} />
        )}
        {currentPage === 'drill' && (
          <TrainingSession userId={user.id} navigateTo={setCurrentPage} />
        )}
        {currentPage === 'topic' && (
          <TopicSpeaking userId={user.id} navigateTo={setCurrentPage} />
        )}
        {currentPage === 'history' && (
          <SessionHistory userId={user.id} />
        )}
      </main>
    </div>
  );
}

export default App;
