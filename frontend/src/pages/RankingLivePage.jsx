import { useEffect, useState } from 'react';
import { FaCrown, FaMedal } from 'react-icons/fa';
import http from '../api/http';
import TeamElementIcon from '../components/TeamElementIcon';
import { getTeamThemeByLabel } from '../utils/teamColors';

function RankingLivePage() {
  const [ranking, setRanking] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(new Date());

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await http.get('/competition/ranking');
      if (mounted) {
        setRanking(data);
        setUpdatedAt(new Date());
      }
    };

    load();
    const timer = setInterval(load, 5000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="min-h-screen space-y-5 bg-gradient-to-b from-zinc-50 to-white px-4 py-10">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 md:text-4xl">Ranking Ao Vivo</h1>
        <p className="text-sm text-zinc-500">
          Atualizado em {updatedAt.toLocaleTimeString('pt-BR')}
        </p>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-3.5">
        {ranking.map((team, index) => {
          const theme = getTeamThemeByLabel(team.nome);

          return (
            <article
              key={team.id}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r px-4 py-4 shadow-sm transition ${theme.border} ${theme.gradient} ${theme.glow}`}
            >
              <TeamElementIcon
                teamName={team.nome}
                sizeClass="text-7xl"
                className={`pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 opacity-10 ${theme.softText}`}
              />

              <span className={`absolute inset-y-0 left-0 w-1.5 ${theme.bg}`} />

              <div className="relative flex items-center justify-between gap-3 pl-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-2xl ${theme.softBg} ${theme.softText}`}
                  >
                    <TeamElementIcon teamName={team.nome} sizeClass="text-2xl" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-zinc-900 md:text-2xl">
                        {team.nome}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${theme.softBg} ${theme.softText}`}
                      >
                        {theme.element}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                          index === 0
                            ? 'bg-amber-100 text-amber-700'
                            : index === 1
                              ? 'bg-slate-100 text-slate-700'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {index === 0 ? <FaCrown /> : index < 3 ? <FaMedal /> : `${index + 1}º`}
                      </span>
                      <small className="text-xs uppercase tracking-wide text-zinc-500">
                        posição {index + 1}
                      </small>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl border bg-white/80 px-4 py-2 text-right ${theme.border}`}>
                  <strong className="block text-xl font-bold text-zinc-900">
                    {team.pontuacao}
                  </strong>
                  <span className="text-xs text-zinc-500">pontos</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default RankingLivePage;
