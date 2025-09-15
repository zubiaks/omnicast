// assets/js/modules/pwaUpdate.js

/**
 * Escuta mensagens do Service Worker indicando que há uma nova versão
 * e exibe um banner de atualização.
 *
 * @param {{ updateAlert: boolean }} config
 */
export function listenForPwaUpdate(config) {
  if (!config.updateAlert || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', onSwMessage);
}

function onSwMessage(event) {
  if (event.data?.type !== 'UPDATE_READY') return;
  showUpdateBanner();
}

/**
 * Cria e exibe o banner de atualização com botões de “Atualizar” e “Fechar”.
 * Garantimos que só seja exibido uma única vez.
 */
function showUpdateBanner() {
  const existing = document.getElementById('oc-pwa-update-banner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'oc-pwa-update-banner';
  banner.className = 'oc-pwa-update-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = `
    <span class="oc-pwa-update-banner__text">
      🚀 Nova versão do OmniCast disponível!
    </span>
    <div class="oc-pwa-update-banner__actions">
      <button 
        type="button" 
        class="oc-pwa-update-banner__btn oc-pwa-update-banner__btn--update"
      >
        Atualizar
      </button>
      <button 
        type="button" 
        class="oc-pwa-update-banner__btn oc-pwa-update-banner__btn--close"
        aria-label="Fechar aviso"
      >
        ✖
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  const btnUpdate = banner.querySelector('.oc-pwa-update-banner__btn--update');
  const btnClose  = banner.querySelector('.oc-pwa-update-banner__btn--close');

  btnUpdate.addEventListener('click', () => {
    // Solicita ao SW ativo que pule waiting e ative a nova versão
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
    fadeOutAndReload(banner);
  });

  btnClose.addEventListener('click', () => {
    fadeOutAndRemove(banner);
  });
}

/**
 * Aplica transição de saída e recarrega a página após delay.
 */
function fadeOutAndReload(el) {
  el.classList.add('oc-pwa-update-banner--fade');
  setTimeout(() => window.location.reload(true), 300);
}

/**
 * Aplica transição de saída e remove o banner do DOM após delay.
 */
function fadeOutAndRemove(el) {
  el.classList.add('oc-pwa-update-banner--fade');
  setTimeout(() => el.remove(), 300);
}
