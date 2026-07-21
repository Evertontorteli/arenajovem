const { Resend } = require('resend');
const AppError = require('./AppError');

function resolveFromAddress() {
  let from = String(process.env.EMAIL_FROM || '').trim();
  if (
    (from.startsWith('"') && from.endsWith('"')) ||
    (from.startsWith("'") && from.endsWith("'"))
  ) {
    from = from.slice(1, -1).trim();
  }
  if (!from) {
    throw new AppError(
      'EMAIL_FROM não configurado. Use algo como: Arena Jovem <noreply@adbelemjales.com>',
      503
    );
  }
  if (/@resend\.dev>/i.test(from) || /@resend\.dev$/i.test(from)) {
    throw new AppError(
      'EMAIL_FROM ainda usa resend.dev. Atualize para um endereço do domínio verificado, ex.: Arena Jovem <noreply@adbelemjales.com>',
      503
    );
  }
  return from;
}

async function sendPasswordResetCode({ to, nome, codigo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const subject = 'Código para redefinir sua senha — Arena Jovem';
  const firstName = String(nome || 'participante').split(' ')[0];
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; line-height: 1.5; color: #18181b;">
      <h2 style="margin: 0 0 12px;">Redefinição de senha</h2>
      <p>Olá, ${firstName}!</p>
      <p>Use o código abaixo para criar uma nova senha na Arena Jovem:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 20px 0;">${codigo}</p>
      <p>Este código expira em <strong>15 minutos</strong>.</p>
      <p style="color: #71717a; font-size: 13px;">Se você não pediu isso, ignore este e-mail.</p>
    </div>
  `;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(
        'Envio de e-mail não configurado. Defina RESEND_API_KEY no Vercel.',
        503
      );
    }
    // eslint-disable-next-line no-console
    console.log(`[dev] Código de reset para ${to}: ${codigo}`);
    return { id: 'dev-log', mocked: true };
  }

  const from = resolveFromAddress();
  // eslint-disable-next-line no-console
  console.log(`[email] Enviando reset de senha de ${from} para ${to}`);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    const raw = String(error.message || '');
    if (/only send testing emails|verify a domain|resend\.dev/i.test(raw)) {
      throw new AppError(
        `Falha no envio (remetente atual: ${from}). Confirme EMAIL_FROM no Vercel/local e faça redeploy. Detalhe: ${raw}`,
        502
      );
    }
    throw new AppError(raw || 'Falha ao enviar e-mail.', 502);
  }

  return data;
}

module.exports = { sendPasswordResetCode };
