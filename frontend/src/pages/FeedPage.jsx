import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import http from '../api/http';
import FeedCard from '../components/FeedCard';
import { useAuth } from '../contexts/AuthContext';

function FeedPage() {
  const PAGE_SIZE = 6;
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isMissionPost, setIsMissionPost] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [feedError, setFeedError] = useState('');
  const [failedCursor, setFailedCursor] = useState(null);
  const [postError, setPostError] = useState('');
  const [posting, setPosting] = useState(false);
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState('');
  const sentinelRef = useRef(null);
  const fetchingRef = useRef(false);
  const fileInputRef = useRef(null);
  const isAdmin = user?.role === 'ADMIN';
  const adminWithoutTeam = isAdmin && !user?.equipe_id;

  const openComposer = () => {
    setPostError('');
    setIsComposerModalOpen(true);
  };

  const closeComposer = () => {
    if (posting) return;
    setPostError('');
    setIsComposerModalOpen(false);
  };

  const fetchPosts = async ({ cursor = null, replace = false, showInitialLoader = false } = {}) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (showInitialLoader) setLoadingInitial(true);
    if (!replace && cursor) setLoadingMore(true);

    try {
      const params = { limit: PAGE_SIZE };
      if (cursor) params.cursor = cursor;

      const { data } = await http.get('/social/posts', {
        params,
      });
      const incomingPosts = data.items || [];
      const pagination = data.pagination || {};

      setPosts((previous) => {
        if (replace) return incomingPosts;
        const existingIds = new Set(previous.map((item) => item.id));
        const uniqueIncoming = incomingPosts.filter((item) => !existingIds.has(item.id));
        return [...previous, ...uniqueIncoming];
      });

      setFeedError('');
      setFailedCursor(null);
      setHasMorePosts(Boolean(pagination.hasMore));
      setNextCursor(pagination.nextCursor || null);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Não foi possível carregar o feed agora.';
      setFeedError(message);
      if (cursor) {
        setFailedCursor(cursor);
        setHasMorePosts(false);
      }
    } finally {
      if (showInitialLoader) setLoadingInitial(false);
      if (!replace && cursor) setLoadingMore(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchPosts({ replace: true, showInitialLoader: true });
  }, []);

  useEffect(() => {
    if (!sentinelRef.current || loadingInitial || !hasMorePosts) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetchingRef.current && nextCursor) {
          fetchPosts({ cursor: nextCursor, replace: false });
        }
      },
      { rootMargin: '220px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadingInitial, hasMorePosts, nextCursor]);

  useEffect(() => {
    const shouldOpenComposer =
      new URLSearchParams(location.search).get('compose') === '1';
    if (!shouldOpenComposer) return;
    openComposer();
    navigate('/feed', { replace: true });
  }, [location.search, navigate]);

  useEffect(() => {
    const onOpenComposer = () => openComposer();
    window.addEventListener('arena-open-feed-composer', onOpenComposer);
    return () =>
      window.removeEventListener('arena-open-feed-composer', onOpenComposer);
  }, []);

  useEffect(() => {
    if (!isComposerModalOpen) return undefined;
    const onEscape = (event) => {
      if (event.key === 'Escape') {
        closeComposer();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onEscape);
    };
  }, [isComposerModalOpen, posting]);

  useEffect(() => {
    if (!deleteNotice) return undefined;
    const timer = window.setTimeout(() => setDeleteNotice(''), 4000);
    return () => window.clearTimeout(timer);
  }, [deleteNotice]);

  const handlePostRefresh = async (options = {}) => {
    await fetchPosts({ replace: true });
    if (options.deleted) {
      setDeleteNotice('Sua publicação foi excluída com sucesso.');
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
    if (!file) {
      setPostError('Selecione uma imagem para publicar.');
      return;
    }
    const payload = new FormData();
    payload.append('imagem', file);
    payload.append('texto', text);
    payload.append('tipo_publicacao', isMissionPost ? 'MISSAO_CONCLUIDA' : 'LIVRE');
    setPosting(true);
    setPostError('');
    try {
      await http.post('/social/posts', payload);
      setText('');
      setFile(null);
      setIsMissionPost(false);
      setIsComposerModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchPosts({ replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Não foi possível publicar a foto. Tente novamente.';
      setPostError(message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Feed da Gincana</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Visual em coluna central no estilo Instagram.
          </p>
        </div>
        <button
          type="button"
          className="ig-button hidden w-auto md:inline-flex"
          onClick={openComposer}
        >
          Nova publicação
        </button>
      </header>

      {deleteNotice ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          role="status"
        >
          {deleteNotice}
        </div>
      ) : null}

      {isComposerModalOpen ? (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/55 p-3"
          onClick={closeComposer}
          role="presentation"
        >
          <section
            className="ig-card w-full max-w-[470px] overflow-hidden p-0"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
              <h3 className="text-sm font-semibold text-zinc-900">Nova publicação</h3>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100"
                onClick={closeComposer}
                aria-label="Fechar modal de publicação"
              >
                <FaTimes />
              </button>
            </header>

            <form className="grid gap-2 p-3" onSubmit={createPost}>
              {adminWithoutTeam ? (
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  Esta publicação será marcada como{' '}
                  <strong className="text-zinc-900">Admin</strong>, pois você
                  não está vinculado a uma equipe.
                </p>
              ) : isAdmin ? (
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  Publicações feitas por administrador aparecem com o selo{' '}
                  <strong className="text-zinc-900">Admin</strong> no feed.
                </p>
              ) : null}
              <textarea
                className="ig-input min-h-[92px]"
                placeholder="Escreva uma legenda..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  ref={fileInputRef}
                  className="ig-input w-full md:w-auto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0])}
                  required
                />
                <label className="flex items-center gap-2 text-sm text-zinc-500">
                  <input
                    className="h-4 w-4 rounded border-zinc-300"
                    type="checkbox"
                    checked={isMissionPost}
                    onChange={(e) => setIsMissionPost(e.target.checked)}
                  />
                  Marcar como missão concluída
                </label>
                <button type="submit" className="ig-button" disabled={posting}>
                  {posting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
              {postError ? (
                <p className="text-sm text-rose-500">{postError}</p>
              ) : null}
            </form>
          </section>
        </div>
      ) : null}

      <div className="grid gap-3">
          {loadingInitial ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((item) => (
                <article key={item} className="ig-card mx-auto grid w-full max-w-[470px] gap-2 p-3">
                  <div className="shimmer h-7 w-36" />
                  <div className="shimmer h-[420px] rounded-xl" />
                  <div className="shimmer h-3 w-2/5" />
                  <div className="shimmer h-3 w-3/5" />
                  <div className="shimmer h-3 w-4/5" />
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {posts.map((post) => (
                  <FeedCard key={post.id} post={post} onRefresh={handlePostRefresh} />
                ))}
              </div>
              {feedError && posts.length > 0 ? (
                <article className="ig-card mx-auto grid w-full max-w-[470px] gap-2 p-3">
                  <p className="text-sm text-rose-500">{feedError}</p>
                  {failedCursor ? (
                    <button
                      type="button"
                      className="ig-button w-fit"
                      onClick={() =>
                        fetchPosts({ cursor: failedCursor, replace: false })
                      }
                    >
                      Tentar carregar mais
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ig-button w-fit"
                      onClick={() => fetchPosts({ replace: true })}
                    >
                      Tentar novamente
                    </button>
                  )}
                </article>
              ) : null}
              {!feedError && posts.length === 0 ? (
                <article className="ig-card mx-auto w-full max-w-[470px] p-4">
                  <p className="text-sm text-zinc-500">
                    Nenhuma publicação encontrada ainda.
                  </p>
                </article>
              ) : null}
              {loadingMore ? (
                <article className="ig-card mx-auto grid w-full max-w-[470px] gap-2 p-3">
                  <div className="shimmer h-7 w-36" />
                  <div className="shimmer h-3 w-3/5" />
                </article>
              ) : null}
              {feedError && posts.length === 0 ? (
                <article className="ig-card mx-auto grid w-full max-w-[470px] gap-2 p-3">
                  <p className="text-sm text-rose-500">{feedError}</p>
                  <button
                    type="button"
                    className="ig-button w-fit"
                    onClick={() => fetchPosts({ replace: true, showInitialLoader: true })}
                  >
                    Tentar novamente
                  </button>
                </article>
              ) : null}
              {hasMorePosts ? <div ref={sentinelRef} className="h-2" /> : null}
            </>
          )}
      </div>
    </section>
  );
}

export default FeedPage;
