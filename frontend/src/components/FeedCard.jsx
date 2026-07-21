import { useEffect, useState } from 'react';
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaTrashAlt,
} from 'react-icons/fa';
import http from '../api/http';
import { useAuth } from '../contexts/AuthContext';
import { getTeamStylesByLabel } from '../utils/teamColors';
import { resolveMediaUrl } from '../utils/avatarPresets';
import AdminSeal from './AdminSeal';
import UserAvatar from './UserAvatar';

const COMMENTS_PAGE_SIZE = 30;

function truncateName(name, max = 20) {
  const value = String(name || '');
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function FeedCard({ post, onRefresh }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [previewComments, setPreviewComments] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showLikeBurst, setShowLikeBurst] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);

  const canDeletePost =
    user && Number(user.id) === Number(post.autor_id);

  const loadPreviewComments = async () => {
    setPreviewLoading(true);
    try {
      const { data } = await http.get(`/social/posts/${post.id}/comments`, {
        params: { limit: 3, offset: 0 },
      });
      setPreviewComments(data.items || []);
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadComments = async ({ offset = 0, append = false } = {}) => {
    if (append) setLoadingMoreComments(true);
    else setCommentsLoading(true);
    setActionError('');
    try {
      const { data } = await http.get(`/social/posts/${post.id}/comments`, {
        params: { limit: COMMENTS_PAGE_SIZE, offset },
      });
      const items = data.items || [];
      setComments((previous) => (append ? [...previous, ...items] : items));
      setCommentsOffset(offset + items.length);
      setCommentsHasMore(Boolean(data.pagination?.hasMore));
      setCommentsTotal(Number(data.pagination?.total || 0));
    } catch (error) {
      setActionError(
        error?.response?.data?.message || 'Não foi possível carregar os comentários.'
      );
    } finally {
      if (append) setLoadingMoreComments(false);
      else setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadPreviewComments();
  }, [post.id, post.comentarios]);

  useEffect(() => {
    if (!isCommentsOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCommentsOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isCommentsOpen]);

  const toggleLike = async () => {
    setIsLikeAnimating(true);
    setShowLikeBurst(true);
    setTimeout(() => setIsLikeAnimating(false), 260);
    setTimeout(() => setShowLikeBurst(false), 620);
    await http.post(`/social/posts/${post.id}/like`);
    onRefresh();
  };

  const handleDeletePost = async () => {
    if (!canDeletePost || isDeletingPost) return;
    setIsDeleteWarningOpen(true);
  };

  const cancelDeletePost = () => {
    if (isDeletingPost) return;
    setIsDeleteWarningOpen(false);
  };

  const confirmDeletePost = async () => {
    if (!canDeletePost || isDeletingPost) return;

    setIsDeletingPost(true);
    setActionError('');
    try {
      await http.delete(`/social/posts/${post.id}`);
      setIsDeleteWarningOpen(false);
      onRefresh?.({ deleted: true });
    } catch (error) {
      setActionError(
        error?.response?.data?.message || 'Não foi possível excluir a publicação.'
      );
    } finally {
      setIsDeletingPost(false);
    }
  };

  const openComments = async () => {
    setIsCommentsOpen(true);
    setReplyTo(null);
    setEditingComment(null);
    setCommentText('');
    await loadComments({ offset: 0, append: false });
  };

  const closeComments = () => {
    setIsCommentsOpen(false);
    setReplyTo(null);
    setEditingComment(null);
    setCommentText('');
    setActionError('');
  };

  const canManageComment = (comment) =>
    user &&
    (user.role === 'ADMIN' || Number(user.id) === Number(comment.usuario_id));

  const startReply = (comment) => {
    setEditingComment(null);
    setReplyTo(comment);
    setCommentText('');
  };

  const startEdit = (comment) => {
    setReplyTo(null);
    setEditingComment(comment);
    setCommentText(comment.texto || '');
  };

  const cancelComposerAction = () => {
    setReplyTo(null);
    setEditingComment(null);
    setCommentText('');
  };

  const sendComment = async (event) => {
    event.preventDefault();
    const texto = commentText.trim();
    if (!texto) return;
    setActionError('');

    try {
      if (editingComment) {
        await http.put(`/social/comments/${editingComment.id}`, { texto });
      } else {
        await http.post(`/social/posts/${post.id}/comments`, {
          texto,
          parent_id: replyTo?.id || null,
        });
      }
      setCommentText('');
      setReplyTo(null);
      setEditingComment(null);
      await loadComments({ offset: 0, append: false });
      await loadPreviewComments();
      onRefresh();
    } catch (error) {
      setActionError(
        error?.response?.data?.message || 'Não foi possível salvar o comentário.'
      );
    }
  };

  const removeComment = async (comment) => {
    const confirmed = window.confirm('Excluir este comentário?');
    if (!confirmed) return;
    setActionError('');
    try {
      await http.delete(`/social/comments/${comment.id}`);
      await loadComments({ offset: 0, append: false });
      await loadPreviewComments();
      onRefresh();
    } catch (error) {
      setActionError(
        error?.response?.data?.message || 'Não foi possível excluir o comentário.'
      );
    }
  };

  const teamStyle = getTeamStylesByLabel(post.equipe_nome, 'AMARELO');
  const isAdminPost = post.autor_role === 'ADMIN';
  const autorNome = truncateName(post.autor_nome);
  const totalComments = Number(post.comentarios || commentsTotal || 0);
  const hasMorePreview = totalComments > 3;

  const renderCommentActions = (comment) => (
    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500">
      <button
        type="button"
        className="bg-transparent p-0 hover:text-zinc-800"
        onClick={() => startReply(comment)}
      >
        Responder
      </button>
      {canManageComment(comment) ? (
        <>
          <button
            type="button"
            className="bg-transparent p-0 hover:text-zinc-800"
            onClick={() => startEdit(comment)}
          >
            Editar
          </button>
          <button
            type="button"
            className="bg-transparent p-0 text-rose-500 hover:text-rose-600"
            onClick={() => removeComment(comment)}
          >
            Excluir
          </button>
        </>
      ) : null}
    </div>
  );

  const renderCommentItem = (comment, isReply = false) => (
    <div key={comment.id} className={isReply ? 'ml-5 border-l border-zinc-200 pl-3' : ''}>
      <p className="text-sm text-zinc-800">
        <strong title={comment.autor_nome}>{truncateName(comment.autor_nome)}</strong>{' '}
        {comment.texto}
        {comment.atualizado_em ? (
          <span className="ml-1 text-xs font-normal text-zinc-400">(editado)</span>
        ) : null}
      </p>
      {renderCommentActions(comment)}
      {!isReply && Array.isArray(comment.respostas) && comment.respostas.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {comment.respostas.map((reply) => renderCommentItem(reply, true))}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <article className="ig-card mx-auto w-full max-w-[470px] overflow-hidden">
        <header className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              foto={post.autor_foto}
              nome={post.autor_nome}
              equipeNome={post.equipe_nome}
              sizeClass="h-8 w-8"
              ringClass={
                isAdminPost && !post.equipe_nome ? 'ring-2 ring-zinc-800' : ''
              }
            />
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-1.5">
                <strong className="text-sm text-zinc-900" title={post.autor_nome}>
                  {autorNome}
                </strong>
                {isAdminPost ? <AdminSeal className="h-4 w-4 shrink-0" /> : null}
                {post.equipe_nome ? (
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${teamStyle.bg}`}
                    title={post.equipe_nome}
                    aria-label={`Equipe ${post.equipe_nome}`}
                  />
                ) : null}
              </div>
              {isAdminPost ? (
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Publicação do administrador
                </span>
              ) : post.equipe_nome ? (
                <span className="text-[11px] text-zinc-500">{post.equipe_nome}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {post.possui_selo_missao ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                Missão Concluída
              </span>
            ) : null}
            {canDeletePost ? (
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={isDeletingPost}
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                aria-label="Excluir publicação"
                title="Excluir publicação"
              >
                <FaTrashAlt className="text-sm" />
              </button>
            ) : null}
          </div>
        </header>

        {actionError && !isCommentsOpen ? (
          <p className="px-3 pb-1 text-sm text-rose-600">{actionError}</p>
        ) : null}

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
            src={resolveMediaUrl(post.imagem_url)}
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
            <strong title={post.autor_nome}>{autorNome}</strong> {post.texto}
          </p>
          {previewLoading && totalComments > 0 ? (
            <p className="text-sm text-zinc-400">Carregando comentários...</p>
          ) : null}
          {!previewLoading && previewComments.length > 0 ? (
            <div className="grid gap-1">
              {previewComments.map((comment) => (
                <p key={comment.id} className="text-sm text-zinc-800">
                  <strong title={comment.autor_nome}>
                    {truncateName(comment.autor_nome)}
                  </strong>{' '}
                  {comment.texto}
                </p>
              ))}
            </div>
          ) : null}
          {hasMorePreview ? (
            <button
              type="button"
              className="bg-transparent p-0 text-left text-sm font-medium text-zinc-500"
              onClick={openComments}
            >
              Ver todos os {totalComments} comentários
            </button>
          ) : totalComments > 0 ? (
            <button
              type="button"
              className="bg-transparent p-0 text-left text-sm font-medium text-zinc-500"
              onClick={openComments}
            >
              Adicionar comentário
            </button>
          ) : (
            <button
              type="button"
              className="bg-transparent p-0 text-left text-sm font-medium text-zinc-500"
              onClick={openComments}
            >
              Seja o primeiro a comentar
            </button>
          )}
          <small className="text-xs text-zinc-500">
            {new Date(post.criado_em).toLocaleString('pt-BR')}
          </small>
        </div>
      </article>

      {isCommentsOpen ? (
        <div
          className="fixed inset-x-0 top-0 bottom-[var(--mobile-nav-height,3.5rem)] z-40 flex items-end justify-center bg-black/55 lg:inset-0"
          onClick={closeComments}
          role="presentation"
        >
          <section
            className="flex h-[min(50vh,calc(var(--app-height,100dvh)-var(--mobile-nav-height,3.5rem)))] w-full max-w-[560px] animate-[slideUp_220ms_ease-out] flex-col overflow-hidden rounded-t-2xl border border-zinc-300 bg-white shadow-2xl lg:h-[50vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Comentários</h3>
                <p className="text-xs text-zinc-500">
                  {commentsTotal} {commentsTotal === 1 ? 'comentário' : 'comentários'}
                </p>
              </div>
              <button
                type="button"
                className="bg-transparent p-0 text-2xl leading-none text-zinc-600"
                onClick={closeComments}
                aria-label="Fechar comentários"
              >
                ×
              </button>
            </header>

            <div className="grid flex-1 gap-3 overflow-y-auto px-4 py-3">
              {commentsLoading ? (
                <p className="text-sm text-zinc-500">Carregando comentários...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-zinc-500">Seja o primeiro a comentar.</p>
              ) : (
                comments.map((comment) => renderCommentItem(comment))
              )}

              {commentsHasMore ? (
                <button
                  type="button"
                  className="ig-button w-fit"
                  disabled={loadingMoreComments}
                  onClick={() =>
                    loadComments({ offset: commentsOffset, append: true })
                  }
                >
                  {loadingMoreComments ? 'Carregando...' : 'Ver mais comentários'}
                </button>
              ) : null}
            </div>

            <form
              onSubmit={sendComment}
              className="grid gap-2 border-t border-zinc-200 p-3"
            >
              {replyTo ? (
                <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600">
                  <span>
                    Respondendo a <strong>{truncateName(replyTo.autor_nome)}</strong>
                  </span>
                  <button
                    type="button"
                    className="bg-transparent p-0 font-medium text-zinc-500"
                    onClick={cancelComposerAction}
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}
              {editingComment ? (
                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                  <span>Editando comentário</span>
                  <button
                    type="button"
                    className="bg-transparent p-0 font-medium"
                    onClick={cancelComposerAction}
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}
              {actionError ? (
                <p className="text-sm text-rose-500">{actionError}</p>
              ) : null}
              <div className="flex items-center gap-2">
                <input
                  className="ig-input border-zinc-200 bg-zinc-50"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  name="texto"
                  placeholder={
                    replyTo
                      ? 'Escreva uma resposta...'
                      : editingComment
                        ? 'Edite seu comentário...'
                        : 'Adicione um comentário...'
                  }
                  maxLength={300}
                />
                <button
                  type="submit"
                  className="bg-transparent p-0 text-sm font-semibold text-blue-600"
                >
                  {editingComment ? 'Salvar' : 'Publicar'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isDeleteWarningOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-post-title-${post.id}`}
          onClick={cancelDeletePost}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id={`delete-post-title-${post.id}`}
              className="text-lg font-semibold text-zinc-900"
            >
              Excluir publicação?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Esta é a sua publicação. Se continuar, ela será removida do feed
              permanentemente e não poderá ser recuperada.
            </p>
            {actionError ? (
              <p className="mt-3 text-sm text-rose-600">{actionError}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                onClick={cancelDeletePost}
                disabled={isDeletingPost}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
                onClick={confirmDeletePost}
                disabled={isDeletingPost}
              >
                {isDeletingPost ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default FeedCard;
