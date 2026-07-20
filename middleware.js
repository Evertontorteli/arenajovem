import { rewrite } from '@vercel/functions';

/**
 * Em SPA (React Router), refresh em /feed etc. precisa servir a home (/).
 * O middleware reescreve a rota sem mudar a URL no navegador.
 */
export const config = {
  matcher: [
    '/((?!api(?:/|$)|uploads(?:/|$)|assets(?:/|$)|favicon\\.svg|.*\\..*).*)',
  ],
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname === '/' || url.pathname === '') {
    return;
  }
  return rewrite(new URL('/', request.url));
}
