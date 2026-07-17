import { useEffect, useState } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import http from '../api/http';
import AvatarPicker from '../components/AvatarPicker';
import UserAvatar from '../components/UserAvatar';

function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [foto, setFoto] = useState(user?.foto || '');
  const [notifications, setNotifications] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setNome(user?.nome || '');
    setFoto(user?.foto || '');
  }, [user]);

  useEffect(() => {
    async function loadNotifications() {
      const { data } = await http.get('/social/notifications');
      setNotifications(data);
    }
    loadNotifications();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await http.put('/users/me', { nome });
      await refreshUser();
      alert('Perfil atualizado.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarSaved = async () => {
    await refreshUser();
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-zinc-900">Meu Perfil</h2>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          <div className="ig-card flex items-center gap-3 p-4">
            <UserAvatar
              foto={foto}
              nome={user?.nome}
              equipeNome={user?.equipe_nome}
              sizeClass="h-14 w-14"
            />
            <div>
              <h3 className="text-base font-semibold text-zinc-900">{user?.nome}</h3>
              <small className="text-xs text-zinc-500">
                @{(user?.nome || '').replace(/\s+/g, '').toLowerCase()}
              </small>
            </div>
          </div>

          <AvatarPicker
            user={user}
            foto={foto}
            onFotoChange={setFoto}
            onSaved={handleAvatarSaved}
          />

          <form className="ig-card grid gap-2 p-4" onSubmit={saveProfile}>
            <input
              className="ig-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome"
            />
            <button type="submit" className="ig-button" disabled={savingProfile}>
              {savingProfile ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </form>

          <button
            type="button"
            onClick={logout}
            className="ig-card flex w-full items-center justify-center gap-2 p-4 text-sm font-medium text-rose-600 transition hover:bg-rose-50 md:hidden"
          >
            <FaSignOutAlt />
            Sair da conta
          </button>

          <div className="ig-card p-4">
            <h3 className="mb-3 text-base font-semibold text-zinc-900">Notificações</h3>
            <div className="grid gap-2.5">
              {notifications.slice(0, 10).map((item) => (
                <div key={item.id} className="grid gap-0.5">
                  <strong className="text-sm text-zinc-900">{item.titulo}</strong>
                  <small className="text-xs text-zinc-500">{item.mensagem}</small>
                </div>
              ))}
              {notifications.length === 0 ? (
                <p className="text-sm text-zinc-500">Sem notificações no momento.</p>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="ig-card sticky top-7 space-y-3 p-4">
            <h3 className="text-base font-semibold text-zinc-900">Resumo</h3>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Email</span>
              <strong className="text-zinc-900">{user?.email || '-'}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Equipe</span>
              <strong className="text-zinc-900">{user?.equipe_nome || 'Sem equipe'}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Perfil</span>
              <strong className="text-zinc-900">{user?.role || '-'}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default ProfilePage;
