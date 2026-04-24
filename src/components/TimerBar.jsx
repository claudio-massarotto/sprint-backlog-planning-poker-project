export default function TimerBar({ elapsed, limit, T }) {
  const rem = Math.max(0, limit - elapsed);
  const pct = (rem / limit) * 100;
  const urgent = rem < 20 && rem > 0;
  const m = Math.floor(rem / 60);
  const s = String(rem % 60).padStart(2, '0');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 110, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: urgent ? T.danger : T.gold,
          borderRadius: 3, transition: 'width .5s',
        }} />
      </div>
      <span style={{
        fontFamily: "'Playfair Display',serif", fontSize: '1.05rem',
        color: urgent ? T.danger : T.gold, fontWeight: 600, minWidth: 42,
      }}>{m}:{s}</span>
    </div>
  );
}
