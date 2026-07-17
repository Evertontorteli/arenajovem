import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const tabClass = (active) =>
  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
  }`;

const adminTabs = [
  { type: 'route', to: '/', end: true, label: 'Dashboard', permission: 'dashboard' },
  { type: 'route', to: '/equipes', label: 'Equipes', permission: 'equipes' },
  { type: 'route', to: '/perfil', label: 'Perfil', permission: 'perfil' },
  {
    type: 'admin',
    to: '/admin?tab=pontuacao',
    label: 'Pontuação',
    permission: 'admin_pontuacao',
    tab: 'pontuacao',
  },
  {
    type: 'admin',
    to: '/admin?tab=acessos',
    label: 'Acessos',
    permission: 'admin_acessos',
    tab: 'acessos',
  },
];

function AdminNavTabs() {
  const location = useLocation();
  const { canAccess } = useAuth();
  const adminTab = new URLSearchParams(location.search).get('tab') || 'pontuacao';
  const isAdminRoute = location.pathname === '/admin';
  const visibleTabs = adminTabs.filter((tab) => canAccess(tab.permission));

  if (visibleTabs.length === 0) return null;

  return (
    <div className="ig-card flex w-full max-w-full items-center gap-1 overflow-x-auto p-1">
      {visibleTabs.map((tab) => {
        if (tab.type === 'route') {
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => tabClass(isActive)}
            >
              {tab.label}
            </NavLink>
          );
        }

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={tabClass(isAdminRoute && adminTab === tab.tab)}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default AdminNavTabs;
