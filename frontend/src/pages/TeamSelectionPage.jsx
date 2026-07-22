import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../contexts/AuthContext';
import { getPostLoginRoute, userHasProfilePhoto } from '../utils/accessPermissions';

function TeamSelectionPage() {
  const { user, refreshUser, getDefaultRoute } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN' || user.equipe_id) {
      navigate(getDefaultRoute(), { replace: true });
      return;
    }
    if (!userHasProfilePhoto(user)) {
      navigate('/escolher-avatar', { replace: true });
      return;
    }

    async function loadTeams() {
      setLoading(true);
      setError('');
      try {
        const { data } = await http.get('/teams');
        const allowed = ['amarelo', 'azul', 'vermelho', 'verde'];
        const filtered = data.filter((team) =>
          allowed.includes(String(team.nome || '').toLowerCase())
        );
        setTeams(filtered);
      } catch (_error) {
        setError('Não foi possível carregar os times.');
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, [navigate, user, getDefaultRoute]);

  const handleSaveTeam = async (event) => {
    event.preventDefault();
    if (!selectedTeamId) {
      setError('Escolha um time para continuar.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { data } = await http.patch('/users/me/team', {
        equipe_id: selectedTeamId,
      });
      if (data?.token) {
        localStorage.setItem('arena_token', data.token);
      }
      await refreshUser();
      navigate(getPostLoginRoute(data) || getDefaultRoute(), { replace: true });
    } catch (_error) {
      setError('Não foi possível salvar o time agora. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid min-h-[var(--app-height,100dvh)] place-items-center bg-zinc-50 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[560px]">
        <form className="ig-card grid gap-4 px-6 py-7" onSubmit={handleSaveTeam}>
          <div>
            <p className="text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
              Passo 2 de 2
            </p>
            <h1 className="mt-1 text-center text-2xl font-semibold text-zinc-900">
              Escolha seu time
            </h1>
            <p className="mt-1 text-center text-sm text-zinc-500">
              Para entrar na gincana, selecione seu time: verde, amarelo, azul ou
              vermelho.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-sm text-zinc-500">Carregando times...</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.map((team) => {
                const isActive = Number(selectedTeamId) === Number(team.id);
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-zinc-900 ring-2 ring-zinc-200'
                        : 'border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="mb-2 flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: team.cor || '#3b82f6' }}
                      />
                      <strong className="text-sm text-zinc-900">{team.nome}</strong>
                    </span>
                    <small className="text-xs text-zinc-500">
                      {team.participantes || 0} participante(s)
                    </small>
                  </button>
                );
              })}
            </div>
          )}

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}

          <button type="submit" className="ig-button w-full" disabled={saving || loading}>
            {saving ? 'Salvando...' : 'Entrar na Arena'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TeamSelectionPage;
