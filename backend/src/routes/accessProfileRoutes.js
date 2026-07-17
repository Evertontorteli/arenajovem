const express = require('express');
const accessProfileController = require('../controllers/accessProfileController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));
router.get('/', accessProfileController.list);
router.patch('/:role', accessProfileController.update);

module.exports = router;
