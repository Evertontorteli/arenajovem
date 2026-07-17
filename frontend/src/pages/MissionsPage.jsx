import { useEffect, useState } from 'react';
import http from '../api/http';
import { useAuth } from '../contexts/AuthContext';

function MissionsPage() {
  const { isAdmin } = useAuth();
  const [missions, setMissions] = useState([]);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    pontuacao: 10,
    data_inicio: '',
    data_fim: '',
  });
  const [submissionFiles, setSubmissionFiles] = useState({});

  const loadMissions = async () => {
    const { data } = await http.get('/competition/missions');
    setMissions(data);
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const createMission = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    await http.post('/competition/missions', payload);
    setForm({ titulo: '', descricao: '', pontuacao: 10, data_inicio: '', data_fim: '' });
    loadMissions();
  };

  const publishMission = async (id) => {
    await http.patch(`/competition/missions/${id}/status`, { status: 'ABERTA' });
    loadMissions();
  };

  const submitMission = async (id) => {
    const payload = new FormData();
    payload.append('imagem', submissionFiles[id]);
    await http.post(`/competition/missions/${id}/submit`, payload);
    setSubmissionFiles((state) => ({ ...state, [id]: null }));
    alert('Missão enviada para análise.');
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-zinc-900">Missões</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Desafios digitais com aprovação e pontuação automática.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          {isAdmin ? (
            <form className="ig-card grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3" onSubmit={createMission}>
              <input
                className="ig-input"
                placeholder="Título"
                value={form.titulo}
                onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                required
              />
              <textarea
                className="ig-input sm:col-span-2 xl:col-span-3"
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
                required
              />
              <input
                className="ig-input"
                type="number"
                min="1"
                value={form.pontuacao}
                onChange={(e) => setForm((s) => ({ ...s, pontuacao: e.target.value }))}
              />
              <input
                className="ig-input"
                type="datetime-local"
                value={form.data_inicio}
                onChange={(e) => setForm((s) => ({ ...s, data_inicio: e.target.value }))}
                required
              />
              <input
                className="ig-input"
                type="datetime-local"
                value={form.data_fim}
                onChange={(e) => setForm((s) => ({ ...s, data_fim: e.target.value }))}
                required
              />
              <button type="submit" className="ig-button sm:col-span-2 xl:col-span-1">Criar Missão</button>
            </form>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {missions.map((mission) => (
              <article key={mission.id} className="ig-card grid gap-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900">{mission.titulo}</h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      mission.status === 'ABERTA'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : mission.status === 'ENCERRADA'
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : 'border-amber-200 bg-amber-50 text-amber-600'
                    }`}
                  >
                    {mission.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">{mission.descricao}</p>
                <small className="text-xs text-zinc-500">
                  {mission.pontuacao} pts • {new Date(mission.data_inicio).toLocaleDateString('pt-BR')} -{' '}
                  {new Date(mission.data_fim).toLocaleDateString('pt-BR')}
                </small>
                {isAdmin ? (
                  <button className="ig-button" type="button" onClick={() => publishMission(mission.id)}>
                    Liberar Missão
                  </button>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className="ig-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setSubmissionFiles((state) => ({
                          ...state,
                          [mission.id]: e.target.files?.[0],
                        }))
                      }
                    />
                    <button
                      className="ig-button"
                      type="button"
                      disabled={!submissionFiles[mission.id]}
                      onClick={() => submitMission(mission.id)}
                    >
                      Enviar Foto
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="ig-card sticky top-7 space-y-3 p-4">
            <h3 className="text-base font-semibold text-zinc-900">Resumo de Missões</h3>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Total</span>
              <strong className="text-zinc-900">{missions.length}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Abertas</span>
              <strong className="text-zinc-900">{missions.filter((m) => m.status === 'ABERTA').length}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Em análise</span>
              <strong className="text-zinc-900">
                {missions.filter((m) => m.status === 'EM_ANALISE').length}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default MissionsPage;
