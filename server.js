import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(__dirname, 'data');
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const TICK_RATE = 20;

mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(join(DATA_DIR, 'space-command.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    credits INTEGER NOT NULL DEFAULT 1200,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    hull_level INTEGER NOT NULL DEFAULT 1,
    engine_level INTEGER NOT NULL DEFAULT 1,
    weapon_level INTEGER NOT NULL DEFAULT 1,
    color TEXT NOT NULL DEFAULT '#69e7ff',
    volume INTEGER NOT NULL DEFAULT 70
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
`);

const fastify = Fastify({ logger: true, bodyLimit: 32 * 1024 });

await fastify.register(fastifyStatic, {
  root: join(__dirname, 'src'),
  prefix: '/src/',
});
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'models'),
  prefix: '/models/',
  decorateReply: false,
});
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'textures'),
  prefix: '/textures/',
  decorateReply: false,
});
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'node_modules', 'three'),
  prefix: '/vendor/three/',
  decorateReply: false,
});
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'node_modules', 'socket.io-client', 'dist'),
  prefix: '/vendor/socket.io-client/',
  decorateReply: false,
});

fastify.get('/', (_, reply) => reply.sendFile('index.html', __dirname));
fastify.get('/style.css', (_, reply) => reply.sendFile('style.css', __dirname));

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((part) => part.trim().split('=')).filter(([key]) => key),
  );
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    credits: user.credits,
    level: user.level,
    experience: user.experience,
    upgrades: {
      hull: user.hull_level,
      engine: user.engine_level,
      weapon: user.weapon_level,
    },
    settings: {
      color: user.color,
      volume: user.volume,
    },
  };
}

function getUserByToken(token) {
  if (!token) return null;
  return db.prepare(`
    SELECT users.*
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ? AND sessions.expires_at > ?
  `).get(token, Date.now()) ?? null;
}

function getRequestUser(request) {
  return getUserByToken(parseCookies(request.headers.cookie).session);
}

function createSession(userId, reply) {
  const token = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, userId, Date.now() + SESSION_MAX_AGE * 1000);
  reply.header(
    'Set-Cookie',
    `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE}`,
  );
}

function requireUser(request, reply) {
  const user = getRequestUser(request);
  if (!user) {
    reply.code(401).send({ error: 'Нужна авторизация' });
    return null;
  }
  return user;
}

fastify.post('/api/auth/register', async (request, reply) => {
  const username = String(request.body?.username ?? '').trim();
  const password = String(request.body?.password ?? '');

  if (!/^[a-zA-Zа-яА-Я0-9_-]{3,18}$/u.test(username)) {
    return reply.code(400).send({ error: 'Имя: 3–18 букв, цифр, _ или -' });
  }
  if (password.length < 6 || password.length > 72) {
    return reply.code(400).send({ error: 'Пароль должен содержать 6–72 символа' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    ).run(username, hashPassword(password));
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    createSession(user.id, reply);
    return { user: sanitizeUser(user) };
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return reply.code(409).send({ error: 'Этот позывной уже занят' });
    }
    throw error;
  }
});

fastify.post('/api/auth/login', async (request, reply) => {
  const username = String(request.body?.username ?? '').trim();
  const password = String(request.body?.password ?? '');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return reply.code(401).send({ error: 'Неверный позывной или пароль' });
  }

  createSession(user.id, reply);
  return { user: sanitizeUser(user) };
});

fastify.post('/api/auth/logout', async (request, reply) => {
  const token = parseCookies(request.headers.cookie).session;
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  reply.header('Set-Cookie', 'session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  return { ok: true };
});

fastify.get('/api/me', async (request, reply) => {
  const user = requireUser(request, reply);
  if (!user) return;
  return { user: sanitizeUser(user) };
});

fastify.patch('/api/settings', async (request, reply) => {
  const user = requireUser(request, reply);
  if (!user) return;

  const color = String(request.body?.color ?? '');
  const volume = Number(request.body?.volume);
  if (!/^#[0-9a-f]{6}$/i.test(color) || !Number.isInteger(volume) || volume < 0 || volume > 100) {
    return reply.code(400).send({ error: 'Некорректные настройки' });
  }

  db.prepare('UPDATE users SET color = ?, volume = ? WHERE id = ?').run(color, volume, user.id);
  return { user: sanitizeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)) };
});

fastify.post('/api/upgrade', async (request, reply) => {
  const user = requireUser(request, reply);
  if (!user) return;

  const type = String(request.body?.type ?? '');
  const columns = { hull: 'hull_level', engine: 'engine_level', weapon: 'weapon_level' };
  const column = columns[type];
  if (!column) return reply.code(400).send({ error: 'Неизвестное улучшение' });

  const currentLevel = user[column];
  const cost = 350 * currentLevel;
  if (currentLevel >= 5) return reply.code(400).send({ error: 'Достигнут максимальный уровень' });
  if (user.credits < cost) return reply.code(400).send({ error: 'Недостаточно кредитов' });

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`UPDATE users SET credits = credits - ?, ${column} = ${column} + 1 WHERE id = ?`)
      .run(cost, user.id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return { user: sanitizeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)) };
});

const io = new Server(fastify.server, {
  cors: { origin: false },
  transports: ['websocket', 'polling'],
});

const players = new Map();
const asteroids = Array.from({ length: 18 }, (_, index) => createAsteroid(index));

function createAsteroid(id) {
  return {
    id,
    x: (Math.random() - 0.5) * 110,
    y: (Math.random() - 0.5) * 55,
    z: -30 - Math.random() * 140,
    size: 0.8 + Math.random() * 2.6,
    speed: 3 + Math.random() * 5,
    spin: (Math.random() - 0.5) * 1.4,
  };
}

function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    x: player.x,
    y: player.y,
    z: player.z,
    yaw: player.yaw,
    pitch: player.pitch,
    hp: player.hp,
    level: player.level,
    score: player.score,
  };
}

io.use((socket, next) => {
  const token = parseCookies(socket.request.headers.cookie).session;
  const user = getUserByToken(token);
  if (!user) return next(new Error('unauthorized'));
  socket.data.user = user;
  next();
});

io.on('connection', (socket) => {
  const user = socket.data.user;

  socket.on('game:join', () => {
    if (players.has(socket.id)) return;
    const player = {
      id: socket.id,
      userId: user.id,
      name: user.username,
      color: user.color,
      level: user.level,
      x: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 10,
      z: 8,
      yaw: 0,
      pitch: 0,
      hp: 100 + (user.hull_level - 1) * 20,
      maxHp: 100 + (user.hull_level - 1) * 20,
      speed: 16 + user.engine_level * 2,
      damage: 12 + user.weapon_level * 4,
      score: 0,
      input: { x: 0, y: 0, boost: false },
      lastShot: 0,
    };
    players.set(socket.id, player);
    socket.emit('game:init', {
      selfId: socket.id,
      players: [...players.values()].map(publicPlayer),
      asteroids,
    });
    socket.broadcast.emit('player:joined', publicPlayer(player));
  });

  socket.on('player:input', (input) => {
    const player = players.get(socket.id);
    if (!player) return;
    player.input.x = Math.max(-1, Math.min(1, Number(input?.x) || 0));
    player.input.y = Math.max(-1, Math.min(1, Number(input?.y) || 0));
    player.input.boost = Boolean(input?.boost);
  });

  socket.on('player:aim', (aim) => {
    const player = players.get(socket.id);
    if (!player) return;
    player.yaw = Math.max(-0.75, Math.min(0.75, Number(aim?.yaw) || 0));
    player.pitch = Math.max(-0.5, Math.min(0.5, Number(aim?.pitch) || 0));
  });

  socket.on('player:shoot', () => {
    const player = players.get(socket.id);
    const now = Date.now();
    if (!player || now - player.lastShot < 280) return;
    player.lastShot = now;
    io.emit('weapon:fired', {
      playerId: player.id,
      x: player.x,
      y: player.y,
      z: player.z - 2,
      yaw: player.yaw,
      pitch: player.pitch,
      color: player.color,
    });
  });

  socket.on('disconnect', () => {
    if (!players.delete(socket.id)) return;
    io.emit('player:left', socket.id);
  });
});

setInterval(() => {
  const dt = 1 / TICK_RATE;

  for (const player of players.values()) {
    const speed = player.speed * (player.input.boost ? 1.65 : 1);
    player.x = Math.max(-42, Math.min(42, player.x + player.input.x * speed * dt));
    player.y = Math.max(-23, Math.min(23, player.y + player.input.y * speed * dt));
  }

  for (const asteroid of asteroids) {
    asteroid.z += asteroid.speed * dt;
    if (asteroid.z > 18) Object.assign(asteroid, createAsteroid(asteroid.id));

    for (const player of players.values()) {
      const dx = player.x - asteroid.x;
      const dy = player.y - asteroid.y;
      const dz = player.z - asteroid.z;
      if (dx * dx + dy * dy + dz * dz < (asteroid.size + 1.2) ** 2) {
        player.hp = Math.max(0, player.hp - 18);
        Object.assign(asteroid, createAsteroid(asteroid.id));
        if (player.hp === 0) {
          player.hp = player.maxHp;
          player.x = 0;
          player.y = 0;
          player.score = Math.max(0, player.score - 100);
        }
      }
    }
  }

  if (players.size) {
    io.emit('game:snapshot', {
      players: [...players.values()].map(publicPlayer),
      asteroids,
      serverTime: Date.now(),
    });
  }
}, 1000 / TICK_RATE);

const port = Number(process.env.PORT) || 7000;
await fastify.listen({ port, host: '0.0.0.0' });
console.log(`Space Command: http://localhost:${port}`);
