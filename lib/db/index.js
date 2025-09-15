import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'postgres',
  password: process.env.PGPASSWORD || '',
  port: parseInt(process.env.PGPORT, 10) || 5432,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});
