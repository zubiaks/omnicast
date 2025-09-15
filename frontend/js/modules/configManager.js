// assets/js/modules/configManager.js

/**
 * Chave usada no localStorage
 * @constant {string}
 */
const STORAGE_KEY = 'omniConfig';

/**
 * Configuração padrão da aplicação.
 * Adicione aqui todas as chaves que deseja persistir.
 */
const DEFAULT_CONFIG = {
  tema: 'light',             // 'light' | 'dark'
  viewmode: 'grid',          // 'grid' | 'list'
  volume: 1,                 // 0.0 – 1.0
  sonsAtivos: {              // quais sons estão ativos
    critical: true,
    warning: true,
    info: true
  }
};

/**
 * Faz merge entre a configuração carregada e os defaults,
 * garantindo que nenhuma chave fique faltando.
 *
 * @param {object} loaded
 * @returns {object}
 */
function normalizeConfig(loaded) {
  if (typeof loaded !== 'object' || loaded === null) {
    loaded = {};
  }

  // Merge superficial
  const cfg = {
    ...DEFAULT_CONFIG,
    ...loaded,
    sonsAtivos: {
      ...DEFAULT_CONFIG.sonsAtivos,
      ...(typeof loaded.sonsAtivos === 'object' ? loaded.sonsAtivos : {})
    }
  };

  // Garantir tipos corretos
  cfg.tema = typeof cfg.tema === 'string' ? cfg.tema : DEFAULT_CONFIG.tema;
  cfg.viewmode =
    cfg.viewmode === 'grid' || cfg.viewmode === 'list'
      ? cfg.viewmode
      : DEFAULT_CONFIG.viewmode;
  cfg.volume =
    typeof cfg.volume === 'number' && cfg.volume >= 0 && cfg.volume <= 1
      ? cfg.volume
      : DEFAULT_CONFIG.volume;

  Object.keys(DEFAULT_CONFIG.sonsAtivos).forEach(key => {
    cfg.sonsAtivos[key] =
      typeof cfg.sonsAtivos[key] === 'boolean'
        ? cfg.sonsAtivos[key]
        : DEFAULT_CONFIG.sonsAtivos[key];
  });

  return cfg;
}

/**
 * Carrega a configuração do localStorage.
 * Se não existir ou estiver inválida, retorna DEFAULT_CONFIG.
 *
 * @returns {object}
 */
export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return normalizeConfig(parsed);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Persiste toda a configuração no localStorage.
 *
 * @param {object} cfg
 */
function saveConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.warn('configManager: falha ao salvar config', err);
  }
}

/**
 * Atualiza apenas uma chave da configuração e salva.
 *
 * @param {string} key
 * @param {*} value
 * @returns {object} Configuração atualizada
 */
export function updateConfig(key, value) {
  const cfg = loadConfig();

  if (key === 'sonsAtivos' && typeof value === 'object') {
    cfg.sonsAtivos = {
      ...DEFAULT_CONFIG.sonsAtivos,
      ...value
    };
  } else if (key in DEFAULT_CONFIG) {
    cfg[key] = value;
  } else {
    console.warn(`configManager: chave desconhecida "${key}"`);
    return cfg;
  }

  saveConfig(cfg);
  return cfg;
}

/**
 * Reseta toda a configuração ao padrão e salva.
 *
 * @returns {object} DEFAULT_CONFIG
 */
export function resetConfig() {
  saveConfig(DEFAULT_CONFIG);
  return { ...DEFAULT_CONFIG };
}

/**
 * Reseta apenas a chave especificada para o valor padrão.
 *
 * @param {string} key
 * @returns {object} Configuração após o reset parcial
 */
export function resetConfigKey(key) {
  const cfg = loadConfig();

  if (key === 'sonsAtivos') {
    cfg.sonsAtivos = { ...DEFAULT_CONFIG.sonsAtivos };
  } else if (key in DEFAULT_CONFIG) {
    cfg[key] = DEFAULT_CONFIG[key];
  } else {
    console.warn(`configManager: não há default para chave "${key}"`);
    return cfg;
  }

  saveConfig(cfg);
  return cfg;
}
