/**
 * Entry-point do módulo de mídia:
 * reexporta inicialização do player, controles de player e gestão de favoritos.
 */
export * from './streamPlayer.js'
export * from './playerControls.js'
export * from './favorites.js'

import * as streamPlayer from './streamPlayer.js'
import * as playerControls from './playerControls.js'
import * as favorites from './favorites.js'

/** Export agregado */
export const mediaModule = {
  ...streamPlayer,
  ...playerControls,
  ...favorites
}
