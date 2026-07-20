const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const teamRoutes = require('./teamRoutes');
const competitionRoutes = require('./competitionRoutes');
const socialRoutes = require('./socialRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const accessProfileRoutes = require('./accessProfileRoutes');
const mediaController = require('../controllers/mediaController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Arena Jovem API' });
});

router.get('/health/db', async (_req, res) => {
  try {
    const { query } = require('../config/db');
    const mediaRepository = require('../repositories/mediaRepository');
    await mediaRepository.ensureMediaTable();
    const rows = await query('SELECT 1 AS ok');
    res.json({
      ok: true,
      database: 'connected',
      result: rows[0]?.ok === 1,
      mediaStorage: 'database',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: 'error',
      message: error.message,
    });
  }
});

router.get('/media/:id', asyncHandler(mediaController.getMedia));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/competition', competitionRoutes);
router.use('/social', socialRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/access-profiles', accessProfileRoutes);

module.exports = router;
