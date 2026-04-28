import { useState, useEffect } from 'react';
import { THEMES } from './themes.js';
import { clearPlayer, loadPlayer, savePlayer } from './utils/clientIdentity.js';
import { resumeSession, subscribeSession } from './services/realtimeClient.js';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSlider, TweakToggle } from './components/TweaksPanel.jsx';
import HomeView from './views/HomeView.jsx';
import FacilitatorView from './views/FacilitatorView.jsx';
import PlayerView from './views/PlayerView.jsx';
import HistoryView from './views/HistoryView.jsx';

const TWEAK_DEFAULTS = {
  theme: 'royal',
  timerLimit: 120,
  autoReveal: true,
};

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState('home');
  const [sess, setSess] = useState(null);
  const [pid, setPid] = useState(null);
  const [player, setPlayer] = useState(null);

  const T = THEMES[t.theme] || THEMES.casino;

  useEffect(() => {
    let ignore = false;
    const p = loadPlayer();
    if (!p) return;
    resumeSession({ sessionId: p.sessionId, playerId: p.id })
      .then(({ session, player: resumed }) => {
        if (ignore) return;
        savePlayer(resumed);
        setSess(session);
        setPid(resumed.id);
        setPlayer(resumed);
        setView(resumed.role === 'facilitator' ? 'facilitator' : 'player');
      })
      .catch(() => {
        if (ignore) return;
        clearPlayer();
      });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!sess?.id || !pid || view === 'home' || view === 'history') return;
    return subscribeSession({
      sessionId: sess.id,
      playerId: pid,
      onSnapshot: setSess,
    });
  }, [sess?.id, pid, view]);

  const onReady = (s, p, special) => {
    if (special === 'history') { setView('history'); return; }
    const nextPlayer = typeof p === 'string'
      ? { id: p, sessionId: s.id, role: 'player' }
      : p;
    savePlayer(nextPlayer);
    setSess(s);
    setPid(nextPlayer.id);
    setPlayer(nextPlayer);
    setView(nextPlayer.role === 'facilitator' ? 'facilitator' : 'player');
  };

  const onEnd = () => {
    clearPlayer();
    setSess(null);
    setPid(null);
    setPlayer(null);
    setView('history');
  };

  return (
    <>
      {view === 'home'        && <HomeView        onReady={onReady} timerLimit={t.timerLimit} T={T} />}
      {view === 'facilitator' && <FacilitatorView initSess={sess} pid={pid} player={player} onEnd={onEnd} autoReveal={t.autoReveal} T={T} />}
      {view === 'player'      && <PlayerView      initSess={sess} pid={pid} onLeave={() => setView('home')} T={T} />}
      {view === 'history'     && <HistoryView     onBack={() => setView('home')} T={T} />}

      <TweaksPanel>
        <TweakSection label="Tema / Theme" />
        <TweakRadio label="Stile visivo" value={t.theme}
          options={['casino', 'midnight', 'royal']}
          labels={['🎰 Casino Classic', '🌙 Midnight Blue', '♥ Royal Burgundy']}
          onChange={(v) => setTweak('theme', v)} />
        <TweakSection label="Sessione / Session" />
        <TweakSlider label="Timer per storia (sec)" value={t.timerLimit} min={30} max={300} step={15} unit="s"
          onChange={(v) => setTweak('timerLimit', v)} />
        <TweakToggle label="Auto-rivela quando tutti votano" value={t.autoReveal}
          onChange={(v) => setTweak('autoReveal', v)} />
      </TweaksPanel>
    </>
  );
}
