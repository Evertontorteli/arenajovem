const asyncHandler = require('../utils/asyncHandler');
const teamService = require('../services/teamService');

const list = asyncHandler(async (_req, res) => {
  const teams = await teamService.listTeams();
  res.json(teams);
});

const create = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.body);
  res.status(201).json(team);
});

const update = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeam(req.params.id, req.body);
  res.json(team);
});

const remove = asyncHandler(async (req, res) => {
  await teamService.deleteTeam(req.params.id);
  res.status(204).send();
});

module.exports = {
  list,
  create,
  update,
  remove,
};
