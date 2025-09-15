// assets/js/modules/offlineHandler.js
import { showToast } from './alerts.js';

/**
 * Inicializa gerenciamento de estado de rede (online/offline),
 * exibindo um banner acessível com botão de retry.
 *
 * @param {Object} [options]
 * @param {string} [options.bannerSelector='.offline-banner']
 *   Seletor do banner; será criado se não existir.
 * @param {string} [options.retryBtnSelector='#retry-btn']
 *   Seletor do botão de retry dentro do banner.
 * @param {string} [options.bannerMessage]
 *   Mensagem exibida no banner ao ficar offline.
 */
export function initOfflineHandler({
  bannerSelector     = '.offline-banner',
  retryBtnSelector   = '#retry-btn',
  bannerMessage      = 'Você está sem conexão. Verifique sua rede.'
} = {}) {
  let bannerEl;
  let retryBtn;

  // Cria e injeta banner se ainda não existir
  function createBanner() {
    bannerEl = document.querySelector(bannerSelector);
    if (bannerEl) return;

    bannerEl = document.createElement('div');
    bannerEl.className = 'offline-banner';
    bannerEl.setAttribute('role', 'alert');
    bannerEl.setAttribute('aria-live', 'assertive');
    bannerEl.innerHTML = `
      <span class="offline-banner__message">${bannerMessage}</span>
      <button type="button" ${retryBtnSelector.startsWith('#') ? `id="${retryBtnSelector.slice(1)}"` : ''}
        class="offline-banner__retry">
        Tentar novamente
      </button>
    `;
    document.body.appendChild(bannerEl);
  }

  // Exibe banner e associa handler ao retry
  function showBanner() {
    createBanner();
    bannerEl.classList.add('offline-banner--visible');
    retryBtn = bannerEl.querySelector(retryBtnSelector);
    retryBtn?.addEventListener('click', onRetry);
  }

  // Oculta banner e remove listener
  function hideBanner() {
    if (bannerEl) {
      bannerEl.classList.remove('offline-banner--visible');
      retryBtn?.removeEventListener('click', onRetry);
    }
  }

  // Ao clicar em retry, tenta recarregar se online ou mostra toast
  function onRetry() {
    if (navigator.onLine) {
      hideBanner();
      location.reload();
    } else {
      showToast('Você ainda está offline. Verifique sua rede e tente novamente.');
    }
  }

  // Eventos do navegador
  window.addEventListener('offline', showBanner);
  window.addEventListener('online', () => {
    hideBanner();
    showToast('Conexão restabelecida!');
  });

  // Se já estiver offline ao iniciar
  if (!navigator.onLine) {
    showBanner();
  }
}
