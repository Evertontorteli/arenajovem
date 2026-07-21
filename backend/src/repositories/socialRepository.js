const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const {
  encodeCursorToken,
  decodeCursorToken,
} = require('../utils/cursorToken');
const { ensureFeedIndexes } = require('../database/ensureFeedIndexes');

async function listPosts({ limit = 6, cursor = null, userId = null } = {}) {
  await ensureFeedIndexes();

  const safeLimit = Math.min(12, Math.max(1, Number(limit) || 6));
  const safeLimitPlusOne = safeLimit + 1;
  const decodedCursor = decodeCursorToken(cursor);
  if (cursor && !decodedCursor) {
    throw new AppError('Cursor inválido ou expirado.', 400);
  }

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

  let rows;
  if (decodedCursor) {
    const params = hasViewer
      ? [
          viewerId,
          decodedCursor.criadoEm,
          decodedCursor.criadoEm,
          decodedCursor.id,
        ]
      : [
          decodedCursor.criadoEm,
          decodedCursor.criadoEm,
          decodedCursor.id,
        ];

    rows = await query(
      `${selectSql}
       WHERE (
         p.criado_em < ?
         OR (p.criado_em = ? AND p.id < ?)
       )
       ORDER BY p.criado_em DESC, p.id DESC
       LIMIT ${safeLimitPlusOne}`,
      params
    );
  } else {
    const params = hasViewer ? [viewerId] : [];
    rows = await query(
      `${selectSql}
       ORDER BY p.criado_em DESC, p.id DESC
       LIMIT ${safeLimitPlusOne}`,
      params
    );
  }

  const hasMore = rows.length > safeLimit;
  const items = hasMore ? rows.slice(0, safeLimit) : rows;
  const nextCursor = hasMore
    ? encodeCursorToken(items[items.length - 1])
    : null;

  return {
    items,
    pagination: {
      limit: safeLimit,
      hasMore,
      nextCursor,
      mode: 'cursor',
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

async function listComments(postId, { limit = 30, offset = 0 } = {}) {
  const safeLimit = Math.min(30, Math.max(1, Number(limit) || 30));
  const safeOffset = Math.max(0, Number(offset) || 0);

  const [countRow] = await query(
    `SELECT COUNT(*)::int AS total
     FROM comentarios
     WHERE publicacao_id = ? AND parent_id IS NULL`,
    [postId]
  );
  const total = Number(countRow?.total || 0);

  const roots = await query(
    `SELECT c.*, u.nome AS autor_nome
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
    `SELECT c.*, u.nome AS autor_nome
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
    `SELECT c.*, u.nome AS autor_nome
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
  deletePost,
  toggleLike,
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
