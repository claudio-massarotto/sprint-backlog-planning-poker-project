import { useState } from 'react';
import PlayingCard from '../components/PlayingCard.jsx';
import { createSession, joinSession, loadHistory } from '../utils/storage.js';

export default function HomeView({ onReady, timerLimit, T }) {
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const inp = {
    background: 'rgba(255,255,255,.07)', border: `1px solid ${T.goldDim}`,
    borderRadius: 8, padding: '12px 16px', color: T.text,
    fontSize: '1rem', fontFamily: 'Inter', width: '100%', outline: 'none', transition: 'border .15s',
  };
  const btnStyle = {
    background: T.btn, color: T.btnText, border: 'none', borderRadius: 9,
    padding: '13px 32px', fontFamily: 'Inter', fontWeight: 700,
    fontSize: '1rem', cursor: 'pointer', width: '100%', marginTop: 6,
  };

  const doCreate = () => {
    if (!name.trim()) return setErr('Inserisci il tuo nome / Enter your name');
    const { sess, pid } = createSession(name.trim(), timerLimit);
    onReady(sess, pid);
  };
  const doJoin = () => {
    if (!name.trim() || !code.trim()) return setErr('Compila tutti i campi / Fill all fields');
    const res = joinSession(code, name.trim());
    if (!res) return setErr('Sessione non trovata / Session not found');
    onReady(res.sess, res.pid);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bgGrad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 18 }}>
          {[1, 5, 13].map((v, i) => <PlayingCard key={v} value={v} size="sm" T={T} delay={i * 60} />)}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2.4rem', color: T.text, fontWeight: 700, letterSpacing: '-.02em' }}>Planning Poker</h1>
        <p style={{ color: T.textMuted, marginTop: 6, fontSize: '.9rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>Sprint Backlog Estimation</p>
      </div>

      <div className="fade-in" style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 16, padding: 36, width: '100%', maxWidth: 420, backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', marginBottom: 28, background: 'rgba(0,0,0,.25)', borderRadius: 9, padding: 4 }}>
          {['create', 'join'].map((t) => (
            <button key={t} onClick={() => { setTab(t); setErr(''); }} style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: 6,
              background: tab === t ? T.gold : 'transparent',
              color: tab === t ? T.btnText : T.textMuted,
              cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, fontSize: '.88rem', transition: 'all .2s',
            }}>
              {t === 'create' ? '+ Crea Sessione' : '→ Unisciti'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'join' && (
            <div>
              <label style={{ display: 'block', color: T.textMuted, fontSize: '.75rem', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Codice Sessione</label>
              <input
                style={{ ...inp, textTransform: 'uppercase', letterSpacing: '.25em', fontSize: '1.5rem', textAlign: 'center', fontFamily: "'Playfair Display',serif", fontWeight: 700 }}
                value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX" maxLength={4} />
            </div>
          )}
          <div>
            <label style={{ display: 'block', color: T.textMuted, fontSize: '.75rem', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>Il tuo nome / Your name</label>
            <input
              style={inp} value={name} onChange={(e) => setName(e.target.value)}
              placeholder={tab === 'create' ? 'Facilitatore' : 'Team Member'}
              onKeyDown={(e) => e.key === 'Enter' && (tab === 'create' ? doCreate() : doJoin())} />
          </div>
          {err && <p style={{ color: T.danger, fontSize: '.83rem', textAlign: 'center' }}>{err}</p>}
          <button style={btnStyle} onClick={tab === 'create' ? doCreate : doJoin}>
            {tab === 'create' ? 'Crea Sessione' : 'Entra nella Sessione'}
          </button>
        </div>
      </div>

      {loadHistory().length > 0 && (
        <button onClick={() => onReady(null, null, 'history')} style={{ marginTop: 20, background: 'none', border: `1px solid ${T.goldDim}`, borderRadius: 8, padding: '8px 20px', color: T.textMuted, cursor: 'pointer', fontSize: '.83rem' }}>
          📊 Storico Sprint ({loadHistory().length})
        </button>
      )}

      <p style={{ marginTop: 32, color: T.textMuted, fontSize: '.78rem', opacity: .6, textAlign: 'center', maxWidth: 340 }}>
        Ogni scheda del browser può partecipare come player — condividi il codice con il team
      </p>
    </div>
  );
}
