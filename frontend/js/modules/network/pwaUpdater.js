// frontend/js/modules/network/pwaUpdater.js

import { configManager }           from '@modules/config/configManager.js'
import { eventBus }                from '@modules/utils/eventBus.js'
import {
  registerServiceWorker,
  activateUpdate
} from '@modules/network/registerServiceWorker.js'

/** Chave em config para alerta de update */
export const UPDATE_ALERT_KEY      = 'updateAlert'

/** Evento interno emitido quando update está disponível */
export const PWA_UPDATE_EVENT      = 'pwa:update-available'

/**
 * Inicializa o PWA updater:
 * - Registra service worker
 * - Exibe banner ao detectar nova versão
 * - Emite evento via eventBus
 *
 * @param {Object} opts
 * @param {boolean} [opts.updateAlert]        — override em runtime (default vem de config)
 * @param {string}  [opts.path='/sw.js']      — URL do service worker
 * @param {string}  [opts.scope='/']          — escopo do SW
 * @param {string}  [opts.bannerId]           — id do banner (default em config)
 * @param {Function}[opts.onReload]           — callback antes de reload
 * @param {Function}[opts.bannerFactory]      — fábrica de HTMLElement para banner
 */
export function initPwaUpdater({
  updateAlert,
  path          = '/sw.js',
  scope         = '/',
  bannerId      = configManager.loadConfig().updateAlertBannerId || 'oc-pwa-update-banner',
  onReload      = () => window.location.reload(),
  bannerFactory = defaultBannerFactory
} = {}) {
  const cfg = configManager.loadConfig()
  const showAlert = typeof updateAlert === 'boolean'
    ? updateAlert
    : Boolean(cfg[UPDATE_ALERT_KEY])

  if (!('serviceWorker' in navigator) || !showAlert) return

  let waitingWorker = null

  // Função para exibir banner e emitir evento
  function notifyUpdate() {
    if (!waitingWorker || document.getElementById(bannerId)) return

    const banner = bannerFactory(bannerId)
    if (!banner) return

    banner.setAttribute('role', 'status')
    banner.setAttribute('aria-live', 'polite')

    const btnUpdate = banner.querySelector('.update-btn')
    const btnClose  = banner.querySelector('.close-btn')

    btnUpdate?.addEventListener('click', () => {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      fadeOut(banner, () => banner.remove())
    })

    btnClose?.addEventListener('click', () => {
      fadeOut(banner, () => banner.remove())
    })

    document.body.appendChild(banner)
    eventBus.emit(PWA_UPDATE_EVENT)
  }

  // Registra SW e lida com ciclo de vida
  registerServiceWorker({
    path,
    scope,
    onSuccess(reg) {
      // SW pronto e já em waiting
      if (reg.waiting) {
        waitingWorker = reg.waiting
        notifyUpdate()
      }
    },
    onUpdateFound(worker) {
      // Novo SW instalado
      waitingWorker = worker
      notifyUpdate()
    },
    onControllerChange() {
      // Após SKIP_WAITING, novo SW assume controle
      setTimeout(onReload, 150)
    }
  })

  // Escuta mensagens do SW
  navigator.serviceWorker.addEventListener('message', ({ data }) => {
    if (data?.type === 'UPDATE_READY') {
      navigator.serviceWorker.ready.then(reg => {
        if (reg.waiting) {
          waitingWorker = reg.waiting
          notifyUpdate()
        }
      })
    }
  })
}

// ——— Helpers ———

function defaultBannerFactory(id) {
  const div = document.createElement('div')
  div.id = id
  div.className = 'oc-pwa-update-banner'
  div.innerHTML = `
    <div class="oc-pwa-update-banner__content">
      <span class="oc-pwa-update-banner__text">🚀 Nova versão disponível.</span>
      <div class="oc-pwa-update-banner__actions">
        <button class="update-btn" aria-label="Aplicar atualização agora">Atualizar</button>
        <button class="close-btn" aria-label="Fechar aviso">Depois</button>
      </div>
    </div>
  `
  div.style.cssText = [
    'position:fixed','left:0','right:0','bottom:0','z-index:9999',
    'display:flex','justify-content:center','padding:10px',
    'background:var(--banner-bg, #1f1b24)','color:var(--banner-fg, #fff)',
    'box-shadow:0 -2px 12px rgba(0,0,0,.3)'
  ].join(';')
  return div
}

function fadeOut(el, cb) {
  el.style.transition = 'opacity .3s ease'
  el.style.opacity = '0'
  setTimeout(cb, 300)
}
