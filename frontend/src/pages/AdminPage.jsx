import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import http from '../api/http';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import {
  ACCESS_MODULES,
} from '../utils/accessPermissions';

function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAccess, refreshUser } = useAuth();
  const activeTab = searchParams.get('tab') === 'acessos' ? 'acessos' : 'pontuacao';
  const accessView = searchParams.get('view') === 'usuarios' ? 'usuarios' : 'perfis';
  const [metrics, setMetrics] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [profileAccess, setProfileAccess] = useState({
    PARTICIPANTE: [],
    ADMIN: [],
  });
  const [selectedProfileRole, setSelectedProfileRole] = useState('PARTICIPANTE');
  const [profileDraft, setProfileDraft] = useState([]);
  const [savingProfileAccess, setSavingProfileAccess] = useState(false);
  const [accessDrafts, setAccessDrafts] = useState({});
  const [savingAccessId, setSavingAccessId] = useState(null);
  const [accessMessage, setAccessMessage] = useState('');
  const [accessError, setAccessError] = useState('');
  const [score, setScore] = useState({
    equipe_id: '',
    pontos: 10,
    tipo: 'ADICAO',
    motivo: '',
    observacao: '',
  });

  const load = async () => {
    const [{ data: admin }, { data: teamsData }, { data: usersData }, { data: profiles }] =
      await Promise.all([
        http.get('/dashboard/admin'),
        http.get('/teams'),
        http.get('/users'),
        http.get('/access-profiles'),
      ]);
    setMetrics(admin);
    setTeams(teamsData);
    setUsers(usersData);
    setProfileAccess(profiles);
    setProfileDraft(profiles[selectedProfileRole] || []);
    setAccessDrafts(
      Object.fromEntries(
        usersData.map((user) => [
          user.id,
          {
            role: user.role,
            equipe_id: user.equipe_id ?? '',
          },
        ])
      )
    );
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeTab === 'acessos' && !canAccess('admin_acessos') && canAccess('admin_pontuacao')) {
      setSearchParams({ tab: 'pontuacao' }, { replace: true });
      return;
    }
    if (activeTab === 'pontuacao' && !canAccess('admin_pontuacao') && canAccess('admin_acessos')) {
      setSearchParams({ tab: 'acessos' }, { replace: true });
    }
  }, [activeTab, canAccess, setSearchParams]);

  useEffect(() => {
    setProfileDraft(profileAccess[selectedProfileRole] || []);
  }, [selectedProfileRole, profileAccess]);

  const submitScore = async (event) => {
    event.preventDefault();
    await http.post('/competition/scores/manual', {
      ...score,
      pontos: Number(score.pontos),
      equipe_id: Number(score.equipe_id),
    });
    setScore({ equipe_id: '', pontos: 10, tipo: 'ADICAO', motivo: '', observacao: '' });
    load();
  };

  const updateAccessDraft = (userId, key, value) => {
    setAccessDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        [key]: value,
      },
    }));
  };

  const hasAccessChange = (user) => {
    const draft = accessDrafts[user.id];
    if (!draft) return false;
    const draftTeam = draft.equipe_id === '' ? null : Number(draft.equipe_id);
    return draft.role !== user.role || draftTeam !== (user.equipe_id ?? null);
  };

  const hasProfileAccessChange = () => {
    const current = [...(profileAccess[selectedProfileRole] || [])].sort();
    const draft = [...profileDraft].sort();
    if (current.length !== draft.length) return true;
    return current.some((item, index) => item !== draft[index]);
  };

  const toggleProfileModule = (key, checked) => {
    setProfileDraft((current) => {
      if (checked) {
        return current.includes(key) ? current : [...current, key];
      }
      return current.filter((item) => item !== key);
    });
  };

  const accessTabClass = (active) =>
    `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
    }`;

  const setAccessView = (view) => {
    setSearchParams({ tab: 'acessos', view }, { replace: true });
  };

  const saveProfileAccess = async () => {
    setAccessMessage('');
    setAccessError('');
    setSavingProfileAccess(true);
    try {
      const { data } = await http.patch(`/access-profiles/${selectedProfileRole}`, {
        acessos: profileDraft,
      });
      setProfileAccess((current) => ({
        ...current,
        [selectedProfileRole]: data.acessos,
      }));
      setAccessMessage(
        `Acessos do perfil ${selectedProfileRole === 'ADMIN' ? 'Admin' : 'Participante'} atualizados.`
      );
      await refreshUser();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Não foi possível salvar os acessos deste perfil.';
      setAccessError(message);
    } finally {
      setSavingProfileAccess(false);
    }
  };

  const saveAccess = async (user) => {
    const draft = accessDrafts[user.id];
    if (!draft) return;

    setAccessMessage('');
    setAccessError('');
    setSavingAccessId(user.id);
    try {
      await http.patch(`/users/${user.id}/access`, {
        role: draft.role,
        equipe_id: draft.equipe_id === '' ? null : Number(draft.equipe_id),
      });
      setAccessMessage(`Acesso de ${user.nome} atualizado com sucesso.`);
      await load();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Não foi possível atualizar o acesso deste usuário.';
      setAccessError(message);
    } finally {
      setSavingAccessId(null);
    }
  };

  if (!metrics) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-zinc-500">
        Carregando painel administrativo...
      </div>
    );
  }

  if (activeTab === 'pontuacao' && !canAccess('admin_pontuacao')) {
    return <Navigate to="/admin?tab=acessos" replace />;
  }

  if (activeTab === 'acessos' && !canAccess('admin_acessos')) {
    return <Navigate to="/admin?tab=pontuacao" replace />;
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-zinc-900">Painel Administrativo</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Estatísticas gerais, ranking, pontuação manual e gestão de acessos.
        </p>
      </header>

      {activeTab === 'pontuacao' ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Participantes" value={metrics.totalParticipantes} />
              <StatCard label="Equipes" value={metrics.totalEquipes} />
              <StatCard label="Desafios" value={metrics.totalDesafios} />
              <StatCard label="Publicações" value={metrics.publicacoes} />
              <StatCard label="Curtidas" value={metrics.curtidas} />
              <StatCard label="Comentários" value={metrics.comentarios} />
            </div>

            <form
              className="ig-card grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3"
              onSubmit={submitScore}
            >
              <select
                className="ig-input"
                value={score.equipe_id}
                onChange={(e) => setScore((s) => ({ ...s, equipe_id: e.target.value }))}
                required
              >
                <option value="">Selecione equipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.nome}
                  </option>
                ))}
              </select>
              <input
                className="ig-input"
                type="number"
                value={score.pontos}
                onChange={(e) => setScore((s) => ({ ...s, pontos: e.target.value }))}
                required
              />
              <select
                className="ig-input"
                value={score.tipo}
                onChange={(e) => setScore((s) => ({ ...s, tipo: e.target.value }))}
              >
                <option value="ADICAO">Adicionar</option>
                <option value="REMOCAO">Remover</option>
              </select>
              <input
                className="ig-input"
                placeholder="Motivo"
                value={score.motivo}
                onChange={(e) => setScore((s) => ({ ...s, motivo: e.target.value }))}
                required
              />
              <input
                className="ig-input"
                placeholder="Observação"
                value={score.observacao}
                onChange={(e) => setScore((s) => ({ ...s, observacao: e.target.value }))}
              />
              <button type="submit" className="ig-button sm:col-span-2 xl:col-span-1">
                Salvar Pontuação
              </button>
            </form>
          </div>

          <aside className="hidden lg:block">
            <div className="ig-card sticky top-7 p-4">
              <h3 className="mb-3 text-base font-semibold text-zinc-900">Resumo de Ranking</h3>
              <div className="grid gap-2.5">
                {(metrics.ranking || []).slice(0, 5).map((time, index) => (
                  <div className="grid gap-0.5" key={time.id}>
                    <strong className="text-sm text-zinc-900">
                      {index + 1}º {time.nome}
                    </strong>
                    <small className="text-xs text-zinc-500">{time.pontuacao} pontos</small>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="ig-card overflow-hidden">
          <div className="border-b border-zinc-100 p-3">
            <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-zinc-50 p-1">
              <button
                type="button"
                className={accessTabClass(accessView === 'perfis')}
                onClick={() => setAccessView('perfis')}
              >
                Perfis
              </button>
              <button
                type="button"
                className={accessTabClass(accessView === 'usuarios')}
                onClick={() => setAccessView('usuarios')}
              >
                Usuários
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4">
            {accessMessage ? <p className="text-sm text-emerald-600">{accessMessage}</p> : null}
            {accessError ? <p className="text-sm text-rose-500">{accessError}</p> : null}

            {accessView === 'perfis' ? (
              <>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">Acessos por perfil</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Escolha o perfil e defina quais módulos ele pode acessar no sistema.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-full sm:w-auto sm:min-w-[220px]">
                      <label className="mb-1 block text-xs font-medium text-zinc-500">Perfil</label>
                      <select
                        className="ig-input py-2"
                        value={selectedProfileRole}
                        onChange={(e) => setSelectedProfileRole(e.target.value)}
                      >
                        <option value="PARTICIPANTE">Participante</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="ig-button px-3 py-2"
                      onClick={saveProfileAccess}
                      disabled={!hasProfileAccessChange() || savingProfileAccess}
                    >
                      {savingProfileAccess ? 'Salvando...' : 'Salvar perfil'}
                    </button>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-500">
                      Módulos permitidos
                    </label>
                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                      {Object.entries(ACCESS_MODULES).map(([key, label], index, items) => {
                        const isChecked = profileDraft.includes(key);

                        return (
                          <div
                            key={key}
                            className={`flex items-center justify-between gap-4 px-4 py-3 ${
                              index < items.length - 1 ? 'border-b border-zinc-100' : ''
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{label}</p>
                              <p className="text-xs text-zinc-500">
                                {isChecked ? 'Acesso liberado' : 'Acesso bloqueado'}
                              </p>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={isChecked}
                              aria-label={`${isChecked ? 'Desativar' : 'Ativar'} ${label}`}
                              onClick={() => toggleProfileModule(key, !isChecked)}
                              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
                                isChecked ? 'bg-zinc-900' : 'bg-zinc-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                  isChecked ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">Usuários</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Atribua o perfil e a equipe de cada usuário. Os acessos seguem o perfil escolhido.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-zinc-500">
                        <th className="px-2 py-2 font-medium">Nome</th>
                        <th className="px-2 py-2 font-medium">Contato</th>
                        <th className="px-2 py-2 font-medium">Perfil</th>
                        <th className="px-2 py-2 font-medium">Equipe</th>
                        <th className="px-2 py-2 font-medium">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-zinc-100">
                          <td className="px-2 py-2">
                            <strong className="text-zinc-900">{user.nome}</strong>
                            <p className="text-xs text-zinc-500">{user.email}</p>
                          </td>
                          <td className="px-2 py-2 text-zinc-600">{user.telefone || '-'}</td>
                          <td className="px-2 py-2">
                            <select
                              className="ig-input py-2"
                              value={accessDrafts[user.id]?.role || user.role}
                              onChange={(e) => updateAccessDraft(user.id, 'role', e.target.value)}
                            >
                              <option value="PARTICIPANTE">Participante</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              className="ig-input py-2"
                              value={accessDrafts[user.id]?.equipe_id ?? user.equipe_id ?? ''}
                              onChange={(e) =>
                                updateAccessDraft(
                                  user.id,
                                  'equipe_id',
                                  e.target.value === '' ? '' : Number(e.target.value)
                                )
                              }
                            >
                              <option value="">Sem equipe</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.nome}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              className="ig-button px-3 py-2"
                              onClick={() => saveAccess(user)}
                              disabled={!hasAccessChange(user) || savingAccessId === user.id}
                            >
                              {savingAccessId === user.id ? 'Salvando...' : 'Salvar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminPage;
