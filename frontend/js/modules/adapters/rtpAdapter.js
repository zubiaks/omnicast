// frontend/js/modules/adapters/rtpAdapter.js

import { configManager } from '@modules/config/configManager.js'
import { eventBus }      from '@modules/utils/eventBus.js'

/**
 * Busca a lista de streams da API RTP e normaliza para o formato interno.
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   url: string,
 *   type: string,
 *   logo: string
 * }>>}
 * @throws {Error} Se a URL não estiver configurada, resposta HTTP falhar ou payload inesperado
 */
export async function fetchRTP() {
  const apiUrl = configManager.get('rtpApiUrl')
  const token  = configManager.get('rtpApiToken')

  if (!apiUrl) {
    const err = new Error('rtpAdapter: RTP API URL não configurada')
    eventBus.emit('data:error', { source: 'rtpAdapter', error: err })
    throw err
  }

  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const response = await fetch(apiUrl, { headers, cache: 'no-store' })
  if (!response.ok) {
    const err = new Error(`rtpAdapter: HTTP ${response.status} – ${response.statusText}`)
    eventBus.emit('data:error', { source: 'rtpAdapter', error: err })
    throw err
  }

  const payload = await response.json()
  if (!Array.isArray(payload.streams)) {
    const err = new Error('rtpAdapter: payload.streams não é um array')
    eventBus.emit('data:error', { source: 'rtpAdapter', error: err })
    throw err
  }

  return payload.streams.map((s, idx) => ({
    id:   s.id   || `rtp-${idx}`,
    name: s.title || `RTP ${idx + 1}`,
    url:  s.url   || '',
    type: 'iptv',
    logo: s.logo  || ''
  }))
}
