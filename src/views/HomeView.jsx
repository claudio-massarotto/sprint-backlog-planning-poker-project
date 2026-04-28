import { useEffect, useState } from 'react';
import PlayingCard from '../components/PlayingCard.jsx';
import { createSession, getHistory, getServerInfo, joinSession } from '../services/realtimeClient.js';
import { loadPlayer } from '../utils/clientIdentity.js';
import { copyText } from '../utils/copyText.js';

export default function HomeView({ onReady, timerLimit, T }) {
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [serverInfo, setServerInfo] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState('');

  useEffect(() => {
    getHistory()
      .then((history) => setHistoryCount(history.length))
      .catch(() => setHistoryCount(0));
    getServerInfo()
      .then(setServerInfo)
      .catch(() => setServerInfo(null));
  }, []);

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
  const addressRow = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    background: 'rgba(255,255,255,.05)',
    border: `1px solid ${T.goldDim}`,
    borderRadius: 8,
    padding: '8px 10px',
    color: T.text,
    fontFamily: 'Inter',
    fontSize: '.78rem',
  };
  const copyBtn = {
    background: T.btn,
    border: 'none',
    borderRadius: 6,
    color: T.btnText,
    cursor: 'pointer',
    fontFamily: 'Inter',
    fontSize: '.72rem',
    fontWeight: 700,
    padding: '6px 9px',
  };

  const copyAddress = async (url) => {
    if (!url) return;
    const copied = await copyText(url);
    if (!copied) return;
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl((current) => current === url ? '' : current), 1600);
  };

  const addressLine = (label, url, disabled) => (
    <div style={{ ...addressRow, opacity: disabled ? .68 : 1 }}>
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}: {url || 'IP pubblico non rilevato'}
      </span>
      {url && (
        <button style={copyBtn} onClick={() => copyAddress(url)}>
          {copiedUrl === url ? 'Copiato' : 'Copia'}
        </button>
      )}
    </div>
  );

  const doCreate = async () => {
    if (!name.trim()) return setErr('Inserisci il tuo nome / Enter your name');
    setLoading(true);
    setErr('');
    try {
      const { session, player } = await createSession({ name: name.trim(), timerLimit });
      onReady(session, player);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };
  const doJoin = async () => {
    if (!name.trim() || !code.trim()) return setErr('Compila tutti i campi / Fill all fields');
    setLoading(true);
    setErr('');
    try {
      const currentPlayer = loadPlayer();
      const { session, player } = await joinSession({
        sessionId: code.trim().toUpperCase(),
        name: name.trim(),
        playerId: currentPlayer?.sessionId === code.trim().toUpperCase() ? currentPlayer.id : undefined,
      });
      onReady(session, player);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
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
          <button style={{ ...btnStyle, opacity: loading ? .7 : 1 }} disabled={loading} onClick={tab === 'create' ? doCreate : doJoin}>
            {loading ? 'Connessione…' : tab === 'create' ? 'Crea Sessione' : 'Entra nella Sessione'}
          </button>
        </div>
      </div>

      {historyCount > 0 && (
        <button onClick={() => onReady(null, null, 'history')} style={{ marginTop: 20, background: 'none', border: `1px solid ${T.goldDim}`, borderRadius: 8, padding: '8px 20px', color: T.textMuted, cursor: 'pointer', fontSize: '.83rem' }}>
          📊 Storico Sprint ({historyCount})
        </button>
      )}

      {serverInfo && (
        <div style={{ marginTop: 20, width: '100%', maxWidth: 420, background: 'rgba(0,0,0,.18)', border: `1px solid ${T.goldDim}`, borderRadius: 12, padding: 14 }}>
          <div style={{ color: T.textMuted, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
            Indirizzi server
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {addressLine('Locale', serverInfo.baseUrl)}
            {(serverInfo.localUrls || []).map((url) => (
              <div key={url}>{addressLine('LAN', url)}</div>
            ))}
            {addressLine('WWW', serverInfo.publicUrl, !serverInfo.publicUrl)}
          </div>
          <p style={{ marginTop: 9, color: T.textMuted, fontSize: '.72rem', lineHeight: 1.35, opacity: .75 }}>
            Gli indirizzi LAN funzionano nella stessa rete. L'indirizzo WWW richiede router/firewall o tunnel configurati.
          </p>
        </div>
      )}

      <p style={{ marginTop: 32, color: T.textMuted, fontSize: '.78rem', opacity: .6, textAlign: 'center', maxWidth: 340 }}>
        Avvia il server, condividi l'indirizzo IP locale e fai entrare ogni partecipante dal proprio browser
      </p>
    </div>
  );
}
