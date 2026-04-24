export default function PlayingCard({ value, selected, onClick, size = 'md', faceDown = false, dim = false, T, delay = 0 }) {
  const sz = {
    sm: { w: 54, h: 82, fs: '1.1rem', cs: '0.58rem' },
    md: { w: 74, h: 112, fs: '1.9rem', cs: '0.72rem' },
    lg: { w: 96, h: 144, fs: '2.4rem', cs: '0.88rem' },
  }[size];

  const isHigh = (typeof value === 'number' && value >= 13) || value === '?';
  const vColor = isHigh ? T.gold : T.cardText;

  if (faceDown) return (
    <div style={{
      width: sz.w, height: sz.h, borderRadius: 9, flexShrink: 0,
      background: `repeating-linear-gradient(45deg, ${T.cardBack} 0px, ${T.cardBack} 5px, ${T.cardBackStripe} 5px, ${T.cardBackStripe} 10px)`,
      border: `2px solid ${T.cardBorder}55`,
      boxShadow: '0 4px 14px rgba(0,0,0,.45)',
    }} />
  );

  return (
    <div
      onClick={onClick}
      className={delay ? 'flip-in' : ''}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        width: sz.w, height: sz.h, borderRadius: 9, flexShrink: 0, position: 'relative',
        background: T.cardFace,
        border: `2px solid ${selected ? T.gold : T.cardBorder}`,
        boxShadow: selected
          ? `0 20px 40px ${T.gold}55, 0 0 0 3px ${T.gold}88`
          : '0 4px 14px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.9)',
        cursor: onClick ? 'pointer' : 'default',
        transform: selected ? 'translateY(-18px) rotate(-1deg)' : 'none',
        transition: 'all .22s cubic-bezier(.34,1.56,.64,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: dim ? 0.45 : 1,
        '--pulse-color': T.gold + '66',
      }}
    >
      <span style={{
        position: 'absolute', top: 5, left: 7,
        fontFamily: "'Playfair Display',serif", fontWeight: 700,
        fontSize: sz.cs, color: vColor, lineHeight: 1.1, userSelect: 'none',
      }}>
        {value}<br /><span style={{ fontSize: '0.8em' }}>{T.suit}</span>
      </span>
      <span style={{
        fontFamily: "'Playfair Display',serif", fontWeight: 700,
        fontSize: sz.fs, color: vColor, userSelect: 'none',
      }}>{value}</span>
      <span style={{
        position: 'absolute', bottom: 5, right: 7,
        fontFamily: "'Playfair Display',serif", fontWeight: 700,
        fontSize: sz.cs, color: vColor, lineHeight: 1.1,
        transform: 'rotate(180deg)', textAlign: 'center', userSelect: 'none',
      }}>
        {value}<br /><span style={{ fontSize: '0.8em' }}>{T.suit}</span>
      </span>
      <div style={{
        position: 'absolute', inset: 4, borderRadius: 5,
        border: `1px solid ${T.cardBorder}66`, pointerEvents: 'none',
      }} />
    </div>
  );
}
