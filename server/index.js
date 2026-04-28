import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  acceptEstimate,
  addStory,
  castVote,
  createSession,
  finishSprint,
  getHistory,
  joinSession,
  markDisconnected,
  resumeSession,
  revealVotes,
  revote,
  snapshotSession,
  startVoting,
} from './sessionStore.js';
import { getLocalUrls, printServerUrls } from './network.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PORT_ATTEMPTS = 20;
let activePort = PORT;
let publicIpCache = null;
let publicIpCacheAt = 0;

const clients = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(Object.assign(new Error('Payload troppo grande'), { statusCode: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error('JSON non valido'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function addClient(sessionId, playerId, res) {
  const key = String(sessionId).toUpperCase();
  if (!clients.has(key)) clients.set(key, new Set());

  const client = { playerId, res };
  clients.get(key).add(client);

  reqWriteEvent(res, 'session_snapshot', snapshotSession(key, playerId));

  return () => {
    clients.get(key)?.delete(client);
    if (clients.get(key)?.size === 0) clients.delete(key);
    const session = markDisconnected(key, playerId);
    if (session) broadcastSession(session.id);
  };
}

function reqWriteEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcastSession(sessionId) {
  const key = String(sessionId).toUpperCase();
  const sessionClients = clients.get(key);
  if (!sessionClients) return;

  for (const client of sessionClients) {
    reqWriteEvent(client.res, 'session_snapshot', snapshotSession(key, client.playerId));
  }
}

function getClientBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${req.headers.host}`;
}

async function getPublicIp() {
  const now = Date.now();
  if (publicIpCache && now - publicIpCacheAt < 5 * 60 * 1000) {
    return publicIpCache;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    publicIpCache = data.ip || null;
    publicIpCacheAt = now;
    return publicIpCache;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function serveStatic(req, res) {
  if (!fs.existsSync(DIST)) {
    sendJson(res, 503, {
      error: 'Frontend non compilato. Esegui npm run build prima di avviare il server.',
    });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(DIST, safePath);

  if (!filePath.startsWith(DIST)) {
    sendJson(res, 403, { error: 'Percorso non valido' });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
  });
  fs.createReadStream(filePath).pipe(res);
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/server-info') {
    const publicIp = await getPublicIp();
    sendJson(res, 200, {
      baseUrl: getClientBaseUrl(req),
      localUrls: getLocalUrls(activePort),
      publicIp,
      publicUrl: publicIp ? `http://${publicIp}:${activePort}` : null,
      port: activePort,
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/history') {
    sendJson(res, 200, { history: getHistory() });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/sessions') {
    const body = await readBody(req);
    const { session, playerId } = createSession({
      hostName: body.name,
      timerLimit: body.timerLimit,
    });
    sendJson(res, 201, {
      session: snapshotSession(session.id, playerId),
      player: {
        id: playerId,
        name: body.name,
        role: 'facilitator',
        sessionId: session.id,
      },
    });
    broadcastSession(session.id);
    return;
  }

  if (pathParts[0] === 'api' && pathParts[1] === 'sessions' && pathParts[2]) {
    const sessionId = pathParts[2].toUpperCase();

    if (req.method === 'GET' && pathParts[3] === 'events') {
      const playerId = url.searchParams.get('playerId');
      if (!playerId) {
        sendJson(res, 400, { error: 'playerId obbligatorio' });
        return;
      }

      resumeSession(sessionId, playerId);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write('retry: 1500\n\n');
      const cleanup = addClient(sessionId, playerId, res);
      broadcastSession(sessionId);
      req.on('close', cleanup);
      return;
    }

    const body = req.method === 'POST' ? await readBody(req) : {};
    const playerId = body.playerId;
    let session;

    if (req.method === 'POST' && pathParts[3] === 'join') {
      const result = joinSession(sessionId, { name: body.name, playerId: body.playerId });
      sendJson(res, 200, {
        session: snapshotSession(sessionId, result.playerId),
        player: {
          id: result.playerId,
          name: body.name,
          role: 'player',
          sessionId,
        },
      });
      broadcastSession(sessionId);
      return;
    }

    if (req.method === 'POST' && pathParts[3] === 'resume') {
      const result = resumeSession(sessionId, body.playerId);
      const player = result.session.players.find((item) => item.id === result.playerId);
      sendJson(res, 200, {
        session: snapshotSession(sessionId, result.playerId),
        player: {
          id: result.playerId,
          name: player.name,
          role: player.role,
          sessionId,
        },
      });
      broadcastSession(sessionId);
      return;
    }

    if (req.method === 'POST' && pathParts[3] === 'stories' && !pathParts[4]) {
      session = addStory(sessionId, playerId, { title: body.title, desc: body.desc });
    } else if (req.method === 'POST' && pathParts[3] === 'stories' && pathParts[4] && pathParts[5] === 'start') {
      session = startVoting(sessionId, playerId, pathParts[4]);
    } else if (req.method === 'POST' && pathParts[3] === 'vote') {
      session = castVote(sessionId, playerId, body.value);
    } else if (req.method === 'POST' && pathParts[3] === 'reveal') {
      session = revealVotes(sessionId, playerId);
    } else if (req.method === 'POST' && pathParts[3] === 'accept') {
      session = acceptEstimate(sessionId, playerId, body.estimate);
    } else if (req.method === 'POST' && pathParts[3] === 'revote') {
      session = revote(sessionId, playerId);
    } else if (req.method === 'POST' && pathParts[3] === 'finish') {
      session = finishSprint(sessionId, playerId);
    } else {
      sendJson(res, 404, { error: 'Endpoint non trovato' });
      return;
    }

    sendJson(res, 200, { session: snapshotSession(session.id, playerId) });
    broadcastSession(session.id);
    return;
  }

  sendJson(res, 404, { error: 'Endpoint non trovato' });
}

async function requestHandler(req, res) {
  try {
    if (req.url.startsWith('/api/')) {
      await handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || 'Errore interno',
    });
  }
}

function listen(port, attempts = 0) {
  const candidate = http.createServer(requestHandler);

  candidate.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempts < MAX_PORT_ATTEMPTS) {
      candidate.close();
      listen(port + 1, attempts + 1);
      return;
    }

    if (error.code === 'EADDRINUSE') {
      console.error(`Nessuna porta libera trovata tra ${PORT} e ${port}.`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });

  candidate.listen(port, HOST, () => {
    activePort = port;
    printServerUrls(port);
  });
}

listen(PORT);
