// assets/js/modules/configUI.js
import {
  loadConfig,
  updateConfig,
  resetConfig,
  resetConfigKey
} from './configManager.js';
import { applyTheme } from './themeManager.js';

document.addEventListener('DOMContentLoaded', () => {
  const cfg = loadConfig();
  applyTheme(cfg.tema);

  const emitChange = detail =>
    window.dispatchEvent(new CustomEvent('configChanged', { detail }));

  const bind = (selector, fn) =>
    document.querySelectorAll(selector).forEach(el => el.addEventListener('change', () => fn(el)));

  // Inicialização dos campos gerais
  document.querySelectorAll('[data-config]').forEach(el => {
    const key = el.dataset.config;
    if (!(key in cfg)) return;
    if (el.type === 'checkbox') el.checked = Boolean(cfg[key]);
    else if (el.type === 'number') el.value = Number(cfg[key]);
    else el.value = cfg[key];
  });

  // Inicialização dos checkboxes de som
  document.querySelectorAll('[data-config-son]').forEach(el => {
    const sk = el.dataset.configSon;
    el.checked = Boolean(cfg.sonsAtivos?.[sk]);
  });

  // Atualização dos campos gerais
  bind('[data-config]', el => {
    const key = el.dataset.config;
    let val = el.value;
    if (el.type === 'checkbox') val = el.checked;
    else if (el.type === 'number') val = Number(val);

    updateConfig(key, val);
    emitChange({ [key]: val });
    if (key === 'tema') applyTheme(val);
  });

  // Atualização dos sons
  bind('[data-config-son]', el => {
    const sk = el.dataset.configSon;
    const current = loadConfig();
    current.sonsAtivos = { ...current.sonsAtivos, [sk]: el.checked };
    updateConfig('sonsAtivos', current.sonsAtivos);
    emitChange({ sonsAtivos: { [sk]: el.checked } });
  });

  // Reset total
  document.getElementById('btn-reset-config')?.addEventListener('click', () => {
    if (confirm('Repor todas as configurações para o padrão?')) {
      resetConfig();
      location.reload();
    }
  });

  // Reset parcial
  document.querySelectorAll('[data-reset-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.resetKey;
      resetConfigKey(key);
      if (key === 'tema') applyTheme(loadConfig().tema);

      // Repopula apenas o campo alterado
      document.querySelectorAll(`[data-config="${key}"]`).forEach(el => {
        if (el.type === 'checkbox') el.checked = loadConfig()[key];
        else el.value = loadConfig()[key];
      });
    });
  });
});
