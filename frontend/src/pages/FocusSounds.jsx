import React, { useState, useCallback } from 'react';
import { Volume2, Play, Pause, Ear, AlertCircle } from 'lucide-react';

const FOCUS_SOUNDS = [
  {
    id: 1,
    sound: "/θ/ — Unvoiced TH",
    ipa: "θ",
    words: ["think", "thumb", "bath", "three", "month"],
    phrase: "Think about the third thumb.",
    tip: "Place your tongue between your teeth and blow air. No voice vibration."
  },
  {
    id: 2,
    sound: "/ð/ — Voiced TH",
    ipa: "ð",
    words: ["this", "that", "breathe", "mother", "smooth"],
    phrase: "This mother breathes smoothly.",
    tip: "Same tongue position as /θ/ but vibrate your vocal cords."
  },
  {
    id: 3,
    sound: "/v/ vs /w/",
    ipa: "v → w",
    words: ["vest", "west", "vine", "wine", "very", "berry"],
    phrase: "The very best vest is woven with vine.",
    tip: "/v/: upper teeth touch lower lip. /w/: lips round like a circle."
  },
  {
    id: 4,
    sound: "/ʃ/ — SH sound",
    ipa: "ʃ",
    words: ["ship", "shop", "wish", "shower", "nation"],
    phrase: "She wishes to see the ship shop.",
    tip: "Round your lips slightly, push air through a narrow channel."
  },
  {
    id: 5,
    sound: "/ʒ/ — ZH sound",
    ipa: "ʒ",
    words: ["measure", "treasure", "pleasure", "vision", "casual"],
    phrase: "Measuring the treasure was a pleasure.",
    tip: "Same mouth shape as /ʃ/ but vibrate your vocal cords."
  },
  {
    id: 6,
    sound: "/z/ vs /s/",
    ipa: "z → s",
    words: ["zebra", "sebra", "rise", "rice", "buzz", "bus"],
    phrase: "The zebra rose and buzzed the bus.",
    tip: "/z/: voiced. /s/: unvoiced. Both have tongue near the ridge."
  },
  {
    id: 7,
    sound: "/f/ vs /p/",
    ipa: "f → p",
    words: ["fine", "pine", "fox", "box", "lap", "laugh"],
    phrase: "A fine fox laughed at the pine box.",
    tip: "/f/: upper teeth on lower lip. /p/: both lips press and release."
  },
  {
    id: 8,
    sound: "/dʒ/ — J sound",
    ipa: "dʒ",
    words: ["jump", "gem", "bridge", "judge", "orange"],
    phrase: "The judge jumped over the orange bridge.",
    tip: "Tongue tip touches the ridge, then releases with voice."
  },
  {
    id: 9,
    sound: "Consonant Clusters",
    ipa: "CCC",
    words: ["spring", "street", "splash", "script", "strong"],
    phrase: "Strong spring street splashes the script.",
    tip: "Don't add vowels between consonants. Keep the cluster tight."
  },
  {
    id: 10,
    sound: "Aspiration — P vs SP",
    ipa: "pʰ vs p",
    words: ["pin", "spin", "top", "stop", "pot", "spot"],
    phrase: "Pin the pot on top of the spot.",
    tip: "After initial 'p', release a puff of air. After 's', no puff."
  },
];

export const FocusSounds = () => {
  const [speakingId, setSpeakingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const speak = useCallback((text, id) => {
    if (speakingId === id) {
      if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
      }
      setSpeakingId(null);
      return;
    }

    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    setErrorMsg(null);

    const audio = new Audio(`/api/conversation/tts?text=${encodeURIComponent(text)}&voice=en-US-JennyNeural`);
    window.currentAudio = audio;

    audio.onplaying = () => setSpeakingId(id);
    audio.onended = () => { setSpeakingId(null); window.currentAudio = null; };
    audio.onerror = () => {
      setSpeakingId(null);
      window.currentAudio = null;
      setErrorMsg("Failed to play audio. Try again.");
    };

    audio.play().catch(() => {
      setSpeakingId(null);
      window.currentAudio = null;
      setErrorMsg("Failed to play audio. Try again.");
    });
  }, [speakingId]);

  return (
    <div style={{ padding: '30px 40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <span className="eyebrow">Targeted Practice</span>
        <h1 className="gradient-title" style={{ fontSize: '2.4rem', marginBottom: '10px' }}>
          Focus Sounds
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px' }}>
          Ten common English sounds that Nepali speakers often find challenging. 
          Tap play to hear the pronunciation, then repeat aloud on your own.
        </p>
      </div>

      {errorMsg && (
        <div className="glass-panel" style={{
          background: 'rgba(194,77,77,0.04)',
          border: '1px solid rgba(194,77,77,0.12)',
          color: 'var(--color-needs-improvement)',
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '24px', padding: '12px 16px'
        }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.85rem' }}>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {FOCUS_SOUNDS.map((item) => (
          <div key={item.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              {/* Play button */}
              <button
                onClick={() => speak(`${item.phrase} ${item.words.join(', ')}`, item.id)}
                className="btn"
                style={{
                  width: '44px',
                  height: '44px',
                  padding: '0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: speakingId === item.id ? 'rgba(15,68,77,0.08)' : 'var(--accent-blue)',
                  color: speakingId === item.id ? 'var(--accent-blue)' : '#fff',
                  border: speakingId === item.id ? '1px solid var(--accent-blue)' : 'none',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
                aria-label={speakingId === item.id ? 'Stop' : `Play ${item.sound}`}
              >
                {speakingId === item.id ? <Pause size={18} /> : <Play size={18} />}
              </button>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--accent-blue)'
                  }}>
                    {item.sound}
                  </span>
                  <span style={{
                    fontSize: '0.65rem', fontFamily: 'var(--font-code)', color: 'var(--text-muted)',
                    background: 'rgba(0,0,0,0.03)', padding: '2px 8px', borderRadius: '4px'
                  }}>
                    /{item.ipa}/
                  </span>
                </div>

                <p style={{
                  fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '8px'
                }}>
                  "{item.phrase}"
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {item.words.map((w) => (
                    <span
                      key={w}
                      onClick={() => {
                        if (window.currentAudio) window.currentAudio.pause();
                        const a = new Audio(`/api/conversation/tts?text=${encodeURIComponent(w)}&voice=en-US-JennyNeural`);
                        window.currentAudio = a;
                        a.play().catch(() => {});
                      }}
                      style={{
                        fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px',
                        background: 'rgba(0,0,0,0.03)', color: 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <Volume2 size={12} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
                      {w}
                    </span>
                  ))}
                </div>

                <div style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4,
                  borderTop: '1px solid var(--glass-border)', paddingTop: '8px', marginTop: '4px'
                }}>
                  <span style={{ fontWeight: 600 }}>Tip: </span>{item.tip}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
