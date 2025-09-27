// js/utils/spinner.js

// cria um spinner global e adiciona ao body
const spinnerEl = document.createElement('div')
spinnerEl.id = 'global-spinner'
spinnerEl.innerHTML = `<div class="spinner"></div>`
document.body.appendChild(spinnerEl)

/**
 * Exibe o spinner na tela.
 */
export function showSpinner() {
  spinnerEl.classList.add('visible')
}

/**
 * Esconde o spinner da tela.
 */
export function hideSpinner() {
  spinnerEl.classList.remove('visible')
}
