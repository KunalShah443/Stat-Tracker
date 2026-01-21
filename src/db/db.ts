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

async function migrateDb(database: SQLiteDatabase, fromVersion: number) {
  let version = fromVersion;

  if (version < 2) {
    await database.execAsync('ALTER TABLE profiles ADD COLUMN draft_round INTEGER');
    await database.execAsync('ALTER TABLE profiles ADD COLUMN draft_pick INTEGER');
    await database.execAsync('ALTER TABLE profiles ADD COLUMN team_name TEXT');
    version = 2;
  }
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

    const current = rows.length > 0 ? Number(rows[0].value) : 0;

    if (current === 0) {
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

    if (current > SCHEMA_VERSION) {
      // Simple approach: throw so we don't silently corrupt data
      throw new Error(
        `DB schema version mismatch. Found ${current}, expected ${SCHEMA_VERSION}. Implement migrations in initDb().`
      );
    }

    if (current < SCHEMA_VERSION) {
      await migrateDb(db, current);
      await db.runAsync(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`, [
        'schema_version',
        String(SCHEMA_VERSION),
      ]);
      console.log('DB migrated');
    }
  })();

  return initPromise;
}
