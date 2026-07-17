import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute, { RoutePermissionGuard } from './components/PermissionRoute';
import TeamRequiredRoute from './components/TeamRequiredRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TeamsPage from './pages/TeamsPage';
import MissionsPage from './pages/MissionsPage';
import FeedPage from './pages/FeedPage';
import RankingLivePage from './pages/RankingLivePage';
import NewsPage from './pages/NewsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import TeamSelectionPage from './pages/TeamSelectionPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route
        path="/escolher-time"
        element={
          <ProtectedRoute>
            <TeamSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <TeamRequiredRoute>
              <RoutePermissionGuard>
                <MainLayout />
              </RoutePermissionGuard>
            </TeamRequiredRoute>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <PermissionRoute permission="dashboard">
              <DashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="equipes"
          element={
            <PermissionRoute permission="equipes">
              <TeamsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="missoes"
          element={
            <PermissionRoute permission="missoes">
              <MissionsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="feed"
          element={
            <PermissionRoute permission="feed">
              <FeedPage />
            </PermissionRoute>
          }
        />
        <Route
          path="ranking-live"
          element={
            <PermissionRoute permission="ranking">
              <RankingLivePage />
            </PermissionRoute>
          }
        />
        <Route
          path="noticias"
          element={
            <PermissionRoute permission="noticias">
              <NewsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="perfil"
          element={
            <PermissionRoute permission="perfil">
              <ProfilePage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
