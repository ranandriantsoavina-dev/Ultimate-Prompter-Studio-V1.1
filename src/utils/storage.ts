// Client for the local Rust server. All persistent data (users, databases, photos)
// lives in the server's data/ folder — nothing heavy is kept in browser storage any more.

export interface ApiUser {
  id: string;
  name: string;
  isMain: boolean;
  createdAt: number;
}

async function readError(res: Response): Promise<string> {
  try {
    const t = (await res.text()).trim();
    return t || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function request(input: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (e: any) {
    throw new Error(`Cannot reach the local server (${e?.message || 'network error'}). Is it running?`);
  }
  if (!res.ok) {
    throw Object.assign(new Error(await readError(res)), { status: res.status });
  }
  return res;
}

export const api = {
  async listUsers(): Promise<ApiUser[]> {
    return (await request('/api/users')).json();
  },

  async createUser(name: string, id?: string): Promise<ApiUser> {
    const res = await request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, id })
    });
    return res.json();
  },

  async deleteUser(id: string): Promise<void> {
    await request(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  /** Returns null when this user has no saved database yet. Throws on any other failure. */
  async getDb(userId: string): Promise<any | null> {
    try {
      const res = await request(`/api/users/${encodeURIComponent(userId)}/db`);
      return await res.json();
    } catch (e: any) {
      if (e?.status === 404) return null;
      throw e;
    }
  },

  async putDb(userId: string, db: unknown): Promise<void> {
    await request(`/api/users/${encodeURIComponent(userId)}/db`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
    });
  },

  /** Stores the image as a real file in data/photos/<userId>/ and returns its URL (/files/<userId>/<file>). */
  async uploadPhoto(userId: string, blob: Blob): Promise<string> {
    const res = await request(`/api/users/${encodeURIComponent(userId)}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/png' },
      body: blob
    });
    const json = await res.json();
    return json.url as string;
  },

  /** Copies a photo file from one user's folder into another's and returns the new URL. */
  async transferPhoto(fromUser: string, toUser: string, url: string): Promise<string> {
    const res = await request('/api/transfer-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUser, toUser, url })
    });
    const json = await res.json();
    return json.url as string;
  }
};

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error || new Error('Could not read file'));
    r.readAsDataURL(blob);
  });
}

/**
 * Makes sure `src` is a file inside `userId`'s photo folder and returns its URL.
 *  - ''                         -> ''
 *  - data:image/...             -> uploaded as a new file
 *  - /files/<otherUser>/...     -> file copied into this user's folder
 *  - /files/<thisUser>/...      -> unchanged
 *  - anything else (http URL)   -> unchanged
 */
export async function ensureImageFor(userId: string, src?: string): Promise<string> {
  if (!src) return '';
  if (src.startsWith('data:')) {
    return api.uploadPhoto(userId, await dataUrlToBlob(src));
  }
  const m = /^\/files\/([A-Za-z0-9_-]+)\//.exec(src);
  if (m) {
    return m[1] === userId ? src : api.transferPhoto(m[1], userId, src);
  }
  return src;
}

/** Deep-walks any JSON value and replaces every embedded data:image URL by an uploaded file URL. */
export async function externalizeImages<T>(userId: string, value: T, cache = new Map<string, string>()): Promise<T> {
  const walk = async (v: any): Promise<any> => {
    if (typeof v === 'string') {
      if (!v.startsWith('data:image/')) return v;
      const hit = cache.get(v);
      if (hit) return hit;
      const url = await api.uploadPhoto(userId, await dataUrlToBlob(v));
      cache.set(v, url);
      return url;
    }
    if (Array.isArray(v)) {
      const out: any[] = [];
      for (const x of v) out.push(await walk(x));
      return out;
    }
    if (v && typeof v === 'object') {
      const out: Record<string, any> = {};
      for (const k of Object.keys(v)) out[k] = await walk(v[k]);
      return out;
    }
    return v;
  };
  return walk(value);
}

/** Inverse of externalizeImages — used for portable "Export Workspace JSON" backups. */
export async function inlineImages<T>(value: T): Promise<T> {
  const cache = new Map<string, string>();
  const walk = async (v: any): Promise<any> => {
    if (typeof v === 'string') {
      if (!/^\/files\/[A-Za-z0-9_-]+\//.test(v)) return v;
      const hit = cache.get(v);
      if (hit) return hit;
      const res = await request(v);
      const dataUrl = await blobToDataUrl(await res.blob());
      cache.set(v, dataUrl);
      return dataUrl;
    }
    if (Array.isArray(v)) {
      const out: any[] = [];
      for (const x of v) out.push(await walk(x));
      return out;
    }
    if (v && typeof v === 'object') {
      const out: Record<string, any> = {};
      for (const k of Object.keys(v)) out[k] = await walk(v[k]);
      return out;
    }
    return v;
  };
  return walk(value);
}

// ---------------------------------------------------------------------------
// One-time migration of data the OLD version kept in localStorage (base64 photos included)
// into the server's data/ folder. The old localStorage keys are left untouched as a backup.
// NOTE: localStorage is per-origin — this only finds the old data when the app is opened
// from the same origin (host:port) as before (e.g. the same Vite dev URL).
// ---------------------------------------------------------------------------
const MIGRATION_FLAG = 'ultimate_prompter_migrated_to_files_v1';

export async function migrateLocalStorage(): Promise<void> {
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  const serverUsers = await api.listUsers(); // throws if the server is down -> caller shows the error screen

  let localUsers: ApiUser[] = [];
  try {
    localUsers = JSON.parse(localStorage.getItem('ultimate_prompter_users') || '[]');
  } catch {
    localUsers = [];
  }
  if (!localUsers.some((u) => u.id === 'main')) {
    localUsers.unshift({ id: 'main', name: 'Main User', isMain: true, createdAt: Date.now() });
  }

  let allOk = true;
  for (const u of localUsers) {
    try {
      const key = u.id === 'main' ? 'ultimate_prompter_studio_v2' : `ultimate_prompter_user_db_${u.id}`;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      if (await api.getDb(u.id)) continue; // server already has data for this user — never overwrite

      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.cats)) continue;

      if (!serverUsers.some((s) => s.id === u.id)) {
        await api.createUser(u.name || 'User', u.id);
      }
      const converted = await externalizeImages(u.id, parsed);
      await api.putDb(u.id, converted);
    } catch (err) {
      allOk = false;
      console.error(`Migration of user "${u.id}" failed:`, err);
    }
  }

  if (allOk) localStorage.setItem(MIGRATION_FLAG, '1');
}
