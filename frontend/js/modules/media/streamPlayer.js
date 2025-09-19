// frontend/js/modules/media/streamPlayer.js

import Hls from 'hls.js'
import videojs from 'video.js'
import { configManager } from '@modules/config/configManager.js'
import { showToast }     from '@modules/ui/alerts.js'

/**
 * Inicializa o player de streams em modal.
 *
 * @param {Object} opts
 * @param {string} [opts.modalSelector='#player-modal']
 * @param {string} [opts.videoSelector='#player-video']
 * @param {string} [opts.closeBtnSel='#btn-close-player']
 * @returns {{ playItem: (item: object, triggerEl?: HTMLElement) => void, closePlayer: () => void }}
 */
export function initStreamPlayer({
  modalSelector = '#player-modal',
  videoSelector = '#player-video',
  closeBtnSel   = '#btn-close-player'
} = {}) {
  const cfg       = configManager.loadConfig()
  const maxRetries = Number.isFinite(cfg.playerMaxRetries)
    ? cfg.playerMaxRetries
    : 3

  const modalEl  = document.querySelector(modalSelector)
  const videoEl  = modalEl?.querySelector(videoSelector)
  const closeBtn = modalEl?.querySelector(closeBtnSel)

  let hlsInstance = null
  let vjsInstance = null
  let triggerEl   = null
  let retryCount  = 0

  /**
   * Abre o modal e foca botão de fechar.
   */
  function openModal(el) {
    triggerEl = el || null
    if (!modalEl) return

    modalEl.setAttribute('aria-hidden', 'false')
    modalEl.classList.remove('hidden')
    ;(closeBtn || videoEl)?.focus()
  }

  /**
   * Fecha modal, destroi instâncias e restaura foco.
   */
  function closePlayer() {
    if (!modalEl) return

    modalEl.setAttribute('aria-hidden', 'true')
    modalEl.classList.add('hidden')

    vjsInstance?.dispose()
    hlsInstance?.destroy()

    if (videoEl) {
      videoEl.removeAttribute('src')
      videoEl.load()
    }

    triggerEl?.focus()
    triggerEl = null
  }

  /**
   * Tenta reproduzir novamente em caso de erro, com backoff exponencial.
   */
  function handleError(src, type, item) {
    if (retryCount < maxRetries) {
      retryCount++
      const delay = Math.pow(2, retryCount) * 1000
      showToast(
        `Falha na reprodução, tentando novamente (${retryCount}/${maxRetries})...`,
        { type: 'warning' }
      )
      setTimeout(() => {
        if (vjsInstance) {
          vjsInstance.src({ src, type })
          vjsInstance.play().catch(() => {})
        } else if (hlsInstance) {
          hlsInstance.loadSource(src)
          hlsInstance.attachMedia(videoEl)
          videoEl.play().catch(() => {})
        }
      }, delay)
    } else {
      showToast(
        `Não foi possível reproduzir "${item.name || item.title}".`,
        { type: 'critical' }
      )
    }
  }

  /**
   * Monta o stream no player, definindo HLS ou video.js conforme o source.
   */
  function mountItem(item) {
    if (!modalEl || !videoEl) {
      showToast('Player indisponível.', { type: 'critical' })
      return
    }
    const src = item.stream_url || item.url || item.src
    if (!src) {
      showToast('URL de stream não fornecida.', { type: 'warning' })
      return
    }

    retryCount = 0
    const isHls = /\.m3u8(?:\?.*)?$/.test(src)
    const mime  = isHls ? 'application/x-mpegURL' : (item.mime || 'video/mp4')

    // Define label de acessibilidade no modal
    modalEl.setAttribute(
      'aria-label',
      `Player — ${item.name || item.title || ''}`
    )

    // Destrói instâncias anteriores
    vjsInstance?.dispose()
    hlsInstance?.destroy()

    if (isHls && Hls.isSupported()) {
      hlsInstance = new Hls()
      hlsInstance.loadSource(src)
      hlsInstance.attachMedia(videoEl)
      videoEl.play().catch(() => {})
      return
    }
    if (isHls && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = src
      videoEl.play().catch(() => {})
      return
    }

    // Fallback para video.js
    if (typeof videojs === 'undefined') {
      console.error('[streamPlayer] video.js não encontrado')
      showToast('Player não disponível.', { type: 'critical' })
      return
    }
    vjsInstance = videojs(videoEl, {
      autoplay: true,
      controls: true,
      preload:  'auto',
      fluid:    true,
      liveui:   isHls
    })
    vjsInstance.src({ src, type: mime })
    vjsInstance.on('error', () => handleError(src, mime, item))
    vjsInstance.on('loadedmetadata', () => {
      retryCount = 0
    })
  }

  /**
   * Abre o modal e inicia reprodução do item.
   * @param {object} item — objeto com propriedades stream_url/title/name
   * @param {HTMLElement} [el] — elemento que disparou o play (para foco)
   */
  function playItem(item, el) {
    openModal(el)
    mountItem(item)
  }

  // Listeners para fechar modal
  if (closeBtn) {
    closeBtn.addEventListener('click', closePlayer)
  }
  modalEl?.addEventListener('click', e => {
    if (e.target === modalEl) closePlayer()
  })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalEl?.getAttribute('aria-hidden') === 'false') {
      closePlayer()
    }
  })

  return { playItem, closePlayer }
}
