// core/registry.js

// Mapas para acesso rápido
const adapters = new Map();
const validators = new Map();
const subtitleProviders = [];

// ===== Adapters =====
export function registerAdapter(adapter) {
  if (adapter?.id) adapters.set(adapter.id, adapter);
}
export function findAdapter(id) {
  return adapters.get(id) || null;
}

// ===== Validadores =====
export function registerValidator(name, validator) {
  if (name && validator) validators.set(name, validator);
}

/**
 * Obtém o validador mais adequado para um stream
 * 1. Procura por canValidate() nos validadores registados
 * 2. Se não encontrar, usa mapeamento por tipo
 * 3. Se ainda assim não encontrar, devolve generic
 */
export function getValidatorFor(stream) {
  // 1️⃣ Tentar validadores com canValidate()
  for (const validator of validators.values()) {
    if (typeof validator.canValidate === 'function' && validator.canValidate(stream)) {
      return validator;
    }
  }

  // 2️⃣ Mapeamento por tipo
  const type = String(stream?.type || '').toLowerCase();
  if (['tv', 'vod', 'iptv', 'live'].includes(type) && validators.has('hls')) {
    return validators.get('hls');
  }
  if (['radio', 'audio'].includes(type) && validators.has('icy')) {
    return validators.get('icy');
  }

  // 3️⃣ Fallback
  return validators.get('generic') || null;
}

// ===== Providers de legendas =====
export function registerSubtitleProvider(provider) {
  if (provider && !subtitleProviders.includes(provider)) {
    subtitleProviders.push(provider);
  }
}
export function getSubtitleProviders() {
  return [...subtitleProviders];
}
