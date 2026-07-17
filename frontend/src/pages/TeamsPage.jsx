import { useEffect, useState } from 'react';
import http from '../api/http';
import { useAuth } from '../contexts/AuthContext';

const emptyForm = { nome: '', cor: '#3B82F6', descricao: '' };

function TeamsPage() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const loadTeams = async () => {
    const { data } = await http.get('/teams');
    setTeams(data);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const createTeam = async (event) => {
    event.preventDefault();
    await http.post('/teams', form);
    setForm(emptyForm);
    loadTeams();
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-zinc-900">Equipes</h2>
        <p className="mt-1 text-sm text-zinc-500">Gerencie as equipes e acompanhe participação.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          {isAdmin ? (
            <form className="ig-card grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={createTeam}>
              <input
                className="ig-input"
                placeholder="Nome da equipe"
                value={form.nome}
                onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                required
              />
              <input
                className="ig-input h-[42px]"
                type="color"
                value={form.cor}
                onChange={(e) => setForm((s) => ({ ...s, cor: e.target.value }))}
              />
              <input
                className="ig-input"
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
              />
              <button type="submit" className="ig-button">Criar Equipe</button>
            </form>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <article className="ig-card grid gap-3 p-4" key={team.id}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center text-sm font-semibold text-zinc-900">
                    <span
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: team.cor }}
                    />
                    {team.nome}
                  </h3>
                  <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-500">
                    {team.pontuacao} pts
                  </span>
                </div>
                <p className="text-sm text-zinc-600">{team.descricao || 'Sem descrição.'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                    <small className="block text-xs text-zinc-500">Participantes</small>
                    <strong className="text-base text-zinc-900">{team.participantes}</strong>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                    <small className="block text-xs text-zinc-500">Alimentos</small>
                    <strong className="text-base text-zinc-900">{team.alimentos_arrecadados}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
    </section>
  );
}

export default TeamsPage;
