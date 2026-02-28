// web/js/pages/home.js
import '/assets/css/layout.css'
import '/assets/css/home.css'
import analytics                    from '../utils/analytics.js'
import { showSpinner, hideSpinner } from '../utils/spinner.js'
import { showToast }                from '../utils/toast.js'

/**
 * Renderiza a página inicial com hero e cards de categoria.
 * @param {HTMLElement} container
 * @param {object} locale – objeto i18n com t(key) => string
 * @returns {Function} cleanup
 */
export default function renderHome(container, locale) {
  analytics.track('page.render', { page: 'home' })
  console.log('[Home] render start')

  container.innerHTML = `
    <div class="page-center">
      <main class="container home-page" aria-labelledby="home-heading">
        <section
          class="home-hero"
          role="region"
          aria-labelledby="home-heading"
          style="background-image: url('/assets/img/hero-network.svg');"
        >
          <h1 id="home-heading">${locale.t('home.hero.title')}</h1>
          <p>${locale.t('home.hero.subtitle')}</p>
        </section>

        <section
          class="categories"
          role="region"
          aria-labelledby="categories-heading"
        >
          <h2 id="categories-heading">${locale.t('home.categories.heading')}</h2>
          <ul class="categories-grid" role="list">
            ${[
              { key: 'iptv',    title: locale.t('home.categories.iptv.title'),    desc: locale.t('home.categories.iptv.desc') },
              { key: 'vod',     title: locale.t('home.categories.vod.title'),     desc: locale.t('home.categories.vod.desc') },
              { key: 'radio',   title: locale.t('home.categories.radio.title'),   desc: locale.t('home.categories.radio.desc') },
              { key: 'webcams', title: locale.t('home.categories.webcams.title'), desc: locale.t('home.categories.webcams.desc') }
            ].map(({ key, title, desc }) => `
              <li role="listitem">
                <a
                  href="#/${key}"
                  class="category-card"
                  data-route="${key}"
                  role="link"
                  tabindex="0"
                  aria-label="${locale.t('home.categories.ariaNavigate', { title })}"
                >
                  <div class="category-icon category-icon--${key}" aria-hidden="true"></div>
                  <div class="category-body">
                    <h3>${title}</h3>
                    <p>${desc}</p>
                  </div>
                </a>
              </li>
            `).join('')}
          </ul>
        </section>
      </main>
    </div>
  `

  // Offline/online detection
  function onOffline() { showToast(locale.t('network.offline') || 'Offline', 'error') }
  function onOnline()  { showToast(locale.t('network.online') || 'Online', 'success') }
  window.addEventListener('offline', onOffline)
  window.addEventListener('online',  onOnline)

  // Page loaders map — explicit imports so Vite can analyze bundles
  const pageLoaders = {
    iptv:    () => import('./iptv.js'),
    vod:     () => import('./vod.js'),
    radio:   () => import('./radio.js'),
    webcams: () => import('./webcams.js'),
    'not-found': () => import('./not-found.js')
  }

  // Navigation handler: spinner + dynamic import via map + telemetry
  async function navigateToRoute(route) {
    analytics.track('home.navigate', { route })
    showSpinner()
    try {
      const loader = pageLoaders[route] || pageLoaders['not-found']
      await loader()
      location.hash = `#/${route}`
    } catch (err) {
      console.error('[Home] nav error', err)
      showToast(locale.t('home.errorNavigate') || 'Erro ao navegar', 'error')
    } finally {
      hideSpinner()
    }
  }

  // Delegated event handlers bound to container for simpler cleanup
  const root = container.querySelector('.categories-grid')

  async function onClick(e) {
    const a = e.target.closest && e.target.closest('.category-card')
    if (!a) return
    e.preventDefault()
    const route = a.dataset.route
    navigateToRoute(route)
  }

  function onPrefetch(e) {
    const a = e.target.closest && e.target.closest('.category-card')
    if (!a) return
    const route = a.dataset.route
    const loader = pageLoaders[route] || pageLoaders['not-found']
    loader().then(() => analytics.track('home.prefetch', { route })).catch(()=>{})
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const a = e.target.closest && e.target.closest('.category-card')
      if (!a) return
      e.preventDefault()
      navigateToRoute(a.dataset.route)
    }
  }

  root.addEventListener('click', onClick)
  root.addEventListener('pointerover', onPrefetch)
  root.addEventListener('focusin', onPrefetch)
  root.addEventListener('keydown', onKeyDown)

  // Cleanup
  return () => {
    console.log('[Home] cleaned up')
    window.removeEventListener('offline', onOffline)
    window.removeEventListener('online',  onOnline)
    root.removeEventListener('click', onClick)
    root.removeEventListener('pointerover', onPrefetch)
    root.removeEventListener('focusin', onPrefetch)
    root.removeEventListener('keydown', onKeyDown)
  }
}
