import { useEffect, useState } from 'react';
import http from '../api/http';
import { useAuth } from '../contexts/AuthContext';

function NewsPage() {
  const { isAdmin } = useAuth();
  const [news, setNews] = useState([]);
  const [form, setForm] = useState({ titulo: '', conteudo: '' });

  const loadNews = async () => {
    const { data } = await http.get('/social/news');
    setNews(data);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const createNews = async (event) => {
    event.preventDefault();
    await http.post('/social/news', form);
    setForm({ titulo: '', conteudo: '' });
    loadNews();
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-zinc-900">Notícias</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Avisos oficiais, datas importantes e mudanças da gincana.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-4">
          {isAdmin ? (
            <form className="ig-card grid gap-2 p-4 sm:grid-cols-2" onSubmit={createNews}>
              <input
                className="ig-input"
                placeholder="Título da notícia"
                value={form.titulo}
                onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                required
              />
              <textarea
                className="ig-input sm:col-span-2"
                placeholder="Conteúdo"
                value={form.conteudo}
                onChange={(e) => setForm((s) => ({ ...s, conteudo: e.target.value }))}
                required
              />
              <button type="submit" className="ig-button sm:col-span-2">
                Publicar Notícia
              </button>
            </form>
          ) : null}

          <div className="grid gap-3">
            {news.map((item) => (
              <article className="ig-card grid gap-3 p-4" key={item.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-500">
                    Notícia
                  </span>
                  <small className="text-xs text-zinc-500">
                    {new Date(item.criado_em).toLocaleString('pt-BR')}
                  </small>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">{item.titulo}</h3>
                <p className="text-sm text-zinc-600">{item.conteudo}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="ig-card sticky top-7 space-y-3 p-4">
            <h3 className="text-base font-semibold text-zinc-900">Painel de Avisos</h3>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Total de notícias</span>
              <strong className="text-zinc-900">{news.length}</strong>
            </div>
            <p className="text-sm text-zinc-500">
              Use esta área para publicar comunicados oficiais de última hora.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default NewsPage;
