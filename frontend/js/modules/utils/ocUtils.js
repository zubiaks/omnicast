// frontend/js/modules/utils/ocUtils.js

import { configManager } from '@modules/config'

/** Tipo padrão para fallback de ícones */
const DEFAULT_FALLBACK_TYPE = 'vod'

/** Caminho base para assets, configurable via configManager */
const ASSETS_BASE = configManager.get('assetsBasePath') || '/assets/img'

/** Mapa de ícones de fallback por tipo de mídia */
const FALLBACK_ICON_MAP = {
  iptv:   `${ASSETS_BASE}/icons/iptv.png`,
  vod:    `${ASSETS_BASE}/icons/vod.png`,
  webcam: `${ASSETS_BASE}/icons/webcam.png`,
  radio:  `${ASSETS_BASE}/icons/radio.png`,
  fav:    `${ASSETS_BASE}/icons/icon-fav.svg`
}

/**
 * Normaliza texto para comparações:
 * remove acentos, converte pra minúsculas e trim.
 *
 * @param {string} [str='']
 * @returns {string}
 */
export function normalize(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * Escapa caracteres especiais em HTML para evitar XSS.
 *
 * @param {string} [str='']
 * @returns {string}
 */
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Escapa caracteres especiais para uso dentro de RegExp.
 *
 * @param {string} [str='']
 * @returns {string}
 */
export function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Retorna a URL de fallback para o tipo especificado.
 *
 * @param {string} [type=DEFAULT_FALLBACK_TYPE]
 * @returns {string}
 */
export function getFallback(type = DEFAULT_FALLBACK_TYPE) {
  const key = String(type).toLowerCase()
  return FALLBACK_ICON_MAP[key] || FALLBACK_ICON_MAP[DEFAULT_FALLBACK_TYPE]
}

/**
 * Gera lista de URLs candidatas para imagens de item,
 * na ordem: thumb, logo, image, extras, fallback.
 *
 * @param {{thumb?: string, logo?: string, image?: string, type?: string}} item
 * @param {string[]} [extra=[]]
 * @returns {string[]}
 */
export function buildCandidates(item = {}, extra = []) {
  const urls = [
    item.thumb,
    item.logo,
    item.image,
    ...(Array.isArray(extra) ? extra : []),
    getFallback(item.type)
  ]
  // filtra vazios e remove duplicados
  return Array.from(new Set(urls.filter(u => typeof u === 'string' && u.trim())))
}

/**
 * Substitui <img data-candidates="url1|url2|..."> por lazy-loading
 * com fallback em sequência.
 *
 * @param {HTMLElement|Document} [root=document]
 * @param {IntersectionObserverInit} [ioOptions={ rootMargin: '200px' }]
 */
export function applyImgFallback(root = document, ioOptions = { rootMargin: '200px' }) {
  const images = Array.from(root.querySelectorAll('img[data-candidates]'))
  if (!images.length) return

  const loadNext = (img, list) => {
    let idx = 0
    const tryLoad = () => {
      if (idx >= list.length) return
      img.onerror = () => { idx += 1; tryLoad() }
      img.onload = () => { img.onerror = null }
      img.src = list[idx++]
    }
    tryLoad()
  }

  const useIO = 'IntersectionObserver' in window
  if (useIO) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ isIntersecting, target }) => {
        if (isIntersecting) {
          const img = /** @type {HTMLImageElement} */(target)
          const list = img.dataset.candidates.split('|').map(u => u.trim())
          loadNext(img, list)
          observer.unobserve(img)
        }
      })
    }, ioOptions)

    images.forEach(img => {
      img.loading = 'lazy'
      observer.observe(img)
    })
  } else {
    images.forEach(img => {
      img.loading = 'lazy'
      const list = img.dataset.candidates.split('|').map(u => u.trim())
      loadNext(img, list)
    })
  }
}
