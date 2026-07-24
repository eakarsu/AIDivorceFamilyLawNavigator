import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  if (!['1', 'true'].includes(String(process.env.ALLOW_SCHEMA_MIGRATION || '').toLowerCase())) throw new Error('Explicit schema authorization is required');
  const email = (process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const name = (process.env.PROVISION_ADMIN_NAME || 'Runtime Administrator').trim();
  if (!email || password.length < 12) throw new Error('Admin email and a 12+ character password are required');
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'attorney')
     ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role`,
    [name, email, passwordHash]
  );
}

main().then(() => pool.end()).catch(async (error) => { console.error(error.message); await pool.end().catch(() => {}); process.exit(1); });
