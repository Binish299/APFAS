import React from 'react';
import { Sparkles, Mic, BarChart3, MessageSquare, Ear, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: <Mic size={20} />,
    title: 'Pronunciation Drills',
    desc: 'Practice sounds unique to English with real-time feedback powered by Whisper AI.',
  },
  {
    icon: <MessageSquare size={20} />,
    title: 'Spontaneous Speaking',
    desc: 'Respond to real-world topics and build fluency through natural conversation.',
  },
  {
    icon: <BarChart3 size={20} />,
    title: 'Detailed Analytics',
    desc: 'Track accuracy, fluency, and progress over time with clear visual metrics.',
  },
  {
    icon: <Ear size={20} />,
    title: 'Focus Sounds',
    desc: 'Train your ear to distinguish minimal pairs and tricky phonemes.',
  },
];

export function LandingPage({ onSignIn }) {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-brand">
          <img src="/Flowgo logo.png" alt="FlowGo" className="landing-brand-logo" />
          <span>FLOWGO</span>
        </div>
        <button className="btn btn-primary landing-signin" onClick={onSignIn}>
          Sign In <ArrowRight size={14} />
        </button>
      </header>

      <section className="landing-hero">
        <span className="eyebrow">Offline · Private · Free</span>
        <h1 className="gradient-title landing-hero-title">
          Speak English with<br />confidence
        </h1>
        <p className="landing-hero-sub">
          An AI-powered speech coach built for Nepali speakers. Practice pronunciation,
          improve fluency, and get instant feedback — all offline.
        </p>
        <div className="landing-hero-actions">
          <button className="btn btn-primary landing-cta" onClick={onSignIn}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-features-grid">
          {features.map((f, i) => (
            <div className="glass-panel landing-feature-card" key={i}>
              <div className="landing-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta-section">
        <div className="glass-panel landing-cta-card">
          <h2 className="gradient-title">Start your practice today</h2>
          <p>No internet required. Your data stays on your device.</p>
          <button className="btn btn-primary" onClick={onSignIn}>
            Create Account <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <span>FLOWGO</span>
        <span className="landing-footer-muted">© {new Date().getFullYear()} · All rights reserved</span>
      </footer>
    </div>
  );
}
