// web/js/pages/iptv.js
import { loadHls }                   from '../hls-loader.js'
import { showSpinner, hideSpinner }  from '@/utils/spinner.js'
import { showToast }                 from '@/utils/toast.js'
import { fetchJSON }                 from '@/utils/fetch.js'
import analytics                     from '@/utils/analytics.js'

/**
 * Renderiza a página “IPTV” com tema “Câmeras do mundo todo”:
 * - Hero com background de antenas globais
 * - Skeleton placeholders animados antes dos dados chegarem
 * - Spinner global e inline para carregamentos
 * - Lista acessível de canais com botão e suporte a teclado
 * - Player HLS ou nativo com tratamento de erro
 * - Detecção offline/online via toast
 * - Telemetria de render, fetch e play
 * - Cleanup rigoroso de listeners, timers e instâncias
 *
 * @param {HTMLElement} container
 * @param {object} locale – i18n: locale.t(key, params) => string
 * @returns {Function} cleanup
 */
export default async function renderIPTV(container, locale) {
  analytics.track('page.render', { page: 'iptv' })
  console.log('[IPTV] render start')

  container.innerHTML = `
    <main class="iptv-page">

      <section
        class="iptv-hero"
        role="region"
        aria-labelledby="iptv-hero-heading"
        style="background-image: url('/assets/img/iptv-hero.svg');"
      >
        <h1 id="iptv-hero-heading">
          ${locale.t('iptv.hero.title')}
        </h1>
        <p>${locale.t('iptv.hero.subtitle')}</p>
      </section>

      <section
        class="iptv-section"
        role="region"
        aria-labelledby="iptv-list-heading"
        aria-busy="true"
      >
        <h2 id="iptv-list-heading">${locale.t('iptv.list.heading')}</h2>
        <p id="iptv-list-desc">${locale.t('iptv.list.desc')}</p>
        <div id="iptv-list" class="iptv-list" role="list">
          ${Array.from({ length: 6 }).map(() => `
            <div
              class="iptv-skeleton"
              role="status"
              aria-label="${locale.t('loading')}"
            ></div>
          `).join('')}
        </div>
      </section>

      <section
        id="iptv-player-section"
        class="iptv-player-section"
        role="region"
        aria-labelledby="iptv-player-heading"
        aria-live="polite"
      >
        <h2 id="iptv-player-heading">${locale.t('iptv.player.heading')}</h2>
        <div id="iptv-player" class="iptv-player"></div>
      </section>

    </main>
  `

  const sectionEl  = container.querySelector('.iptv-section')
  const listEl     = container.querySelector('#iptv-list')
  const playerEl   = container.querySelector('#iptv-player')
  let hlsInstance  = null
  const cleanupFns = []

  // offline/online detection
  function onOffline() { showToast(locale.t('offline'), 'error') }
  function onOnline()  { showToast(locale.t('online'),  'success') }
  window.addEventListener('offline', onOffline)
  window.addEventListener('online',  onOnline)
  cleanupFns.push(() => {
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('online',  onOnline)
  })

  // fetch canais com spinner global
  showSpinner()
  let channels = []
  try {
    channels = await fetchJSON('/api/iptv-channels')
    analytics.track('iptv.fetched', { count: channels.length })
    showToast(locale.t('iptv.loaded'), 'success')
  } catch (err) {
    console.error('[IPTV] fetch failed:', err)
    listEl.innerHTML = `
      <div role="alert" class="error">
        ${locale.t('iptv.error')}: ${err.message}
      </div>`
    showToast(locale.t('iptv.errorToast'), 'error')
    sectionEl.setAttribute('aria-busy', 'false')
    hideSpinner()
    return () => console.log('[IPTV] cleaned up')
  } finally {
    hideSpinner()
    sectionEl.setAttribute('aria-busy', 'false')
  }

  // renderizar lista de canais
  listEl.innerHTML = ''
  if (channels.length === 0) {
    listEl.innerHTML = `<p>${locale.t('iptv.empty')}</p>`
  } else {
    channels.forEach((ch, idx) => {
      const btn = document.createElement('button')
      btn.type           = 'button'
      btn.role           = 'listitem'
      btn.className      = 'iptv-button'
      btn.tabIndex       = 0
      btn.dataset.url    = ch.streamUrl
      btn.dataset.index  = idx
      btn.innerHTML      = `
        <span class="iptv-icon" aria-hidden="true"></span>
        <span class="iptv-name">${ch.name}</span>
      `
      listEl.append(btn)
    })
    showToast(locale.t('iptv.listLoaded'), 'info')
  }

  // função para parar e limpar player
  function stopStream() {
    if (hlsInstance) {
      hlsInstance.destroy()
      hlsInstance = null
    }
    playerEl.innerHTML = ''
  }

  // ativar canal (click ou teclado)
  async function activateChannel(btn) {
    const url  = btn.dataset.url
    const name = btn.querySelector('.iptv-name').textContent

    if (!url) {
      return showToast(locale.t('iptv.noStream'), 'error')
    }

    listEl.querySelectorAll('.iptv-button.active')
      .forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    stopStream()

    // spinner inline no player
    playerEl.innerHTML = `
      <div
        class="spinner spinner--small inline-spinner"
        role="status"
        aria-label="${locale.t('loading')}"
      ></div>
    `
    showToast(locale.t('iptv.loadingChannel', { name }), 'info')

    const video = document.createElement('video')
    video.controls   = true
    video.autoplay   = true
    video.className  = 'iptv-video'
    playerEl.innerHTML = ''
    playerEl.append(video)

    try {
      const Hls = await loadHls()
      if (Hls.isSupported()) {
        hlsInstance = new Hls({ debug: false })
        hlsInstance.loadSource(url)
        hlsInstance.attachMedia(video)
        cleanupFns.push(() => hlsInstance.destroy())
        hlsInstance.on(Hls.Events.ERROR, (_evt, data) => {
          console.error('[IPTV] HLS error:', data)
          showToast(
            locale.t('iptv.streamError', { type: data.type }),
            'error'
          )
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
        const onErr = () =>
          showToast(locale.t('iptv.nativeError'), 'error')
        video.addEventListener('error', onErr)
        cleanupFns.push(() => video.removeEventListener('error', onErr))
      } else {
        showToast(locale.t('iptv.unsupported'), 'error')
      }

      analytics.track('iptv.play', { channel: name })
      showToast(locale.t('iptv.playing', { channel: name }), 'success')
    } catch (err) {
      console.error('[IPTV] playback failed:', err)
      showToast(locale.t('iptv.playError'), 'error')
    }
  }

  // handlers de interação
  function onClick(e) {
    const btn = e.target.closest('.iptv-button')
    if (btn) activateChannel(btn)
  }
  function onKeyDown(e) {
    const btn = e.currentTarget
    if (
      (e.key === 'Enter' || e.key === ' ') &&
      btn.classList.contains('iptv-button')
    ) {
      e.preventDefault()
      activateChannel(btn)
    }
  }

  listEl.addEventListener('click', onClick)
  cleanupFns.push(() => listEl.removeEventListener('click', onClick))

  // suporte teclado: delega keydown para cada botão
  const buttons = Array.from(listEl.querySelectorAll('.iptv-button'))
  buttons.forEach(btn => {
    btn.addEventListener('keydown', onKeyDown)
    cleanupFns.push(() => btn.removeEventListener('keydown', onKeyDown))
  })

  console.log('[IPTV] render end')
  return () => {
    cleanupFns.forEach(fn => fn())
    stopStream()
    console.log('[IPTV] cleaned up')
  }
}
