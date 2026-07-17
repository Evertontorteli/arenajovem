import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function TeamRequiredRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-zinc-500">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN' && !user.equipe_id) {
    return <Navigate to="/escolher-time" replace />;
  }

  return children;
}

export default TeamRequiredRoute;
