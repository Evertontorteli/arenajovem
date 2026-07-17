const asyncHandler = require('../utils/asyncHandler');
const socialService = require('../services/socialService');

const listPosts = asyncHandler(async (req, res) => {
  const posts = await socialService.listPosts({
    page: req.query.page,
    limit: req.query.limit,
    cursor: req.query.cursor,
  });
  res.json(posts);
});

const createPost = asyncHandler(async (req, res) => {
  const post = await socialService.createPost({
    ...req.body,
    autor_id: req.user.id,
    equipe_id: req.user.equipe_id,
    imagem_url: req.file ? `/uploads/${req.file.filename}` : null,
    possui_selo_missao: req.body.tipo_publicacao === 'MISSAO_CONCLUIDA',
  });
  res.status(201).json(post);
});

const likePost = asyncHandler(async (req, res) => {
  await socialService.likePost(req.params.id, req.user.id);
  res.status(204).send();
});

const unlikePost = asyncHandler(async (req, res) => {
  await socialService.unlikePost(req.params.id, req.user.id);
  res.status(204).send();
});

const listComments = asyncHandler(async (req, res) => {
  const comments = await socialService.listComments(req.params.id);
  res.json(comments);
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await socialService.createComment({
    publicacao_id: req.params.id,
    usuario_id: req.user.id,
    texto: req.body.texto,
  });
  res.status(201).json(comment);
});

const deleteComment = asyncHandler(async (req, res) => {
  await socialService.deleteComment(req.params.id, req.user);
  res.status(204).send();
});

const listNews = asyncHandler(async (_req, res) => {
  const news = await socialService.listNews();
  res.json(news);
});

const createNews = asyncHandler(async (req, res) => {
  const news = await socialService.createNews({
    ...req.body,
    autor_id: req.user.id,
    imagem_url: req.file ? `/uploads/${req.file.filename}` : req.body.imagem_url,
  });
  res.status(201).json(news);
});

const updateNews = asyncHandler(async (req, res) => {
  const news = await socialService.updateNews(req.params.id, req.body);
  res.json(news);
});

const deleteNews = asyncHandler(async (req, res) => {
  await socialService.deleteNews(req.params.id);
  res.status(204).send();
});

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await socialService.listNotifications(req.user.id);
  res.json(notifications);
});

const readNotification = asyncHandler(async (req, res) => {
  await socialService.readNotification(req.params.id, req.user.id);
  res.status(204).send();
});

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
