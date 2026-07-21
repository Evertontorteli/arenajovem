const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(__dirname, '../../.env'),
  override: true,
});

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  null;

const shouldUseSsl =
  process.env.DB_SSL === 'true' ||
  Boolean(connectionString) ||
  process.env.NODE_ENV === 'production';

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'arena_jovem',
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
      }
);

function toPgPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${(index += 1)}`);
}

async function query(sql, values = []) {
  const result = await pool.query(toPgPlaceholders(sql), values);
  return result.rows;
}

async function queryOn(client, sql, values = []) {
  const result = await client.query(toPgPlaceholders(sql), values);
  return result.rows;
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  queryOn,
  withTransaction,
};
