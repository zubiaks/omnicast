// frontend/js/modules/dataService.js

import { configManager } from '@modules/config'
import { eventBus }      from '@modules/utils'

// Configurações padrão (podem ser sobrescritas em configManager)
const DEFAULT_MASTER_LIST_PATH = '/assets/data/master_list.json'
const DEFAULT_FALLBACK_CACHE_DURATION = configManager.get('cacheTtlMs') || 600000 // 10 min
const DEFAULT_RETRY_ATTEMPTS = configManager.get('retryAttempts') || 3
const DEFAULT_RETRY_BACKOFF = configManager.get('retryBackoffMs')  || 500

/**
 * Dorme por um intervalo (ms).
 * @param {number} ms — Milissegundos a aguardar.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Tenta buscar recurso via fetch com retries exponenciais e timeout.
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {number} [attempts=DEFAULT_RETRY_ATTEMPTS]
 * @param {number} [backoff=DEFAULT_RETRY_BACKOFF]
 * @returns {Promise<Response>}
 * @throws {Error} após esgotar tentativas ou timeout
 */
async function fetchWithRetry(url, options = {}, attempts = DEFAULT_RETRY_ATTEMPTS, backoff = DEFAULT_RETRY_BACKOFF) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const controller = new AbortController()
      const timeoutMs = configManager.get('fetchTimeoutMs') || 5000
      const timer = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ao buscar ${url}`)
      }
      return response
    } catch (err) {
      if (i === attempts) throw err
      await sleep(backoff * i)
    }
  }
}

/**
 * Cache simples em LocalStorage para fallback local.
 */
const cacheKey = key => `dataService:cache:${key}`

function readCache(key, maxAgeMs = DEFAULT_FALLBACK_CACHE_DURATION) {
  try {
    const item = JSON.parse(localStorage.getItem(cacheKey(key)) || '{}')
    if (item.timestamp && (Date.now() - item.timestamp) < maxAgeMs) {
      return item.value
    }
  } catch (_){ /* ignore */ }
  return null
}

function writeCache(key, value) {
  try {
    const payload = { timestamp: Date.now(), value }
    localStorage.setItem(cacheKey(key), JSON.stringify(payload))
  } catch (_){ /* ignore */ }
}

/**
 * Busca JSON network-first com retry/backoff; usa cache local se enabled.
 *
 * @param {string} url
 * @param {string} cacheId
 * @returns {Promise<any|null>}
 */
async function fetchJson(url, cacheId) {
  eventBus.emit('data:fetching', { url, cacheId })
  // Tenta com retry
  try {
    const response = await fetchWithRetry(url)
    const data = await response.json()
    writeCache(cacheId, data)
    eventBus.emit('data:success', { url, cacheId, data })
    return data
  } catch (networkErr) {
    // Use cache fallback
    const cached = readCache(cacheId)
    if (cached !== null) {
      eventBus.emit('data:success', { url, cacheId, data: cached, fromCache: true })
      return cached
    }
    eventBus.emit('data:error', { url, cacheId, error: networkErr })
    console.error('[dataService] fetchJson falhou para', url, networkErr)
    return null
  }
}

/**
 * Carrega e normaliza a master list de streams.
 *
 * @returns {Promise<Array<{id:string,name:string,url:string,type:string}>>}
 */
export async function loadMasterList() {
  const masterUrl = configManager.get('masterListUrl') || DEFAULT_MASTER_LIST_PATH
  const raw = await fetchJson(masterUrl, 'masterList') || []

  if (!Array.isArray(raw)) {
    console.warn('[dataService] masterList não é array, retornando vazio')
    return []
  }

  return raw.map((item, idx) => ({
    id:   String(item.id || `stream-${idx}`),
    name: String(item.name || `Canal ${idx + 1}`),
    url:  String(item.url || ''),
    type: String(item.type || 'iptv')
  }))
}
