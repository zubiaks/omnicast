// web/js/pages/signup.js
import '/assets/css/auth.css'
import '/assets/css/layout.css'
import { showSpinner, hideSpinner } from '../utils/spinner.js'
import { showToast }                from '../utils/toast.js'
import { supabase }                 from '../supabaseClient.js'
import locale                       from '../utils/i18n.js'

export default async function renderSignup(container) {
  container.innerHTML = `
    <div class="page-center">
      <main class="container">
        <form id="signup-form" class="auth-form" aria-labelledby="signup-heading" novalidate>
          <h2 id="signup-heading">${locale.t('signup.title')}</h2>

          <label for="email">${locale.t('signup.email')}</label>
          <input id="email" name="email" type="email" required autocomplete="email" class="focus-ring" />

          <label for="password">${locale.t('signup.password')}</label>
          <input id="password" name="password" type="password" required minlength="6" autocomplete="new-password" class="focus-ring" />

          <button type="submit">${locale.t('signup.submit')}</button>

          <p>${locale.t('signup.haveAccount')} <a href="#/login">${locale.t('signup.loginLink')}</a></p>
          <div class="form-error" role="status" aria-live="polite"></div>
        </form>
      </main>
    </div>
  `

  const form   = container.querySelector('#signup-form')
  const error  = container.querySelector('.form-error')

  async function onSubmit(e) {
    e.preventDefault()
    error.textContent = ''
    const fd = new FormData(form)
    const email = (fd.get('email') || '').toString().trim()
    const password = (fd.get('password') || '').toString()
    if (!email || !password) {
      const msg = locale.t('signup.fillFields') || 'Preenche email e password'
      error.textContent = msg
      showToast(msg, 'error')
      return
    }
    showSpinner()
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      showToast(locale.t('signup.success'), 'success')
      location.hash = '#/login'
    } catch (err) {
      const msg = err?.message || String(err) || locale.t('signup.error') || 'Erro'
      error.textContent = msg
      showToast(msg, 'error')
    } finally {
      hideSpinner()
    }
  }

  form.addEventListener('submit', onSubmit)
  return () => form.removeEventListener('submit', onSubmit)
}
