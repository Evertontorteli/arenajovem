const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');
const authService = require('../services/authService');
const { persistUpload } = require('../utils/persistUpload');
const { invalidateCachedUser } = require('../utils/userSessionCache');

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
  invalidateCachedUser(req.user.id);
  res.json(user);
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(req.user.id, req.body);
  res.json(result);
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Selecione uma imagem para o avatar.' });
  }

  const fotoUrl = await persistUpload(req.file);
  const user = await userService.updateProfile(req.user.id, {
    foto: fotoUrl,
  });
  invalidateCachedUser(req.user.id);
  res.json(user);
});

const updateTeam = asyncHandler(async (req, res) => {
  const user = await userService.updateTeam(req.params.id, req.body.equipe_id);
  invalidateCachedUser(req.params.id);
  res.json(user);
});

const updateMyTeam = asyncHandler(async (req, res) => {
  const user = await userService.updateTeam(req.user.id, req.body.equipe_id);
  const session = await authService.buildAuthResponse(user);
  res.json({
    ...session.user,
    token: session.token,
  });
});

const updateAccess = asyncHandler(async (req, res) => {
  const user = await userService.updateAccess(req.user.id, req.params.id, req.body);
  invalidateCachedUser(req.params.id);
  res.json(user);
});

const deleteMyAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteMyAccount(req.user.id);
  invalidateCachedUser(req.user.id);
  res.json(result);
});

module.exports = {
  me,
  list,
  updateProfile,
  changePassword,
  uploadAvatar,
  updateTeam,
  updateMyTeam,
  updateAccess,
  deleteMyAccount,
};
