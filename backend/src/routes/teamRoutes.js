const express = require('express');
const teamController = require('../controllers/teamController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', teamController.list);
router.post('/', requireRole('ADMIN'), teamController.create);
router.put('/:id', requireRole('ADMIN'), teamController.update);
router.delete('/:id', requireRole('ADMIN'), teamController.remove);

module.exports = router;
