import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultRouteForAccess, getPermissionForPath } from '../utils/accessPermissions';

function PermissionRoute({ children, permission, adminOnly = false }) {
  const { loading, isAuthenticated, isAdmin, canAccess, acessos } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-zinc-500">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to={getDefaultRouteForAccess(acessos)} replace />;
  }

  if (permission && !canAccess(permission)) {
    return <Navigate to={getDefaultRouteForAccess(acessos)} replace />;
  }

  return children;
}

export function RoutePermissionGuard({ children }) {
  const { loading, isAuthenticated, canAccess, acessos } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-zinc-500">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/admin') {
    const tab = new URLSearchParams(location.search).get('tab');
    const permission = tab === 'acessos' ? 'admin_acessos' : 'admin_pontuacao';

    if (!canAccess(permission)) {
      if (tab !== 'acessos' && canAccess('admin_acessos')) {
        return <Navigate to="/admin?tab=acessos" replace />;
      }
      if (tab === 'acessos' && canAccess('admin_pontuacao')) {
        return <Navigate to="/admin?tab=pontuacao" replace />;
      }
      return <Navigate to={getDefaultRouteForAccess(acessos)} replace />;
    }

    return children;
  }

  const requiredPermission = getPermissionForPath(location.pathname, location.search);
  if (requiredPermission && !canAccess(requiredPermission)) {
    return <Navigate to={getDefaultRouteForAccess(acessos)} replace />;
  }

  return children;
}

export default PermissionRoute;
