// assets/js/modules/themeManager.js
import { loadConfig, updateConfig } from './configManager.js';

/**
 * Define o atributo `data-theme` no <html> e atualiza classes auxiliares.
 *
 * @param {'light'|'dark'} theme
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Inicializa o tema com base na configuração persistida.
 * Chame antes do render para evitar flash de tema incorreto.
 */
export function initTheme() {
  const { tema } = loadConfig();
  applyTheme(tema);
}

/**
 * Alterna entre 'dark' e 'light', persiste no localStorage
 * e re-aplica o tema imediatamente.
 */
export function toggleTheme() {
  const { tema } = loadConfig();
  const next = tema === 'dark' ? 'light' : 'dark';
  updateConfig('tema', next);
  applyTheme(next);

  // Notifica outros módulos que o tema mudou
  document.dispatchEvent(
    new CustomEvent('configChanged', { detail: { tema: next } })
  );
}
