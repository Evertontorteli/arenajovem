const { query } = require('../config/db');
const AppError = require('../utils/AppError');
const {
  encodeCursorToken,
  decodeCursorToken,
} = require('../utils/cursorToken');

async function listPosts({ page = 1, limit = 6, cursor = null } = {}) {
  const safeLimit = Math.min(20, Math.max(1, Number(limit) || 6));
  const safeLimitPlusOne = safeLimit + 1;
  const decodedCursor = decodeCursorToken(cursor);
  if (cursor && !decodedCursor) {
    throw new AppError('Cursor inválido ou expirado.', 400);
  }

  if (decodedCursor) {
    const rows = await query(
      `SELECT p.*, u.nome AS autor_nome, e.nome AS equipe_nome,
        (SELECT COUNT(*) FROM curtidas c WHERE c.publicacao_id = p.id) AS curtidas,
        (SELECT COUNT(*) FROM comentarios c2 WHERE c2.publicacao_id = p.id) AS comentarios
       FROM publicacoes p
       INNER JOIN usuarios u ON u.id = p.autor_id
       INNER JOIN equipes e ON e.id = p.equipe_id
       WHERE (
         p.criado_em < ?
         OR (p.criado_em = ? AND p.id < ?)
       )
       ORDER BY p.criado_em DESC, p.id DESC
       LIMIT ${safeLimitPlusOne}`,
      [
        decodedCursor.criadoEm,
        decodedCursor.criadoEm,
        decodedCursor.id,
      ]
    );

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

  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  const posts = await query(
    `SELECT p.*, u.nome AS autor_nome, e.nome AS equipe_nome,
      (SELECT COUNT(*) FROM curtidas c WHERE c.publicacao_id = p.id) AS curtidas,
      (SELECT COUNT(*) FROM comentarios c2 WHERE c2.publicacao_id = p.id) AS comentarios
     FROM publicacoes p
     INNER JOIN usuarios u ON u.id = p.autor_id
     INNER JOIN equipes e ON e.id = p.equipe_id
     ORDER BY p.criado_em DESC, p.id DESC
     LIMIT ${safeLimit} OFFSET ${offset}`
  );

  const [countRow] = await query('SELECT COUNT(*) AS total FROM publicacoes');
  const total = Number(countRow?.total || 0);
  const totalPages = Math.ceil(total / safeLimit) || 1;
  const hasMore = safePage < totalPages;
  const nextCursor = posts.length
    ? encodeCursorToken(posts[posts.length - 1])
    : null;

  return {
    items: posts,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasMore,
      nextCursor: hasMore ? nextCursor : null,
      mode: 'offset',
    },
  };
}

async function createPost(data) {
  const result = await query(
    `INSERT INTO publicacoes
      (autor_id, equipe_id, imagem_url, texto, tipo_publicacao, missao_id, possui_selo_missao)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
  const rows = await query('SELECT * FROM publicacoes WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function toggleLike(postId, userId, like) {
  if (like) {
    await query(
      'INSERT IGNORE INTO curtidas (publicacao_id, usuario_id) VALUES (?, ?)',
      [postId, userId]
    );
  } else {
    await query(
      'DELETE FROM curtidas WHERE publicacao_id = ? AND usuario_id = ?',
      [postId, userId]
    );
  }
}

async function listComments(postId) {
  return query(
    `SELECT c.*, u.nome AS autor_nome
     FROM comentarios c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.publicacao_id = ?
     ORDER BY c.criado_em ASC`,
    [postId]
  );
}

async function createComment(data) {
  const result = await query(
    `INSERT INTO comentarios (publicacao_id, usuario_id, texto)
     VALUES (?, ?, ?)`,
    [data.publicacao_id, data.usuario_id, data.texto]
  );
  const rows = await query('SELECT * FROM comentarios WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function findCommentById(id) {
  const rows = await query('SELECT * FROM comentarios WHERE id = ?', [id]);
  return rows[0] || null;
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
  const result = await query(
    `INSERT INTO noticias (titulo, conteudo, imagem_url, autor_id)
     VALUES (?, ?, ?, ?)`,
    [data.titulo, data.conteudo, data.imagem_url || null, data.autor_id]
  );
  const rows = await query('SELECT * FROM noticias WHERE id = ?', [result.insertId]);
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
  toggleLike,
  listComments,
  createComment,
  findCommentById,
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
