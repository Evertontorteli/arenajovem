const express = require('express');
const userController = require('../controllers/userController');
const upload = require('../middlewares/uploadMiddleware');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/me', userController.me);
router.put('/me', userController.updateProfile);
router.put('/me/password', userController.changePassword);
router.delete('/me', userController.deleteMyAccount);
router.post('/me/avatar', upload.single('foto'), userController.uploadAvatar);
router.patch('/me/team', userController.updateMyTeam);
router.get('/', requireRole('ADMIN'), userController.list);
router.patch('/:id/team', requireRole('ADMIN'), userController.updateTeam);
router.patch('/:id/access', requireRole('ADMIN'), userController.updateAccess);

module.exports = router;
