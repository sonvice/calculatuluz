import db from './db.js';

const KEY = 'prices';
const CACHE_TTL_MS = 3600 * 1000; // 1 hora

export async function getCachedData() {
  // Leemos la fila
  const row = await db
    .prepare('SELECT value, last_updated FROM cache WHERE key = ?')
    .bind(KEY)
    .first();
  if (!row) return null;

  // Comprobamos si está expirado
  const age = Date.now() - row.last_updated;
  if (age > CACHE_TTL_MS) {
    console.log('[CACHE] Expirado tras', Math.floor(age/1000), 's');
    return null;
  }

  const data = JSON.parse(row.value);
  console.log('[CACHE] Última actualización:', new Date(row.last_updated).toLocaleString());
  return data;
}

export async function updateCache(newData) {
  const text = JSON.stringify(newData);
  const now = Date.now();

  await db
    .prepare(`
      INSERT INTO cache (key, value, last_updated)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        last_updated = excluded.last_updated
    `)
    .bind(KEY, text, now)
    .run();

  console.log('[CACHE] Actualizado en D1', new Date(now).toLocaleString());
  return newData;
}
