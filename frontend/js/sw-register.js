// assets/js/modules/swRegister.js
import { loadConfig } from './configManager.js';

/**
 * Registra o Service Worker e dispara callbacks de sucesso e atualização.
 *
 * @param {Object} [options]
 * @param {string} [options.path]            — Caminho do SW (default: '/service-worker.js')
 * @param {string} [options.scope]           — Escopo do SW (default: '/')
 * @param {Function} [options.onSuccess]     — Chamado após registro bem-sucedido
 * @param {Function} [options.onUpdateFound] — Chamado quando um novo SW entra em `waiting`
 */
export function registerServiceWorker({
  path  = loadConfig().swPath || '/service-worker.js',
  scope = '/',
  onSuccess,
  onUpdateFound
} = {}) {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(path, { scope });
      console.log(`[SW] Registrado com sucesso em: ${registration.scope}`);
      onSuccess?.(registration);

      // Se já há um SW aguardando ativação
      if (registration.waiting) {
        onUpdateFound?.(registration.waiting);
      }

      // Quando um novo SW for detectado
      registration.addEventListener('updatefound', () => {
        const newSW = registration.installing;
        newSW?.addEventListener('statechange', () => {
          if (
            newSW.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            onUpdateFound?.(newSW);
          }
        });
      });
    } catch (error) {
      console.error('[SW] Falha ao registrar Service Worker:', error);
    }
  });
}
