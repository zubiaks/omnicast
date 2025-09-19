// frontend/js/modules/adapters/contract.js

/**
 * @module adapters/contract
 * 
 * PlayerAdapter define o contrato que todos os adapters de streaming
 * devem implementar para interagir corretamente com o streamPlayer
 * e com os controles de reprodução.
 */

/**
 * @typedef {Object} PlayerAdapter
 * @property {(url: string, options?: object) => Promise<void>} connect
 *   Inicializa a ligação ao stream apontando para a URL fornecida.
 * @property {() => Promise<void> | void} play
 *   Inicia ou retoma a reprodução após a conexão.
 * @property {() => Promise<void> | void} stop
 *   Para imediatamente a reprodução em curso.
 * @property {(callback: (err: Error) => void) => () => void} onError
 *   Regista um callback para tratar erros de reprodução.
 *   Retorna uma função para cancelar esse listener.
 * @property {() => Promise<void> | void} destroy
 *   Opcional: libera recursos alocados (MediaSource, MediaStream, etc.).
 */

export {}; // Garante que este ficheiro seja tratado como módulo ES
