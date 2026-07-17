function RankingTable({ ranking }) {
  const getRowStyles = (position) => {
    if (position === 1) {
      return 'border-amber-200 text-amber-800';
    }
    if (position === 2) {
      return 'border-slate-200 bg-slate-50/80 text-slate-700';
    }
    if (position === 3) {
      return 'border-orange-200 bg-orange-50/70 text-orange-700';
    }
    return 'border-zinc-100 text-zinc-700';
  };

  return (
    <div className="ig-card overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900">Ranking Geral</h3>
        <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Atualizado em tempo real
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] border-separate border-spacing-0 text-sm">
          <thead className="text-xs uppercase tracking-wide text-zinc-500">
            <tr className="border-b border-zinc-200">
              <th className="px-2 py-2 text-left font-semibold">Pos.</th>
              <th className="px-2 py-2 text-left font-semibold">Equipe</th>
              <th className="px-2 py-2 text-right font-semibold">Pontos</th>
              <th className="px-2 py-2 text-right font-semibold">Diferença 1º</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((item) => (
              <tr
                key={item.id}
                className={`border-b transition hover:bg-zinc-50/80 ${getRowStyles(item.posicao)}`}
              >
                <td className="px-2 py-2.5">
                  <span className="inline-flex min-w-9 justify-center rounded-md border border-current/25 bg-white/70 px-2 py-0.5 text-xs font-semibold">
                    {item.posicao}º
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: item.cor || '#3b82f6' }}
                    />
                    <span className="font-medium text-zinc-900">{item.nome}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-right font-semibold text-zinc-900">{item.pontuacao}</td>
                <td className="px-2 py-2.5 text-right text-zinc-600">
                  {item.diferenca_primeiro}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ranking.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Ainda não há equipes no ranking.</p>
      ) : null}
    </div>
  );
}

export default RankingTable;
