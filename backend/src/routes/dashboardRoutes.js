const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/user', dashboardController.userDashboard);
router.get('/admin', requireRole('ADMIN'), dashboardController.adminDashboard);

module.exports = router;
