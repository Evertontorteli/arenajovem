const AppError = require('../utils/AppError');
const socialRepository = require('../repositories/socialRepository');

function listPosts(pagination) {
  return socialRepository.listPosts(pagination);
}

function createPost(data, actor = {}) {
  if (!data.imagem_url) {
    throw new AppError('Selecione uma imagem para publicar.', 400);
  }

  const isAdmin = actor.role === 'ADMIN';
  if (!data.equipe_id && !isAdmin) {
    throw new AppError('Você precisa estar em uma equipe para publicar.', 400);
  }

  return socialRepository.createPost({
    ...data,
    equipe_id: data.equipe_id || null,
  });
}

async function deletePost(postId, user) {
  const post = await socialRepository.findPostById(postId);
  if (!post) throw new AppError('Publicação não encontrada.', 404);
  if (Number(post.autor_id) !== Number(user.id)) {
    throw new AppError('Você só pode excluir a sua própria publicação.', 403);
  }

  const mediaMatch = String(post.imagem_url || '').match(/^\/api\/media\/(\d+)$/);
  await socialRepository.deletePost(postId);

  if (mediaMatch) {
    try {
      const { query } = require('../config/db');
      await query('DELETE FROM midias WHERE id = ?', [Number(mediaMatch[1])]);
    } catch (_error) {
      // Publicação já removida; mídia órfã não bloqueia a exclusão.
    }
  }
}

function likePost(postId, userId) {
  return socialRepository.toggleLike(postId, userId, true);
}

function unlikePost(postId, userId) {
  return socialRepository.toggleLike(postId, userId, false);
}

function listComments(postId, pagination) {
  return socialRepository.listComments(postId, pagination);
}

async function createComment(data) {
  const texto = String(data.texto || '').trim();
  if (!texto) {
    throw new AppError('Escreva um comentário.', 400);
  }
  if (texto.length > 300) {
    throw new AppError('Comentário deve ter no máximo 300 caracteres.', 400);
  }

  let parentId = data.parent_id ? Number(data.parent_id) : null;
  if (parentId) {
    const parent = await socialRepository.findCommentById(parentId);
    if (!parent || Number(parent.publicacao_id) !== Number(data.publicacao_id)) {
      throw new AppError('Comentário pai inválido.', 400);
    }
    // Mantém apenas 1 nível de resposta (thread sob o comentário raiz)
    if (parent.parent_id) {
      parentId = Number(parent.parent_id);
    }
  }

  return socialRepository.createComment({
    publicacao_id: data.publicacao_id,
    usuario_id: data.usuario_id,
    parent_id: parentId,
    texto,
  });
}

async function updateComment(commentId, user, texto) {
  const comment = await socialRepository.findCommentById(commentId);
  if (!comment) throw new AppError('Comentário não encontrado.', 404);
  if (user.role !== 'ADMIN' && Number(comment.usuario_id) !== Number(user.id)) {
    throw new AppError('Você não pode editar este comentário.', 403);
  }

  const nextText = String(texto || '').trim();
  if (!nextText) {
    throw new AppError('Escreva um comentário.', 400);
  }
  if (nextText.length > 300) {
    throw new AppError('Comentário deve ter no máximo 300 caracteres.', 400);
  }

  return socialRepository.updateComment(commentId, nextText);
}

async function deleteComment(commentId, user) {
  const comment = await socialRepository.findCommentById(commentId);
  if (!comment) throw new AppError('Comentário não encontrado.', 404);
  if (user.role !== 'ADMIN' && Number(comment.usuario_id) !== Number(user.id)) {
    throw new AppError('Você não pode excluir este comentário.', 403);
  }
  await socialRepository.deleteComment(commentId);
}

function listNews() {
  return socialRepository.listNews();
}

async function createNews(data) {
  const news = await socialRepository.createNews(data);
  await socialRepository.createNotificationForAll({
    titulo: 'Nova notícia',
    mensagem: news.titulo,
    tipo: 'NOVA_NOTICIA',
  });
  return news;
}

function updateNews(id, data) {
  return socialRepository.updateNews(id, data);
}

function deleteNews(id) {
  return socialRepository.deleteNews(id);
}

function listNotifications(userId) {
  return socialRepository.listNotifications(userId);
}

function readNotification(id, userId) {
  return socialRepository.markNotificationAsRead(id, userId);
}

module.exports = {
  listPosts,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  listComments,
  createComment,
  updateComment,
  deleteComment,
  listNews,
  createNews,
  updateNews,
  deleteNews,
  listNotifications,
  readNotification,
};
