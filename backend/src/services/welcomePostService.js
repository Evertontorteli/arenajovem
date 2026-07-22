const fs = require('fs');
const path = require('path');
const { query, queryOn, withTransaction } = require('../config/db');
const mediaRepository = require('../repositories/mediaRepository');
const {
  getConfigValue,
  setConfigValue,
} = require('../repositories/accessProfileRepository');

const WELCOME_POST_ID_KEY = 'welcome_post_id';
const WELCOME_POINTS_KEY = 'welcome_comment_points';
const WELCOME_STATUS_KEY = 'welcome_post_status';
const WELCOME_REF_TYPE = 'COMENTARIO_BOAS_VINDAS';
const DEFAULT_POINTS = 5;
const WELCOME_STATUS = {
  PINNED: 'pinned',
  UNPINNED: 'unpinned',
  ARCHIVED: 'archived',
};

const WELCOME_TEXT =
  'Bem-vindos à Arena Jovem! Marque presença comentando com sua equipe.';

let ensurePromise = null;

async function getWelcomePostId() {
  const raw = await getConfigValue(WELCOME_POST_ID_KEY);
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getWelcomePoints() {
  const raw = await getConfigValue(WELCOME_POINTS_KEY);
  const points = Number(raw);
  if (Number.isFinite(points) && points >= 0) return Math.floor(points);
  return DEFAULT_POINTS;
}

async function getWelcomeStatus() {
  const raw = String(await getConfigValue(WELCOME_STATUS_KEY) || '')
    .trim()
    .toLowerCase();
  if (
    raw === WELCOME_STATUS.UNPINNED ||
    raw === WELCOME_STATUS.ARCHIVED ||
    raw === WELCOME_STATUS.PINNED
  ) {
    return raw;
  }
  return WELCOME_STATUS.PINNED;
}

async function setWelcomeStatus(status) {
  const next = String(status || '')
    .trim()
    .toLowerCase();
  if (
    next !== WELCOME_STATUS.PINNED &&
    next !== WELCOME_STATUS.UNPINNED &&
    next !== WELCOME_STATUS.ARCHIVED
  ) {
    const AppError = require('../utils/AppError');
    throw new AppError(
      'Status inválido. Use pinned, unpinned ou archived.',
      400
    );
  }
  await setConfigValue(WELCOME_STATUS_KEY, next);
  return next;
}

async function findAdminId() {
  const rows = await query(
    `SELECT id FROM usuarios
     WHERE role = 'ADMIN'
     ORDER BY id ASC
     LIMIT 1`
  );
  return rows[0]?.id || null;
}

async function createLogoMedia() {
  const logoPath = path.join(__dirname, '../../assets/logoArena.png');
  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo da Arena não encontrado em ${logoPath}`);
  }
  const buffer = fs.readFileSync(logoPath);
  const media = await mediaRepository.createMedia({
    mimeType: 'image/png',
    size: buffer.length,
    width: null,
    height: null,
    buffer,
  });
  return `/api/media/${media.id}`;
}

async function ensureWelcomeIndexes() {
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pontuacoes_welcome_user
    ON pontuacoes (referencia_tipo, referencia_id)
    WHERE referencia_tipo = 'COMENTARIO_BOAS_VINDAS'
  `);
}

async function ensureWelcomePost() {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await mediaRepository.ensureMediaTable();
      await ensureWelcomeIndexes();

      const existingId = await getWelcomePostId();
      if (existingId) {
        const rows = await query(
          'SELECT id, texto FROM publicacoes WHERE id = ?',
          [existingId]
        );
        if (rows[0]) {
          if (rows[0].texto !== WELCOME_TEXT) {
            await query('UPDATE publicacoes SET texto = ? WHERE id = ?', [
              WELCOME_TEXT,
              existingId,
            ]);
          }
          try {
            await backfillWelcomeCommentCredits();
          } catch (backfillError) {
            // eslint-disable-next-line no-console
            console.warn(
              'Backfill de pontos do post oficial falhou:',
              backfillError.message
            );
          }
          return existingId;
        }
      }

      const adminId = await findAdminId();
      if (!adminId) {
        throw new Error('Nenhum admin encontrado para criar o post de boas-vindas.');
      }

      const imagemUrl = await createLogoMedia();
      const inserted = await query(
        `INSERT INTO publicacoes
          (autor_id, equipe_id, imagem_url, texto, tipo_publicacao, missao_id, possui_selo_missao)
         VALUES (?, NULL, ?, ?, 'LIVRE', NULL, 0)
         RETURNING id`,
        [adminId, imagemUrl, WELCOME_TEXT]
      );
      const postId = inserted[0].id;
      await setConfigValue(WELCOME_POST_ID_KEY, String(postId));
      const pointsConfig = await getConfigValue(WELCOME_POINTS_KEY);
      if (!pointsConfig) {
        await setConfigValue(WELCOME_POINTS_KEY, String(DEFAULT_POINTS));
      }
      const statusConfig = await getConfigValue(WELCOME_STATUS_KEY);
      if (!statusConfig) {
        await setConfigValue(WELCOME_STATUS_KEY, WELCOME_STATUS.PINNED);
      }
      return postId;
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

async function hasUserCreditedWelcome(usuarioId) {
  const rows = await query(
    `SELECT id FROM pontuacoes
     WHERE referencia_tipo = ? AND referencia_id = ?
     LIMIT 1`,
    [WELCOME_REF_TYPE, Number(usuarioId)]
  );
  return Boolean(rows[0]);
}

/**
 * Credita pontos 1x por participante (com equipe) no 1º comentário raiz do post oficial.
 */
async function maybeCreditWelcomeComment({ comment, actor }) {
  if (!comment || !actor?.id) return null;
  if (comment.parent_id) return null;

  const welcomePostId = await getWelcomePostId();
  if (!welcomePostId || Number(comment.publicacao_id) !== Number(welcomePostId)) {
    return null;
  }

  // Usa dados atuais do banco (JWT pode estar desatualizado após escolher o time).
  const users = await query(
    `SELECT id, role, equipe_id FROM usuarios WHERE id = ? LIMIT 1`,
    [Number(actor.id)]
  );
  const user = users[0];
  if (!user || user.role === 'ADMIN' || !user.equipe_id) return null;

  const pontos = await getWelcomePoints();
  if (pontos <= 0) return null;

  try {
    return await withTransaction(async (client) => {
      const existing = await queryOn(
        client,
        `SELECT id FROM pontuacoes
         WHERE referencia_tipo = ? AND referencia_id = ?
         LIMIT 1`,
        [WELCOME_REF_TYPE, Number(user.id)]
      );
      if (existing[0]) return null;

      await queryOn(
        client,
        `INSERT INTO pontuacoes
          (equipe_id, pontos, tipo, motivo, observacao, referencia_tipo, referencia_id, criado_por)
         VALUES (?, ?, 'ADICAO', ?, ?, ?, ?, ?)`,
        [
          Number(user.equipe_id),
          pontos,
          'Missão Cheguei na Arena',
          'Primeiro comentário no post oficial',
          WELCOME_REF_TYPE,
          Number(user.id),
          Number(user.id),
        ]
      );
      await queryOn(
        client,
        'UPDATE equipes SET pontuacao = pontuacao + ? WHERE id = ?',
        [pontos, Number(user.equipe_id)]
      );

      return { pontos, equipe_id: Number(user.equipe_id) };
    });
  } catch (error) {
    // Corrida entre dois comentários do mesmo usuário: índice único evita duplicar.
    if (error?.code === '23505') return null;
    throw error;
  }
}

/**
 * Credita quem já comentou no post oficial antes do score existir / com JWT sem equipe.
 */
async function backfillWelcomeCommentCredits() {
  const welcomePostId = await getWelcomePostId();
  if (!welcomePostId) return { credited: 0 };

  const pontos = await getWelcomePoints();
  if (pontos <= 0) return { credited: 0 };

  const pending = await query(
    `SELECT DISTINCT ON (c.usuario_id)
        c.id AS comentario_id,
        c.usuario_id,
        u.role,
        u.equipe_id
     FROM comentarios c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.publicacao_id = ?
       AND c.parent_id IS NULL
       AND u.role <> 'ADMIN'
       AND u.equipe_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM pontuacoes p
         WHERE p.referencia_tipo = ?
           AND p.referencia_id = c.usuario_id
       )
     ORDER BY c.usuario_id, c.criado_em ASC`,
    [welcomePostId, WELCOME_REF_TYPE]
  );

  let credited = 0;
  for (const row of pending) {
    try {
      await withTransaction(async (client) => {
        const existing = await queryOn(
          client,
          `SELECT id FROM pontuacoes
           WHERE referencia_tipo = ? AND referencia_id = ?
           LIMIT 1`,
          [WELCOME_REF_TYPE, Number(row.usuario_id)]
        );
        if (existing[0]) return;

        await queryOn(
          client,
          `INSERT INTO pontuacoes
            (equipe_id, pontos, tipo, motivo, observacao, referencia_tipo, referencia_id, criado_por)
           VALUES (?, ?, 'ADICAO', ?, ?, ?, ?, ?)`,
          [
            Number(row.equipe_id),
            pontos,
            'Missão Cheguei na Arena',
            'Backfill do primeiro comentário no post oficial',
            WELCOME_REF_TYPE,
            Number(row.usuario_id),
            Number(row.usuario_id),
          ]
        );
        await queryOn(
          client,
          'UPDATE equipes SET pontuacao = pontuacao + ? WHERE id = ?',
          [pontos, Number(row.equipe_id)]
        );
      });
      credited += 1;
    } catch (error) {
      if (error?.code === '23505') continue;
      throw error;
    }
  }

  return { credited };
}

function decorateWelcomePost(
  post,
  { alreadyCredited = false, status = WELCOME_STATUS.PINNED } = {}
) {
  if (!post) return post;
  return {
    ...post,
    eh_boas_vindas: true,
    missao_chegada: true,
    usuario_ja_pontuou_chegada: alreadyCredited,
    boas_vindas_status: status,
    boas_vindas_fixado: status === WELCOME_STATUS.PINNED,
    boas_vindas_arquivado: status === WELCOME_STATUS.ARCHIVED,
  };
}

module.exports = {
  WELCOME_REF_TYPE,
  WELCOME_STATUS,
  DEFAULT_POINTS,
  ensureWelcomePost,
  getWelcomePostId,
  getWelcomePoints,
  getWelcomeStatus,
  setWelcomeStatus,
  hasUserCreditedWelcome,
  maybeCreditWelcomeComment,
  backfillWelcomeCommentCredits,
  decorateWelcomePost,
};
