import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import type { Express, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
const scrypt = promisify(derive);
const sessions = new Map<string, { userId: string; expires: number }>();
const attempts = new Map<string, { count: number; expires: number }>();
const ttl = 12 * 60 * 60 * 1000;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const credentials = z.object({ username: z.string().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9_-]+$/), password: z.string().min(12).max(128) });
export const userId = (res: Response): string => res.locals.user.id;
export const requireUser: RequestHandler = (_req, res, next) => {
  if (!res.locals.user) { res.status(401).json({ error: 'Sign in required' }); return; }
  next();
};
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${(await scrypt(password, salt, 64) as Buffer).toString('hex')}`;
}
async function verify(password: string, stored: string) {
  const [format, salt, hash] = stored.split(':');
  if (format !== 'scrypt' || !salt || !hash || hash.length !== 128) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
export function installAuth(app: Express) {
  app.use('/api', async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    // Browser mutations must originate from this app; cookies are also SameSite=Strict.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && req.headers.origin !== `${req.protocol}://${req.get('host')}`) {
      res.status(403).json({ error: 'Cross-origin mutation rejected' }); return;
    }
    const now = Date.now();
    for (const [key, session] of sessions) if (session.expires <= now) sessions.delete(key);
    const token = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('foodloop_session='))?.slice('foodloop_session='.length);
    const session = token && sessions.get(digest(token));
    try {
      if (session) {
        const user = await storage.getUser(session.userId);
        if (user) res.locals.user = { id: user.id, username: user.username };
      }
      next();
    } catch { res.status(503).json({ error: 'Account storage unavailable' }); }
  });
  app.get('/api/auth/me', (_req, res) => res.json({ user: res.locals.user ?? null }));
  for (const action of ['register', 'login']) {
    app.post(`/api/auth/${action}`, async (req, res) => {
      const now = Date.now();
      for (const [key, attempt] of attempts) if (attempt.expires <= now) attempts.delete(key);
      const key = req.ip ?? 'local';
      const attempt = attempts.get(key) ?? { count: 0, expires: now + 15 * 60 * 1000 };
      if (++attempt.count > 30 || attempts.size > 10000) { res.status(429).json({ error: 'Too many sign-in attempts; try again later' }); return; }
      attempts.set(key, attempt);
      const parsed = credentials.safeParse(req.body);
      if (!parsed.success) { res.status(400).json({ error: 'Use a 3–40 character username (letters, numbers, _ or -) and a 12–128 character password' }); return; }
      try {
        const { username, password } = parsed.data;
        let user = await storage.getUserByUsername(username);
        if (action === 'register') {
          if (user) { res.status(409).json({ error: 'Username unavailable' }); return; }
          try { user = await storage.createUser({ username, password: await hashPassword(password) }); }
          catch (error: any) { if (error.code === '23505' || error.message === 'Username unavailable') { res.status(409).json({ error: 'Username unavailable' }); return; } throw error; }
        } else if (!user || !await verify(password, user.password)) {
          // Always perform a KDF on unknown accounts too.
          if (!user) await hashPassword(password);
          res.status(401).json({ error: 'Invalid username or password' }); return;
        }
        const old = req.headers.cookie?.match(/(?:^|;\s*)foodloop_session=([^;]+)/)?.[1];
        if (old) sessions.delete(digest(old));
        if (sessions.size >= 10000) { res.status(503).json({ error: 'Session capacity reached' }); return; }
        const token = randomBytes(32).toString('hex');
        sessions.set(digest(token), { userId: user!.id, expires: now + ttl });
        res.cookie('foodloop_session', token, { httpOnly: true, sameSite: 'strict', secure: req.secure || process.env.COOKIE_SECURE === 'true', maxAge: ttl, path: '/' });
        res.status(action === 'register' ? 201 : 200).json({ user: { id: user!.id, username: user!.username } });
      } catch { res.status(503).json({ error: 'Account service unavailable' }); }
    });
  }
  app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.cookie?.match(/(?:^|;\s*)foodloop_session=([^;]+)/)?.[1];
    if (token) sessions.delete(digest(token));
    res.clearCookie('foodloop_session', { path: '/', httpOnly: true, sameSite: 'strict', secure: req.secure || process.env.COOKIE_SECURE === 'true' });
    res.status(204).end();
  });
}
