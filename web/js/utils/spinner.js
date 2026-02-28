// web/js/utils/spinner.js

// Spinner global para indicar carregamento
const spinnerEl = document.createElement('div')
spinnerEl.id = 'global-spinner'
spinnerEl.innerHTML = `<div class="spinner"></div>`
document.body.appendChild(spinnerEl)

/** Exibe o spinner global na tela. */
export function showSpinner() {
  spinnerEl.classList.add('visible')
}

/** Esconde o spinner global da tela. */
export function hideSpinner() {
  spinnerEl.classList.remove('visible')
}
