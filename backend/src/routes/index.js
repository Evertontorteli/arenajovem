const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const teamRoutes = require('./teamRoutes');
const competitionRoutes = require('./competitionRoutes');
const socialRoutes = require('./socialRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const accessProfileRoutes = require('./accessProfileRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Arena Jovem API' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/competition', competitionRoutes);
router.use('/social', socialRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/access-profiles', accessProfileRoutes);

module.exports = router;
