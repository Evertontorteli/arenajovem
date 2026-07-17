const express = require('express');
const competitionController = require('../controllers/competitionController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/missions', competitionController.listMissions);
router.post(
  '/missions',
  requireRole('ADMIN'),
  upload.single('imagem_capa'),
  competitionController.createMission
);
router.put(
  '/missions/:id',
  requireRole('ADMIN'),
  upload.single('imagem_capa'),
  competitionController.updateMission
);
router.delete('/missions/:id', requireRole('ADMIN'), competitionController.deleteMission);
router.patch(
  '/missions/:id/status',
  requireRole('ADMIN'),
  competitionController.updateMissionStatus
);
router.post(
  '/missions/:id/submit',
  requireRole('PARTICIPANTE', 'ADMIN'),
  upload.single('imagem'),
  competitionController.submitMission
);
router.get(
  '/mission-submissions',
  requireRole('ADMIN'),
  competitionController.listMissionSubmissions
);
router.patch(
  '/mission-submissions/:id/review',
  requireRole('ADMIN'),
  competitionController.reviewMissionSubmission
);

router.get('/foods', competitionController.listFoodRecords);
router.post('/foods', competitionController.createFoodRecord);
router.patch('/foods/:id/confirm', requireRole('ADMIN'), competitionController.confirmFoodRecord);

router.get('/scores/history', competitionController.listScoreHistory);
router.post('/scores/manual', requireRole('ADMIN'), competitionController.createManualScore);

router.get('/ranking', competitionController.getRanking);

module.exports = router;
