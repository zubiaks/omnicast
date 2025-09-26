// js/utils/spinner.js

const spinnerEl = document.createElement('div')
spinnerEl.id = 'global-spinner'
spinnerEl.innerHTML = `<div class="spinner"></div>`
document.body.appendChild(spinnerEl)

export function showSpinner() {
  spinnerEl.classList.add('visible')
}

export function hideSpinner() {
  spinnerEl.classList.remove('visible')
}
