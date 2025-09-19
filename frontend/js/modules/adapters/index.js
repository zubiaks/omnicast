// frontend/js/modules/adapters/index.js

import rtpAdapter from './rtpAdapter.js'
// futuros imports:
// import hlsAdapter from './hlsAdapter.js'
// import dashAdapter from './dashAdapter.js'

import { eventBus } from '@modules/utils/eventBus.js'

/** @typedef {Object} PlayerAdapter
 *  @property {(url: string, options?: object) => Promise<void>} connect
 *  @property {() => void} play
 *  @property {() => void} stop
 *  @property {(cb: (err: Error) => void) => () => void} onError
 *  @property {() => void} [destroy]
 */

/** Mapa dos adapters disponíveis */
export const adapters = {
  rtp: rtpAdapter,
  // hls: hlsAdapter,
  // dash: dashAdapter
}

/** Retorna um adapter pela key */
export function getAdapter(name) {
  const adapter = adapters[name]
  if (!adapter) {
    const error = new Error(`Adapter "${name}" não encontrado`)
    console.error('[adapters]', error)
    eventBus.emit('adapter:error', { name, error })
    return adapters.rtp
  }
  return adapter
}

/** Export agregado */
export const adaptersManager = {
  adapters,
  getAdapter
}

export default adaptersManager
