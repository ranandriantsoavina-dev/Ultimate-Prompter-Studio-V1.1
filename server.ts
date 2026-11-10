import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import multer from 'multer';
import AdmZip from 'adm-zip';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const DATA_DIR = process.env.PROMPTER_DATA || path.join(process.cwd(), 'data');

  // Ensure data dirs
  const dbDir = path.join(DATA_DIR, 'db');
  const photosDir = path.join(DATA_DIR, 'photos');
  const exportsDir = path.join(DATA_DIR, 'exports');
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
  if (!existsSync(photosDir)) mkdirSync(photosDir, { recursive: true });
  if (!existsSync(exportsDir)) mkdirSync(exportsDir, { recursive: true });
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

  // Multer for zip archive uploads (500MB max)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }
  });

  const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg', '.bmp']);

  async function getAllFiles(dir: string, baseDir: string = dir): Promise<{ fullPath: string; relPath: string }[]> {
    const results: { fullPath: string; relPath: string }[] = [];
    if (!existsSync(dir)) return results;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const nested = await getAllFiles(fullPath, baseDir);
          results.push(...nested);
        } else if (entry.isFile()) {
          const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          results.push({ fullPath, relPath });
        }
      }
    } catch (err) {
      console.warn(`Error scanning directory ${dir}:`, err);
    }
    return results;
  }

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

  app.patch('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
      const { name } = req.body || {};
      const trimmed = (name || '').trim();
      if (!trimmed || trimmed.length > 60) {
        return res.status(400).json({ error: 'User name must be 1-60 characters' });
      }
      let users = await readUsers();
      const user = users.find((u: any) => u.id === id);
      if (!user) return res.status(404).json({ error: 'No such user' });
      user.name = trimmed;
      await writeUsers(users);
      res.json(user);
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

  app.post('/api/users/:id/restore', async (req, res) => {
    try {
      const { id } = req.params;
      if (!validId(id)) return res.status(400).json({ error: 'Invalid user id' });
      const userBakFile = path.join(dbDir, `${id}.bak.json`);
      const mainBakFile = path.join(dbDir, 'main.bak.json');
      const mainFile = path.join(dbDir, 'main.json');
      const targetDbFile = path.join(dbDir, `${id}.json`);

      let sourceFile = '';
      if (existsSync(userBakFile)) sourceFile = userBakFile;
      else if (existsSync(mainBakFile)) sourceFile = mainBakFile;
      else if (existsSync(mainFile)) sourceFile = mainFile;

      if (!sourceFile) {
        return res.status(404).json({ error: 'No backup or actual data database found to restore from' });
      }

      const content = await fs.readFile(sourceFile, 'utf-8');
      await fs.writeFile(targetDbFile, content, 'utf-8');
      if (id === 'main' && sourceFile !== mainFile) {
        try { await fs.writeFile(mainFile, content, 'utf-8'); } catch {}
      }

      res.setHeader('Content-Type', 'application/json');
      res.send(content);
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

  // -------------------------------------------------------------------------
  // FULL EXPORT & FULL IMPORT APIs
  // -------------------------------------------------------------------------

  // GET /api/export/full - Packages main JSON data + all images in data/ into a dedicated folder and .zip archive
  app.get('/api/export/full', async (req, res) => {
    try {
      const userId = (req.query.userId as string) || 'main';
      const dbFile = path.join(dbDir, `${userId}.json`);
      const mainDbFile = path.join(dbDir, 'main.json');

      let dbContent = '';
      if (existsSync(dbFile)) {
        dbContent = await fs.readFile(dbFile, 'utf-8');
      } else if (existsSync(mainDbFile)) {
        dbContent = await fs.readFile(mainDbFile, 'utf-8');
      }

      if (!dbContent) {
        return res.status(404).json({ error: 'No database file found to export' });
      }

      let parsedDb: any;
      try {
        parsedDb = JSON.parse(dbContent);
      } catch (e: any) {
        return res.status(500).json({ error: `Corrupt database file: ${e.message}` });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFolderName = `export_${userId}_${timestamp}`;
      const dedicatedExportDir = path.join(exportsDir, exportFolderName);
      await fs.mkdir(dedicatedExportDir, { recursive: true });
      const dedicatedPhotosDir = path.join(dedicatedExportDir, 'photos');
      await fs.mkdir(dedicatedPhotosDir, { recursive: true });

      // 1. Write the main JSON data file to the dedicated export folder
      await fs.writeFile(path.join(dedicatedExportDir, 'database.json'), JSON.stringify(parsedDb, null, 2), 'utf-8');
      if (userId === 'main') {
        await fs.writeFile(path.join(dedicatedExportDir, 'main.json'), JSON.stringify(parsedDb, null, 2), 'utf-8');
      }

      // 2. Gather all image files located in data/photos and data/
      const allPhotos = await getAllFiles(photosDir);
      const photoImages = allPhotos.filter(f => IMAGE_EXTS.has(path.extname(f.relPath).toLowerCase()));

      const rootFiles = await fs.readdir(DATA_DIR, { withFileTypes: true });
      const extraRootImages: { fullPath: string; relPath: string }[] = [];
      for (const ent of rootFiles) {
        if (ent.isFile() && IMAGE_EXTS.has(path.extname(ent.name).toLowerCase())) {
          extraRootImages.push({
            fullPath: path.join(DATA_DIR, ent.name),
            relPath: ent.name
          });
        }
      }

      const allImagesToExport = [...photoImages, ...extraRootImages];

      // Copy each image to dedicated export folder
      for (const img of allImagesToExport) {
        const destImgPath = path.join(dedicatedPhotosDir, img.relPath);
        await fs.mkdir(path.dirname(destImgPath), { recursive: true });
        await fs.copyFile(img.fullPath, destImgPath);
      }

      // 3. Create manifest
      const manifest = {
        app: 'Ultimate Prompter Studio',
        version: '1.1',
        exportedAt: new Date().toISOString(),
        timestamp,
        userId,
        databaseFile: 'database.json',
        imageCount: allImagesToExport.length,
        images: allImagesToExport.map(img => img.relPath)
      };
      await fs.writeFile(
        path.join(dedicatedExportDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
      );

      // 4. Create ZIP archive
      const zip = new AdmZip();
      zip.addFile('database.json', Buffer.from(JSON.stringify(parsedDb, null, 2), 'utf-8'));
      if (userId === 'main') {
        zip.addFile('main.json', Buffer.from(JSON.stringify(parsedDb, null, 2), 'utf-8'));
      }
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));

      for (const img of allImagesToExport) {
        try {
          const fileData = await fs.readFile(img.fullPath);
          const zipEntryPath = path.posix.join('photos', img.relPath);
          zip.addFile(zipEntryPath, fileData);
        } catch (e) {
          console.warn(`Could not read image ${img.fullPath} for zip:`, e);
        }
      }

      const zipBuffer = zip.toBuffer();
      const zipFilename = `prompter-vault-full-export-${timestamp}.zip`;
      const dedicatedZipPath = path.join(exportsDir, zipFilename);
      await fs.writeFile(dedicatedZipPath, zipBuffer);

      if (req.query.format === 'json') {
        return res.json({
          ok: true,
          filename: zipFilename,
          exportFolder: dedicatedExportDir,
          zipPath: dedicatedZipPath,
          imageCount: allImagesToExport.length,
          downloadUrl: `/api/export/download/${encodeURIComponent(zipFilename)}`
        });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
      res.setHeader('X-Image-Count', String(allImagesToExport.length));
      res.setHeader('X-Export-Folder', exportFolderName);
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('Full export error:', err);
      res.status(500).json({ error: err.message || 'Export failed' });
    }
  });

  // POST /api/import/full - Unpacks ZIP, extracts embedded images into data/photos, properly links them to JSON data
  app.post('/api/import/full', upload.single('archive'), async (req, res) => {
    try {
      const userId = (req.query.userId as string) || (req.body?.userId as string) || 'main';
      let zipBuffer: Buffer | null = null;

      if (req.file && req.file.buffer) {
        zipBuffer = req.file.buffer;
      } else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        zipBuffer = req.body;
      } else if (req.body?.serverZipPath) {
        const p = req.body.serverZipPath;
        if (existsSync(p)) {
          zipBuffer = await fs.readFile(p);
        }
      }

      if (!zipBuffer || zipBuffer.length === 0) {
        return res.status(400).json({ error: 'No zip archive file provided for import' });
      }

      let zip: AdmZip;
      try {
        zip = new AdmZip(zipBuffer);
      } catch (e: any) {
        return res.status(400).json({ error: `Invalid ZIP archive: ${e.message}` });
      }

      const zipEntries = zip.getEntries();

      // 1. Locate database JSON file inside archive
      let dbEntry = zipEntries.find(
        e => !e.isDirectory && (e.entryName === 'database.json' || e.entryName === 'db/main.json' || e.entryName === 'main.json')
      );

      if (!dbEntry) {
        const manifestEntry = zipEntries.find(e => !e.isDirectory && e.entryName === 'manifest.json');
        if (manifestEntry) {
          try {
            const m = JSON.parse(manifestEntry.getData().toString('utf-8'));
            if (m.databaseFile) {
              dbEntry = zipEntries.find(e => !e.isDirectory && e.entryName === m.databaseFile);
            }
          } catch {}
        }
      }

      if (!dbEntry) {
        for (const e of zipEntries) {
          if (!e.isDirectory && e.entryName.endsWith('.json') && e.entryName !== 'manifest.json' && !e.entryName.includes('/manifest')) {
            try {
              const parsed = JSON.parse(e.getData().toString('utf-8'));
              if (parsed && Array.isArray(parsed.cats)) {
                dbEntry = e;
                break;
              }
            } catch {}
          }
        }
      }

      if (!dbEntry) {
        return res.status(400).json({
          error: 'The archive does not contain a valid database JSON file (expected database.json or main.json with "cats").'
        });
      }

      let rawDb: any;
      try {
        rawDb = JSON.parse(dbEntry.getData().toString('utf-8'));
      } catch (e: any) {
        return res.status(400).json({ error: `Corrupt JSON in database file: ${e.message}` });
      }

      if (!rawDb || typeof rawDb !== 'object' || !Array.isArray(rawDb.cats)) {
        return res.status(400).json({ error: 'Database JSON must contain a "cats" array.' });
      }

      // 2. Extract embedded images into designated data/photos folder
      let extractedCount = 0;
      const extractedFileMap = new Map<string, string>(); // baseName or relPath -> new URL

      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;
        const ext = path.extname(entry.entryName).toLowerCase();
        if (!IMAGE_EXTS.has(ext)) continue;

        let cleanRelPath = entry.entryName.replace(/\\/g, '/');
        if (cleanRelPath.startsWith('photos/')) {
          cleanRelPath = cleanRelPath.slice(7);
        } else if (cleanRelPath.startsWith('images/')) {
          cleanRelPath = cleanRelPath.slice(7);
        }

        const destPath = path.join(photosDir, cleanRelPath);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, entry.getData());
        extractedCount++;

        const servedUrl = `/files/${cleanRelPath}`;
        extractedFileMap.set(cleanRelPath, servedUrl);
        extractedFileMap.set(path.basename(cleanRelPath), servedUrl);
      }

      // 3. Properly link images to JSON data
      function linkImages(val: any): any {
        if (typeof val === 'string') {
          if (!val) return val;
          if (val.startsWith('/files/')) {
            const stripped = val.slice('/files/'.length);
            if (extractedFileMap.has(stripped)) {
              return extractedFileMap.get(stripped)!;
            }
            const base = path.basename(stripped);
            if (extractedFileMap.has(base)) {
              return extractedFileMap.get(base)!;
            }
            return val;
          }
          if (val.startsWith('photos/') || val.startsWith('images/')) {
            const stripped = val.replace(/^(photos|images)\//, '');
            if (extractedFileMap.has(stripped)) {
              return extractedFileMap.get(stripped)!;
            }
            return `/files/${stripped}`;
          }
          const base = path.basename(val);
          if (extractedFileMap.has(base)) {
            return extractedFileMap.get(base)!;
          }
          return val;
        }
        if (Array.isArray(val)) {
          return val.map(linkImages);
        }
        if (val && typeof val === 'object') {
          const out: Record<string, any> = {};
          for (const k of Object.keys(val)) {
            out[k] = linkImages(val[k]);
          }
          return out;
        }
        return val;
      }

      const linkedDb = linkImages(rawDb);

      // 4. Save to database files on disk
      const targetDbFile = path.join(dbDir, `${userId}.json`);
      const mainDbFile = path.join(dbDir, 'main.json');
      const bakFile = path.join(dbDir, `${userId}.bak.json`);

      try {
        if (existsSync(targetDbFile)) {
          await fs.copyFile(targetDbFile, bakFile);
        } else if (existsSync(mainDbFile)) {
          await fs.copyFile(mainDbFile, path.join(dbDir, 'main.bak.json'));
        }
      } catch {}

      const jsonStr = JSON.stringify(linkedDb, null, 2);
      await fs.writeFile(targetDbFile, jsonStr, 'utf-8');
      if (userId === 'main') {
        await fs.writeFile(mainDbFile, jsonStr, 'utf-8');
      }

      res.json({
        ok: true,
        message: 'Full import completed successfully! Images extracted and database linked.',
        imagesExtracted: extractedCount,
        categoriesCount: (linkedDb.cats || []).length,
        presetsCount: (linkedDb.presets || []).length,
        db: linkedDb
      });
    } catch (err: any) {
      console.error('Full import error:', err);
      res.status(500).json({ error: err.message || 'Import failed' });
    }
  });

  // GET /api/export/list - Lists saved export archives in data/exports/
  app.get('/api/export/list', async (req, res) => {
    try {
      if (!existsSync(exportsDir)) {
        return res.json([]);
      }
      const entries = await fs.readdir(exportsDir, { withFileTypes: true });
      const zips = entries.filter(e => e.isFile() && e.name.endsWith('.zip'));
      const list = await Promise.all(
        zips.map(async (z) => {
          const full = path.join(exportsDir, z.name);
          const stats = await fs.stat(full);
          return {
            filename: z.name,
            sizeBytes: stats.size,
            createdAt: stats.mtimeMs,
            downloadUrl: `/api/export/download/${encodeURIComponent(z.name)}`
          };
        })
      );
      list.sort((a, b) => b.createdAt - a.createdAt);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/export/download/:filename - Directly download an export archive
  app.get('/api/export/download/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      if (!filename || filename.includes('..') || !filename.endsWith('.zip')) {
        return res.status(400).json({ error: 'Invalid filename' });
      }
      const filePath = path.join(exportsDir, filename);
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'Export file not found' });
      }
      res.download(filePath, filename);
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
