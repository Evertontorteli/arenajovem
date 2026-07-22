import { Link } from 'react-router-dom';
import logoArena from '../assets/logoArena.png';
import {
  LGPD_ORG,
  LGPD_SECTIONS,
  LGPD_TITLE,
  LGPD_VERSION,
} from '../content/lgpd';

function PrivacyPage() {
  return (
    <div className="min-h-[var(--app-height,100dvh)] bg-zinc-50 px-5 py-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 text-center">
          <img
            src={logoArena}
            alt="Logo Arena Jovem"
            className="mx-auto mb-3 h-auto w-auto max-h-[min(96px,16svh)] max-w-[min(160px,40vw)] object-contain"
          />
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {LGPD_ORG}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{LGPD_TITLE}</h1>
          <p className="mt-1 text-xs text-zinc-500">Versão {LGPD_VERSION}</p>
        </div>

        <article className="ig-card space-y-5 p-5 text-sm leading-relaxed text-zinc-700">
          {LGPD_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-zinc-900">{section.title}</h2>
              <p className="mt-1.5">{section.body}</p>
            </section>
          ))}
        </article>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            to="/cadastro"
            className="font-semibold text-blue-600 hover:underline"
          >
            Voltar ao cadastro
          </Link>
          <span className="text-zinc-300">·</span>
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
