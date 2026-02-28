// web/js/utils/toast.js

// Container único para todos os toasts
const toastContainer = document.createElement('div')
toastContainer.id = 'toast-container'
document.body.appendChild(toastContainer)

/**
 * Exibe uma mensagem flutuante na tela.
 * @param {string} message  Texto da mensagem.
 * @param {'success'|'error'|'info'} [type='success']
 * @param {Object} [options]  Opções extras (por exemplo className, duration)
 */
export function showToast(
  message,
  type = 'success',
  { className = '', duration = 3000 } = {}
) {
  const toast = document.createElement('div')
  toast.className = `toast toast--${type} ${className}`.trim()
  toast.textContent = message
  toastContainer.appendChild(toast)

  // Fecha automaticamente após `duration`
  setTimeout(() => {
    toast.classList.add('fade-out')
    toast.addEventListener(
      'transitionend',
      () => toast.remove(),
      { once: true }
    )
  }, duration)
}
