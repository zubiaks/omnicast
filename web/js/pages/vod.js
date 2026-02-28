// web/js/pages/vod.js
import { showSpinner, hideSpinner } from '@/utils/spinner.js'
import { showToast }                from '@/utils/toast.js'
import { fetchJSON }                from '@/utils/fetch.js'
import analytics                     from '@/utils/analytics.js'

/**
 * Renderiza a página “VOD” com tema “Vídeos sob demanda”:
 * - Hero simplificado e grade de thumbnails
 * - Skeleton placeholders animados antes dos dados chegarem
 * - Spinner global e inline para carregamentos
 * - Player HTML5 com poster, controls e tratamento de erros
 * - Offline/online detection via toast
 * - Telemetria de render, fetch e play
 * - Cleanup rigoroso de listeners e estado
 *
 * @param {HTMLElement} container
 * @param {object} locale – objeto i18n com t(key, params) => string
 * @returns {Function} cleanup
 */
export default async function renderVOD(container, locale) {
  analytics.track('page.render', { page: 'vod' })

  // 1. Marcação inicial com skeletons e aria-busy
  container.innerHTML = `
    <main class="vod-page">
      <section
        class="vod-section"
        role="region"
        aria-labelledby="vod-heading"
        aria-busy="true"
      >
        <h2 id="vod-heading">${locale.t('vod.title')}</h2>
        <p>${locale.t('vod.subtitle')}</p>
        <div id="vod-grid" class="vod-grid" role="list">
          ${Array.from({ length: 6 }).map(() => `
            <div class="vod-skeleton" role="status" aria-label="${locale.t('loading')}"></div>
          `).join('')}
        </div>
        <div id="vod-player" class="vod-player" role="region" aria-live="polite"></div>
      </section>
    </main>
  `

  const sectionEl   = container.querySelector('.vod-section')
  const gridEl      = container.querySelector('#vod-grid')
  const playerEl    = container.querySelector('#vod-player')
  let videos        = []
  let currentVideo  = null
  const cleanupFns  = []

  // 2. Offline/online detection
  const onOffline = () => showToast(locale.t('offline'), 'error')
  const onOnline  = () => showToast(locale.t('online'),  'success')
  window.addEventListener('offline', onOffline)
  window.addEventListener('online',  onOnline)
  cleanupFns.push(() => {
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('online',  onOnline)
  })

  // 3. Fetch da lista de vídeos
  showSpinner()
  try {
    videos = await fetchJSON('/api/vod')
    analytics.track('vod.fetched', { count: videos.length })
    showToast(locale.t('vod.loaded'), 'success')
  } catch (err) {
    console.error('[VOD] fetch failed:', err)
    gridEl.innerHTML = `
      <div role="alert" class="error">
        ${locale.t('vod.error')}: ${err.message}
      </div>
    `
    showToast(locale.t('vod.errorToast'), 'error')
    sectionEl.setAttribute('aria-busy', 'false')
    hideSpinner()
    return () => console.log('[VOD] cleaned up')
  } finally {
    hideSpinner()
    sectionEl.setAttribute('aria-busy', 'false')
  }

  // 4. Renderizar grade de vídeos
  gridEl.innerHTML = ''
  if (videos.length === 0) {
    gridEl.innerHTML = `<p>${locale.t('vod.empty')}</p>`
  } else {
    videos.forEach((v, idx) => {
      const card = document.createElement('button')
      card.type         = 'button'
      card.className    = 'vod-card'
      card.role         = 'listitem'
      card.tabIndex     = 0
      card.dataset.url  = v.url
      card.dataset.poster = v.thumbnail
      card.dataset.index = idx
      card.innerHTML    = `
        <img 
          src="${v.thumbnail}" 
          alt="${locale.t('vod.thumbAlt', { title: v.title })}"
        />
        <div class="vod-info">${v.title}</div>
      `
      gridEl.append(card)
    })
    showToast(locale.t('vod.listLoaded'), 'info')
  }

  // 5. Função para pausar e remover player atual
  function stopCurrent() {
    if (currentVideo) {
      currentVideo.pause()
      currentVideo = null
    }
    playerEl.innerHTML = ''
  }

  // 6. Ativar reprodução de um vídeo
  async function activateVideo(card) {
    const url    = card.dataset.url
    const poster = card.dataset.poster
    const title  = card.querySelector('.vod-info').textContent

    // sem URL de vídeo
    if (!url) {
      return showToast(locale.t('vod.noVideo'), 'error')
    }

    // marca ativo e limpa player antigo
    gridEl.querySelectorAll('.vod-card.active')
      .forEach(c => c.classList.remove('active'))
    card.classList.add('active')
    stopCurrent()

    // spinner inline no player
    playerEl.innerHTML = `
      <div 
        class="spinner spinner--small inline-spinner" 
        role="status" 
        aria-label="${locale.t('loading')}"
      ></div>
    `

    // criar elemento vídeo
    const video = document.createElement('video')
    video.controls = true
    video.autoplay = true
    video.poster   = poster
    video.className = 'vod-video'
    video.src      = url

    // tratamento de erro
    const onErr = () => {
      console.error('[VOD] video error')
      showToast(locale.t('vod.playError'), 'error')
    }
    video.addEventListener('error', onErr)
    cleanupFns.push(() => video.removeEventListener('error', onErr))

    // anexar e iniciar
    playerEl.innerHTML = ''
    playerEl.append(video)
    currentVideo = video

    analytics.track('vod.play', { title })
    showToast(locale.t('vod.playing', { title }), 'success')
  }

  // 7. Event listeners: click e teclado
  function onClick(e) {
    const card = e.target.closest('.vod-card')
    if (card) activateVideo(card)
  }
  function onKeyDown(e) {
    const card = e.currentTarget
    if ((e.key === 'Enter' || e.key === ' ') && card.classList.contains('vod-card')) {
      e.preventDefault()
      activateVideo(card)
    }
  }

  gridEl.addEventListener('click', onClick)
  cleanupFns.push(() => gridEl.removeEventListener('click', onClick))

  const cards = Array.from(gridEl.querySelectorAll('.vod-card'))
  cards.forEach(card => {
    card.addEventListener('keydown', onKeyDown)
    cleanupFns.push(() => card.removeEventListener('keydown', onKeyDown))
  })

  console.log('[VOD] render end')
  // 8. Cleanup completo
  return () => {
    cleanupFns.forEach(fn => fn())
    stopCurrent()
    console.log('[VOD] cleaned up')
  }
}
