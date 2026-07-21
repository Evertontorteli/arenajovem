/**
 * Corrige layout no iOS Safari:
 * - 100vh/dvh divergem do visualViewport até um resize (ex.: zoom)
 * - visualViewport.offsetTop desloca o conteúdo para cima
 */
export function syncAppHeight() {
  const vv = window.visualViewport;
  const height = Math.round(vv?.height || window.innerHeight || 0);
  const offsetTop = Math.round(vv?.offsetTop || 0);
  if (!height) return;

  const root = document.documentElement;
  root.style.setProperty('--app-height', `${height}px`);
  root.style.setProperty('--vv-offset-top', `${offsetTop}px`);
}

export function startAppHeightSync() {
  syncAppHeight();

  const onChange = () => syncAppHeight();
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
  window.visualViewport?.addEventListener('resize', onChange);
  window.visualViewport?.addEventListener('scroll', onChange);

  // iOS às vezes reporta altura/offset errados no primeiro paint
  window.setTimeout(syncAppHeight, 50);
  window.setTimeout(syncAppHeight, 300);
  window.setTimeout(syncAppHeight, 1000);

  return () => {
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
    window.visualViewport?.removeEventListener('resize', onChange);
    window.visualViewport?.removeEventListener('scroll', onChange);
  };
}
