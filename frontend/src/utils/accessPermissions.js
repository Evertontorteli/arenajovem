export const ACCESS_MODULES = {
  dashboard: 'Dashboard',
  equipes: 'Equipes',
  missoes: 'Missões',
  feed: 'Feed',
  ranking: 'Ranking Ao Vivo',
  noticias: 'Notícias',
  perfil: 'Perfil',
  admin_pontuacao: 'Pontuação (Admin)',
  admin_acessos: 'Acessos (Admin)',
};

export const PARTICIPANTE_DEFAULT_ACCESS = [
  'missoes',
  'feed',
  'ranking',
  'noticias',
  'perfil',
];

export const ROUTE_PERMISSION_MAP = {
  '/': 'dashboard',
  '/equipes': 'equipes',
  '/missoes': 'missoes',
  '/feed': 'feed',
  '/ranking-live': 'ranking',
  '/noticias': 'noticias',
  '/perfil': 'perfil',
  '/admin': 'admin_pontuacao',
};

export function getPermissionForPath(pathname, search = '') {
  if (pathname === '/admin') {
    const tab = new URLSearchParams(search).get('tab');
    return tab === 'acessos' ? 'admin_acessos' : 'admin_pontuacao';
  }
  return ROUTE_PERMISSION_MAP[pathname] || null;
}

export function getDefaultRouteForAccess(acessos = []) {
  const order = [
    'dashboard',
    'feed',
    'missoes',
    'ranking',
    'noticias',
    'equipes',
    'perfil',
    'admin_pontuacao',
    'admin_acessos',
  ];
  const routeByPermission = {
    dashboard: '/',
    equipes: '/equipes',
    missoes: '/missoes',
    feed: '/feed',
    ranking: '/ranking-live',
    noticias: '/noticias',
    perfil: '/perfil',
    admin_pontuacao: '/admin?tab=pontuacao',
    admin_acessos: '/admin?tab=acessos',
  };

  const allowed = order.find((key) => acessos.includes(key));
  return allowed ? routeByPermission[allowed] : '/perfil';
}

export function getPostLoginRoute(user) {
  if (!user) return '/login';
  if (user.role !== 'ADMIN' && !userHasProfilePhoto(user)) {
    return '/escolher-avatar';
  }
  if (!user.equipe_id && user.role !== 'ADMIN') {
    return '/escolher-time';
  }
  if (user.role === 'ADMIN') {
    return '/';
  }
  if (canAccessModule(user.acessos || PARTICIPANTE_DEFAULT_ACCESS, 'feed')) {
    return '/feed';
  }
  return getDefaultRouteForAccess(user.acessos || PARTICIPANTE_DEFAULT_ACCESS);
}

export function userHasProfilePhoto(user) {
  if (!user) return false;
  const foto = user.foto;
  return typeof foto === 'string' && foto.trim().length > 0;
}

export const ADMIN_ONLY_MODULES = ['dashboard', 'equipes', 'admin_pontuacao', 'admin_acessos'];

export function getModulesForRole(role) {
  return Object.entries(ACCESS_MODULES).filter(([key]) =>
    role === 'ADMIN' ? true : !ADMIN_ONLY_MODULES.includes(key)
  );
}

export function canAccessModule(acessos = [], permission) {
  return acessos.includes(permission);
}
