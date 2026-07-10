import fs from 'fs';
import path from 'path';
import { db } from './db';

export async function initDatabase() {
  // ts-node-dev: __dirname may point to src/config or dist/config depending on the run mode.
  // Use multiple candidate paths and pick whichever exists.
  const candidates = [
    path.join(__dirname, '..', 'models', 'schema.sql'),          // compiled / ts-node
    path.join(process.cwd(), 'src', 'models', 'schema.sql'),     // cwd fallback
  ];

  const sqlPath = candidates.find(fs.existsSync);

  if (!sqlPath) {
    console.warn('⚠️  schema.sql not found — skipping DB schema init. Tables must already exist.');
    return;
  }

  try {
    console.log('🔧 Initializing database schema from:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log('✅ Database tables verified/created successfully.');
  } catch (error: any) {
    // Non-fatal: tables likely already exist (common on subsequent starts)
    if (error?.code === '42P07' || error?.message?.includes('already exists')) {
      console.log('✅ Database tables already exist — schema init skipped.');
    } else {
      console.error('⚠️  Failed to initialize database schema:', error?.message || error);
      console.warn('   Server will continue, but some features may not work if tables are missing.');
    }
  }
}
