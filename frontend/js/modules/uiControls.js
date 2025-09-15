// assets/js/modules/uiControls.js
import { loadConfig, updateConfig } from './configManager.js';
import { applyTheme } from './themeManager.js';

/**
 * Ativa controles de UI: painel de config, troca de tema, refresh e sons.
 *
 * @param {Object} options
 * @param {Object} options.selectors
 * @param {HTMLElement} options.selectors.btnOpenConfig
 * @param {HTMLElement} options.selectors.panelConfig
 * @param {HTMLElement} options.selectors.btnSaveConfig
 * @param {HTMLElement} options.selectors.btnManualRefresh
 * @param {NodeListOf<HTMLInputElement>} options.selectors.themeRadios
 * @param {HTMLInputElement} options.selectors.toggleUpdateAlert
 * @param {HTMLInputElement} options.selectors.toggleAutoRefresh
 * @param {NodeListOf<HTMLInputElement>} options.selectors.soundCheckboxes
 * @param {Object} options.updaterControls
 * @param {Function} options.updaterControls.updateDashboard
 * @param {Function} options.updaterControls.startAutoRefresh
 * @param {Function} options.updaterControls.stopAutoRefresh
 */
export function attachUIControls({ selectors, updaterControls }) {
  // 1. Carrega config inicial e aplica tema
  const config = loadConfig();
  applyTheme(config.tema);

  // 2. Destructura seletores e callbacks
  const {
    btnOpenConfig,
    panelConfig,
    btnSaveConfig,
    btnManualRefresh,
    themeRadios,
    toggleUpdateAlert,
    toggleAutoRefresh,
    soundCheckboxes
  } = selectors;

  const { updateDashboard, startAutoRefresh, stopAutoRefresh } = updaterControls;

  // 3. Emissor de evento unificado
  const emitChange = detail =>
    document.dispatchEvent(new CustomEvent('configChanged', { detail }));

  // 4. Atualiza o painel de UI a partir de `config`
  function refreshUI() {
    themeRadios.forEach(r => { r.checked = r.value === config.tema; });
    toggleUpdateAlert.checked = Boolean(config.updateAlert);
    toggleAutoRefresh.checked = Boolean(config.autoRefresh);
    soundCheckboxes.forEach(cb => {
      cb.checked = Boolean(config.sonsAtivos?.[cb.dataset.som]);
    });
    if (btnManualRefresh) {
      btnManualRefresh.classList.toggle('hidden', config.autoRefresh);
    }
  }

  // 5. Handlers de mudança imediata
  function onThemeChange(e) {
    const tema = e.target.value;
    if (tema === config.tema) return;
    config.tema = tema;
    updateConfig('tema', tema);
    applyTheme(tema);
    emitChange({ tema });
  }

  function onUpdateAlertChange(e) {
    config.updateAlert = e.target.checked;
    updateConfig('updateAlert', config.updateAlert);
    emitChange({ updateAlert: config.updateAlert });
  }

  function onAutoRefreshChange(e) {
    config.autoRefresh = e.target.checked;
    updateConfig('autoRefresh', config.autoRefresh);
    config.autoRefresh ? startAutoRefresh() : stopAutoRefresh();
    if (btnManualRefresh) {
      btnManualRefresh.classList.toggle('hidden', config.autoRefresh);
    }
    emitChange({ autoRefresh: config.autoRefresh });
  }

  function onSoundChange(e) {
    const key = e.target.dataset.som;
    config.sonsAtivos[key] = e.target.checked;
    updateConfig('sonsAtivos', config.sonsAtivos);
    emitChange({ sonsAtivos: { [key]: config.sonsAtivos[key] } });
  }

  // 6. Associação de eventos
  themeRadios.forEach(r => r.addEventListener('change', onThemeChange));
  toggleUpdateAlert.addEventListener('change', onUpdateAlertChange);
  toggleAutoRefresh.addEventListener('change', onAutoRefreshChange);
  soundCheckboxes.forEach(cb => cb.addEventListener('change', onSoundChange));

  btnOpenConfig?.addEventListener('click', () => {
    panelConfig?.classList.toggle('hidden');
    if (!panelConfig?.classList.contains('hidden')) {
      refreshUI();
    }
  });

  // Apenas fecha painel: as mudanças já foram salvas a cada evento
  btnSaveConfig?.addEventListener('click', () => {
    panelConfig?.classList.add('hidden');
  });

  btnManualRefresh?.addEventListener('click', () => {
    updateDashboard();
  });

  // 7. Estado inicial do painel
  refreshUI();
}
