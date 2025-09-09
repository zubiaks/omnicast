// assets/js/modules/configManager.js

/**
 * Configuração padrão da aplicação.
 * Pode incluir aqui defaults adicionais (p.ex.: thresholds, API base).
 */
export const DEFAULT_CONFIG = {
  sonsAtivos: { critical: true, warning: true, info: true },
  updateAlert: true,
  tema: 'dark',
  autoRefresh: true,
  apiBase: window.OMNICAST_API || 'http://localhost:8081',
  latenciaThreshold: 500      // ms para alerta de warning
};

/**
 * Carrega a configuração do localStorage.
 * Em caso de erro ou key inexistente, retorna DEFAULT_CONFIG.
 */
export function loadConfig() {
  try {
    const raw = localStorage.getItem('configApp');
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    console.error('⚠️ Erro ao carregar configApp:', err);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Persiste a configuração no localStorage.
 * @param {Object} config — Objeto de configuração completo.
 */
export function saveConfig(config) {
  try {
    localStorage.setItem('configApp', JSON.stringify(config));
  } catch (err) {
    console.error('⚠️ Erro ao salvar configApp:', err);
  }
}
