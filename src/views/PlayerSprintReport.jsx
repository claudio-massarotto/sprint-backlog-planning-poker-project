import { FIBONACCI } from '../themes.js';
import { savePlayer } from '../utils/storage.js';

export default function PlayerSprintReport({ sess, onBack, T }) {
  const stories = sess.finishedStories || sess.stories.filter((s) => s.status === 'done');
  const totalSP = stories.reduce((s, st) => s + (st.estimate || 0), 0);
  const fibNums = FIBONACCI.filter((v) => typeof v === 'number');
  const counts = {};
  fibNums.forEach((v) => { counts[v] = stories.filter((s) => s.estimate === v).length; });
  const maxCnt = Math.max(...Object.values(counts), 1);

  return (
    <div style={{ minHeight: '100vh', background: T.bgGrad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '40px 24px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 680 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🎉</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', color: T.gold, marginBottom: 6 }}>Sprint Completato!</h1>
          <p style={{ color: T.textMuted, fontSize: '.9rem' }}>
            Sessione <strong style={{ color: T.gold, letterSpacing: '.1em' }}>{sess.id}</strong>
            {' · '}
            {new Date(sess.finishedAt || Date.now()).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
          {[
            ['Story Points', 'Total', totalSP],
            ['Storie Stimate', 'Estimated', stories.length],
            ['Media SP', 'Avg SP', (totalSP / (stories.length || 1)).toFixed(1)],
          ].map(([it, en, v]) => (
            <div key={it} style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${T.goldDim}`, borderRadius: 12, padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '.68rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                {it}<span style={{ opacity: .45 }}> / {en}</span>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 700, color: T.gold }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${T.goldDim}`, borderRadius: 12, padding: '22px 20px', marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', color: T.text, marginBottom: 18 }}>Distribuzione Stime</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
            {fibNums.map((v) => (
              <div key={v} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: '.7rem', color: counts[v] ? T.gold : T.textMuted, fontWeight: 600 }}>{counts[v] || ''}</div>
                <div style={{ width: '100%', background: counts[v] ? T.gold : `${T.gold}18`, borderRadius: '4px 4px 0 0', height: `${counts[v] ? (counts[v] / maxCnt) * 80 + 8 : 4}px`, transition: 'height .6s' }} />
                <div style={{ fontSize: '.78rem', fontFamily: "'Playfair Display',serif", color: T.textMuted }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', color: T.text, marginBottom: 12 }}>User Stories Stimate</h3>
        {stories.length === 0 ? (
          <p style={{ color: T.textMuted, textAlign: 'center', padding: 24 }}>Nessuna storia stimata in questa sessione.</p>
        ) : stories.map((st, i) => (
          <div key={st.id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 10, marginBottom: 8, background: 'rgba(255,255,255,.04)', border: `1px solid ${T.goldDim}` }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: T.badge, color: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '.9rem', color: T.text }}>{st.title}</div>
              {st.desc && <div style={{ fontSize: '.75rem', color: T.textMuted, marginTop: 2 }}>{st.desc}</div>}
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', fontWeight: 700, color: T.gold, flexShrink: 0 }}>
              {st.estimate} <span style={{ fontSize: '.7rem', color: T.textMuted, fontFamily: 'Inter', fontWeight: 400 }}>SP</span>
            </div>
          </div>
        ))}

        <button onClick={() => { savePlayer(null); onBack(); }} style={{ display: 'block', margin: '28px auto 0', background: 'rgba(255,255,255,.07)', border: `1px solid ${T.goldDim}`, borderRadius: 9, padding: '12px 30px', color: T.textMuted, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, fontSize: '.88rem' }}>
          ← Torna alla Home
        </button>
      </div>
    </div>
  );
}
