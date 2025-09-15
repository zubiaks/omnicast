// assets/js/pages/configPage.js

import { loadConfig, updateConfig } from '../modules/configManager.js';
import { applyTheme }              from '../modules/themeManager.js';
import { showToast }               from '../modules/alerts.js';

/**
 * Inicializa a página de configurações globais:
 * • Tema (dark/light)
 * • Auto-refresh (on/off)
 * • Intervalo de refresh em ms
 */
export function initConfigPage({
  formSelector         = '#config-form',
  temaSelector         = '#config-tema',
  autoRefreshSelector  = '#config-autorefresh',
  intervalSelector     = '#config-refresh-interval'
} = {}) {
  const formEl      = document.querySelector(formSelector);
  const temaEl      = formEl.querySelector(temaSelector);
  const autoEl      = formEl.querySelector(autoRefreshSelector);
  const intervalEl  = formEl.querySelector(intervalSelector);

  if (!formEl || !temaEl || !autoEl || !intervalEl) {
    console.warn('[configPage] Elementos de configuração não encontrados.');
    return;
  }

  // Carrega valores iniciais do config
  const cfg = loadConfig();
  temaEl.checked    = cfg.tema === 'dark';
  autoEl.checked    = Boolean(cfg.autoRefresh);
  intervalEl.value  = cfg.refreshIntervalMs ?? 15000;

  // Feedback visual breve nos campos
  function flash(el, className) {
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), 800);
  }

  /**
   * Salva a nova configuração e dispara as reações necessárias.
   */
  function onFieldChange(key, value, el) {
    try {
      updateConfig({ [key]: value });
      if (key === 'tema') {
        applyTheme(value);
      }
      flash(el, 'field-saved');
      showToast('Configuração salva', 'success');
    } catch (err) {
      console.error('[configPage] Falha ao salvar config:', err);
      flash(el, 'field-error');
      showToast('Erro ao salvar configuração', 'error');
    }
  }

  // Listeners
  temaEl.addEventListener('change', () => {
    const tema = temaEl.checked ? 'dark' : 'light';
    onFieldChange('tema', tema, temaEl);
  });

  autoEl.addEventListener('change', () => {
    onFieldChange('autoRefresh', autoEl.checked, autoEl);
  });

  intervalEl.addEventListener('change', () => {
    const ms = Number(intervalEl.value);
    if (!Number.isFinite(ms) || ms < 1000) {
      showToast('Intervalo inválido', 'warning');
      intervalEl.value = loadConfig().refreshIntervalMs;
      return;
    }
    onFieldChange('refreshIntervalMs', ms, intervalEl);
  });
}

// Auto-bootstrap quando a página de config estiver presente
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#config-form')) {
    initConfigPage();
  }
});
