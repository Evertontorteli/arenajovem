function StatCard({ label, value, highlight = false }) {
  return (
    <article
      className={`ig-card grid gap-1.5 p-4 ${
        highlight ? 'border-blue-500 ring-2 ring-blue-100' : ''
      }`}
    >
      <span className="text-xs text-zinc-500">{label}</span>
      <strong className="text-lg text-zinc-900">{value}</strong>
    </article>
  );
}

export default StatCard;
