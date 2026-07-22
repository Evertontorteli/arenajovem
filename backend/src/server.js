const app = require('./app');
const { query } = require('./config/db');
const { ensureUserSchema } = require('./database/ensureUserSchema');
const teamService = require('./services/teamService');
const accessProfileService = require('./services/accessProfileService');
const bcrypt = require('bcryptjs');

const PORT = Number(process.env.PORT || 3333);

async function ensureMediaTable() {
  const mediaRepository = require('./repositories/mediaRepository');
  await mediaRepository.ensureMediaTable();
}

async function ensureFeedIndexes() {
  const { ensureFeedIndexes: ensureIndexes } = require('./database/ensureFeedIndexes');
  await ensureIndexes();
}

async function ensureQuizSchema() {
  const quizRepository = require('./repositories/quizRepository');
  await quizRepository.ensureQuizSchema();
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
    await ensureUserSchema();
    await ensureMediaTable();
    await ensureFeedIndexes();
    await ensureQuizSchema();
    await teamService.ensureDefaultTeams();
    await accessProfileService.ensureDefaultProfiles();
    const [adminCount] = await query(
      "SELECT COUNT(*)::int AS total FROM usuarios WHERE role = 'ADMIN'"
    );
    if (Number(adminCount.total) === 0) {
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

    try {
      const welcomePostService = require('./services/welcomePostService');
      await welcomePostService.ensureWelcomePost();
    } catch (welcomeError) {
      // eslint-disable-next-line no-console
      console.warn('Post de boas-vindas não criado:', welcomeError.message);
    }

    const testEmail = process.env.DEFAULT_TEST_EMAIL || 'teste@arenajovem.com';
    const [testUserRows] = await query(
      'SELECT COUNT(*)::int AS total FROM usuarios WHERE email = ?',
      [testEmail]
    );

    if (Number(testUserRows.total) === 0) {
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
