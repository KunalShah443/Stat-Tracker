import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

let dbPromise: Promise<SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

function nowIso() {
  return new Date().toISOString();
}

export async function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync('stat-tracker.db');
  }
  return dbPromise;
}

/**
 * Initializes database tables once.
 * Uses meta table to track schema version.
 */
export function initDb(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await getDb();

    // Create tables (idempotent)
    await db.execAsync(CREATE_TABLES_SQL);

    // Ensure meta has schema_version
    const rows = await db.getAllAsync<{ value: string }>(
      `SELECT value FROM meta WHERE key = ?`,
      ['schema_version']
    );

    if (rows.length === 0) {
      await db.runAsync(`INSERT INTO meta (key, value) VALUES (?, ?)`, [
        'schema_version',
        String(SCHEMA_VERSION),
      ]);
      await db.runAsync(`INSERT INTO meta (key, value) VALUES (?, ?)`, [
        'initialized_at',
        nowIso(),
      ]);
      console.log('DB initialized');
      return;
    }

    const current = Number(rows[0].value);
    // For now we only support SCHEMA_VERSION = 1; future migrations go here.
    if (current !== SCHEMA_VERSION) {
      // Simple approach: throw so we don't silently corrupt data
      throw new Error(
        `DB schema version mismatch. Found ${current}, expected ${SCHEMA_VERSION}. Implement migrations in initDb().`
      );
    }
  })();

  return initPromise;
}
