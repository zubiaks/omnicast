// web/js/pages/not-found.js
import analytics              from '@/utils/analytics.js'
import { showSpinner, hideSpinner } from '@/utils/spinner.js'
import { showToast }                from '@/utils/toast.js'

/**
 * Renderiza a “404 – Página não encontrada” com tema de descoberta:
 * - Hero com background de bússola/magnifying glass
 * - Global spinner breve ao montar
 * - Toast informativo
 * - Botão de retorno com suporte a teclado
 * - Detecção offline/online via toast
 * - Telemetria de render
 * - Cleanup de listeners
 *
 * @param {HTMLElement} container
 * @param {object} locale – i18n: locale.t(key) => string
 * @returns {Function} cleanup
 */
export default async function renderNotFound(container, locale) {
  analytics.track('page.render', { page: 'not-found' })
  showSpinner()

  container.innerHTML = `
    <main class="notfound-page">

      <section
        class="notfound-hero"
        role="region"
        aria-labelledby="notfound-hero-heading"
        style="background-image: url('/assets/img/compass.svg');"
      >
        <h1 id="notfound-hero-heading">
          ${locale.t('notFound.hero.title')}
        </h1>
        <p>${locale.t('notFound.hero.subtitle')}</p>
      </section>

      <section
        class="notfound-section"
        role="region"
        aria-labelledby="notfound-heading"
      >
        <h2 id="notfound-heading">
          ${locale.t('notFound.section.title')}
        </h2>
        <p>${locale.t('notFound.section.message')}</p>
        <button
          id="notfound-home-btn"
          class="btn-primary"
          role="button"
          aria-label="${locale.t('notFound.buttonLabel')}"
          tabindex="0"
        >
          ${locale.t('notFound.buttonText')}
        </button>
      </section>

    </main>
  `

  hideSpinner()
  showToast(locale.t('notFound.toast'), 'info')

  // buttons & listeners
  const btn = container.querySelector('#notfound-home-btn')
  function navigateHome() {
    analytics.track('not-found.navigate-home')
    location.hash = ''
  }
  function onClick() {
    navigateHome()
  }
  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigateHome()
    }
  }
  btn.addEventListener('click', onClick)
  btn.addEventListener('keydown', onKeyDown)

  // offline/online detection
  function onOffline() {
    showToast(locale.t('offline'), 'error')
  }
  function onOnline() {
    showToast(locale.t('online'), 'success')
  }
  window.addEventListener('offline', onOffline)
  window.addEventListener('online', onOnline)

  // Cleanup
  return () => {
    btn.removeEventListener('click', onClick)
    btn.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('online', onOnline)
    console.log('[NotFound] cleaned up')
  }
}
