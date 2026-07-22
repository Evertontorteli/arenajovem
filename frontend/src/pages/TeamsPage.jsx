import { useEffect, useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import http from '../api/http';
import { useAuth } from '../contexts/AuthContext';

const emptyForm = { nome: '', cor: '#3B82F6', descricao: '' };

function TeamsPage() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadTeams = async () => {
    const { data } = await http.get('/teams');
    setTeams(data);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (!isCreateModalOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isCreateModalOpen]);

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setForm(emptyForm);
    setCreateError('');
  };

  const createTeam = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await http.post('/teams', form);
      closeCreateModal();
      await loadTeams();
    } catch (error) {
      setCreateError(
        error?.response?.data?.message || 'Não foi possível criar a equipe.'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Equipes</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie as equipes e acompanhe participação.
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-500 text-white shadow-sm transition hover:bg-blue-600"
            onClick={() => setIsCreateModalOpen(true)}
            aria-label="Criar equipe"
            title="Criar equipe"
          >
            <FaPlus className="text-sm" />
          </button>
        ) : null}
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-3">
          {teams.length === 0 ? (
            <div className="ig-card px-4 py-8 text-center text-sm text-zinc-500">
              Nenhuma equipe cadastrada ainda.
            </div>
          ) : (
            <div className="ig-card divide-y divide-zinc-200 overflow-hidden">
              {teams.map((team) => (
                <article
                  key={team.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
                >
                  <span
                    className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: team.cor || '#3b82f6' }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-zinc-900">
                        {team.nome}
                      </h3>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600">
                        {team.pontuacao} pts
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
                      {team.descricao || 'Sem descrição.'}
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-4 text-xs text-zinc-500 sm:w-auto sm:justify-end">
                    <span>
                      <strong className="text-zinc-900">{team.participantes}</strong>{' '}
                      participantes
                    </span>
                    <span>
                      <strong className="text-zinc-900">
                        {team.alimentos_arrecadados}
                      </strong>{' '}
                      alimentos
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="ig-card sticky top-7 space-y-3 p-4">
            <h3 className="text-base font-semibold text-zinc-900">Visão Geral</h3>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Total de equipes</span>
              <strong className="text-zinc-900">{teams.length}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Líder atual</span>
              <strong className="text-zinc-900">{teams[0]?.nome || '-'}</strong>
            </div>
          </div>
        </aside>
      </div>

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-team-title"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
              <h3
                id="create-team-title"
                className="text-base font-semibold text-zinc-900"
              >
                Nova equipe
              </h3>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100"
                onClick={closeCreateModal}
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </header>

            <form className="grid gap-3 p-4" onSubmit={createTeam}>
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Nome
                <input
                  className="ig-input"
                  placeholder="Nome da equipe"
                  value={form.nome}
                  onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                  required
                  autoFocus
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Cor
                <input
                  className="ig-input h-[42px]"
                  type="color"
                  value={form.cor}
                  onChange={(e) => setForm((s) => ({ ...s, cor: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Descrição
                <input
                  className="ig-input"
                  placeholder="Descrição (opcional)"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, descricao: e.target.value }))
                  }
                />
              </label>
              {createError ? (
                <p className="text-sm text-rose-500">{createError}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="submit" className="ig-button" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar equipe'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700"
                  onClick={closeCreateModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default TeamsPage;
