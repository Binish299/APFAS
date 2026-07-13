import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { TrainingSession } from './pages/TrainingSession';
import { TopicSpeaking } from './pages/TopicSpeaking';
import { SessionHistory } from './pages/SessionHistory';
import { FocusSounds } from './pages/FocusSounds';
import { Login } from './pages/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { Sparkles, LayoutDashboard, Volume2, HelpCircle, History, Ear, LogOut } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nepalish_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('nepalish_user', JSON.stringify(userData));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nepalish_user');
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
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div 
          className="sidebar-brand" 
          onClick={() => setCurrentPage('dashboard')}
        >
          <Sparkles size={22} style={{ color: 'var(--accent-blue)' }} />
          <span>NEPALISH COACH</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{user.username}</span>
            <span className="sidebar-streak">🔥 3 Day Streak</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button 
            onClick={() => setCurrentPage('dashboard')} 
            className={`sidebar-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            aria-current={currentPage === 'dashboard' ? 'page' : undefined}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => setCurrentPage('drill')} 
            className={`sidebar-item ${currentPage === 'drill' ? 'active' : ''}`}
            aria-current={currentPage === 'drill' ? 'page' : undefined}
          >
            <Volume2 size={18} />
            <span>Pronunciation Drills</span>
          </button>
          
          <button 
            onClick={() => setCurrentPage('topic')} 
            className={`sidebar-item ${currentPage === 'topic' ? 'active' : ''}`}
            aria-current={currentPage === 'topic' ? 'page' : undefined}
          >
            <HelpCircle size={18} />
            <span>Spontaneous Topics</span>
          </button>

          <button 
            onClick={() => setCurrentPage('focus')} 
            className={`sidebar-item ${currentPage === 'focus' ? 'active' : ''}`}
            aria-current={currentPage === 'focus' ? 'page' : undefined}
          >
            <Ear size={18} />
            <span>Focus Sounds</span>
          </button>
          
          <button 
            onClick={() => setCurrentPage('history')} 
            className={`sidebar-item ${currentPage === 'history' ? 'active' : ''}`}
            aria-current={currentPage === 'history' ? 'page' : undefined}
          >
            <History size={18} />
            <span>Session History</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <OfflineBanner />
        <main style={{ flex: 1, background: 'transparent', overflowY: 'auto' }}>
          <ErrorBoundary>
            {currentPage === 'dashboard' && (
              <Dashboard navigateTo={setCurrentPage} />
            )}
            {currentPage === 'drill' && (
              <TrainingSession navigateTo={setCurrentPage} />
            )}
            {currentPage === 'topic' && (
              <TopicSpeaking navigateTo={setCurrentPage} />
            )}
            {currentPage === 'focus' && (
              <FocusSounds />
            )}
            {currentPage === 'history' && (
              <SessionHistory />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
