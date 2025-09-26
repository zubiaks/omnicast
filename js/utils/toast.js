const toastContainer = document.createElement('div')
toastContainer.id = 'toast-container'
document.body.appendChild(toastContainer)

export function showToast(message, type = 'success') {
  const toast = document.createElement('div')
  toast.className = `toast toast--${type}`
  toast.textContent = message
  toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('fade-out')
    toast.addEventListener('transitionend', () => toast.remove(), { once: true })
  }, 3000)
}
