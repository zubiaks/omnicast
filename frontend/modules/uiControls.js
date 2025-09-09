// assets/js/modules/uiControls.js

import { saveConfig } from './configManager.js';

/**
 * Liga o painel de configurações globais, botões de refresh manual e troca de tema.
 *
 * @param {Object} options
 * @param {Object} options.config           — Objeto de configuração (mutável).
 * @param {Object} options.selectors        — Referências a elementos DOM:
 *    { btnAbrirConfig, painelConfig, btnGuardarConfig, btnRefreshManual,
 *      themeRadios, toggleUpdateAlert, toggleAutoRefresh,
 *      soundCheckboxes }
 * @param {Object} options.updaterControls  — Contém { updateDashboard, startAutoRefresh, stopAutoRefresh }.
 */
export function attachUIControls({ config, selectors, updaterControls }) {
  const {
    btnAbrirConfig,
    painelConfig,
    btnGuardarConfig,
    btnRefreshManual,
    themeRadios,
    toggleUpdateAlert,
    toggleAutoRefresh,
    soundCheckboxes
  } = selectors;

  const { updateDashboard, startAutoRefresh, stopAutoRefresh } = updaterControls;

  // Aplica a configuração atual aos inputs do painel
  function applyConfigToUI() {
    // tema
    themeRadios.forEach(radio => {
      radio.checked = radio.value === config.tema;
    });
    // notificações de atualização
    toggleUpdateAlert.checked = config.updateAlert;
    // auto-refresh
    toggleAutoRefresh.checked = config.autoRefresh;
    updateManualButton();
    // sons
    soundCheckboxes.forEach(cb => {
      cb.checked = !!config.sonsAtivos[cb.dataset.som];
    });
  }

  // Mostra ou oculta botão de refresh manual
  function updateManualButton() {
    btnRefreshManual.style.display = config.autoRefresh ? 'none' : 'block';
  }

  // Alterna visibilidade do painel de configurações
  btnAbrirConfig.addEventListener('click', () => {
    const isHidden = painelConfig.style.display === 'none' || !painelConfig.style.display;
    painelConfig.style.display = isHidden ? 'block' : 'none';
    if (isHidden) applyConfigToUI();
  });

  // Guarda alterações e aplica imediatamente
  btnGuardarConfig.addEventListener('click', () => {
    // sons
    soundCheckboxes.forEach(cb => {
      config.sonsAtivos[cb.dataset.som] = cb.checked;
    });

    // notificações de atualização
    config.updateAlert = toggleUpdateAlert.checked;

    // tema
    const selectedTheme = Array.from(themeRadios).find(r => r.checked)?.value;
    if (selectedTheme && selectedTheme !== config.tema) {
      config.tema = selectedTheme;
      document.body.classList.toggle('theme-light', config.tema === 'light');
      document.body.classList.toggle('theme-dark', config.tema === 'dark');
    }

    // auto-refresh
    const auto = toggleAutoRefresh.checked;
    if (auto !== config.autoRefresh) {
      config.autoRefresh = auto;
      if (config.autoRefresh) startAutoRefresh();
      else stopAutoRefresh();
    }

    // persistir e atualizar UI
    saveConfig(config);
    updateManualButton();
    painelConfig.style.display = 'none';
  });

  // Refresh manual
  btnRefreshManual.addEventListener('click', () => {
    updateDashboard();
  });

  // Inicialização
  applyConfigToUI();
}
