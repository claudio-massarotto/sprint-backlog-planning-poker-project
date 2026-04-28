import { useEffect, useState } from 'react';
import { FIBONACCI } from '../themes.js';
import { getHistory } from '../services/realtimeClient.js';

export default function HistoryView({ onBack, T }) {
  const [history, setHistory] = useState([]);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    getHistory()
      .then((items) => {
        setHistory(items);
        setSel(items[0] || null);
      })
      .catch(() => {
        setHistory([]);
        setSel(null);
      });
  }, []);

  const allEst = sel ? sel.stories.map((s) => s.estimate).filter(Boolean) : [];
  const counts = {};
  FIBONACCI.filter((v) => typeof v === 'number').forEach((v) => { counts[v] = allEst.filter((e) => e === v).length; });
  const maxCnt = Math.max(...Object.values(counts), 1);
  const totalSP = allEst.reduce((s, v) => s + v, 0);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, color: T.text, fontFamily: 'Inter', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: 60, borderBottom: `1px solid ${T.panelBorder}`, background: 'rgba(0,0,0,.3)', gap: 16, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: `1px solid ${T.goldDim}`, borderRadius: 7, padding: '7px 16px', color: T.textMuted, cursor: 'pointer', fontFamily: 'Inter', fontSize: '.83rem' }}>← Indietro</button>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', color: T.gold }}>Storico Sprint</h1>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 270, borderRight: `1px solid ${T.panelBorder}`, overflowY: 'auto', padding: 14, background: 'rgba(0,0,0,.12)', flexShrink: 0 }}>
          {history.length === 0 ? (
            <p style={{ color: T.textMuted, textAlign: 'center', marginTop: 40, fontSize: '.88rem' }}>Nessuna sessione completata</p>
          ) : history.map((h) => (
            <div key={h.id} onClick={() => setSel(h)} style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 9, border: `1px solid ${sel?.id === h.id ? T.gold : T.goldDim}`, background: sel?.id === h.id ? `${T.gold}12` : 'rgba(255,255,255,.03)', cursor: 'pointer', transition: 'all .15s' }}>
              <div style={{ fontWeight: 700, color: T.gold, fontFamily: "'Playfair Display',serif", marginBottom: 4, letterSpacing: '.06em' }}>{h.id}</div>
              <div style={{ fontSize: '.78rem', color: T.textMuted }}>
                {new Date(h.date).toLocaleDateString('it-IT')} · {h.stories.length} storie · {h.players} 👥
              </div>
              <div style={{ fontSize: '.78rem', color: T.textMuted, marginTop: 2 }}>
                {h.stories.reduce((s, st) => s + (st.estimate || 0), 0)} SP totali
              </div>
            </div>
          ))}
        </div>

        {sel ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 36 }} className="fade-in">
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.7rem', color: T.text, marginBottom: 6 }}>Sprint Report — {sel.id}</h2>
            <p style={{ color: T.textMuted, marginBottom: 32, fontSize: '.88rem' }}>
              {new Date(sel.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {sel.players} partecipanti
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
              {[['Story Points Totali', totalSP], ['Storie Stimate', sel.stories.length], ['Media SP/Storia', (totalSP / (sel.stories.length || 1)).toFixed(1)]].map(([l, v]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${T.goldDim}`, borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: '.7rem', color: T.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>{l}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 700, color: T.gold }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${T.goldDim}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", marginBottom: 20, fontSize: '1.05rem' }}>Distribuzione Stime</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120, paddingBottom: 4 }}>
                {FIBONACCI.filter((v) => typeof v === 'number').map((v) => (
                  <div key={v} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{ fontSize: '.7rem', color: counts[v] ? T.gold : T.textMuted, fontWeight: 600 }}>{counts[v] || ''}</div>
                    <div style={{ width: '100%', background: counts[v] ? T.gold : `${T.gold}18`, borderRadius: '4px 4px 0 0', height: `${counts[v] ? (counts[v] / maxCnt) * 90 + 10 : 4}px`, transition: 'height .5s' }} />
                    <div style={{ fontSize: '.78rem', fontFamily: "'Playfair Display',serif", color: T.textMuted }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <h3 style={{ fontFamily: "'Playfair Display',serif", marginBottom: 14, fontSize: '1.05rem' }}>User Stories</h3>
            {sel.stories.map((st, i) => (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 10, marginBottom: 8, background: 'rgba(255,255,255,.04)', border: `1px solid ${T.goldDim}` }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: T.badge, color: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{st.title}</div>
                  {st.desc && <div style={{ fontSize: '.78rem', color: T.textMuted, marginTop: 2 }}>{st.desc}</div>}
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700, color: T.gold, flexShrink: 0 }}>{st.estimate}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>Seleziona una sessione</div>
        )}
      </div>
    </div>
  );
}
