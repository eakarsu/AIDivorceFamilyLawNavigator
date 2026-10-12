import pg from 'pg';
import { pathToFileURL } from 'node:url';
import { migrateNativeData } from './nativeDataSetup.js';
import { resolveDemoActor, inspectNativeData, seedNativeDemoData } from './services/nativeDemoData.js';

// Preserving development data repair. No dotenv, schema.sql, account provisioning or provider calls.
export async function runNativeDataCLI(args = process.argv.slice(2), env = process.env) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    if (['--user-id', '--email'].includes(key)) {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${key} requires a value`);
      options[key === '--user-id' ? 'userId' : 'email'] = args[++i];
    } else if (['--migrate', '--dry-run', '--count', '--json', '--migration-only'].includes(key)) options[key.slice(2)] = true;
    else if (key === '--help') {
      return { help: 'node server/seed.js --user-id EXISTING_ID [--migrate] [--dry-run|--count] [--json]\nOr --email EXISTING_EMAIL. --dry-run and --count never write. --migration-only prepares additive storage without seeding or changing accounts.' };
    } else throw new Error(`Unknown option: ${key}`);
  }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required; supply the intended app database explicitly.');
  const readonly = options['dry-run'] || options.count;
  if (readonly && (options.migrate || options['migration-only'])) throw new Error('--dry-run/--count cannot be combined with migration writes. Run inspection first, then --migrate explicitly.');
  if (env.NODE_ENV === 'production' && !readonly) throw new Error('Synthetic examples and this development repair command are unavailable in production.');
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 2 });
  try {
    const migration = options.migrate || options['migration-only'] ? await migrateNativeData(pool) : null;
    if (options['migration-only']) return { ...migration, migrationOnly: true };
    const actor = await resolveDemoActor(pool, { ...options, env });
    const result = readonly ? await inspectNativeData(pool, actor.id) : await seedNativeDemoData(pool, { userId: actor.id, env });
    return { ...(migration ? { migration } : {}), ...result, dryRun: Boolean(options['dry-run']), readonly: Boolean(readonly) };
  } finally { await pool.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runNativeDataCLI().then(result => {
    if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
    else if (result.help) console.log(result.help);
    else {
      console.log(result.readonly ? 'Native record inspection (no writes).' : 'Native record preparation complete. Existing records and accounts preserved.');
      for (const row of result.collections || []) console.log(`  ${row.feature}: ${row.total} owned records (${row.demo} synthetic examples)${row.storageReady ? '' : ' — additive migration required'}`);
      if (result.insertedTotal !== undefined) console.log(`Added ${result.insertedTotal} labeled examples. Accounts changed: 0. Provider calls: 0.`);
    }
  }).catch(error => {
    const known = error.message && !/(?:postgres(?:ql)?:\/\/|password=)/i.test(error.message);
    console.error(known ? error.message : 'Native record preparation failed; check the intended database configuration.');
    process.exitCode = 1;
  });
}
