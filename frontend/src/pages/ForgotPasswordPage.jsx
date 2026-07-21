import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import http from '../api/http';
import logoArena from '../assets/logoArena.png';

const STEP_COPY = {
  1: {
    title: 'Esqueceu a senha?',
    hint: 'Informe o e-mail cadastrado para receber um código.',
    submit: 'Enviar código',
  },
  2: {
    title: 'Validar código',
    hint: 'Digite o código de 6 dígitos enviado no seu e-mail.',
    submit: 'Validar código',
  },
  3: {
    title: 'Nova senha',
    hint: 'Escolha uma nova senha para a sua conta.',
    submit: 'Redefinir senha',
  },
};

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  const copy = STEP_COPY[step];

  const requestCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    setDevCode('');
    try {
      const { data } = await http.post('/auth/forgot-password', { email });
      setInfo(
        data.message ||
          'Se este e-mail estiver cadastrado, enviamos um código de verificação.'
      );
      if (data.devCode) setDevCode(data.devCode);
      setStep(2);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível enviar o código agora.'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setError('Informe o código de 6 dígitos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await http.post('/auth/verify-reset-code', {
        email,
        codigo,
      });
      setInfo(data.message || 'Código validado. Defina sua nova senha.');
      setDevCode('');
      setStep(3);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível validar o código.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (senhaNova.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senhaNova !== confirmarSenha) {
      setError('A confirmação da nova senha não confere.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await http.post('/auth/reset-password', {
        email,
        codigo,
        senhaNova,
        confirmarSenha,
      });
      setInfo(data.message || 'Senha redefinida com sucesso.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Não foi possível redefinir a senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit =
    step === 1 ? requestCode : step === 2 ? verifyCode : resetPassword;

  const goBack = () => {
    setError('');
    if (step === 3) {
      setSenhaNova('');
      setConfirmarSenha('');
      setInfo('');
      setStep(2);
      return;
    }
    setCodigo('');
    setInfo('');
    setDevCode('');
    setStep(1);
  };

  return (
    <div className="flex min-h-[var(--app-height,100dvh)] items-center justify-center bg-zinc-50 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[360px]">
        <form
          className="ig-card grid gap-2 border-zinc-300 px-6 py-5 max-[720px]:gap-1.5 max-[720px]:py-4"
          onSubmit={onSubmit}
        >
          <img
            src={logoArena}
            alt="Logo Arena Jovem"
            className="mx-auto mb-1 h-auto w-auto max-h-[min(140px,22svh)] max-w-[min(200px,50vw)] object-contain"
          />
          <p className="text-center text-xs font-medium uppercase tracking-wide text-zinc-400">
            Passo {step} de 3
          </p>
          <h1 className="text-center text-lg font-semibold text-zinc-900">
            {copy.title}
          </h1>
          <p className="mb-1 text-center text-sm text-zinc-500">{copy.hint}</p>

          {step === 1 ? (
            <input
              className="ig-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail cadastrado"
              autoComplete="email"
              required
            />
          ) : null}

          {step === 2 ? (
            <input
              className="ig-input tracking-[0.35em]"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={codigo}
              onChange={(e) =>
                setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="000000"
              autoComplete="one-time-code"
              required
            />
          ) : null}

          {step === 3 ? (
            <>
              <input
                className="ig-input"
                type="password"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                placeholder="Nova senha"
                autoComplete="new-password"
                required
              />
              <input
                className="ig-input"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirmar nova senha"
                autoComplete="new-password"
                required
              />
            </>
          ) : null}

          {info ? <span className="text-sm text-emerald-600">{info}</span> : null}
          {devCode && step === 2 ? (
            <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">
              Dev: código {devCode}
            </span>
          ) : null}
          {error ? <span className="text-sm text-rose-500">{error}</span> : null}

          <button className="ig-button w-full" type="submit" disabled={loading}>
            {loading ? 'Aguarde...' : copy.submit}
          </button>

          {step > 1 ? (
            <button
              type="button"
              className="bg-transparent p-0 text-center text-xs text-blue-900 hover:underline"
              onClick={goBack}
              disabled={loading}
            >
              {step === 2 ? 'Voltar e usar outro e-mail' : 'Voltar ao código'}
            </button>
          ) : null}

          <Link
            to="/login"
            className="mt-1 text-center text-xs text-blue-900 hover:underline"
          >
            Voltar ao login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
