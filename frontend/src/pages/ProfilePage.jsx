import { useEffect, useState } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import http from '../api/http';
import AvatarPicker from '../components/AvatarPicker';
import UserAvatar from '../components/UserAvatar';
import { isValidFullName, normalizeFullName } from '../utils/fullName';

function ProfilePage() {
  const { user, refreshUser, logout, deleteAccount } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [foto, setFoto] = useState(user?.foto || '');
  const [notifications, setNotifications] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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
    const nomeCompleto = normalizeFullName(nome);
    if (!isValidFullName(nomeCompleto)) {
      setProfileError('Informe nome e sobrenome.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    try {
      await http.put('/users/me', { nome: nomeCompleto });
      await refreshUser();
      alert('Perfil atualizado.');
    } catch (requestError) {
      setProfileError(
        requestError?.response?.data?.message ||
          'Não foi possível salvar o perfil.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!senhaAtual || !senhaNova || !confirmarSenha) {
      setPasswordError('Preencha todos os campos de senha.');
      return;
    }
    if (senhaNova.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senhaNova !== confirmarSenha) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    setSavingPassword(true);
    try {
      const { data } = await http.put('/users/me/password', {
        senhaAtual,
        senhaNova,
        confirmarSenha,
      });
      setPasswordSuccess(data.message || 'Senha alterada com sucesso.');
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmarSenha('');
    } catch (requestError) {
      setPasswordError(
        requestError?.response?.data?.message || 'Não foi possível alterar a senha.'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarSaved = async () => {
    await refreshUser();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Apagar sua conta permanentemente? Seus dados de cadastro serão removidos. Esta ação não pode ser desfeita.'
    );
    if (!confirmed) return;
    const typed = window.prompt('Digite APAGAR para confirmar:');
    if (String(typed || '').trim().toUpperCase() !== 'APAGAR') {
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteAccount();
    } catch (requestError) {
      alert(
        requestError?.response?.data?.message ||
          'Não foi possível apagar a conta.'
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-zinc-900">Meu Perfil</h2>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          <form className="ig-card grid gap-3 p-4" onSubmit={saveProfile}>
            <div className="flex items-center gap-3">
              <UserAvatar
                foto={foto}
                nome={nome || user?.nome}
                equipeNome={user?.equipe_nome}
                sizeClass="h-14 w-14"
              />
              <div className="min-w-0 flex-1">
                <input
                  className="ig-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome e sobrenome"
                  aria-label="Nome e sobrenome"
                  autoComplete="name"
                />
                <p className="mt-1 truncate text-xs text-zinc-500">
                  @{(nome || user?.nome || '').replace(/\s+/g, '').toLowerCase()}
                  {user?.equipe_nome ? ` · ${user.equipe_nome}` : ''}
                </p>
              </div>
            </div>
            {profileError ? (
              <p className="text-sm text-rose-500">{profileError}</p>
            ) : null}
            <button type="submit" className="ig-button" disabled={savingProfile}>
              {savingProfile ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </form>

          <AvatarPicker
            user={user}
            foto={foto}
            onFotoChange={setFoto}
            onSaved={handleAvatarSaved}
          />

          <form className="ig-card grid gap-2 p-4" onSubmit={changePassword}>
            <h3 className="mb-1 text-base font-semibold text-zinc-900">Alterar senha</h3>
            <p className="mb-1 text-xs text-zinc-500">
              Informe a senha atual e escolha uma nova senha com pelo menos 6 caracteres.
            </p>
            <input
              className="ig-input"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Senha atual"
              autoComplete="current-password"
              required
            />
            <input
              className="ig-input"
              type="password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              placeholder="Nova senha"
              autoComplete="new-password"
              required
              minLength={6}
            />
            <input
              className="ig-input"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Confirmar nova senha"
              autoComplete="new-password"
              required
              minLength={6}
            />
            {passwordError ? (
              <span className="text-sm text-rose-500">{passwordError}</span>
            ) : null}
            {passwordSuccess ? (
              <span className="text-sm text-emerald-600">{passwordSuccess}</span>
            ) : null}
            <button type="submit" className="ig-button" disabled={savingPassword}>
              {savingPassword ? 'Alterando...' : 'Alterar senha'}
            </button>
          </form>

          <button
            type="button"
            onClick={logout}
            className="ig-card flex w-full items-center justify-center gap-2 p-4 text-sm font-medium text-rose-600 transition hover:bg-rose-50 lg:hidden"
          >
            <FaSignOutAlt />
            Sair da conta
          </button>

          <div className="ig-card space-y-3 p-4">
            <h3 className="text-base font-semibold text-zinc-900">Privacidade</h3>
            <p className="text-sm text-zinc-500">
              Você pode ler o aviso LGPD e apagar sua conta a qualquer momento.
              O Arena Jovem é temporário e pode sair do ar após o evento.
            </p>
            <Link
              to="/privacidade"
              className="inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Ver Aviso de Privacidade e LGPD
            </Link>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              {deletingAccount ? 'Apagando conta...' : 'Apagar minha conta'}
            </button>
          </div>

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
