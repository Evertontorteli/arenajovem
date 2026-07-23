const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const {
  encodeCursorToken,
  decodeCursorToken,
} = require('../utils/cursorToken');
const { ensureFeedIndexes } = require('../database/ensureFeedIndexes');
const welcomePostService = require('../services/welcomePostService');

async function hydratePosts(rows, { userId = null, welcomeStatus = null } = {}) {
  if (!rows.length) return [];
  const welcomePostId = await welcomePostService.getWelcomePostId();
  const status =
    welcomeStatus || (await welcomePostService.getWelcomeStatus());
  let alreadyCredited = false;
  if (
    welcomePostId &&
    userId &&
    rows.some((row) => Number(row.id) === Number(welcomePostId))
  ) {
    alreadyCredited = await welcomePostService.hasUserCreditedWelcome(userId);
  }

  return rows.map((row) => {
    if (welcomePostId && Number(row.id) === Number(welcomePostId)) {
      return welcomePostService.decorateWelcomePost(row, {
        alreadyCredited,
        status,
      });
    }
    return row;
  });
}

async function findPostRowById(postId, userId = null) {
  const viewerId = Number(userId);
  const hasViewer = Number.isInteger(viewerId) && viewerId > 0;
  const likedByMeSelect = hasViewer
    ? `(EXISTS (
         SELECT 1 FROM curtidas cl
         WHERE cl.publicacao_id = p.id AND cl.usuario_id = ?
       )) AS curtida_por_mim`
    : 'FALSE AS curtida_por_mim';

  const previewCommentsSelect = `(
    SELECT COALESCE(json_agg(row_to_json(preview)), '[]'::json)
    FROM (
      SELECT c.id, c.texto, c.usuario_id, u2.nome AS autor_nome, c.criado_em
      FROM comentarios c
      INNER JOIN usuarios u2 ON u2.id = c.usuario_id
      WHERE c.publicacao_id = p.id AND c.parent_id IS NULL
      ORDER BY c.criado_em DESC
      LIMIT 3
    ) preview
  ) AS comentarios_preview`;

  const params = hasViewer ? [viewerId, postId] : [postId];
  const rows = await query(
    `SELECT p.*, u.nome AS autor_nome, u.role AS autor_role, u.foto AS autor_foto, e.nome AS equipe_nome,
      (SELECT COUNT(*)::int FROM curtidas c WHERE c.publicacao_id = p.id) AS curtidas,
      (SELECT COUNT(*)::int FROM comentarios c2 WHERE c2.publicacao_id = p.id AND c2.parent_id IS NULL) AS comentarios,
      ${likedByMeSelect},
      ${previewCommentsSelect}
     FROM publicacoes p
     INNER JOIN usuarios u ON u.id = p.autor_id
     LEFT JOIN equipes e ON e.id = p.equipe_id
     WHERE p.id = ?`,
    params
  );
  return rows[0] || null;
}

async function listPosts({ limit = 6, cursor = null, userId = null } = {}) {
  await ensureFeedIndexes();
  const welcomePostId = await welcomePostService.ensureWelcomePost();
  const welcomeStatus = await welcomePostService.getWelcomeStatus();
  const isPinned = welcomeStatus === welcomePostService.WELCOME_STATUS.PINNED;
  const isArchived =
    welcomeStatus === welcomePostService.WELCOME_STATUS.ARCHIVED;

  const safeLimit = Math.min(12, Math.max(1, Number(limit) || 6));
  const decodedCursor = decodeCursorToken(cursor);
  if (cursor && !decodedCursor) {
    throw new AppError('Cursor inválido ou expirado.', 400);
  }

  const isFirstPage = !decodedCursor;
  const reserveWelcomeSlot = isFirstPage && isPinned && !isArchived;
  const pageLimit = reserveWelcomeSlot ? Math.max(1, safeLimit - 1) : safeLimit;
  const pageLimitPlusOne = pageLimit + 1;

  const viewerId = Number(userId);
  const hasViewer = Number.isInteger(viewerId) && viewerId > 0;
  const likedByMeSelect = hasViewer
    ? `(EXISTS (
         SELECT 1 FROM curtidas cl
         WHERE cl.publicacao_id = p.id AND cl.usuario_id = ?
       )) AS curtida_por_mim`
    : 'FALSE AS curtida_por_mim';

  const previewCommentsSelect = `(
    SELECT COALESCE(json_agg(row_to_json(preview)), '[]'::json)
    FROM (
      SELECT c.id, c.texto, c.usuario_id, u2.nome AS autor_nome, c.criado_em
      FROM comentarios c
      INNER JOIN usuarios u2 ON u2.id = c.usuario_id
      WHERE c.publicacao_id = p.id AND c.parent_id IS NULL
      ORDER BY c.criado_em DESC
      LIMIT 3
    ) preview
  ) AS comentarios_preview`;

  const selectSql = `SELECT p.*, u.nome AS autor_nome, u.role AS autor_role, u.foto AS autor_foto, e.nome AS equipe_nome,
      (SELECT COUNT(*)::int FROM curtidas c WHERE c.publicacao_id = p.id) AS curtidas,
      (SELECT COUNT(*)::int FROM comentarios c2 WHERE c2.publicacao_id = p.id AND c2.parent_id IS NULL) AS comentarios,
      ${likedByMeSelect},
      ${previewCommentsSelect}
     FROM publicacoes p
     INNER JOIN usuarios u ON u.id = p.autor_id
     LEFT JOIN equipes e ON e.id = p.equipe_id`;

  // Arquivado: some do feed. Fixado: fora da query normal e no topo.
  // Desafixado: entra na ordem cronológica normal.
  const excludeWelcome = isPinned || isArchived;

  let rows;
  if (decodedCursor) {
    const params = [];
    if (hasViewer) params.push(viewerId);
    if (excludeWelcome) params.push(welcomePostId);
    params.push(
      decodedCursor.criadoEm,
      decodedCursor.criadoEm,
      decodedCursor.id
    );

    rows = await query(
      `${selectSql}
       WHERE ${excludeWelcome ? 'p.id <> ? AND ' : ''}(
         p.criado_em < ?
         OR (p.criado_em = ? AND p.id < ?)
       )
       ORDER BY p.criado_em DESC, p.id DESC
       LIMIT ${pageLimitPlusOne}`,
      params
    );
  } else {
    const params = [];
    if (hasViewer) params.push(viewerId);
    if (excludeWelcome) params.push(welcomePostId);

    rows = await query(
      `${selectSql}
       ${excludeWelcome ? 'WHERE p.id <> ?' : ''}
       ORDER BY p.criado_em DESC, p.id DESC
       LIMIT ${pageLimitPlusOne}`,
      params
    );
  }

  const hasMore = rows.length > pageLimit;
  const items = hasMore ? rows.slice(0, pageLimit) : rows;
  const nextCursor = hasMore
    ? encodeCursorToken(items[items.length - 1])
    : null;

  let finalItems = items;
  if (reserveWelcomeSlot) {
    const welcomeRow = await findPostRowById(welcomePostId, userId);
    if (welcomeRow) {
      finalItems = [welcomeRow, ...items];
    }
  }

  return {
    items: await hydratePosts(finalItems, {
      userId,
      welcomeStatus,
    }),
    pagination: {
      limit: safeLimit,
      hasMore,
      nextCursor,
      mode: 'cursor',
    },
    welcome: {
      id: welcomePostId,
      status: welcomeStatus,
    },
  };
}

async function createPost(data) {
  const inserted = await query(
    `INSERT INTO publicacoes
      (autor_id, equipe_id, imagem_url, texto, tipo_publicacao, missao_id, possui_selo_missao)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [
      data.autor_id,
      data.equipe_id,
      data.imagem_url,
      data.texto || null,
      data.tipo_publicacao || 'LIVRE',
      data.missao_id || null,
      data.possui_selo_missao ? 1 : 0,
    ]
  );
  const rows = await query('SELECT * FROM publicacoes WHERE id = ?', [inserted[0].id]);
  return rows[0];
}

async function findPostById(id) {
  const rows = await query('SELECT * FROM publicacoes WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findPostByMissionId(missaoId) {
  const rows = await query(
    `SELECT * FROM publicacoes
     WHERE missao_id = ? AND tipo_publicacao = 'MISSAO_CONCLUIDA'
     ORDER BY criado_em DESC
     LIMIT 1`,
    [missaoId]
  );
  return rows[0] || null;
}

async function deletePost(id) {
  await query('DELETE FROM publicacoes WHERE id = ?', [id]);
}

async function toggleLike(postId, userId, like) {
  if (like) {
    await query(
      `INSERT INTO curtidas (publicacao_id, usuario_id) VALUES (?, ?)
       ON CONFLICT (publicacao_id, usuario_id) DO NOTHING`,
      [postId, userId]
    );
  } else {
    await query(
      'DELETE FROM curtidas WHERE publicacao_id = ? AND usuario_id = ?',
      [postId, userId]
    );
  }
}

async function toggleCommentLike(commentId, userId, like) {
  await ensureFeedIndexes();
  if (like) {
    await query(
      `INSERT INTO curtidas_comentarios (comentario_id, usuario_id) VALUES (?, ?)
       ON CONFLICT (comentario_id, usuario_id) DO NOTHING`,
      [commentId, userId]
    );
  } else {
    await query(
      'DELETE FROM curtidas_comentarios WHERE comentario_id = ? AND usuario_id = ?',
      [commentId, userId]
    );
  }
}

function commentLikeSelect(userId) {
  const viewerId = Number(userId);
  const hasViewer = Number.isInteger(viewerId) && viewerId > 0;
  const likedByMe = hasViewer
    ? `(EXISTS (
         SELECT 1 FROM curtidas_comentarios cc
         WHERE cc.comentario_id = c.id AND cc.usuario_id = ${viewerId}
       )) AS curtida_por_mim`
    : 'FALSE AS curtida_por_mim';

  return `(SELECT COUNT(*)::int FROM curtidas_comentarios cc WHERE cc.comentario_id = c.id) AS curtidas,
      ${likedByMe}`;
}

async function listComments(postId, { limit = 30, offset = 0, userId = null } = {}) {
  await ensureFeedIndexes();
  const safeLimit = Math.min(30, Math.max(1, Number(limit) || 30));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const likeFields = commentLikeSelect(userId);

  const [countRow] = await query(
    `SELECT COUNT(*)::int AS total
     FROM comentarios
     WHERE publicacao_id = ? AND parent_id IS NULL`,
    [postId]
  );
  const total = Number(countRow?.total || 0);

  const roots = await query(
    `SELECT c.*, u.nome AS autor_nome,
      ${likeFields}
     FROM comentarios c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.publicacao_id = ? AND c.parent_id IS NULL
     ORDER BY c.criado_em DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [postId]
  );

  if (roots.length === 0) {
    return {
      items: [],
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
        hasMore: false,
      },
    };
  }

  const rootIds = roots.map((row) => row.id);
  const replies = await query(
    `SELECT c.*, u.nome AS autor_nome,
      ${likeFields}
     FROM comentarios c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.parent_id IN (${rootIds.map(() => '?').join(',')})
     ORDER BY c.criado_em ASC`,
    rootIds
  );

  const repliesByParent = new Map();
  for (const reply of replies) {
    const list = repliesByParent.get(reply.parent_id) || [];
    list.push(reply);
    repliesByParent.set(reply.parent_id, list);
  }

  const items = roots.map((root) => ({
    ...root,
    respostas: repliesByParent.get(root.id) || [],
  }));

  return {
    items,
    pagination: {
      limit: safeLimit,
      offset: safeOffset,
      total,
      hasMore: safeOffset + roots.length < total,
    },
  };
}

async function createComment(data) {
  const inserted = await query(
    `INSERT INTO comentarios (publicacao_id, usuario_id, parent_id, texto)
     VALUES (?, ?, ?, ?)
     RETURNING id`,
    [
      data.publicacao_id,
      data.usuario_id,
      data.parent_id || null,
      data.texto,
    ]
  );
  const rows = await query(
    `SELECT c.*, u.nome AS autor_nome,
      0 AS curtidas,
      FALSE AS curtida_por_mim
     FROM comentarios c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.id = ?`,
    [inserted[0].id]
  );
  return rows[0];
}

async function findCommentById(id) {
  const rows = await query(
    `SELECT c.*, u.nome AS autor_nome
     FROM comentarios c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updateComment(id, texto) {
  await query(
    `UPDATE comentarios
     SET texto = ?, atualizado_em = NOW()
     WHERE id = ?`,
    [texto, id]
  );
  return findCommentById(id);
}

async function deleteComment(id) {
  await query('DELETE FROM comentarios WHERE id = ?', [id]);
}

async function listNews() {
  return query(
    `SELECT n.*, u.nome AS autor_nome
     FROM noticias n
     LEFT JOIN usuarios u ON u.id = n.autor_id
     ORDER BY n.criado_em DESC`
  );
}

async function createNews(data) {
  const inserted = await query(
    `INSERT INTO noticias (titulo, conteudo, imagem_url, autor_id)
     VALUES (?, ?, ?, ?)
     RETURNING id`,
    [data.titulo, data.conteudo, data.imagem_url || null, data.autor_id]
  );
  const rows = await query('SELECT * FROM noticias WHERE id = ?', [inserted[0].id]);
  return rows[0];
}

async function updateNews(id, data) {
  await query(
    `UPDATE noticias
     SET titulo = COALESCE(?, titulo),
         conteudo = COALESCE(?, conteudo),
         imagem_url = COALESCE(?, imagem_url)
     WHERE id = ?`,
    [data.titulo || null, data.conteudo || null, data.imagem_url || null, id]
  );
  const rows = await query('SELECT * FROM noticias WHERE id = ?', [id]);
  return rows[0];
}

async function deleteNews(id) {
  await query('DELETE FROM noticias WHERE id = ?', [id]);
}

async function createNotification(data) {
  await query(
    `INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
     VALUES (?, ?, ?, ?)`,
    [data.usuario_id, data.titulo, data.mensagem, data.tipo]
  );
}

async function createNotificationForTeam(teamId, payload) {
  await query(
    `INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
     SELECT id, ?, ?, ? FROM usuarios WHERE equipe_id = ?`,
    [payload.titulo, payload.mensagem, payload.tipo, teamId]
  );
}

async function createNotificationForAll(payload) {
  await query(
    `INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
     SELECT id, ?, ?, ? FROM usuarios`,
    [payload.titulo, payload.mensagem, payload.tipo]
  );
}

async function listNotifications(userId) {
  return query(
    `SELECT * FROM notificacoes
     WHERE usuario_id = ?
     ORDER BY criado_em DESC`,
    [userId]
  );
}

async function markNotificationAsRead(id, userId) {
  await query(
    'UPDATE notificacoes SET lida = 1, lida_em = NOW() WHERE id = ? AND usuario_id = ?',
    [id, userId]
  );
}

module.exports = {
  listPosts,
  createPost,
  findPostById,
  findPostByMissionId,
  deletePost,
  toggleLike,
  toggleCommentLike,
  listComments,
  createComment,
  findCommentById,
  updateComment,
  deleteComment,
  listNews,
  createNews,
  updateNews,
  deleteNews,
  createNotification,
  createNotificationForTeam,
  createNotificationForAll,
  listNotifications,
  markNotificationAsRead,
};
