// frontend/js/modules/config/configManager.js

import { eventBus } from '@modules/utils/eventBus.js'

/** Chave de armazenamento no localStorage */
const STORAGE_KEY = 'oc:config'

/** Eventos emitidos pelo configManager */
export const CONFIG_CHANGE_EVENT = 'config:changed'
export const CONFIG_RESET_EVENT  = 'config:reset'

/** Configurações iniciais e defaults imutáveis */
const DEFAULT_CONFIG = Object.freeze({
  tema:           'light',
  viewmode:       'grid',
  validateStreams: true,
  volume:         1,
  sonsAtivos: Object.freeze({
    critical: true,
    warning:  true,
    info:     true
  }),
  rtpApiUrl:      '',
  rtpApiToken:    '',
  iptvUrl:        '',
  vodApiUrl:      '',
  radioApiUrl:    '',
  webcamsApiUrl:  '',
  autoRefresh:    false,
  updateAlert:    true,
  refreshIntervalMs: 300000,
  statusPollingMs:   60000,
  radioRefreshMs:    30000,
  playerMaxRetries:  2
})

/** Normaliza um objeto cru, aplicando defaults e validando tipos/enums */
function normalizeConfig(raw) {
  const loaded = (raw && typeof raw === 'object') ? raw : {}
  const cfg = {
    ...DEFAULT_CONFIG,
    ...loaded,
    sonsAtivos: {
      ...DEFAULT_CONFIG.sonsAtivos,
      ...(loaded.sonsAtivos || {})
    }
  }

  if (!['light', 'dark'].includes(cfg.tema)) cfg.tema = DEFAULT_CONFIG.tema
  if (!['grid', 'list'].includes(cfg.viewmode)) cfg.viewmode = DEFAULT_CONFIG.viewmode

  cfg.validateStreams = typeof cfg.validateStreams === 'boolean' ? cfg.validateStreams : DEFAULT_CONFIG.validateStreams
  cfg.autoRefresh     = typeof cfg.autoRefresh === 'boolean' ? cfg.autoRefresh : DEFAULT_CONFIG.autoRefresh
  cfg.updateAlert     = typeof cfg.updateAlert === 'boolean' ? cfg.updateAlert : DEFAULT_CONFIG.updateAlert

  if (typeof cfg.volume !== 'number' || cfg.volume < 0 || cfg.volume > 1) {
    cfg.volume = DEFAULT_CONFIG.volume
  }

  ;['rtpApiUrl','rtpApiToken','iptvUrl','vodApiUrl','radioApiUrl','webcamsApiUrl']
    .forEach(key => { if (typeof cfg[key] !== 'string') cfg[key] = DEFAULT_CONFIG[key] })

  ;['refreshIntervalMs','statusPollingMs','radioRefreshMs','playerMaxRetries']
    .forEach(key => { cfg[key] = Number.isFinite(cfg[key]) ? cfg[key] : DEFAULT_CONFIG[key] })

  return cfg
}

/** Carrega e retorna a configuração normalizada do localStorage */
export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return normalizeConfig(parsed)
  } catch {
    console.warn('[configManager] erro ao ler config, usando defaults')
    return normalizeConfig(null)
  }
}

/** Persiste uma chave na configuração e emite evento */
export function updateConfig(key, value) {
  const current = loadConfig()

  if (key === 'sonsAtivos' && typeof value === 'object') {
    current.sonsAtivos = { ...DEFAULT_CONFIG.sonsAtivos, ...value }
  } else if (key in DEFAULT_CONFIG) {
    current[key] = value
  } else {
    console.warn(`[configManager] chave desconhecida: "${key}"`)
    return current
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch (err) {
    console.warn('[configManager] falha ao salvar config', err)
  }

  eventBus.emit(CONFIG_CHANGE_EVENT, { key, value, config: current })
  return current
}

/** Restaura toda a config ao default */
export function resetConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG))
  } catch (err) {
    console.warn('[configManager] falha ao resetar config', err)
  }

  eventBus.emit(CONFIG_RESET_EVENT, { config: DEFAULT_CONFIG })
  return DEFAULT_CONFIG
}

/** Restaura apenas uma chave ao default */
export function resetConfigKey(key) {
  const current = loadConfig()

  if (key === 'sonsAtivos') {
    current.sonsAtivos = { ...DEFAULT_CONFIG.sonsAtivos }
  } else if (key in DEFAULT_CONFIG) {
    current[key] = DEFAULT_CONFIG[key]
  } else {
    console.warn(`[configManager] sem default para chave "${key}"`)
    return current
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch (err) {
    console.warn('[configManager] falha ao salvar config', err)
  }

  const value = current[key]
  eventBus.emit(CONFIG_CHANGE_EVENT, { key, value, config: current })
  return current
}

/** Novo método: obtém uma chave da configuração atual */
export function get(key) {
  const current = loadConfig()
  return current[key]
}

/** Export agregado para compatibilidade */
export const configManager = {
  loadConfig,
  updateConfig,
  resetConfig,
  resetConfigKey,
  get, // 👈 agora disponível
  CONFIG_CHANGE_EVENT,
  CONFIG_RESET_EVENT
}
