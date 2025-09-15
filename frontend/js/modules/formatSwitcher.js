// assets/js/modules/formatSwitcher.js

/**
 * Controla a proporção do container de vídeo (e UI) via classes.
 * Suporta múltiplos formatos (16x9, 4x3 etc) e persiste a escolha.
 */

import { loadConfig, updateConfig } from './configManager.js';

const FORMATS = ['16x9', '4x3', '16x10', '21x9', '9x16'];
const ROOT_ID = 'cockpit-root';
const BTN_SELECTOR = '.format-controls .btn.format';

/**
 * Aplica o formato ao container e atualiza UI e config.
 *
 * @param {string} fmt — Proporção (ex.: '16x9')
 */
function setFormat(fmt) {
  if (!FORMATS.includes(fmt)) {
    console.warn(`[formatSwitcher] Formato inválido: ${fmt}`);
    return;
  }

  const root = document.getElementById(ROOT_ID);
  if (!root) {
    console.warn(`[formatSwitcher] Elemento #${ROOT_ID} não encontrado.`);
    return;
  }

  // Atualiza classes
  root.classList.remove(...FORMATS.map(f => `is-${f}`));
  root.classList.add(`is-${fmt}`);

  // Atualiza botões
  document.querySelectorAll(BTN_SELECTOR).forEach(btn => {
    const active = btn.dataset.format === fmt;
    btn.setAttribute('aria-pressed', active);
  });

  // Persiste no config
  updateConfig('formatoInicial', fmt);
}

/**
 * Liga eventos aos botões de troca de formato.
 */
function bindFormatButtons() {
  document.querySelectorAll(BTN_SELECTOR).forEach(btn => {
    btn.addEventListener('click', () => {
      const fmt = btn.dataset.format;
      setFormat(fmt);
    });
  });
}

/**
 * Inicializa o switcher de formato.
 * Deve ser chamado após o DOM estar pronto.
 */
export function initFormatSwitcher() {
  // Liga os buttons
  bindFormatButtons();

  // Aplica formato inicial (do config ou default)
  const { formatoInicial = FORMATS[0] } = loadConfig();
  setFormat(formatoInicial);
}
