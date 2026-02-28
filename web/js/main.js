// web/js/main.js
import { supabase }   from './supabaseClient.js'
import { initRouter } from './router.js'
import { showToast }  from './utils/toast.js'
import locale         from './utils/i18n.js'
import { registerSW } from 'virtual:pwa-register'

// estilos globais (para bundler)
import '../assets/css/base.css'
import '../assets/css/theme.css'
import '../assets/css/spinner.css'
import '../assets/css/toast.css'

/**
 * Mostra ou esconde os links de Login, Cadastrar e o botão de Logout
 * Protegemos chamadas para document.getElementById para não falhar se elemento não existir
 */
function updateAuthUI(session) {
  const login = document.getElementById('login-link')
  const signup = document.getElementById('signup-link')
  const logout = document.getElementById('logout-btn')

  if (login) login.classList.toggle('hidden', !!session)
  if (signup) signup.classList.toggle('hidden', !!session)
  if (logout) logout.classList.toggle('hidden', !session)
}

// expor para debug/runtime
window.updateAuthUI = updateAuthUI

/* Web Vitals em DEV: painel na página */
if (import.meta.env.DEV) {
  const panel = document.createElement('div')
  panel.id = 'metrics-panel'
  panel.className = 'metrics-panel'
  panel.innerHTML = '<h3>Métricas Web Vitals</h3>'
  document.body.append(panel)
}

/**
 * Envia métricas de Web Vitals para /api/metrics
 * Protegemos contra erros de rede para não poluir o console em dev
 */
function sendToMonitoring(metric) {
  const payload = {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    href: window.location.href,
    timestamp: Date.now()
  }

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
    } else {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {})
    }
  } catch (e) {
    // swallow to avoid noisy errors in dev
  }

  if (import.meta.env.DEV) {
    const panel = document.getElementById('metrics-panel')
    const item  = document.createElement('div')
    item.textContent = `${metric.name}: ${metric.value.toFixed(2)} (Δ${metric.delta.toFixed(2)})`
    panel?.append(item)
  }
}

/* Web Vitals import assíncrono */
;(async () => {
  try {
    const { getCLS, getFID, getLCP, getFCP } = await import('web-vitals')
    getCLS(sendToMonitoring)
    getFID(sendToMonitoring)
    getLCP(sendToMonitoring)
    getFCP(sendToMonitoring)
  } catch {
    console.warn('[WebVitals] import falhou')
  }
})()

/* Coloca toda a lógica que mexe no DOM dentro de DOMContentLoaded */
window.addEventListener('DOMContentLoaded', () => {
  /* Checagem inicial de sessão e atualização da UI de autenticação (proteção contra payloads nulos) */
  ;(async () => {
    try {
      const res = await supabase.auth.getSession()
      const session = res?.data?.session ?? null
      updateAuthUI(session)
      if (!session && !['#/login', '#/signup'].includes(location.hash)) {
        showToast(locale.t('auth.loginRequired'), 'info')
        location.hash = '#/login'
      }
    } catch (err) {
      console.error('[Auth] getSession failed', err)
    }
  })()

  /* Detecta logout em outra aba ou expiração de sessão — protege caso payload seja nulo */
  supabase.auth.onAuthStateChange((_event, payload) => {
    try {
      const session = payload?.session ?? null
      updateAuthUI(session)
      if (!session) {
        showToast(locale.t('auth.signedOut'), 'info')
        location.hash = '#/login'
      }
    } catch (err) {
      console.error('[Auth] onAuthStateChange handler failed', err)
    }
  })

  /* Logout via botão (guardando se o botão existe) */
  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await supabase.auth.signOut()
        updateAuthUI(false)
        showToast(locale.t('auth.signedOut'), 'success')
        location.hash = '#/login'
      } catch (err) {
        console.error('[Auth] signOut failed', err)
        showToast(locale.t('auth.signOutError'), 'error')
      }
    })
  }

  /* Toasters de rede */
  window.addEventListener('offline', () =>
    showToast(locale.t('network.offline'), 'error')
  )
  window.addEventListener('online', () =>
    showToast(locale.t('network.online'), 'success')
  )

  /* Inicializa o roteador SPA */
  const container = document.getElementById('main-content')
  initRouter(container)

  /* Registra o Service Worker via VitePWA somente em produção e com try/catch */
  if (!import.meta.env.DEV) {
    try {
      const updateSW = registerSW({
        onRegistered()       { console.log('[SW] registrado') },
        onRegisterError(err) { console.error('[SW] erro:', err) },
        onNeedRefresh() {
          showToast(locale.t('sw.updateAvailable'), 'info')
          updateSW(true)
        },
        onOfflineReady() {
          showToast(locale.t('sw.offlineReady'), 'success')
        }
      })
    } catch (err) {
      console.warn('[SW] register failed (caught):', err)
    }
  } else {
    console.log('[SW] registo ignorado em DEV')
  }
})
