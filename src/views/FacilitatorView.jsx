import { useState, useEffect } from 'react';
import PlayingCard from '../components/PlayingCard.jsx';
import TimerBar from '../components/TimerBar.jsx';
import ResultsPanel from '../components/ResultsPanel.jsx';
import { useTimer } from '../hooks/useTimer.js';
import {
  acceptEstimate as acceptEstimateApi,
  addStory as addStoryApi,
  finishSprint as finishSprintApi,
  getServerInfo,
  revealVotes,
  revote as revoteApi,
  startVoting as startVotingApi,
} from '../services/realtimeClient.js';
import { copyText } from '../utils/copyText.js';

export default function FacilitatorView({ initSess, pid, onEnd, autoReveal, T }) {
  const sess = initSess;
  const [tab, setTab] = useState('stories');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '' });
  const [err, setErr] = useState('');
  const [serverInfo, setServerInfo] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState('');
  const elapsed = useTimer(sess);

  useEffect(() => {
    getServerInfo().then(setServerInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!autoReveal || sess.phase !== 'voting' || !sess.currentStoryId) return;
    const story = sess.stories.find((s) => s.id === sess.currentStoryId);
    if (!story) return;
    const voters = sess.players.filter((p) => p.role !== 'facilitator');
    if (voters.length > 0 && voters.every((p) => story.votes[p.id] !== undefined)) {
      reveal();
    }
  }, [sess]);

  const run = async (fn) => {
    setErr('');
    try {
      await fn();
    } catch (error) {
      setErr(error.message);
    }
  };

  const addStory = async () => {
    if (!form.title.trim()) return;
    await run(async () => {
      await addStoryApi({ sessionId: sess.id, playerId: pid, title: form.title.trim(), desc: form.desc.trim() });
      setForm({ title: '', desc: '' });
      setShowAdd(false);
    });
  };

  const startVoting = (storyId) => run(() =>
    startVotingApi({ sessionId: sess.id, playerId: pid, storyId })
  );

  const reveal = () => run(() => revealVotes({ sessionId: sess.id, playerId: pid }));

  const acceptEstimate = (estimate) => run(() =>
    acceptEstimateApi({ sessionId: sess.id, playerId: pid, estimate })
  );

  const revote = () => run(() => revoteApi({ sessionId: sess.id, playerId: pid }));

  const finishSprint = async () => {
    const done = sess.stories.filter((s) => s.status === 'done');
    if (done.length === 0 && !window.confirm('Nessuna storia stimata. Terminare lo sprint?')) return;
    await run(async () => {
      await finishSprintApi({ sessionId: sess.id, playerId: pid });
      setTimeout(onEnd, 400);
    });
  };

  const story = sess.stories.find((s) => s.id === sess.currentStoryId);
  const voters = sess.players.filter((p) => p.role !== 'facilitator');
  const votesCnt = story ? Object.keys(story.votes).length : 0;
  const doneCnt = sess.stories.filter((s) => s.status === 'done').length;
  const shareUrls = [
    ...(serverInfo?.localUrls || []),
    serverInfo?.publicUrl,
  ].filter(Boolean);
  const inviteUrl = shareUrls[0] || serverInfo?.baseUrl || window.location.origin;

  const copyAddress = async (url) => {
    const copied = await copyText(url);
    if (!copied) return;
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl((current) => current === url ? '' : current), 1600);
  };

  const inp = {
    background: 'rgba(255,255,255,.07)', border: `1px solid ${T.goldDim}`,
    borderRadius: 8, padding: '10px 14px', color: T.text,
    fontSize: '.93rem', fontFamily: 'Inter', outline: 'none', width: '100%',
  };

  const pill = (active, label, onClick) => (
    <button onClick={onClick} style={{
      flex: 1, padding: '11px', border: 'none',
      background: active ? `${T.gold}22` : 'transparent',
      color: active ? T.gold : T.textMuted,
      borderBottom: `2px solid ${active ? T.gold : 'transparent'}`,
      cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, fontSize: '.83rem', transition: 'all .2s',
    }}>{label}</button>
  );

  const addressPill = (url, label) => (
    <button key={url} onClick={() => copyAddress(url)} title={`Copia ${url}`} style={{
      background: 'rgba(255,255,255,.06)',
      border: `1px solid ${T.goldDim}`,
      borderRadius: 7,
      padding: '6px 9px',
      color: copiedUrl === url ? T.success : T.textMuted,
      cursor: 'pointer',
      fontFamily: 'Inter',
      fontSize: '.74rem',
      maxWidth: 230,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {copiedUrl === url ? 'Copiato' : `${label}: ${url.replace(/^https?:\/\//, '')}`}
    </button>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, color: T.text, fontFamily: 'Inter', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '8px 24px', minHeight: 60, borderBottom: `1px solid ${T.panelBorder}`, background: 'rgba(0,0,0,.3)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: T.gold, fontSize: '1.15rem' }}>Planning Poker</span>
          <div style={{ background: T.badge, border: `1px solid ${T.badgeBorder}`, borderRadius: 6, padding: '4px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '.7rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em' }}>Session</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, letterSpacing: '.22em', color: T.gold, fontSize: '1.1rem' }}>{sess.id}</span>
          </div>
          {shareUrls.map((url) => addressPill(url, url === serverInfo?.publicUrl ? 'WWW' : 'LAN'))}
          <span style={{ fontSize: '.82rem', color: T.textMuted }}>👥 {sess.players.length} · ✅ {doneCnt}/{sess.stories.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
          {sess.phase === 'voting' && <TimerBar elapsed={elapsed} limit={sess.timerLimit} T={T} />}
          <button onClick={finishSprint} style={{ background: 'rgba(255,255,255,.07)', border: `1px solid ${T.goldDim}`, borderRadius: 7, padding: '7px 14px', color: T.textMuted, cursor: 'pointer', fontFamily: 'Inter', fontSize: '.8rem' }}>Fine Sprint</button>
        </div>
      </div>
      {err && (
        <div style={{ background: `${T.danger}22`, borderBottom: `1px solid ${T.danger}66`, color: T.text, padding: '8px 24px', fontSize: '.82rem' }}>
          {err}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 310, borderRight: `1px solid ${T.panelBorder}`, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,.15)', flexShrink: 0 }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.panelBorder}` }}>
            {pill(tab === 'stories', `📋 Stories (${sess.stories.length})`, () => setTab('stories'))}
            {pill(tab === 'players', `👥 Players (${sess.players.length})`, () => setTab('players'))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {tab === 'stories' ? (
              <>
                {sess.stories.map((st, i) => {
                  const active = st.id === sess.currentStoryId;
                  return (
                    <div key={st.id} onClick={() => st.status !== 'done' && startVoting(st.id)}
                      style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 9, border: `1px solid ${active ? T.gold : T.goldDim}`, background: active ? `${T.gold}12` : 'rgba(255,255,255,.03)', cursor: st.status === 'done' ? 'default' : 'pointer', transition: 'all .15s', opacity: st.status === 'done' ? .65 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '.68rem', color: T.textMuted, marginBottom: 3 }}>#{i + 1}</div>
                          <div style={{ fontSize: '.88rem', fontWeight: 600, lineHeight: 1.35 }}>{st.title}</div>
                          {st.desc && <div style={{ fontSize: '.75rem', color: T.textMuted, marginTop: 3, lineHeight: 1.4 }}>{st.desc}</div>}
                        </div>
                        <div style={{ flexShrink: 0, marginTop: 2 }}>
                          {st.status === 'done'
                            ? <span style={{ background: `${T.success}22`, border: `1px solid ${T.success}66`, borderRadius: 6, padding: '3px 9px', fontSize: '.83rem', color: T.success, fontWeight: 700 }}>{st.estimate}</span>
                            : active
                              ? <span style={{ background: T.badge, border: `1px solid ${T.badgeBorder}`, borderRadius: 6, padding: '3px 8px', fontSize: '.7rem', color: T.gold }}>VOTING</span>
                              : <span style={{ background: 'rgba(255,255,255,.06)', borderRadius: 6, padding: '3px 8px', fontSize: '.7rem', color: T.textMuted }}>PENDING</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {showAdd ? (
                  <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${T.goldDim}`, borderRadius: 10, padding: 14 }}>
                    <input style={{ ...inp, marginBottom: 9 }} placeholder="Titolo storia *" value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      autoFocus onKeyDown={(e) => e.key === 'Enter' && addStory()} />
                    <input style={{ ...inp, marginBottom: 12 }} placeholder="Descrizione (opzionale)" value={form.desc}
                      onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ flex: 1, background: T.btn, color: T.btnText, border: 'none', borderRadius: 8, padding: '9px', fontFamily: 'Inter', fontWeight: 700, cursor: 'pointer' }} onClick={addStory}>Aggiungi</button>
                      <button style={{ background: 'rgba(255,255,255,.07)', border: 'none', borderRadius: 8, padding: '9px 14px', color: T.textMuted, cursor: 'pointer' }} onClick={() => setShowAdd(false)}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button style={{ width: '100%', border: `1px dashed ${T.goldDim}`, borderRadius: 10, padding: '12px', background: 'none', color: T.textMuted, cursor: 'pointer', fontFamily: 'Inter', fontSize: '.85rem' }} onClick={() => setShowAdd(true)}>
                    + Aggiungi Storia
                  </button>
                )}
              </>
            ) : (
              sess.players.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, marginBottom: 8, background: 'rgba(255,255,255,.04)', border: `1px solid ${T.goldDim}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.badge, border: `2px solid ${T.badgeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: T.gold, fontSize: '.9rem', flexShrink: 0 }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '.72rem', color: T.textMuted }}>
                      {p.role === 'facilitator' ? '👑 Facilitatore' : '🎴 Player'} · {p.connected ? 'online' : 'offline'}
                    </div>
                  </div>
                  {story && sess.phase === 'voting' && p.role !== 'facilitator' && (
                    <span style={{ fontSize: '.82rem', color: story.votes[p.id] !== undefined ? T.success : T.textMuted }}>
                      {story.votes[p.id] !== undefined ? '✅' : '⏳'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center stage */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto' }}>
          {!story ? (
            <div style={{ textAlign: 'center' }} className="fade-in">
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, opacity: .35 }}>
                {[1, 3, 5, 8, 13].map((v) => <PlayingCard key={v} value={v} size="md" T={T} />)}
              </div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', color: T.textMuted, fontWeight: 400 }}>
                {sess.stories.length === 0 ? 'Aggiungi user stories per iniziare' : 'Clicca una storia per avviare la votazione'}
              </p>
              <p style={{ color: T.textMuted, marginTop: 12, fontSize: '.88rem', opacity: .6 }}>
                Condividi <strong style={{ color: T.gold }}>{inviteUrl}</strong> e il codice <strong style={{ color: T.gold, letterSpacing: '.15em' }}>{sess.id}</strong> con il team
              </p>
            </div>
          ) : sess.phase === 'voting' ? (
            <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }} className="fade-in">
              <div style={{ fontSize: '.72rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Votazione in corso</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', color: T.text, marginBottom: 8, lineHeight: 1.3 }}>{story.title}</h2>
              {story.desc && <p style={{ color: T.textMuted, marginBottom: 26, fontSize: '.9rem' }}>{story.desc}</p>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 30 }}>
                {voters.map((p, i) => (
                  <div key={p.id} style={{ textAlign: 'center' }}>
                    <PlayingCard value={story.votes[p.id] !== undefined ? '✓' : '?'} size="sm" faceDown={story.votes[p.id] === undefined} T={T} />
                    <div style={{ fontSize: '.65rem', color: T.textMuted, marginTop: 5, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  </div>
                ))}
              </div>
              <p style={{ color: T.textMuted, marginBottom: 20, fontSize: '.9rem' }}>{votesCnt} / {voters.length} voti ricevuti</p>
              <button onClick={reveal} style={{ background: T.btn, color: T.btnText, border: 'none', borderRadius: 10, padding: '14px 38px', fontFamily: 'Inter', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: votesCnt > 0 ? 1 : .6 }}>
                🃏 Rivela i Voti
              </button>
            </div>
          ) : sess.phase === 'revealed' ? (
            <ResultsPanel session={sess} story={story} onAccept={acceptEstimate} onRevote={revote} T={T} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
