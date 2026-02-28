// web/js/pages/login.js
import '/assets/css/auth.css'
import '/assets/css/layout.css'
import { showSpinner, hideSpinner } from '../utils/spinner.js'
import { showToast }                from '../utils/toast.js'
import { supabase }                 from '../supabaseClient.js'
import locale                       from '../utils/i18n.js'

export default async function renderLogin(container) {
  container.innerHTML = `
    <div class="page-center">
      <main class="container">
        <form id="login-form" class="auth-form" aria-labelledby="login-heading" novalidate>
          <h2 id="login-heading">${locale.t('login.title')}</h2>

          <label for="email">${locale.t('login.email')}</label>
          <input id="email" name="email" type="email" required autocomplete="email" class="focus-ring" />

          <label for="password">${locale.t('login.password')}</label>
          <input id="password" name="password" type="password" required autocomplete="current-password" class="focus-ring" />

          <button type="submit">${locale.t('login.submit')}</button>

          <p>${locale.t('login.noAccount')} <a href="#/signup">${locale.t('login.signupLink')}</a></p>
          <div class="form-error" role="status" aria-live="polite"></div>
        </form>
      </main>
    </div>
  `

  const form   = container.querySelector('#login-form')
  const error  = container.querySelector('.form-error')

  async function onSubmit(e) {
    e.preventDefault()
    error.textContent = ''
    const fd = new FormData(form)
    const email = (fd.get('email') || '').toString().trim()
    const password = (fd.get('password') || '').toString()
    if (!email || !password) {
      const msg = locale.t('login.fillFields') || 'Preenche email e password'
      error.textContent = msg
      showToast(msg, 'error')
      return
    }
    showSpinner()
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      showToast(locale.t('login.success'), 'success')
      location.hash = '#/home'
    } catch (err) {
      const msg = err?.message || String(err) || locale.t('login.error') || 'Erro'
      error.textContent = msg
      showToast(msg, 'error')
    } finally {
      hideSpinner()
    }
  }

  form.addEventListener('submit', onSubmit)
  return () => form.removeEventListener('submit', onSubmit)
}
