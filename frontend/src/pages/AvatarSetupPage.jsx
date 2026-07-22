import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../api/http';
import logoArena from '../assets/logoArena.png';
import AvatarPicker from '../components/AvatarPicker';
import { useAuth } from '../contexts/AuthContext';
import { getPostLoginRoute, userHasProfilePhoto } from '../utils/accessPermissions';

function AvatarSetupPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [foto, setFoto] = useState(user?.foto || '');
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN' || userHasProfilePhoto(user)) {
      navigate(getPostLoginRoute(user), { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    setFoto(user?.foto || '');
  }, [user?.foto]);

  const canContinue = userHasProfilePhoto({ foto });

  const handleContinue = async () => {
    if (!canContinue || continuing) return;
    setContinuing(true);
    try {
      await refreshUser();
      const { data } = await http.get('/users/me');
      navigate(getPostLoginRoute(data), { replace: true });
    } finally {
      setContinuing(false);
    }
  };

  return (
    <div className="grid min-h-[var(--app-height,100dvh)] place-items-center bg-zinc-50 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[560px] space-y-4">
        <div className="text-center">
          <img
            src={logoArena}
            alt="Logo Arena Jovem"
            className="mx-auto mb-3 h-auto w-auto max-h-[min(100px,18svh)] max-w-[min(180px,45vw)] object-contain"
          />
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {user?.equipe_id ? 'Quase lá' : 'Passo 1 de 2'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            Mostre quem você é
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {user?.equipe_id
              ? 'Escolha um avatar ou envie sua foto para o feed e as missões ficarem mais saudáveis — assim todo mundo reconhece quem está participando.'
              : 'Escolha um avatar ou envie sua foto antes de entrar no time. Assim o feed e as missões ficam mais vivos — todo mundo reconhece quem está participando.'}
          </p>
        </div>

        <AvatarPicker
          user={user}
          foto={foto}
          onFotoChange={setFoto}
          onSaved={(updated) => {
            if (updated?.foto) setFoto(updated.foto);
          }}
        />

        <button
          type="button"
          className="ig-button w-full"
          disabled={!canContinue || continuing}
          onClick={handleContinue}
        >
          {continuing
            ? 'Continuando...'
            : canContinue
              ? user?.equipe_id
                ? 'Entrar na Arena'
                : 'Continuar para escolher o time'
              : 'Escolha um avatar para continuar'}
        </button>
      </div>
    </div>
  );
}

export default AvatarSetupPage;
