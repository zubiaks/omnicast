/**
 * Entry-point do módulo de listagem:
 * reexporta controlador e view para facilitar imports.
 */
export * from './listController.js'
export * from './listView.js'

import * as listController from './listController.js'
import * as listView from './listView.js'

/** Export agregado */
export const listModule = {
  ...listController,
  ...listView
}

export default listModule
