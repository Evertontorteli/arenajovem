const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body);
  res.json(result);
});

const verifyResetCode = asyncHandler(async (req, res) => {
  const result = await authService.verifyPasswordResetCode(req.body);
  res.json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPasswordWithCode(req.body);
  res.json(result);
});

module.exports = {
  login,
  register,
  signup,
  forgotPassword,
  verifyResetCode,
  resetPassword,
};
