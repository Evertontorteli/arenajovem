const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function setup() {
  const schemaPath = path.resolve(__dirname, '..', 'src', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  await pool.query(schemaSql);

  const teams = [
    ['Azul', '#3B82F6'],
    ['Vermelho', '#EF4444'],
    ['Amarelo', '#FACC15'],
    ['Verde', '#22C55E'],
  ];

  for (const [nome, cor] of teams) {
    await pool.query(
      `INSERT INTO equipes (nome, cor, descricao)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (SELECT 1 FROM equipes WHERE nome = $4)`,
      [nome, cor, `Equipe ${nome}`, nome]
    );
  }

  const adminRows = await pool.query(
    'SELECT COUNT(*)::int AS total FROM usuarios WHERE role = $1',
    ['ADMIN']
  );
  if (Number(adminRows.rows[0]?.total || 0) === 0) {
    const hash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, $4)',
      [
        process.env.DEFAULT_ADMIN_NAME || 'Administrador Arena Jovem',
        process.env.DEFAULT_ADMIN_EMAIL || 'admin@arenajovem.com',
        hash,
        'ADMIN',
      ]
    );
  }

  const testEmail = process.env.DEFAULT_TEST_EMAIL || 'teste@arenajovem.com';
  const testRows = await pool.query('SELECT id FROM usuarios WHERE email = $1', [
    testEmail,
  ]);
  if (testRows.rows.length === 0) {
    const teamRows = await pool.query(
      'SELECT id FROM equipes ORDER BY id ASC LIMIT 1'
    );
    const hash = await bcrypt.hash(process.env.DEFAULT_TEST_PASSWORD || 'teste', 10);
    await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role, equipe_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        process.env.DEFAULT_TEST_NAME || 'Usuario Teste',
        testEmail,
        hash,
        'PARTICIPANTE',
        teamRows.rows[0]?.id || null,
      ]
    );
  }

  const users = await pool.query(
    `SELECT id, nome, email, role, equipe_id
     FROM usuarios
     WHERE email IN ($1, $2)
     ORDER BY id`,
    ['admin@arenajovem.com', testEmail]
  );

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(users.rows, null, 2));

  await pool.end();
}

setup().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error.message);
  process.exit(1);
});
