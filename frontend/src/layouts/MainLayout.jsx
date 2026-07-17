import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaFlagCheckered,
  FaCamera,
  FaTrophy,
  FaBullhorn,
  FaUser,
  FaPlus,
  FaChartBar,
  FaSignOutAlt,
} from 'react-icons/fa';
import AdminNavTabs from '../components/AdminNavTabs';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { getTeamStylesByIndex, getTeamStylesByLabel } from '../utils/teamColors';

const adminHubRoutes = new Set(['/', '/equipes', '/perfil', '/admin']);

const menu = [
  { to: '/', label: 'Dashboard', icon: FaHome, permission: 'dashboard' },
  { to: '/equipes', label: 'Equipes', icon: FaUsers, permission: 'equipes' },
  { to: '/missoes', label: 'Missões', icon: FaFlagCheckered, permission: 'missoes' },
  { to: '/feed', label: 'Feed', icon: FaCamera, permission: 'feed' },
  { to: '/ranking-live', label: 'Ranking Ao Vivo', icon: FaTrophy, permission: 'ranking' },
  { to: '/noticias', label: 'Notícias', icon: FaBullhorn, permission: 'noticias' },
  { to: '/perfil', label: 'Perfil', icon: FaUser, permission: 'perfil' },
];

function MainLayout() {
  const { logout, user, isAdmin, canAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isFeedRoute = location.pathname === '/feed';
  const isProfileRoute = location.pathname === '/perfil';
  const profileTeamStyle = getTeamStylesByLabel(user?.equipe_nome, 'AMARELO');
  const hiddenDesktopRoutes = new Set(['/', '/equipes', '/perfil']);
  const visibleMenu = menu.filter((item) => canAccess(item.permission));
  const desktopMenuItems = isAdmin
    ? [
        ...visibleMenu,
        ...(canAccess('admin_pontuacao') || canAccess('admin_acessos')
          ? [
              {
                to: '/admin',
                label: 'Painel Admin',
                icon: FaChartBar,
                permission: 'admin_pontuacao',
                isAdminPanel: true,
              },
            ]
          : []),
      ]
    : visibleMenu;
  const filteredDesktopMenuItems = desktopMenuItems.filter(
    (item) => !hiddenDesktopRoutes.has(item.to)
  );
  const participantMobileMenu = visibleMenu
    .filter((item) => item.to !== '/perfil')
    .slice(0, 5);
  const mobileMenuItems =
    isAdmin && (canAccess('admin_pontuacao') || canAccess('admin_acessos'))
      ? [
          {
            to: '/admin',
            label: 'Admin',
            icon: FaChartBar,
            permission: 'admin_pontuacao',
            isAdminPanel: true,
          },
          ...visibleMenu.filter((item) => !hiddenDesktopRoutes.has(item.to)).slice(0, 4),
        ]
      : participantMobileMenu;
  const mobileNavGridClass =
    mobileMenuItems.length === 4 ? 'grid-cols-4' : 'grid-cols-5';
  const showAdminNavTabs =
    isAdmin &&
    adminHubRoutes.has(location.pathname) &&
    (canAccess('dashboard') ||
      canAccess('equipes') ||
      canAccess('perfil') ||
      canAccess('admin_pontuacao') ||
      canAccess('admin_acessos'));

  const isAdminPanelActive = adminHubRoutes.has(location.pathname);

  const getNavItemActive = (item, isActive) =>
    item.isAdminPanel ? isAdminPanelActive : isActive;

  const handleOpenComposer = () => {
    if (location.pathname !== '/feed') {
      navigate('/feed?compose=1');
      return;
    }
    window.dispatchEvent(new CustomEvent('arena-open-feed-composer'));
  };

  const desktopNavClass = ({ isActive }) =>
    `flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${
      isActive ? 'bg-zinc-100 font-semibold text-zinc-900' : 'text-zinc-700 hover:bg-zinc-100'
    }`;

  const mobileNavClass = ({ isActive }) =>
    `grid place-items-center text-xl transition ${
      isActive ? 'scale-105 text-zinc-900' : 'text-zinc-500'
    }`;

  return (
    <div className="grid h-full min-h-screen md:grid-cols-[245px_1fr]">
      <aside className="hide-on-mobile sticky top-0 flex h-screen flex-col gap-4 border-r border-zinc-300 bg-white p-3 md:flex">
        <Link className="px-3 py-3 text-3xl font-semibold tracking-tight text-zinc-900" to="/">
          Arena Jovem
        </Link>
        <nav className="grid gap-1">
          {filteredDesktopMenuItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                desktopNavClass({ isActive: getNavItemActive(item, isActive) })
              }
            >
              {({ isActive }) => {
                const Icon = item.icon;
                const active = getNavItemActive(item, isActive);
                const menuTeamStyle = getTeamStylesByIndex(index);
                return (
                  <>
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-lg text-sm transition ${
                        active
                          ? `${menuTeamStyle.bg} text-white shadow-sm`
                          : 'text-zinc-600'
                      }`}
                    >
                      <Icon />
                    </span>
                    <span>{item.label}</span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 border-t border-zinc-200 px-3 pt-3">
          <small className="text-xs text-zinc-500">
            @{(user?.nome || 'usuario').replace(/\s+/g, '').toLowerCase()}
          </small>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </aside>
      <div className="flex h-dvh min-w-0 flex-col overflow-hidden md:h-auto md:overflow-visible md:min-h-screen">
        <header className="z-20 grid h-14 shrink-0 grid-cols-[40px_1fr_40px] items-center bg-white px-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] md:hidden">
          {isFeedRoute ? (
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-zinc-300 text-zinc-700"
              aria-label="Criar publicação"
              onClick={handleOpenComposer}
            >
              <FaPlus className="text-sm" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}
          <h1 className="text-center text-xl font-semibold">Arena Jovem</h1>
          <Link
            to="/perfil"
            aria-label="Abrir perfil"
            className={`grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-transparent transition ${
              isProfileRoute ? `ring-2 ${profileTeamStyle.ring}` : ''
            }`}
          >
            <UserAvatar
              foto={user?.foto}
              nome={user?.nome}
              equipeNome={user?.equipe_nome}
              sizeClass="h-9 w-9"
            />
          </Link>
        </header>
        <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto px-3 py-5 md:overflow-visible md:px-6 md:py-8">
          {showAdminNavTabs ? (
            <div className="mb-4">
              <AdminNavTabs />
            </div>
          ) : null}
          <Outlet />
        </main>
        <nav className={`z-30 grid h-14 shrink-0 ${mobileNavGridClass} border-t border-zinc-300 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden`}>
          {mobileMenuItems.map((item, index) => (
            <NavLink
              key={`mobile-${item.to}`}
              to={item.to}
              end
              aria-label={item.label}
              className={({ isActive }) =>
                mobileNavClass({ isActive: getNavItemActive(item, isActive) })
              }
            >
              {({ isActive }) => {
                const Icon = item.icon;
                const active = getNavItemActive(item, isActive);
                const menuTeamStyle = getTeamStylesByIndex(index);
                return (
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                      active
                        ? `${menuTeamStyle.bg} text-white shadow-sm`
                        : 'text-zinc-500'
                    }`}
                  >
                    <Icon />
                  </span>
                );
              }}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default MainLayout;
