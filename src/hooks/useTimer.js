import { useState, useEffect } from 'react';

export function useTimer(session) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!session?.timerStart) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - session.timerStart) / 1000));
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [session?.timerStart]);
  return elapsed;
}
