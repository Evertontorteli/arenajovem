const AppError = require('../utils/AppError');
const socialRepository = require('../repositories/socialRepository');

function listPosts(pagination) {
  return socialRepository.listPosts(pagination);
}

function createPost(data) {
  return socialRepository.createPost(data);
}

function likePost(postId, userId) {
  return socialRepository.toggleLike(postId, userId, true);
}

function unlikePost(postId, userId) {
  return socialRepository.toggleLike(postId, userId, false);
}

function listComments(postId) {
  return socialRepository.listComments(postId);
}

function createComment(data) {
  return socialRepository.createComment(data);
}

async function deleteComment(commentId, user) {
  const comment = await socialRepository.findCommentById(commentId);
  if (!comment) throw new AppError('Comentário não encontrado.', 404);
  if (user.role !== 'ADMIN' && comment.usuario_id !== user.id) {
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
  likePost,
  unlikePost,
  listComments,
  createComment,
  deleteComment,
  listNews,
  createNews,
  updateNews,
  deleteNews,
  listNotifications,
  readNotification,
};
