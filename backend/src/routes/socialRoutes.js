const express = require('express');
const socialController = require('../controllers/socialController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/posts', socialController.listPosts);
router.post(
  '/posts',
  requireRole('PARTICIPANTE', 'ADMIN'),
  upload.single('imagem'),
  socialController.createPost
);
router.delete('/posts/:id', socialController.deletePost);
router.post('/posts/:id/like', socialController.likePost);
router.delete('/posts/:id/like', socialController.unlikePost);
router.get('/posts/:id/comments', socialController.listComments);
router.post('/posts/:id/comments', socialController.createComment);
router.put('/comments/:id', socialController.updateComment);
router.delete('/comments/:id', socialController.deleteComment);

router.get('/news', socialController.listNews);
router.post('/news', requireRole('ADMIN'), upload.single('imagem'), socialController.createNews);
router.put('/news/:id', requireRole('ADMIN'), socialController.updateNews);
router.delete('/news/:id', requireRole('ADMIN'), socialController.deleteNews);

router.get('/notifications', socialController.listNotifications);
router.patch('/notifications/:id/read', socialController.readNotification);

router.get('/welcome-post', requireRole('ADMIN'), socialController.getWelcomePost);
router.patch(
  '/welcome-post',
  requireRole('ADMIN'),
  socialController.updateWelcomePost
);

module.exports = router;
