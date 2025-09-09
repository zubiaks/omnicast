// assets/js/modules/pwaUpdater.js

/**
 * Regista o Service Worker e configura o banner de atualização.
 *
 * @param {Object} config — Deve conter config.updateAlert (boolean).
 */
export function registerPWAUpdates(config) {
  if (!('serviceWorker' in navigator) || !config.updateAlert) return;

  // Regista SW
  navigator.serviceWorker.register('/pwa/sw.js').then(reg => {
    console.log('✔️ Service Worker registado:', reg.scope);

    // Se já houver SW ativo, avisa imediatamente
    if (reg.waiting) {
      showUpdateBanner();
    }

    // Quando um novo SW for instalado e estiver waiting
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW?.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });
  }).catch(err => {
    console.error('❌ Falha ao registar SW:', err);
  });

  // Recebe mensagem do SW (ativação)
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'UPDATE_READY') {
      showUpdateBanner();
    }
  });

  // Cria e exibe banner de atualização
  function showUpdateBanner() {
    if (document.getElementById('update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'update-banner';
    banner.innerHTML = `
      <span>🚀 Nova versão disponível!</span>
      <div class="update-actions">
        <button id="btn-update-now" class="update-btn">Atualizar</button>
        <button id="btn-update-close" class="update-close">✖</button>
      </div>
    `;
    document.body.appendChild(banner);

    const btnNow = document.getElementById('btn-update-now');
    const btnClose = document.getElementById('btn-update-close');

    btnNow.addEventListener('click', () => {
      banner.classList.add('fade-out');
      setTimeout(() => location.reload(true), 300);
    });
    btnClose.addEventListener('click', () => {
      banner.classList.add('fade-out');
      setTimeout(() => banner.remove(), 300);
    });
  }
}
