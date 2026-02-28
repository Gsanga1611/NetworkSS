import { Pool } from 'pg';

// This module provides a simple PostgreSQL pool for server-side code.  
// It reads the connection string from SUPABASE_DB_URL, which should point
// to the Postgres instance backing your Supabase project.
//
// Important: do **not** expose the service role key or raw connection string
// to client-side code; keep this file strictly server-only.

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('SUPABASE_DB_URL environment variable is not set');
}

export const pgPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
