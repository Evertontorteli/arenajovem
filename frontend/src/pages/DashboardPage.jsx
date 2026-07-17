import { useEffect, useState } from 'react';
import http from '../api/http';
import StatCard from '../components/StatCard';
import RankingTable from '../components/RankingTable';

function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const [{ data: dashboard }, { data: ranking }] = await Promise.all([
        http.get('/dashboard/user'),
        http.get('/competition/ranking'),
      ]);
      setData({ ...dashboard, ranking });
    }
    loadData();
  }, []);

  if (!data) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-zinc-500">
        Carregando dashboard...
      </div>
    );
  }

  const myTeam = data.usuario?.equipe_nome || 'Sem equipe';
  const myPoints = data.usuario?.pontuacao ?? 0;
  const posicao = data.ranking.find((item) => item.id === data.usuario?.equipe_id)?.posicao || '-';
  const ultimasMissoes = data.ultimasMissoes || [];
  const proximasAtividades = data.proximasAtividades || [];

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-zinc-900">Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ranking geral, desafios recentes e visão rápida da competição.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Equipe" value={myTeam} />
            <StatCard label="Pontos da Equipe" value={myPoints} highlight />
            <StatCard label="Posição no Campeonato" value={`${posicao}º`} />
            <StatCard label="Próximas Atividades" value={proximasAtividades.length} />
          </div>

          <RankingTable ranking={data.ranking} />

          <div className="ig-card p-4">
            <h3 className="mb-3 text-base font-semibold text-zinc-900">Últimos Desafios</h3>
            <div className="grid gap-2.5">
              {ultimasMissoes.slice(0, 5).map((missao) => (
                <div key={missao.id} className="grid gap-0.5">
                  <strong className="text-sm text-zinc-900">{missao.titulo}</strong>
                  <small className="text-xs text-zinc-500">
                    {new Date(missao.data_inicio).toLocaleDateString('pt-BR')} • {missao.pontuacao} pts
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <div className="ig-card sticky top-7 space-y-3 p-4">
            <h3 className="text-base font-semibold text-zinc-900">Sua Equipe</h3>
            <p className="text-sm text-zinc-500">{myTeam}</p>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Pontuação atual</span>
              <strong className="text-zinc-900">{myPoints}</strong>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Posição no campeonato</span>
              <strong className="text-zinc-900">{posicao}º</strong>
            </div>
          </div>

          <div className="ig-card sticky top-7 space-y-3 p-4">
            <h3 className="text-base font-semibold text-zinc-900">Próximas atividades</h3>
            <div className="grid gap-2.5">
              {proximasAtividades.slice(0, 4).map((atividade) => (
                <div key={atividade.id} className="grid gap-0.5">
                  <strong className="text-sm text-zinc-900">{atividade.titulo}</strong>
                  <small className="text-xs text-zinc-500">
                    {new Date(atividade.data_inicio).toLocaleString('pt-BR')}
                  </small>
                </div>
              ))}
              {proximasAtividades.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma atividade agendada.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default DashboardPage;
