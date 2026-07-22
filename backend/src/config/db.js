const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(__dirname, '../../.env'),
  override: true,
});

/**
 * Preferir URL com pooler do Neon em produção serverless.
 * Ex.: ep-xxx-pooler.region.aws.neon.tech
 */
function resolveConnectionString() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL_UNPOOLED,
  ].filter(Boolean);

  if (!candidates.length) return null;

  const pooler = candidates.find((url) =>
    /[-.]pooler\./i.test(String(url))
  );
  return pooler || candidates[0];
}

const connectionString = resolveConnectionString();

const shouldUseSsl =
  process.env.DB_SSL === 'true' ||
  Boolean(connectionString) ||
  process.env.NODE_ENV === 'production';

const isServerless =
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
  process.env.SERVERLESS === 'true';

/** Poucas conexões por instância — crítico no Vercel + Neon. */
const poolMax = Math.max(
  1,
  Number(process.env.DB_POOL_MAX || (isServerless ? 4 : 10)) || 4
);

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
        max: poolMax,
        idleTimeoutMillis: isServerless ? 10_000 : 30_000,
        connectionTimeoutMillis: 10_000,
        allowExitOnIdle: isServerless,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'arena_jovem',
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
        max: poolMax,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
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
  poolMax,
  isServerless,
};
