const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'admin',
    multipleStatements: true,
  });

  const schemaPath = path.resolve(__dirname, '..', 'src', 'database', 'schema.sql');
  const schemaSql = fs
    .readFileSync(schemaPath, 'utf8')
    .replace(/arena_jovem/g, 'arenajovem');

  await connection.query(schemaSql);
  await connection.query('USE arenajovem');

  const teams = [
    ['Azul', '#3B82F6'],
    ['Vermelho', '#EF4444'],
    ['Amarelo', '#FACC15'],
    ['Verde', '#22C55E'],
  ];

  for (const [nome, cor] of teams) {
    await connection.query(
      `INSERT INTO equipes (nome, cor, descricao)
       SELECT ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM equipes WHERE nome = ?)`,
      [nome, cor, `Equipe ${nome}`, nome]
    );
  }

  const [adminRows] = await connection.query(
    'SELECT COUNT(*) AS total FROM usuarios WHERE role = ?',
    ['ADMIN']
  );
  if (Number(adminRows[0]?.total || 0) === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await connection.query(
      'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
      ['Administrador Arena Jovem', 'admin@arenajovem.com', hash, 'ADMIN']
    );
  }

  const [testRows] = await connection.query(
    'SELECT id FROM usuarios WHERE email = ?',
    ['teste@arenajovem.com']
  );
  if (testRows.length === 0) {
    const [teamRows] = await connection.query(
      'SELECT id FROM equipes ORDER BY id ASC LIMIT 1'
    );
    const hash = await bcrypt.hash('teste', 10);
    await connection.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role, equipe_id)
       VALUES (?, ?, ?, ?, ?)`,
      ['Usuario Teste', 'teste@arenajovem.com', hash, 'PARTICIPANTE', teamRows[0]?.id || null]
    );
  }

  const [users] = await connection.query(
    `SELECT id, nome, email, role, equipe_id
     FROM usuarios
     WHERE email IN (?, ?)
     ORDER BY id`,
    ['admin@arenajovem.com', 'teste@arenajovem.com']
  );

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(users, null, 2));

  await connection.end();
}

setup().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error.message);
  process.exit(1);
});
