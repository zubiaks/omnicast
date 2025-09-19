/**
 * Módulo central de configurações:
 * - configManager: API para ler/escrever configurações persistentes
 * - configUI: componente de interface para ajustes de configurações
 */
export * from './configManager.js'
export * from './configUI.js'

import * as configManager from './configManager.js'
import * as configUI from './configUI.js'

/** Export agregado */
export const configModule = {
  ...configManager,
  ...configUI,
}

export default configModule
