import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isRemote = process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  // Force IPv4 for cloud DB hosts when the platform has no IPv6 route.
  // pg accepts this runtime option, but @types/pg may not include it.
  family: 4,
  // SSL is required for Supabase and most cloud PostgreSQL providers
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  keepAlive: true,
} as any);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};
