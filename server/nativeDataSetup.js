import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Explicit pool injection: this module does not load credentials or connect on import.
export async function migrateNativeData(pool) {
  const directory = new URL('./migrations/', import.meta.url);
  const files = (await readdir(directory)).filter(file => /^\d.*\.sql$/.test(file)).sort();
  const client = await pool.connect();
  const applied = [];
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', ['divorce-native-schema-migrations']);
    await client.query('CREATE TABLE IF NOT EXISTS native_schema_migrations (filename TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    for (const file of files) {
      const source = await readFile(new URL(file, directory), 'utf8');
      if (/\bDROP\s+TABLE\b/i.test(source)) throw new Error('Destructive table migration rejected');
      const sha256 = createHash('sha256').update(source).digest('hex');
      const previous = (await client.query('SELECT sha256 FROM native_schema_migrations WHERE filename=$1', [file])).rows[0];
      if (previous) {
        if (previous.sha256 !== sha256) throw new Error(`Previously applied migration changed: ${file}`);
        continue;
      }
      const statements = source.replace(/^\s*(?:BEGIN|COMMIT)\s*;\s*$/gim, '');
      await client.query('BEGIN');
      try {
        await client.query(statements);
        await client.query('INSERT INTO native_schema_migrations(filename,sha256) VALUES($1,$2)', [file, sha256]);
        await client.query('COMMIT');
        applied.push(file);
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', ['divorce-native-schema-migrations']).catch(() => {});
    client.release();
  }
  return { applied, destructiveSchemaUsed: false, accountsCreatedOrChanged: 0 };
}
