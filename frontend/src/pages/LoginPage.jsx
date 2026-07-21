import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPostLoginRoute } from '../utils/accessPermissions';
import logoArena from '../assets/logoArena.png';

function LoginPage() {
  const [contato, setContato] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    navigate(getPostLoginRoute(user), { replace: true });
  }, [navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!contato.trim()) {
      setError('Informe seu email ou telefone.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const loggedUser = await login(contato.trim(), senha);
      navigate(getPostLoginRoute(loggedUser));
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message || 'Email, telefone ou senha inválidos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[var(--app-height,100dvh)] place-items-center bg-zinc-50 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[360px]">
        <form
          className="ig-card grid gap-2 border-zinc-300 px-6 py-7"
          onSubmit={handleSubmit}
        >
          <img
            src={logoArena}
            alt="Logo Arena Jovem"
            className="mx-auto mb-1 w-full max-w-[280px] object-contain"
          />
          <p className="mb-2 text-center text-sm text-zinc-500">
            Entre para acompanhar o ranking e o feed.
          </p>
          <input
            className="ig-input"
            id="contato"
            type="text"
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            placeholder="Email ou celular com DDD"
            autoComplete="username"
            required
          />
          <input
            className="ig-input"
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            autoComplete="current-password"
            required
          />
          {error ? <span className="text-sm text-rose-500">{error}</span> : null}
          <button className="ig-button w-full" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <Link
            to="/esqueci-senha"
            className="mt-1 text-center text-xs text-blue-900 hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </form>
        <div className="ig-card mt-3 px-3 py-4 text-center text-sm">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="font-semibold text-blue-600 hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
