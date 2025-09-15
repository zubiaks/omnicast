// assets/js/modules/pwaUpdater.js

/**
 * Regista o Service Worker e exibe banner de atualização quando há nova versão.
 *
 * @param {Object} config
 * @param {boolean} config.updateAlert    — se deve mostrar banner
 * @param {string} [config.swPath='/pwa/sw.js'] — caminho do Service Worker
 */
export function registerPWAUpdates({ updateAlert, swPath = '/pwa/sw.js' }) {
  if (!updateAlert || !('serviceWorker' in navigator)) return;

  let registration;
  let waitingSW;

  // Regista o SW
  navigator.serviceWorker
    .register(swPath)
    .then(reg => {
      registration = reg;
      console.log(`✔️ Service Worker registrado em: ${reg.scope}`);

      // Se já existir um SW aguardando ativação
      if (reg.waiting) {
        waitingSW = reg.waiting;
        showUpdateBanner();
      }

      // Quando um novo SW é encontrado (installing → installed)
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            waitingSW = newSW;
            showUpdateBanner();
          }
        });
      });
    })
    .catch(err => {
      console.error('❌ Falha ao registrar Service Worker:', err);
    });

  // Escuta mensagens vindas do SW (por exemplo, via skipWaiting)
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'UPDATE_READY') {
      // SW indicou que já está esperando
      waitingSW = registration?.waiting;
      showUpdateBanner();
    }
  });

  /**
   * Exibe banner de atualização (uma vez por vida)
   */
  function showUpdateBanner() {
    if (document.getElementById('update-banner')) return;

    // Marcação CSS / ARIA
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'update-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <p class="update-banner__message">🚀 Nova versão disponível!</p>
      <div class="update-banner__actions">
        <button id="btn-update-now" class="update-banner__btn update-now">
          Atualizar
        </button>
        <button id="btn-update-close" class="update-banner__btn update-close" aria-label="Fechar">
          ✖
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // Referências
    const btnNow   = document.getElementById('btn-update-now');
    const btnClose = document.getElementById('btn-update-close');

    // Handler: força ativação imediata do SW e recarrega página
    btnNow.addEventListener('click', () => {
      banner.classList.add('update-banner--fade');
      waitingSW?.postMessage({ type: 'SKIP_WAITING' });
      // Espera transição CSS antes de reload
      setTimeout(() => location.reload(true), 300);
    });

    // Handler: fecha o banner apenas
    btnClose.addEventListener('click', () => {
      banner.classList.add('update-banner--fade');
      setTimeout(() => banner.remove(), 300);
    });
  }
}
