const SESSION_PFX = 'pp_sess_';
const HISTORY_KEY = 'pp_history';

export const genId = (n = 6) => Math.random().toString(36).substring(2, 2 + n).toUpperCase();

export const loadSession = (id) => {
  try { return JSON.parse(localStorage.getItem(SESSION_PFX + id)); } catch { return null; }
};
export const saveSession = (s) => localStorage.setItem(SESSION_PFX + s.id, JSON.stringify(s));

export const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
};
export const saveHistory = (h) => localStorage.setItem(HISTORY_KEY, JSON.stringify(h));

export const loadPlayer = () => {
  try { return JSON.parse(sessionStorage.getItem('pp_player')); } catch { return null; }
};
export const savePlayer = (p) =>
  p ? sessionStorage.setItem('pp_player', JSON.stringify(p)) : sessionStorage.removeItem('pp_player');

export { SESSION_PFX };

export function createSession(hostName, timerLimit) {
  const id = genId(4);
  const pid = genId(10);
  const sess = {
    id, hostId: pid, timerLimit,
    stories: [], players: [{ id: pid, name: hostName, role: 'facilitator' }],
    currentStoryId: null, phase: 'lobby', timerStart: null, createdAt: Date.now(),
  };
  saveSession(sess);
  savePlayer({ id: pid, name: hostName, role: 'facilitator', sessionId: id });
  return { sess, pid };
}

export function joinSession(code, name) {
  const sess = loadSession(code.toUpperCase());
  if (!sess) return null;
  const pid = genId(10);
  sess.players = [
    ...sess.players.filter((p) => p.name !== name || p.role === 'facilitator'),
    { id: pid, name, role: 'player' },
  ];
  saveSession(sess);
  savePlayer({ id: pid, name, role: 'player', sessionId: sess.id });
  return { sess, pid };
}

export function computeStats(votes) {
  const nums = Object.values(votes).filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!nums.length) return null;
  const mean = (nums.reduce((s, v) => s + v, 0) / nums.length).toFixed(1);
  const mid = Math.floor(nums.length / 2);
  const median = nums.length % 2 === 0
    ? ((nums[mid - 1] + nums[mid]) / 2).toFixed(1)
    : String(nums[mid]);
  return {
    mean, median,
    range: `${nums[0]}–${nums[nums.length - 1]}`,
    consensus: nums.every((v) => v === nums[0]),
    nums,
  };
}
