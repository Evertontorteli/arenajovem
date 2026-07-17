const asyncHandler = require('../utils/asyncHandler');
const accessProfileService = require('../services/accessProfileService');

const list = asyncHandler(async (_req, res) => {
  const profiles = await accessProfileService.listProfiles();
  res.json(profiles);
});

const update = asyncHandler(async (req, res) => {
  const role = String(req.params.role || '').toUpperCase();
  const result = await accessProfileService.updateProfile(role, req.body.acessos);
  res.json(result);
});

module.exports = {
  list,
  update,
};
