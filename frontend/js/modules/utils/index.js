/**
 * Ponto único de import para utilitários genéricos.
 * Reexporta todas as funções e classes úteis:
 * - eventBus: Pub/Sub desacoplado baseado em EventTarget
 * - normalize, escapeHtml, escapeRegExp, buildCandidates, applyImgFallback
 * - renderSVG, clearSVG, preloadSVG (svgRenderer.js)
 * - validações: isUrl, isNonEmptyString, isPositiveInt, etc. (validator-core.js)
 * - debounce e throttle para controlar frequência de invocações
 */

export * from './eventBus.js'
export * from './ocUtils.js'
export * from './svgRenderer.js'
export * from './validator-core.js'
export { debounce, throttle } from './debounce.js'

// --- Export agregado ---
import * as eventBus from './eventBus.js'
import * as ocUtils from './ocUtils.js'
import * as svgRenderer from './svgRenderer.js'
import * as validator from './validator-core.js'
import { debounce, throttle } from './debounce.js'

export const utilsModule = {
  ...eventBus,
  ...ocUtils,
  ...svgRenderer,
  ...validator,
  debounce,
  throttle
}

export default utilsModule
