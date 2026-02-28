// web/js/pages/webcams.js
import { showSpinner, hideSpinner } from '@/utils/spinner.js'
import { showToast }                 from '@/utils/toast.js'
import { fetchJSON }                 from '@/utils/fetch.js'
import { loadHls }                   from '../hls-loader.js'
import analytics                      from '@/utils/analytics.js'

/**
 * Renderiza a página “Webcams” com tema “Câmeras do mundo todo”
 *
 * @param {HTMLElement} container
 * @param {object} locale
 * @returns {Function} cleanup
 */
export default async function renderWebcams(container, locale) {
  analytics.track('page.render', { page: 'webcams' })

  container.innerHTML = `
    <main class="webcams-page">

      <section
        class="webcams-hero"
        role="region"
        aria-labelledby="hero-heading"
        style="background-image: url('/assets/img/world-map.svg');"
      >
        <h1 id="hero-heading">${locale.t('webcams.hero.title')}</h1>
        <p>${locale.t('webcams.hero.subtitle')}</p>
      </section>

      <section
        class="webcams-section"
        role="region"
        aria-labelledby="list-heading"
        aria-busy="true"
      >
        <h2 id="list-heading">${locale.t('webcams.list.heading')}</h2>
        <p id="list-desc">${locale.t('webcams.list.desc')}</p>
        <div id="webcams-grid" class="webcams-grid" role="list">
          ${Array.from({ length: 8 }).map(() => `
            <div class="webcam-skeleton" role="status" aria-label="${locale.t('loading')}"></div>
          `).join('')}
        </div>
      </section>

      <section
        id="player-section"
        class="webcam-player-section"
        role="region"
        aria-labelledby="player-heading"
        aria-live="polite"
      >
        <h2 id="player-heading">${locale.t('webcams.player.heading')}</h2>
        <div id="webcam-player" class="webcam-player"></div>
      </section>

    </main>
  `

  const sectionEl   = container.querySelector('.webcams-section')
  const gridEl      = container.querySelector('#webcams-grid')
  const playerEl    = container.querySelector('#webcam-player')
  let cams          = []
  let hlsInstance   = null
  const cleanupFns  = []

  // offline/online handlers
  function onOffline() { showToast(locale.t('offline'), 'error') }
  function onOnline()  { showToast(locale.t('online'),  'success') }
  window.addEventListener('offline', onOffline)
  window.addEventListener('online', onOnline)
  cleanupFns.push(() => {
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('online', onOnline)
  })

  // fetch data with spinner
  showSpinner()
  try {
    cams = await fetchJSON('/api/webcams')
    analytics.track('webcams.fetched', { count: cams.length })
    showToast(locale.t('webcams.loaded'), 'success')
  } catch (err) {
    console.error('[Webcams] fetch failed:', err)
    gridEl.innerHTML = `
      <div role="alert" class="error">
        ${locale.t('webcams.error')}: ${err.message}
      </div>`
    showToast(locale.t('webcams.errorToast'), 'error')
    sectionEl.setAttribute('aria-busy', 'false')
    hideSpinner()
    return () => console.log('[Webcams] cleaned up')
  } finally {
    hideSpinner()
    sectionEl.setAttribute('aria-busy', 'false')
  }

  // render cards
  gridEl.innerHTML = ''
  if (!cams.length) {
    gridEl.innerHTML = `<p>${locale.t('webcams.empty')}</p>`
  } else {
    cams.forEach((cam, idx) => {
      const card = document.createElement('div')
      card.className     = 'webcam-card'
      card.role          = 'listitem'
      card.tabIndex      = 0
      card.dataset.index = idx
      card.innerHTML     = `
        <img
          class="webcam-snapshot"
          src="${cam.snapshotUrl}?t=${Date.now()}"
          alt="${locale.t('webcams.snapshotAlt', { name: cam.name })}"
        />
        <div class="webcam-info">${cam.name}</div>
      `
      gridEl.append(card)
    })
  }

  // auto-refresh snapshots (uso de concatenação para evitar problemas de parsing)
  function refreshSnapshots() {
    cams.forEach((cam, i) => {
      const selector = '.webcam-card[data-index="' + i + '"] .webcam-snapshot'
      const img = gridEl.querySelector(selector)
      if (img) img.src = cam.snapshotUrl + '?t=' + Date.now()
    })
    analytics.track('webcams.refreshed')
  }
  const refreshTimer = setInterval(refreshSnapshots, 30_000)
  cleanupFns.push(() => clearInterval(refreshTimer))

  // stop any existing HLS
  function stopStream() {
    if (hlsInstance) {
      try { hlsInstance.destroy() } catch (e) { /* ignore */ }
      hlsInstance = null
    }
    playerEl.innerHTML = ''
  }

  // activate a card (click or keyboard)
  async function activateCard(card) {
    const cam = cams[+card.dataset.index]
    if (!cam || !cam.streamUrl) {
      return showToast(locale.t('webcams.noStream'), 'error')
    }

    // mark active
    gridEl.querySelectorAll('.webcam-card.active').forEach(c => c.classList.remove('active'))
    card.classList.add('active')
    stopStream()

    // inline spinner in player
    playerEl.classList.add('loading')
    playerEl.innerHTML = `<div class="spinner spinner--small inline-spinner" role="status" aria-label="${locale.t('loading')}"></div>`

    const video = document.createElement('video')
    video.controls = true
    video.autoplay = true
    video.className = 'webcam-video'
    playerEl.innerHTML = ''
    playerEl.append(video)

    try {
      if (cam.streamUrl.endsWith('.m3u8')) {
        const Hls = await loadHls()
        if (Hls && Hls.isSupported && Hls.isSupported()) {
          hlsInstance = new Hls({ debug: false })
          hlsInstance.loadSource(cam.streamUrl)
          hlsInstance.attachMedia(video)
          hlsInstance.on(Hls.Events.ERROR, (_evt, data) => {
            console.error('[Webcams] HLS error:', data)
            showToast(locale.t('webcams.streamError', { type: data && data.type }), 'error')
          })
        } else {
          video.src = cam.streamUrl
        }
      } else {
        video.src = cam.streamUrl
      }
      analytics.track('webcams.play', { name: cam.name })
      showToast(locale.t('webcams.playing', { name: cam.name }), 'success')
    } catch (err) {
      console.error('[Webcams] playback failed:', err)
      showToast(locale.t('webcams.playError'), 'error')
    } finally {
      playerEl.classList.remove('loading')
    }
  }

  // event handlers
  function onClick(e) {
    const card = e.target.closest('.webcam-card')
    if (card) activateCard(card)
  }
  function onKeyDown(e) {
    const card = e.currentTarget
    if ((e.key === 'Enter' || e.key === ' ') && card.classList.contains('webcam-card')) {
      e.preventDefault()
      activateCard(card)
    }
  }

  gridEl.addEventListener('click', onClick)
  cleanupFns.push(() => gridEl.removeEventListener('click', onClick))

  // keyboard support
  const cards = Array.from(gridEl.querySelectorAll('.webcam-card'))
  cards.forEach(card => {
    card.addEventListener('keydown', onKeyDown)
    cleanupFns.push(() => card.removeEventListener('keydown', onKeyDown))
  })

  console.log('[Webcams] render end')
  return () => {
    cleanupFns.forEach(fn => fn())
    stopStream()
    console.log('[Webcams] cleaned up')
  }
}
