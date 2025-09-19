import { configManager } from '@modules/config'

/** Tipo padrão para fallback de ícones */
const DEFAULT_FALLBACK_TYPE = 'vod'

/** Função que devolve sempre o caminho base atual dos assets */
function getAssetsBase() {
  return configManager.get('assetsBasePath') || '/assets/img'
}

/** Constrói dinamicamente o mapa de ícones de fallback */
function buildFallbackIconMap() {
  const base = getAssetsBase()
  return {
    iptv:   `${base}/icons/iptv.png`,
    vod:    `${base}/icons/vod.png`,
    webcam: `${base}/icons/webcam.png`,
    radio:  `${base}/icons/radio.png`,
    fav:    `${base}/icons/icon-fav.svg`
  }
}

/**
 * Normaliza texto para comparações:
 * remove acentos, converte pra minúsculas e trim.
 */
export function normalize(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

/** Escapa caracteres especiais em HTML para evitar XSS. */
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Escapa caracteres especiais para uso dentro de RegExp. */
export function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Retorna a URL de fallback para o tipo especificado.
 */
export function getFallback(type = DEFAULT_FALLBACK_TYPE) {
  const key = String(type).toLowerCase()
  const map = buildFallbackIconMap()
  return map[key] || map[DEFAULT_FALLBACK_TYPE]
}

/**
 * Gera lista de URLs candidatas para imagens de item,
 * na ordem: thumb, logo, image, extras, fallback.
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
