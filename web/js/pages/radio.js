// web/js/pages/radio.js
import { showSpinner, hideSpinner } from '@/utils/spinner.js'
import { showToast }                from '@/utils/toast.js'
import { fetchJSON }                from '@/utils/fetch.js'
import analytics                     from '@/utils/analytics.js'

/**
 * Renderiza a página “Rádio” com tema “Câmeras do mundo todo”:
 * - Hero com background de ondas de rádio
 * - Skeleton placeholders para lista inicial
 * - Seção de estações com fetch, inline e global spinner
 * - Player <audio> com controls, loading e erro tratado
 * - Detecção offline/online via toasts
 * - Telemetria de render, fetch e play
 * - Suporte a teclado (Enter/Space)
 * - Cleanup rigoroso de listeners e timers
 *
 * @param {HTMLElement} container
 * @param {object} locale – i18n: locale.t(key, params) => string
 * @returns {Function} cleanup
 */
export default async function renderRadio(container, locale) {
  analytics.track('page.render', { page: 'radio' })
  console.log('[Radio] render start')

  container.innerHTML = `
    <main class="radio-page">

      <section
        class="radio-hero"
        role="region"
        aria-labelledby="radio-hero-heading"
        style="background-image: url('/assets/img/radio-wave.svg');"
      >
        <h1 id="radio-hero-heading">${locale.t('radio.hero.title')}</h1>
        <p>${locale.t('radio.hero.subtitle')}</p>
      </section>

      <section
        class="radio-section"
        role="region"
        aria-labelledby="radio-list-heading"
        aria-busy="true"
      >
        <h2 id="radio-list-heading">${locale.t('radio.list.heading')}</h2>
        <p>${locale.t('radio.list.desc')}</p>
        <div id="radio-list" class="radio-list" role="list">
          ${Array.from({ length: 6 }).map(() => `
            <div class="radio-skeleton" role="status" aria-label="${locale.t('loading')}"></div>
          `).join('')}
        </div>
      </section>

      <section
        id="player-section"
        class="radio-player-section"
        role="region"
        aria-labelledby="radio-player-heading"
        aria-live="polite"
      >
        <h2 id="radio-player-heading">${locale.t('radio.player.heading')}</h2>
        <div id="radio-player" class="radio-player"></div>
      </section>

    </main>
  `

  const sectionEl    = container.querySelector('.radio-section')
  const listEl       = container.querySelector('#radio-list')
  const playerEl     = container.querySelector('#radio-player')
  let stations       = []
  let currentAudio   = null
  const cleanupFns   = []

  // detect offline/online
  function onOffline() {
    showToast(locale.t('offline'), 'error')
  }
  function onOnline() {
    showToast(locale.t('online'), 'success')
  }
  window.addEventListener('offline', onOffline)
  window.addEventListener('online',  onOnline)
  cleanupFns.push(() => {
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('online',  onOnline)
  })

  // fetch estações com feedback global
  showSpinner()
  try {
    stations = await fetchJSON('/api/radio-stations')
    analytics.track('radio.fetched', { count: stations.length })
    showToast(locale.t('radio.loaded'), 'success')
  } catch (err) {
    console.error('[Radio] fetch failed:', err)
    listEl.innerHTML = `
      <div role="alert" class="error">
        ${locale.t('radio.error')}: ${err.message}
      </div>`
    showToast(locale.t('radio.errorToast'), 'error')
    sectionEl.setAttribute('aria-busy', 'false')
    hideSpinner()
    return () => console.log('[Radio] cleaned up')
  } finally {
    hideSpinner()
    sectionEl.setAttribute('aria-busy', 'false')
  }

  // renderizar lista de estações
  listEl.innerHTML = ''
  if (stations.length === 0) {
    listEl.innerHTML = `<p>${locale.t('radio.empty')}</p>`
  } else {
    stations.forEach((st, idx) => {
      const btn = document.createElement('button')
      btn.type          = 'button'
      btn.role          = 'listitem'
      btn.className     = 'radio-button'
      btn.tabIndex      = 0
      btn.dataset.url   = st.streamUrl
      btn.dataset.index = idx
      btn.innerHTML     = `
        <span class="radio-icon" aria-hidden="true"></span>
        <span class="radio-name">${st.name}</span>
      `
      listEl.append(btn)
    })
    showToast(locale.t('radio.listLoaded'), 'info')
  }

  // pausar áudio existente
  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    playerEl.innerHTML = ''
  }

  // ativar estação (click ou teclado)
  async function activateStation(btn) {
    const url  = btn.dataset.url
    const name = btn.querySelector('.radio-name').textContent

    if (!url) {
      return showToast(locale.t('radio.noStream'), 'error')
    }

    // marca ativo e limpa player antigo
    listEl.querySelectorAll('.radio-button.active')
      .forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    stopAudio()

    // inline spinner no player
    playerEl.innerHTML = `
      <div
        class="spinner spinner--small inline-spinner"
        role="status"
        aria-label="${locale.t('loading')}"
      ></div>
    `

    // criar elemento <audio>
    const audio = document.createElement('audio')
    audio.controls  = true
    audio.autoplay  = true
    audio.className = 'radio-audio'
    audio.src       = url

    // erro de reprodução
    const onError = () => {
      console.error('[Radio] audio error')
      showToast(locale.t('radio.playError'), 'error')
    }
    audio.addEventListener('error', onError)
    cleanupFns.push(() => audio.removeEventListener('error', onError))

    // anexar e iniciar
    playerEl.innerHTML = ''
    playerEl.append(audio)
    currentAudio = audio

    analytics.track('radio.play', { station: name })
    showToast(locale.t('radio.playing', { station: name }), 'success')
  }

  // listeners de interação
  function onClick(e) {
    const btn = e.target.closest('.radio-button')
    if (btn) activateStation(btn)
  }
  function onKeyDown(e) {
    const btn = e.currentTarget
    if ((e.key === 'Enter' || e.key === ' ') && btn.classList.contains('radio-button')) {
      e.preventDefault()
      activateStation(btn)
    }
  }

  listEl.addEventListener('click', onClick)
  cleanupFns.push(() => listEl.removeEventListener('click', onClick))

  const buttons = Array.from(listEl.querySelectorAll('.radio-button'))
  buttons.forEach(btn => {
    btn.addEventListener('keydown', onKeyDown)
    cleanupFns.push(() => btn.removeEventListener('keydown', onKeyDown))
  })

  console.log('[Radio] render end')
  // cleanup completo
  return () => {
    cleanupFns.forEach(fn => fn())
    stopAudio()
    console.log('[Radio] cleaned up')
  }
}
