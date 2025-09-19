// frontend/js/modules/ui/alerts.js

import { configManager } from '@modules/config'
import { eventBus }      from '@modules/utils/eventBus.js'

/** Evento emitido quando um toast é exibido */
export const TOAST_EVENT = 'ui:toast'

/** Caminhos dos sons de alerta em `public/assets/sounds` */
export const SOUND_PATHS = {
  critical: '/assets/sounds/alert-critical.mp3',
  warning:  '/assets/sounds/alert-warning.mp3',
  info:     '/assets/sounds/alert-info.mp3'
}

/** Cache de instâncias de Audio para reutilização */
const audioCache = {}

// Polyfill de Math.clamp
if (typeof Math.clamp !== 'function') {
  Math.clamp = (val, min, max) => Math.min(Math.max(val, min), max)
}

/**
 * Toca um som de alerta, se estiver habilitado nas configurações.
 *
 * @param {'critical'|'warning'|'info'} type — Tipo de alerta.
 * @fires eventBus.emit('sound:played', { type })
 */
export function tocarSom(type) {
  const { sonsAtivos, volume } = configManager.getAll()
  if (!sonsAtivos?.[type]) return

  const src = SOUND_PATHS[type]
  if (!src) return

  let audio = audioCache[type]
  if (!audio) {
    audio = new Audio(src)
    audio.preload = 'auto'
    audio.volume  = Math.clamp(volume ?? 1, 0, 1)
    audioCache[type] = audio
  }

  audio.currentTime = 0
  audio.play().catch(() => {})

  eventBus.emit('sound:played', { type })
}

/**
 * Adiciona um efeito de pulso visual no elemento alvo.
 *
 * @param {HTMLElement} el — Elemento que receberá o pulso.
 * @param {number} [duration=2000] — Duração do efeito em ms.
 */
export function addPulse(el, duration = 2000) {
  if (!(el instanceof HTMLElement)) return

  if (typeof el.animate === 'function') {
    const anim = el.animate([
      { boxShadow: '0 0 0 rgba(255,0,0,0)' },
      { boxShadow: '0 0 8px rgba(255,0,0,0.8)' },
      { boxShadow: '0 0 0 rgba(255,0,0,0)' }
    ], {
      duration,
      easing:    'ease-in-out',
      iterations: 1
    })
    anim.onfinish = () => anim.cancel()
  } else {
    el.classList.add('alerta')
    setTimeout(() => el.classList.remove('alerta'), duration)
  }
}

/**
 * Exibe um toast no canto da tela com mensagem e tipo.
 *
 * @param {string} message — Texto a ser exibido.
 * @param {Object} [opts]
 * @param {'info'|'warning'|'critical'} [opts.type='info'] — Estilo do toast.
 * @param {number} [opts.duration=3000] — Tempo em ms antes de esconder.
 * @returns {HTMLElement} Instância do elemento toast criado.
 * @fires eventBus.emit(TOAST_EVENT, { message, type, duration })
 */
export function showToast(
  message,
  { type = 'info', duration = 3000 } = {}
) {
  eventBus.emit(TOAST_EVENT, { message, type, duration })

  let container = document.querySelector('.toast-container')
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.className = `toast toast--${type}`
  toast.textContent = message
  container.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('toast--hide')
    toast.addEventListener(
      'transitionend',
      () => toast.remove(),
      { once: true }
    )
  }, duration)

  return toast
}
