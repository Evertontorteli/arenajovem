import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import http from '../api/http';
import {
  canAccessModule,
  getDefaultRouteForAccess,
  getPermissionForPath,
  PARTICIPANTE_DEFAULT_ACCESS,
} from '../utils/accessPermissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem('arena_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await http.get('/users/me');
        setUser(data);
      } catch (_error) {
        localStorage.removeItem('arena_token');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  const login = async (contato, senha) => {
    const { data } = await http.post('/auth/login', { contato, senha });
    localStorage.setItem('arena_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async ({ nome, email, senha, telefone, aceite_lgpd }) => {
    const { data } = await http.post('/auth/signup', {
      nome,
      email,
      senha,
      telefone,
      aceite_lgpd,
    });
    localStorage.setItem('arena_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('arena_token');
    setUser(null);
  };

  const deleteAccount = async () => {
    await http.delete('/users/me');
    localStorage.removeItem('arena_token');
    setUser(null);
  };

  const value = useMemo(() => {
    const acessos = user?.acessos?.length
      ? user.acessos
      : user?.role === 'ADMIN'
        ? null
        : PARTICIPANTE_DEFAULT_ACCESS;

    const resolvedAcessos =
      acessos ||
      (user?.role === 'ADMIN'
        ? [
            'dashboard',
            'equipes',
            'missoes',
            'feed',
            'ranking',
            'noticias',
            'perfil',
            'admin_pontuacao',
            'admin_acessos',
          ]
        : PARTICIPANTE_DEFAULT_ACCESS);

    return {
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      hasTeam: Boolean(user?.equipe_id),
      acessos: resolvedAcessos,
      canAccess: (permission) => canAccessModule(resolvedAcessos, permission),
      canAccessPath: (pathname, search = '') => {
        const permission = getPermissionForPath(pathname, search);
        if (!permission) return true;
        return canAccessModule(resolvedAcessos, permission);
      },
      getDefaultRoute: () => getDefaultRouteForAccess(resolvedAcessos),
      login,
      signup,
      logout,
      deleteAccount,
      refreshUser: async () => {
        const { data } = await http.get('/users/me');
        setUser(data);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
