// assets/js/modules/displaySettings.js
import { loadConfig, updateConfig } from './modules/configManager.js';

/**
 * Inicializa dropdown de tema e modo de exibição no header.
 *
 * @param {Object} [options]
 * @param {string} [options.buttonSelector='#display-settings']
 * @param {string} [options.menuSelector='#display-menu']
 * @param {string} [options.themeLabelSelector='#theme-label']
 * @param {string} [options.viewLabelSelector='#viewmode-label']
 */
export function initDisplaySettings({
  buttonSelector      = '#display-settings',
  menuSelector        = '#display-menu',
  themeLabelSelector  = '#theme-label',
  viewLabelSelector   = '#viewmode-label'
} = {}) {
  const cfg       = loadConfig();
  const btn       = document.querySelector(buttonSelector);
  const menu      = document.querySelector(menuSelector);
  const themeLab  = document.querySelector(themeLabelSelector);
  const viewLab   = document.querySelector(viewLabelSelector);

  if (!btn || !menu) {
    console.warn('[displaySettings] Elementos não encontrados.');
    return;
  }

  // Helpers
  const viewModes = ['', 'compact', 'cinema'];
  const labels = {
    tema:    { dark: 'Escuro', light: 'Claro' },
    viewmode:{ '': 'Normal', compact: 'Compacto', cinema: 'Cinema' }
  };

  function applyInitial() {
    // Tema
    const tema = cfg.tema || 'dark';
    document.documentElement.dataset.theme = tema;
    if (themeLab) themeLab.textContent = labels.tema[tema];

    // View mode
    const vm = cfg.viewmode || '';
    document.body.classList.remove('compact', 'cinema');
    if (vm) document.body.classList.add(vm);
    if (viewLab) viewLab.textContent = labels.viewmode[vm];
  }

  function closeMenu() {
    menu.classList.remove('show');
    btn.setAttribute('aria-expanded', 'false');
  }

  // Alterna tema e persiste no config
  function onToggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next    = current === 'dark' ? 'light' : 'dark';
    updateConfig({ tema: next });
    document.documentElement.dataset.theme = next;
    if (themeLab) themeLab.textContent = labels.tema[next];
    document.dispatchEvent(new CustomEvent('oc:theme-changed', {
      detail: labels.tema[next]
    }));
  }

  // Alterna viewmode no ciclo ['', 'compact', 'cinema']
  function onToggleViewMode() {
    const current = cfg.viewmode || '';
    const idx     = viewModes.indexOf(current);
    const next    = viewModes[(idx + 1) % viewModes.length];
    updateConfig({ viewmode: next });
    document.body.classList.remove('compact', 'cinema');
    if (next) document.body.classList.add(next);
    if (viewLab) viewLab.textContent = labels.viewmode[next];
    document.dispatchEvent(new CustomEvent('oc:viewmode-changed', {
      detail: labels.viewmode[next]
    }));
  }

  // Abre/fecha o menu
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('show');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  // Fecha ao clicar fora ou ESC
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      closeMenu();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('show')) {
      closeMenu();
      btn.focus();
    }
  });

  // Delegação de ações no menu
  menu.addEventListener('click', e => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    const action = item.dataset.action;
    if (action === 'theme')    onToggleTheme();
    if (action === 'viewmode') onToggleViewMode();
    closeMenu();
    btn.focus();
  });

  applyInitial();
}
