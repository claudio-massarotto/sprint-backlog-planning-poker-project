import fs from 'node:fs';
import path from 'node:path';

const HISTORY_FILE = path.resolve(process.cwd(), 'data', 'history.json');
const sessions = new Map();

const FIBONACCI_VALUES = new Set([1, 2, 3, 5, 8, 13, 21, '?']);

export function genId(n = 6) {
  return Math.random().toString(36).substring(2, 2 + n).toUpperCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureSession(id) {
  const session = sessions.get(String(id || '').toUpperCase());
  if (!session) {
    const err = new Error('Sessione non trovata');
    err.statusCode = 404;
    throw err;
  }
  return session;
}

function ensureHost(session, playerId) {
  if (session.hostId !== playerId) {
    const err = new Error('Solo il facilitatore puo eseguire questa azione');
    err.statusCode = 403;
    throw err;
  }
}

function ensureDataDir() {
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
}

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeHistory(history) {
  ensureDataDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function publicStory(story, session, viewerId) {
  const votes = {};
  const showValues = session.phase === 'revealed' || session.phase === 'finished' || story.status === 'revealed' || story.status === 'done';

  for (const [playerId, value] of Object.entries(story.votes || {})) {
    if (showValues || playerId === viewerId) {
      votes[playerId] = value;
    } else {
      votes[playerId] = true;
    }
  }

  return { ...story, votes };
}

export function snapshotSession(sessionId, viewerId) {
  const session = ensureSession(sessionId);
  return {
    ...clone(session),
    stories: session.stories.map((story) => publicStory(story, session, viewerId)),
  };
}

export function createSession({ hostName, timerLimit }) {
  const sessionId = genId(4);
  const hostId = genId(10);
  const session = {
    id: sessionId,
    hostId,
    timerLimit: Number(timerLimit) || 120,
    stories: [],
    players: [{
      id: hostId,
      name: String(hostName || '').trim(),
      role: 'facilitator',
      connected: true,
      lastSeen: Date.now(),
    }],
    currentStoryId: null,
    phase: 'lobby',
    timerStart: null,
    createdAt: Date.now(),
  };

  sessions.set(sessionId, session);
  return { session, playerId: hostId };
}

export function joinSession(sessionId, { name, playerId }) {
  const session = ensureSession(sessionId);
  if (session.phase === 'finished') {
    const err = new Error('Sessione gia terminata');
    err.statusCode = 409;
    throw err;
  }

  const cleanName = String(name || '').trim();
  if (!cleanName) {
    const err = new Error('Nome obbligatorio');
    err.statusCode = 400;
    throw err;
  }

  const existing = playerId && session.players.find((player) => player.id === playerId && player.role !== 'facilitator');
  if (existing) {
    existing.name = cleanName;
    existing.connected = true;
    existing.lastSeen = Date.now();
    return { session, playerId: existing.id };
  }

  const id = genId(10);
  session.players.push({
    id,
    name: cleanName,
    role: 'player',
    connected: true,
    lastSeen: Date.now(),
  });

  return { session, playerId: id };
}

export function resumeSession(sessionId, playerId) {
  const session = ensureSession(sessionId);
  const player = session.players.find((item) => item.id === playerId);
  if (!player) {
    const err = new Error('Partecipante non trovato');
    err.statusCode = 404;
    throw err;
  }
  player.connected = true;
  player.lastSeen = Date.now();
  return { session, playerId };
}

export function markDisconnected(sessionId, playerId) {
  const session = sessions.get(String(sessionId || '').toUpperCase());
  if (!session) return null;
  const player = session.players.find((item) => item.id === playerId);
  if (!player) return null;
  player.connected = false;
  player.lastSeen = Date.now();
  return session;
}

export function addStory(sessionId, playerId, { title, desc }) {
  const session = ensureSession(sessionId);
  ensureHost(session, playerId);

  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    const err = new Error('Titolo storia obbligatorio');
    err.statusCode = 400;
    throw err;
  }

  session.stories.push({
    id: genId(10),
    title: cleanTitle,
    desc: String(desc || '').trim(),
    status: 'pending',
    votes: {},
    estimate: null,
  });

  return session;
}

export function startVoting(sessionId, playerId, storyId) {
  const session = ensureSession(sessionId);
  ensureHost(session, playerId);

  const story = session.stories.find((item) => item.id === storyId);
  if (!story) {
    const err = new Error('Storia non trovata');
    err.statusCode = 404;
    throw err;
  }

  session.currentStoryId = storyId;
  session.phase = 'voting';
  session.timerStart = Date.now();
  session.stories = session.stories.map((item) => {
    if (item.id === storyId) return { ...item, status: 'voting', votes: {} };
    if (item.status === 'voting' || item.status === 'revealed') return { ...item, status: 'pending' };
    return item;
  });

  return session;
}

export function castVote(sessionId, playerId, value) {
  const session = ensureSession(sessionId);
  if (session.phase !== 'voting') {
    const err = new Error('La votazione non e attiva');
    err.statusCode = 409;
    throw err;
  }

  const player = session.players.find((item) => item.id === playerId && item.role !== 'facilitator');
  if (!player) {
    const err = new Error('Solo i player possono votare');
    err.statusCode = 403;
    throw err;
  }

  if (!FIBONACCI_VALUES.has(value)) {
    const err = new Error('Voto non valido');
    err.statusCode = 400;
    throw err;
  }

  const story = session.stories.find((item) => item.id === session.currentStoryId);
  if (!story) {
    const err = new Error('Storia corrente non trovata');
    err.statusCode = 404;
    throw err;
  }

  story.votes[playerId] = value;
  player.lastSeen = Date.now();
  return session;
}

export function revealVotes(sessionId, playerId) {
  const session = ensureSession(sessionId);
  ensureHost(session, playerId);

  if (!session.currentStoryId) {
    const err = new Error('Nessuna storia in votazione');
    err.statusCode = 409;
    throw err;
  }

  session.phase = 'revealed';
  session.stories = session.stories.map((story) =>
    story.id === session.currentStoryId ? { ...story, status: 'revealed' } : story
  );

  return session;
}

export function acceptEstimate(sessionId, playerId, estimate) {
  const session = ensureSession(sessionId);
  ensureHost(session, playerId);

  if (!session.currentStoryId) {
    const err = new Error('Nessuna storia corrente');
    err.statusCode = 409;
    throw err;
  }

  session.phase = 'lobby';
  session.timerStart = null;
  session.stories = session.stories.map((story) =>
    story.id === session.currentStoryId ? { ...story, status: 'done', estimate } : story
  );
  session.currentStoryId = null;

  return session;
}

export function revote(sessionId, playerId) {
  const session = ensureSession(sessionId);
  ensureHost(session, playerId);

  if (!session.currentStoryId) {
    const err = new Error('Nessuna storia corrente');
    err.statusCode = 409;
    throw err;
  }

  session.phase = 'voting';
  session.timerStart = Date.now();
  session.stories = session.stories.map((story) =>
    story.id === session.currentStoryId ? { ...story, votes: {}, status: 'voting' } : story
  );

  return session;
}

export function finishSprint(sessionId, playerId) {
  const session = ensureSession(sessionId);
  ensureHost(session, playerId);

  const done = session.stories.filter((story) => story.status === 'done');
  const record = {
    id: session.id,
    date: Date.now(),
    stories: done,
    players: session.players.length,
  };
  const history = readHistory();
  history.unshift(record);
  writeHistory(history);

  session.phase = 'finished';
  session.finishedAt = Date.now();
  session.finishedStories = done;
  return session;
}

export function getHistory() {
  return readHistory();
}
