const express = require('express');
const competitionController = require('../controllers/competitionController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { uploadMedia } = require('../middlewares/uploadMediaMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/missions', competitionController.listMissions);
router.post(
  '/missions',
  requireRole('ADMIN'),
  uploadMedia.any(),
  competitionController.createMission
);
router.put(
  '/missions/:id',
  requireRole('ADMIN'),
  uploadMedia.any(),
  competitionController.updateMission
);
router.delete('/missions/:id', requireRole('ADMIN'), competitionController.deleteMission);
router.patch(
  '/missions/:id/status',
  requireRole('ADMIN'),
  competitionController.updateMissionStatus
);
router.post(
  '/missions/:id/feed-post',
  requireRole('ADMIN'),
  competitionController.postMissionToFeed
);
router.post(
  '/missions/:id/submit',
  requireRole('PARTICIPANTE', 'ADMIN'),
  uploadMedia.any(),
  competitionController.submitMission
);
router.get(
  '/missions/:id/quiz',
  requireRole('PARTICIPANTE', 'ADMIN'),
  competitionController.getMissionQuiz
);
router.post(
  '/missions/:id/quiz/start',
  requireRole('PARTICIPANTE', 'ADMIN'),
  competitionController.startMissionQuiz
);
router.post(
  '/missions/:id/quiz/submit',
  requireRole('PARTICIPANTE', 'ADMIN'),
  competitionController.submitMissionQuiz
);
router.get(
  '/missions/:id/quiz/ranking',
  requireRole('PARTICIPANTE', 'ADMIN'),
  competitionController.getMissionQuizRanking
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
