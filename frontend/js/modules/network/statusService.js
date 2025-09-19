// frontend/js/modules/network/statusService.js

import { configManager } from '@modules/config'
import { eventBus }      from '@modules/utils'

/** Evento emitido após cada tentativa de status */
export const STATUS_EVENT = 'network:status'

/** Evento emitido quando ocorre erro na tentativa de status */
export const STATUS_ERROR_EVENT = 'network:statusError'

/**
 * Resultado da verificação de status.
 *
 * @typedef {Object} StatusResult
 * @property {any|null} statusData — Payload da resposta JSON ou null.
 * @property {number} latency — Tempo de resposta em milissegundos.
 */

/**
 * Chama o endpoint de status da API, mede latência e emite evento.
 *
 * @param {string} apiUrl — URL base da API (sem barra final).
 * @param {Object} [opts]
 * @param {string} [opts.endpoint] — caminho do endpoint (default em config.statusEndpoint).
 * @param {number} [opts.timeout] — ms antes de abortar (default em config.statusTimeoutMs).
 * @returns {Promise<StatusResult>}
 */
export async function getStatus(
  apiUrl,
  { endpoint, timeout } = {}
) {
  const base       = apiUrl.replace(/\/+$/, '')
  const cfg        = configManager.getAll()
  const path       = endpoint ?? cfg.statusEndpoint ?? '/status'
  const abortAfter = Number.isFinite(timeout)
    ? timeout
    : (Number.isFinite(cfg.statusTimeoutMs) ? cfg.statusTimeoutMs : 5000)

  const url       = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const controller = new AbortController()
  const timerId    = setTimeout(() => controller.abort(), abortAfter)
  const start      = performance.now()

  let statusData = null
  let latency    = 0

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache:  'no-store'
    })
    latency = Math.round(performance.now() - start)
    clearTimeout(timerId)

    if (response.ok) {
      statusData = await response.json()
    } else {
      console.warn(`[statusService] HTTP ${response.status} – ${response.statusText}`)
    }

    eventBus.emit(STATUS_EVENT, { url, statusData, latency })
  } catch (err) {
    latency = Math.round(performance.now() - start)
    clearTimeout(timerId)

    const isAbort = err.name === 'AbortError'
    console[isAbort ? 'warn' : 'error'](
      `[statusService] ${isAbort ? 'timeout' : 'erro'}`, err
    )
    eventBus.emit(STATUS_ERROR_EVENT, { url, error: err, latency })
  }

  return { statusData, latency }
}

/**
 * Inicia polling periódico de status.
 *
 * @param {string} apiUrl — URL base da API.
 * @param {Object} [opts]
 * @param {number} [opts.intervalMs] — Intervalo entre chamadas (default em config.statusPollIntervalMs).
 * @param {string} [opts.endpoint]   — Caminho customizado do endpoint.
 * @param {number} [opts.timeout]    — Timeout customizado para cada chamada.
 * @returns {() => void} — Função para parar o polling.
 */
export function startStatusPolling(
  apiUrl,
  { intervalMs, endpoint, timeout } = {}
) {
  const cfg        = configManager.getAll()
  const interval   = Number.isFinite(intervalMs)
    ? intervalMs
    : (Number.isFinite(cfg.statusPollIntervalMs) ? cfg.statusPollIntervalMs : 30000)

  const poll = () => {
    getStatus(apiUrl, { endpoint, timeout })
  }

  // Primeira chamada imediata
  poll()
  const id = setInterval(poll, interval)

  return () => clearInterval(id)
}
