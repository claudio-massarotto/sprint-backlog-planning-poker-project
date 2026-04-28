async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Errore di comunicazione con il server');
  }
  return data;
}

const post = (path, body) => apiFetch(path, {
  method: 'POST',
  body: JSON.stringify(body || {}),
});

export const getServerInfo = () => apiFetch('/api/server-info');

export const getHistory = async () => {
  const data = await apiFetch('/api/history');
  return data.history || [];
};

export const createSession = ({ name, timerLimit }) =>
  post('/api/sessions', { name, timerLimit });

export const joinSession = ({ sessionId, name, playerId }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/join`, { name, playerId });

export const resumeSession = ({ sessionId, playerId }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/resume`, { playerId });

export const addStory = ({ sessionId, playerId, title, desc }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/stories`, { playerId, title, desc });

export const startVoting = ({ sessionId, playerId, storyId }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/stories/${encodeURIComponent(storyId)}/start`, { playerId });

export const castVote = ({ sessionId, playerId, value }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/vote`, { playerId, value });

export const revealVotes = ({ sessionId, playerId }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/reveal`, { playerId });

export const acceptEstimate = ({ sessionId, playerId, estimate }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/accept`, { playerId, estimate });

export const revote = ({ sessionId, playerId }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/revote`, { playerId });

export const finishSprint = ({ sessionId, playerId }) =>
  post(`/api/sessions/${encodeURIComponent(sessionId)}/finish`, { playerId });

export function subscribeSession({ sessionId, playerId, onSnapshot, onError }) {
  const url = `/api/sessions/${encodeURIComponent(sessionId)}/events?playerId=${encodeURIComponent(playerId)}`;
  const events = new EventSource(url);

  events.addEventListener('session_snapshot', (event) => {
    onSnapshot(JSON.parse(event.data));
  });

  events.onerror = () => {
    onError?.(new Error('Connessione realtime interrotta'));
  };

  return () => events.close();
}
