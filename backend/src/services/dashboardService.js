const dashboardRepository = require('../repositories/dashboardRepository');

function getAdminMetrics() {
  return dashboardRepository.getAdminMetrics();
}

function getUserDashboardData(userId) {
  return dashboardRepository.getUserDashboardData(userId);
}

module.exports = {
  getAdminMetrics,
  getUserDashboardData,
};
