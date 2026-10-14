import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const DATA_DIR = process.env.PROMPTER_DATA || path.join(process.cwd(), 'data');

  // Ensure data dirs
  const dbDir = path.join(DATA_DIR, 'db');
  const photosDir = path.join(DATA_DIR, 'photos');
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
  if (!existsSync(photosDir)) mkdirSync(photosDir, { recursive: true });
  const usersFile = path.join(DATA_DIR, 'users.json');
  if (!existsSync(usersFile)) {
    await fs.writeFile(
      usersFile,
      JSON.stringify([{ id: 'main', name: 'Main User', isMain: true, createdAt: Date.now() }], null, 2)
    );
  }

  // Body parser with 100MB limit for JSON dbs and raw image uploads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.raw({ type: 'image/*', limit: '100mb' }));

  // Helper functions for users
  async function readUsers() {
    try {
      const data = await fs.readFile(usersFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [{ id: 'main', name: 'Main User', isMain: true, createdAt: Date.now() }];
    }
  }

  async function writeUsers(users: any[]) {
    await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
  }

  function validId(s: string) {
    return s && s.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(s);
  }

  function validFile(s: string) {
    return s && s.length <= 128 && !s.startsWith('.') && !s.includes('..') && /^[a-zA-Z0-9_.-]+$/.test(s);
  }

  // API Routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await readUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { name, id: customId } = req.body || {};
      const trimmed = (name || '').trim();
      if (!trimmed || trimmed.length > 60) {
        return res.status(400).json({ error: 'User name must be 1-60 characters' });
      }
      const users = await readUsers();
      const id = customId && validId(customId) ? customId : `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      if (users.some((u: any) => u.id === id)) {
        const existing = users.find((u: any) => u.id === id);
        return res.json(existing);
      }
      const newUser = { id, name: trimmed, isMain: false, createdAt: Date.now() };
      users.push(newUser);
      await writeUsers(users);
      await fs.mkdir(path.join(photosDir, id), { recursive: true });
      res.json(newUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
      if (id === 'main') return res.status(400).json({ error: 'The main user cannot be deleted' });
      let users = await readUsers();
      const before = users.length;
      users = users.filter((u: any) => u.id !== id);
      if (users.length === before) return res.status(404).json({ error: 'No such user' });
      await writeUsers(users);

      try { await fs.unlink(path.join(dbDir, `${id}.json`)); } catch {}
      try { await fs.unlink(path.join(dbDir, `${id}.bak.json`)); } catch {}
      try {
        const userPhotosDir = path.join(photosDir, id);
        if (existsSync(userPhotosDir)) {
          await fs.rm(userPhotosDir, { recursive: true, force: true });
        }
      } catch {}
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users/:id/db', async (req, res) => {
    try {
      const { id } = req.params;
      if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
      const dbFile = path.join(dbDir, `${id}.json`);
      if (!existsSync(dbFile)) {
        return res.status(404).json({ error: 'No saved database yet' });
      }
      const content = await fs.readFile(dbFile, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(content);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/users/:id/db', async (req, res) => {
    try {
      const { id } = req.params;
      if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
      const body = req.body;
      if (!body || typeof body !== 'object' || !Array.isArray(body.cats)) {
        return res.status(400).json({ error: 'Database JSON must contain a cats array' });
      }
      const dbFile = path.join(dbDir, `${id}.json`);
      const bakFile = path.join(dbDir, `${id}.bak.json`);
      if (existsSync(dbFile)) {
        try {
          const stats = await fs.stat(bakFile);
          const age = Date.now() - stats.mtimeMs;
          if (age > 5 * 60 * 1000) {
            await fs.copyFile(dbFile, bakFile);
          }
        } catch {
          try { await fs.copyFile(dbFile, bakFile); } catch {}
        }
      }
      const jsonStr = JSON.stringify(body, null, 2);
      await fs.writeFile(dbFile, jsonStr, 'utf-8');
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users/:id/photos', async (req, res) => {
    try {
      const { id } = req.params;
      if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
      const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/avif': 'avif'
      };
      const ext = extMap[contentType];
      if (!ext) {
        return res.status(415).json({ error: `Unsupported image type '${contentType}'` });
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Empty upload' });
      }
      const userPhotosDir = path.join(photosDir, id);
      if (!existsSync(userPhotosDir)) {
        await fs.mkdir(userPhotosDir, { recursive: true });
      }
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      await fs.writeFile(path.join(userPhotosDir, fileName), req.body);
      res.json({ url: `/files/${id}/${fileName}`, file: fileName });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/transfer-photo', async (req, res) => {
    try {
      const { fromUser, toUser, url } = req.body || {};
      if (!validId(fromUser) || !validId(toUser) || !url) {
        return res.status(400).json({ error: 'Invalid transfer request' });
      }
      const prefix = `/files/${fromUser}/`;
      if (!url.startsWith(prefix)) {
        return res.status(400).json({ error: 'URL does not belong to source user' });
      }
      const file = url.slice(prefix.length);
      if (!validFile(file)) {
        return res.status(400).json({ error: 'Invalid file name' });
      }
      if (fromUser === toUser) {
        return res.json({ url });
      }
      const srcPath = path.join(photosDir, fromUser, file);
      if (!existsSync(srcPath)) {
        return res.status(404).json({ error: 'Source photo not found' });
      }
      const ext = path.extname(file).slice(1) || 'jpg';
      const destDir = path.join(photosDir, toUser);
      if (!existsSync(destDir)) {
        await fs.mkdir(destDir, { recursive: true });
      }
      const destName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      await fs.copyFile(srcPath, path.join(destDir, destName));
      res.json({ url: `/files/${toUser}/${destName}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve photos statically
  app.use('/files', express.static(photosDir));

  // Vite integration in dev
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ultimate Prompter] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
