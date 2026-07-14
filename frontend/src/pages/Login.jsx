import React, { useState, useMemo } from 'react';
import { User, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api';

function generateStars(count) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      x: 50 + Math.random() * 45,
      y: 5 + Math.random() * 50,
      size: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 4,
      duration: Math.random() * 2 + 2,
    });
  }
  return positions;
}

function Stars({ isSignUp }) {
  const stars = useMemo(() => generateStars(60), []);

  const lines = useMemo(() => {
    const result = [];
    for (let i = 1; i < stars.length; i++) {
      const prev = stars[i - 1];
      const s = stars[i];
      const dx = s.x - prev.x;
      const dy = s.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 18) continue;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      result.push({
        prevX: prev.x,
        prevY: prev.y,
        width: len,
        angle,
        opacity: 0.15 + (1 - len / 18) * 0.35,
        delay: s.delay,
      });
    }
    return result;
  }, [stars]);

  return (
    <div className="auth-stars-container" data-signup={isSignUp}>
      {stars.map((s, i) => (
        <div
          key={i}
          className="auth-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
      {lines.map((l, i) => (
        <div
          key={`l-${i}`}
          className="auth-star-line"
          style={{
            left: `${l.prevX}%`,
            top: `${l.prevY}%`,
            width: `${l.width}%`,
            transform: `rotate(${l.angle}deg)`,
            opacity: l.opacity,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

import { ArrowLeft } from 'lucide-react';

export const Login = ({ onLoginSuccess, onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isRegistering && password !== confirmPw) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);

    const payload = isRegistering
      ? { username, email, password }
      : { username, password };

    const endpoint = isRegistering ? "register" : "login";

    try {
      const res = await api.post(`/auth/${endpoint}`, payload);
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

  const toggleMode = () => {
    if (animating) return;
    setAnimating(true);
    setErrorMsg(null);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPw("");
    setAgreeTerms(false);
    setIsRegistering((prev) => !prev);
    setTimeout(() => setAnimating(false), 950);
  };

  return (
    <div className={`auth-container${isRegistering ? ' sign-up' : ''}`}>
      {onBack && (
        <button className="auth-back-btn" onClick={onBack} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
      )}

      {/* ── Form Panel ────────────────────────────────────── */}
      <div className="auth-form-panel">
        <div className="auth-form-content">

          {/* Sign In Set */}
          <div className={`auth-form-set${isRegistering ? '' : ' auth-set-active'}`}>
            <span className="auth-eyebrow">WELCOME BACK</span>
            <h2 className="auth-title">Sign in</h2>

            {errorMsg && !isRegistering && (
              <div className="auth-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-fields">
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input type="text" required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="auth-input" />
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input type={showPw ? 'text' : 'password'} required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? 'Authenticating...' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Sign Up Set */}
          <div className={`auth-form-set${isRegistering ? ' auth-set-active' : ''}`}>
            <span className="auth-eyebrow">JOIN THE SPACE</span>
            <h2 className="auth-title">Create account</h2>

            {errorMsg && isRegistering && (
              <div className="auth-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-fields">
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input type="text" required placeholder="Full Name" value={username} onChange={(e) => setUsername(e.target.value)} className="auth-input" />
                </div>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input type="email" required placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input type={showPw ? 'text' : 'password'} required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input type={showPw ? 'text' : 'password'} required placeholder="Confirm Password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="auth-input" />
                </div>
              </div>
              <label className="auth-terms-label">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="auth-terms-checkbox" />
                <span>I agree to the Terms &amp; Conditions</span>
              </label>
              <button type="submit" disabled={loading || !agreeTerms} className="auth-submit-btn">
                {loading ? 'Authenticating...' : 'Create account'}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* ── Overlay Panel ─────────────────────────────────── */}
      <div className="auth-overlay-panel">
        <Stars isSignUp={isRegistering} />
        <div className="auth-overlay-content">
          {isRegistering ? (
            <div key="signup" className="auth-overlay-item auth-overlay-enter">
              <h3 className="auth-gradient-title">Already have an account?</h3>
              <p className="auth-gradient-desc">Sign in to continue your speech practice journey.</p>
              <button className="auth-ghost-btn" onClick={toggleMode}>Sign in</button>
            </div>
          ) : (
            <div key="signin" className="auth-overlay-item auth-overlay-enter">
              <h3 className="auth-gradient-title">New to NepaliCoach?</h3>
              <p className="auth-gradient-desc">Create a free account and start improving your English speaking skills today.</p>
              <button className="auth-ghost-btn" onClick={toggleMode}>Create account</button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};