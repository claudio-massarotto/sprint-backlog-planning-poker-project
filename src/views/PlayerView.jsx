import { useState, useEffect } from 'react';
import PlayingCard from '../components/PlayingCard.jsx';
import TimerBar from '../components/TimerBar.jsx';
import ResultsPanel from '../components/ResultsPanel.jsx';
import PlayerSprintReport from './PlayerSprintReport.jsx';
import { useTimer } from '../hooks/useTimer.js';
import { loadSession, saveSession, savePlayer, SESSION_PFX } from '../utils/storage.js';
import { FIBONACCI } from '../themes.js';

export default function PlayerView({ initSess, pid, onLeave, T }) {
  const [sess, setSess] = useState(initSess);
  const elapsed = useTimer(sess);
  const me = sess.players.find((p) => p.id === pid);

  useEffect(() => {
    const h = (e) => {
      if (e.key === SESSION_PFX + sess.id) {
        try { setSess(JSON.parse(e.newValue)); } catch { }
      }
    };
    window.addEventListener('storage', h);
    const iv = setInterval(() => {
      const s = loadSession(sess.id);
      if (s) setSess(s);
    }, 900);
    return () => { window.removeEventListener('storage', h); clearInterval(iv); };
  }, [sess.id]);

  const castVote = (value) => {
    const s = loadSession(sess.id);
    if (!s || s.phase !== 'voting') return;
    const story = s.stories.find((st) => st.id === s.currentStoryId);
    if (!story) return;
    story.votes[pid] = value;
    saveSession(s);
    setSess({ ...s });
  };

  const story = sess.stories.find((s) => s.id === sess.currentStoryId);
  const myVote = story?.votes?.[pid];
  const voters = sess.players.filter((p) => p.role !== 'facilitator');

  if (sess.phase === 'finished') {
    return <PlayerSprintReport sess={sess} onBack={onLeave} T={T} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, color: T.text, fontFamily: 'Inter', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 60, borderBottom: `1px solid ${T.panelBorder}`, background: 'rgba(0,0,0,.3)', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: T.gold }}>Planning Poker</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {sess.phase === 'voting' && <TimerBar elapsed={elapsed} limit={sess.timerLimit} T={T} />}
          <span style={{ fontSize: '.83rem', color: T.textMuted }}>👤 {me?.name}</span>
          <div style={{ background: T.badge, border: `1px solid ${T.badgeBorder}`, borderRadius: 6, padding: '4px 12px' }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, letterSpacing: '.2em', color: T.gold }}>{sess.id}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, overflowY: 'auto' }}>
        {(!story || sess.phase === 'lobby') ? (
          <div style={{ textAlign: 'center' }} className="fade-in">
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32, opacity: .4 }}>
              {FIBONACCI.map((v) => <PlayingCard key={v} value={v} size="sm" faceDown T={T} />)}
            </div>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: T.textMuted, fontWeight: 400 }}>In attesa del facilitatore…</p>
          </div>
        ) : sess.phase === 'voting' ? (
          <div style={{ width: '100%', maxWidth: 660 }} className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: '.72rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Storia in votazione</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', color: T.text, lineHeight: 1.3 }}>{story.title}</h2>
              {story.desc && <p style={{ color: T.textMuted, marginTop: 8, fontSize: '.9rem' }}>{story.desc}</p>}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
              {voters.map((p) => (
                <div key={p.id} style={{ textAlign: 'center' }}>
                  <PlayingCard
                    value={p.id === pid && myVote !== undefined ? myVote : '?'}
                    faceDown={p.id !== pid || myVote === undefined}
                    size="sm" T={T} />
                  <div style={{ fontSize: '.65rem', color: T.textMuted, marginTop: 5, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                </div>
              ))}
            </div>

            <div style={{ background: T.felt, border: `1px solid ${T.feltBorder}`, borderRadius: 16, padding: '28px 24px', boxShadow: 'inset 0 2px 12px rgba(0,0,0,.3)' }}>
              <div style={{ fontSize: '.78rem', color: T.textMuted, textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                {myVote !== undefined
                  ? `Voto: ${myVote} — puoi cambiare / You voted: ${myVote} — tap to change`
                  : 'Seleziona la tua stima / Select your estimate'}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {FIBONACCI.map((v) => (
                  <PlayingCard key={v} value={v} selected={myVote === v} onClick={() => castVote(v)} size="md" T={T} />
                ))}
              </div>
            </div>
          </div>
        ) : sess.phase === 'revealed' ? (
          <ResultsPanel session={sess} story={story} readonly T={T} />
        ) : null}
      </div>
    </div>
  );
}
