const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

const me = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user.id);
  res.json(user);
});

const list = asyncHandler(async (_req, res) => {
  const users = await userService.listUsers();
  res.json(users);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  res.json(user);
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Selecione uma imagem para o avatar.' });
  }

  const user = await userService.updateProfile(req.user.id, {
    foto: `/uploads/${req.file.filename}`,
  });
  res.json(user);
});

const updateTeam = asyncHandler(async (req, res) => {
  const user = await userService.updateTeam(req.params.id, req.body.equipe_id);
  res.json(user);
});

const updateMyTeam = asyncHandler(async (req, res) => {
  const user = await userService.updateTeam(req.user.id, req.body.equipe_id);
  res.json(user);
});

const updateAccess = asyncHandler(async (req, res) => {
  const user = await userService.updateAccess(req.user.id, req.params.id, req.body);
  res.json(user);
});

module.exports = {
  me,
  list,
  updateProfile,
  uploadAvatar,
  updateTeam,
  updateMyTeam,
  updateAccess,
};
