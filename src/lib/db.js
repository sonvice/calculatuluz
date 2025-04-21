import { Database } from '@netlify/d1';
const db = new Database(process.env.D1_DATABASE_URL);

// Asegurarnos de que exista la tabla
await db
  .prepare(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT,
      last_updated INTEGER
    )
  `)
  .run();

export default db;
