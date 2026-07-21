import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoArena from '../assets/logoArena.png';
import { useAuth } from '../contexts/AuthContext';
import { getPostLoginRoute } from '../utils/accessPermissions';

function RegisterPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    navigate(getPostLoginRoute(user), { replace: true });
  }, [navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (senha.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const createdUser = await signup({ nome, email, senha, telefone });
      navigate(getPostLoginRoute(createdUser));
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message || 'Não foi possível criar sua conta.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[var(--app-height,100dvh)] items-center justify-center bg-zinc-50 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[360px]">
        <form
          className="ig-card grid gap-2 border-zinc-300 px-6 py-5 max-[720px]:gap-1.5 max-[720px]:py-4"
          onSubmit={handleSubmit}
        >
          <img
            src={logoArena}
            alt="Logo Arena Jovem"
            className="mx-auto mb-1 h-auto w-auto max-h-[min(140px,22svh)] max-w-[min(200px,50vw)] object-contain"
          />
          <p className="mb-1 text-center text-sm text-zinc-500">
            Crie sua conta manualmente para participar da gincana.
          </p>
          <input
            className="ig-input"
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Nome completo"
            required
          />
          <input
            className="ig-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="ig-input"
            type="tel"
            value={telefone}
            onChange={(event) => setTelefone(event.target.value)}
            placeholder="Celular com DDD (opcional)"
          />
          <input
            className="ig-input"
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Senha"
            required
          />
          <input
            className="ig-input"
            type="password"
            value={confirmarSenha}
            onChange={(event) => setConfirmarSenha(event.target.value)}
            placeholder="Confirmar senha"
            required
          />
          {error ? <span className="text-sm text-rose-500">{error}</span> : null}
          <button className="ig-button w-full" type="submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <div className="ig-card mt-3 px-3 py-4 text-center text-sm">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
