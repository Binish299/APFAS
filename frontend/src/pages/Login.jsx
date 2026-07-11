import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import api from '../api';

export const Login = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const payload = isRegistering 
      ? { username, email, password }
      : { username, password };

    const endpoint = isRegistering ? "register" : "login";

    try {
      const res = await api.post(`/auth/${endpoint}`, payload);
      // Pass logged-in session data back to main App wrapper
      if (onLoginSuccess) {
        onLoginSuccess(res.data);
      }
    } catch (err) {
      console.error("Auth query failure: ", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg("Connection error. Make sure local FastAPI backend is active.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
            color: 'white',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(15,68,77,0.3)'
          }}>
            <Sparkles size={28} />
          </div>
          <h2 className="gradient-title" style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
            {isRegistering ? 'Start Speech Training' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isRegistering ? 'Create your local speech coach profile' : 'Sign in to access your offline dashboard'}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: 'var(--color-needs-improvement)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Username
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. nepalilearner"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input" 
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> Email Address
              </label>
              <input 
                type="email" 
                required
                placeholder="learner@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input" 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Authenticating...' : isRegistering ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegistering ? 'Already registered?' : 'First time practicing?'}
          </span>{' '}
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-blue)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegistering ? 'Sign In here' : 'Sign Up here'}
          </button>
        </div>
      </div>
    </div>
  );
};
