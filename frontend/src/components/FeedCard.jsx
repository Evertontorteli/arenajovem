import { useEffect, useState } from 'react';
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
} from 'react-icons/fa';
import http from '../api/http';
import { getTeamStylesByLabel } from '../utils/teamColors';

function FeedCard({ post, onRefresh }) {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showLikeBurst, setShowLikeBurst] = useState(false);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const { data } = await http.get(`/social/posts/${post.id}/comments`);
      setComments(data);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCommentsOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCommentsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCommentsOpen]);

  const toggleLike = async () => {
    setIsLikeAnimating(true);
    setShowLikeBurst(true);
    setTimeout(() => setIsLikeAnimating(false), 260);
    setTimeout(() => setShowLikeBurst(false), 620);
    await http.post(`/social/posts/${post.id}/like`);
    onRefresh();
  };

  const openComments = async () => {
    setIsCommentsOpen(true);
    await loadComments();
  };

  const sendComment = async (event) => {
    event.preventDefault();
    const texto = commentText.trim();
    if (!texto) return;
    await http.post(`/social/posts/${post.id}/comments`, { texto });
    setCommentText('');
    await loadComments();
    onRefresh();
  };

  const teamStyle = getTeamStylesByLabel(post.equipe_nome, 'AMARELO');

  return (
    <>
      <article className="ig-card mx-auto w-full max-w-[470px] overflow-hidden">
        <header className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className={`h-8 w-8 rounded-full ${teamStyle.bg}`} />
            <div className="flex items-center gap-1.5">
              <strong className="text-sm text-zinc-900">{post.autor_nome}</strong>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${teamStyle.bg}`}
                title={post.equipe_nome}
                aria-label={`Equipe ${post.equipe_nome}`}
              />
            </div>
          </div>
          {post.possui_selo_missao ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
              Missão Concluída
            </span>
          ) : null}
        </header>

        <div
          className="relative overflow-hidden"
          onDoubleClick={toggleLike}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter') toggleLike();
          }}
        >
          <img
            className="aspect-square w-full object-cover"
            src={`${import.meta.env.VITE_API_URL_BASE || 'http://localhost:3333'}${post.imagem_url}`}
            alt={post.texto || 'Publicação'}
          />
          {showLikeBurst ? <FaHeart className="like-burst" /> : null}
        </div>

        <div className="grid gap-2 p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`bg-transparent p-0 text-xl ${post.curtidas > 0 ? 'text-rose-500' : 'text-zinc-800'} ${isLikeAnimating ? 'like-pop' : ''}`}
              onClick={toggleLike}
              aria-label="Curtir"
            >
              {post.curtidas > 0 ? <FaHeart /> : <FaRegHeart />}
            </button>
            <button
              type="button"
              className="bg-transparent p-0 text-xl text-zinc-800"
              aria-label="Comentar"
              onClick={openComments}
            >
              <FaRegComment />
            </button>
          </div>
          <strong className="text-sm text-zinc-900">{post.curtidas} curtidas</strong>
          <p className="text-sm text-zinc-800">
            <strong>{post.autor_nome}</strong> {post.texto}
          </p>
          <button
            type="button"
            className="bg-transparent p-0 text-left text-sm font-medium text-zinc-500"
            onClick={openComments}
          >
            Ver todos os {post.comentarios || 0} comentários
          </button>
          <small className="text-xs text-zinc-500">{new Date(post.criado_em).toLocaleString('pt-BR')}</small>
        </div>
      </article>

      {isCommentsOpen ? (
        <div
          className="fixed inset-0 z-30 grid place-items-center bg-black/55 p-4"
          onClick={() => setIsCommentsOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsCommentsOpen(false);
          }}
        >
          <section
            className="grid max-h-[78vh] w-full max-w-[560px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-2xl border border-zinc-300 bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-zinc-900">Comentários</h3>
              <button
                type="button"
                className="bg-transparent p-0 text-2xl leading-none text-zinc-600"
                onClick={() => setIsCommentsOpen(false)}
                aria-label="Fechar comentários"
              >
                ×
              </button>
            </header>
            <div className="grid gap-2.5 overflow-y-auto px-4 py-3">
              {commentsLoading ? (
                <p className="text-sm text-zinc-500">Carregando comentários...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-zinc-500">Seja o primeiro a comentar.</p>
              ) : (
                comments.map((comment) => (
                  <p key={comment.id} className="text-sm text-zinc-700">
                    <strong>{comment.autor_nome}:</strong> {comment.texto}
                  </p>
                ))
              )}
            </div>
            <form onSubmit={sendComment} className="flex items-center gap-2 border-t border-zinc-200 p-3">
              <input
                className="ig-input border-zinc-200 bg-zinc-50"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                name="texto"
                placeholder="Adicione um comentário..."
              />
              <button type="submit" className="bg-transparent p-0 text-sm font-semibold text-blue-600">
                Publicar
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default FeedCard;
