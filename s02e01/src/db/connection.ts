import pg from 'pg';

// Keep this local development default in sync with drizzle.config.ts and Compose.
export const DEFAULT_DATABASE_URL = 'postgresql://stock5:stock5@127.0.0.1:5454/reorder_sjpt';

export function createPool(databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  return new pg.Pool({ connectionString: databaseUrl, max: 4, connectionTimeoutMillis: 5000 });
}
