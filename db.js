import { Pool } from 'pg';

let pool;
let sqlClient;

export async function getSqlClient() {
  if (sqlClient) return sqlClient;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: true },
    });
  }

  sqlClient = async (strings, ...values) => {
    const text = strings.reduce(
      (acc, str, idx) => acc + str + (idx < values.length ? `$${idx + 1}` : ''),
      ''
    );
    const result = await pool.query(text, values);
    return result.rows;
  };

  return sqlClient;
}

export async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS patterns (
    code text primary key,
    name text not null,
    description text,
    type text,
    brand text,
    year text,
    model text,
    trim text,
    image_url text,
    image_data text,
    tags text,
    created_at timestamptz default now()
  )`;
}
