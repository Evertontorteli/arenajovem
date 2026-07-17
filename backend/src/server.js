const app = require('./app');
const { query } = require('./config/db');
const teamService = require('./services/teamService');
const accessProfileService = require('./services/accessProfileService');
const bcrypt = require('bcryptjs');

const PORT = Number(process.env.PORT || 3333);

async function ensureUserColumns() {
  const requiredColumns = [
    { name: 'telefone', ddl: 'ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(20) NULL AFTER email' },
    {
      name: 'google_sub',
      ddl:
        'ALTER TABLE usuarios ADD COLUMN google_sub VARCHAR(64) NULL UNIQUE AFTER telefone',
    },
    {
      name: 'acessos',
      ddl: 'ALTER TABLE usuarios ADD COLUMN acessos JSON NULL AFTER equipe_id',
    },
  ];

  for (const column of requiredColumns) {
    const rows = await query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'usuarios'
         AND COLUMN_NAME = ?`,
      [column.name]
    );
    if (rows.length === 0) {
      await query(column.ddl);
    }
  }
}

async function bootstrap() {
  try {
    if (
      process.env.NODE_ENV === 'production' &&
      String(process.env.AUTH_BYPASS_PASSWORD || 'false') === 'true'
    ) {
      throw new Error(
        'AUTH_BYPASS_PASSWORD não pode estar habilitado em produção.'
      );
    }

    await query('SELECT 1');
    await ensureUserColumns();
    await teamService.ensureDefaultTeams();
    await accessProfileService.ensureDefaultProfiles();
    const [adminCount] = await query(
      "SELECT COUNT(*) AS total FROM usuarios WHERE role = 'ADMIN'"
    );
    if (adminCount.total === 0) {
      const senhaHash = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        10
      );
      await query(
        `INSERT INTO usuarios (nome, email, senha_hash, role)
         VALUES (?, ?, ?, 'ADMIN')`,
        [
          process.env.DEFAULT_ADMIN_NAME || 'Administrador Arena Jovem',
          process.env.DEFAULT_ADMIN_EMAIL || 'admin@arenajovem.com',
          senhaHash,
        ]
      );
    }

    const testEmail = process.env.DEFAULT_TEST_EMAIL || 'teste@arenajovem.com';
    const [testUserRows] = await query(
      'SELECT COUNT(*) AS total FROM usuarios WHERE email = ?',
      [testEmail]
    );

    if (testUserRows.total === 0) {
      const senhaHashTeste = await bcrypt.hash(
        process.env.DEFAULT_TEST_PASSWORD || 'teste',
        10
      );
      const [primeiraEquipe] = await query(
        'SELECT id FROM equipes ORDER BY id ASC LIMIT 1'
      );
      await query(
        `INSERT INTO usuarios (nome, email, senha_hash, role, equipe_id)
         VALUES (?, ?, ?, 'PARTICIPANTE', ?)`,
        [
          process.env.DEFAULT_TEST_NAME || 'Usuário Teste',
          testEmail,
          senhaHashTeste,
          primeiraEquipe?.id || null,
        ]
      );
    }

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Arena Jovem API rodando na porta ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Falha ao iniciar a API:', error.message);
    process.exit(1);
  }
}

bootstrap();
