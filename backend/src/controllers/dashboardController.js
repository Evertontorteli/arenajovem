const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');

const userDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getUserDashboardData(req.user.id);
  res.json(data);
});

const adminDashboard = asyncHandler(async (_req, res) => {
  const data = await dashboardService.getAdminMetrics();
  res.json(data);
});

module.exports = {
  userDashboard,
  adminDashboard,
};
