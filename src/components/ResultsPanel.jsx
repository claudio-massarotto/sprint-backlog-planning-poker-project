import { useState, useMemo } from 'react';
import { FIBONACCI } from '../themes.js';
import { computeStats } from '../utils/storage.js';
import PlayingCard from './PlayingCard.jsx';

export default function ResultsPanel({ session, story, onAccept, onRevote, readonly, T }) {
  const stats = useMemo(() => computeStats(story.votes), [story.votes]);
  const players = session.players;
  const fibNums = FIBONACCI.filter((v) => typeof v === 'number');

  const [chosen, setChosen] = useState(() => {
    if (!stats) return null;
    if (stats.consensus) return Number(stats.median);
    const mean = parseFloat(stats.mean);
    return fibNums.reduce((p, c) => Math.abs(c - mean) < Math.abs(p - mean) ? c : p);
  });

  if (!stats) return <div style={{ color: T.textMuted }}>Nessun voto registrato.</div>;

  return (
    <div style={{ width: '100%', maxWidth: 680 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '.72rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Risultati / Results</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.7rem', color: T.text, lineHeight: 1.3 }}>{story.title}</h2>
      </div>

      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
        {players.filter((p) => story.votes[p.id] !== undefined).map((p, i) => (
          <div key={p.id} style={{ textAlign: 'center' }}>
            <PlayingCard value={story.votes[p.id]} size="md" T={T} delay={i * 60} />
            <div style={{ fontSize: '.72rem', color: T.textMuted, marginTop: 6, maxWidth: 76, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '6px auto 0' }}>{p.name}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[['Media', 'Mean', stats.mean], ['Mediana', 'Median', stats.median], ['Range', 'Range', stats.range]].map(([it, en, val]) => (
          <div key={it} style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${T.goldDim}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '.7rem', color: T.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>
              {it}<span style={{ opacity: .5 }}> / {en}</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', fontWeight: 700, color: T.gold }}>{val}</div>
          </div>
        ))}
      </div>

      {!readonly && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 12, fontSize: '.85rem', color: stats.consensus ? T.success : T.textMuted, fontWeight: 600 }}>
            {stats.consensus ? '✅ Consenso raggiunto! / Consensus reached!' : 'Seleziona la stima finale / Select final estimate:'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
            {fibNums.map((v) => (
              <button key={v} onClick={() => setChosen(v)} style={{
                width: 44, height: 44, borderRadius: 8, cursor: 'pointer',
                background: chosen === v ? T.btn : 'rgba(255,255,255,.07)',
                border: `2px solid ${chosen === v ? T.gold : T.goldDim}`,
                color: chosen === v ? T.btnText : T.text,
                fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', transition: 'all .15s',
              }}>{v}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => chosen != null && onAccept(chosen)} style={{
              background: chosen != null ? T.btn : `${T.btn}66`, color: T.btnText, border: 'none', borderRadius: 10,
              padding: '13px 30px', fontFamily: 'Inter', fontWeight: 700, cursor: chosen != null ? 'pointer' : 'not-allowed', transition: 'all .2s',
            }}>✅ Accetta {chosen != null ? `(${chosen} SP)` : ''}</button>
            <button onClick={onRevote} style={{ background: 'rgba(255,255,255,.07)', color: T.text, border: `1px solid ${T.goldDim}`, borderRadius: 10, padding: '13px 24px', fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer' }}>
              🔄 Rivota
            </button>
          </div>
        </>
      )}
    </div>
  );
}
