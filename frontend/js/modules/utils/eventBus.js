// frontend/js/modules/utils/eventBus.js

/**
 * EventBus para comunicação desacoplada entre módulos.
 * Baseado em EventTarget, com APIs para on, off, once e emit.
 */

const _bus = new EventTarget()

/**
 * Callback de evento do EventBus.
 * @callback EventCallback
 * @param {CustomEvent<any>} event — Evento disparado.
 */

/** EventBus API */
export const eventBus = {
  /**
   * Regista um listener para um tipo de evento.
   * @param {string} type — Nome do evento.
   * @param {EventCallback} callback — Função a chamar quando ocorrer o evento.
   * @param {AddEventListenerOptions|boolean} [options=false]
   *   Opções de listener (capture, once, passive).
   * @returns {() => void} Função para remover esse listener.
   */
  on(type, callback, options = false) {
    _bus.addEventListener(type, callback, options)
    return () => _bus.removeEventListener(type, callback, options)
  },

  /**
   * Regista um listener para um evento que será executado apenas uma vez.
   * @param {string} type — Nome do evento.
   * @param {EventCallback} callback — Função a chamar quando ocorrer o evento.
   * @param {AddEventListenerOptions|boolean} [options=false]
   *   Opções de listener. Note que `once` em options também funciona.
   * @returns {() => void} Função para remover o listener antes de disparar.
   */
  once(type, callback, options = false) {
    // Se caller já passou { once: true }, podemos delegar a EventTarget
    if (typeof options === 'object' && options.once) {
      _bus.addEventListener(type, callback, options)
      return () => _bus.removeEventListener(type, callback, options)
    }

    const wrapper = (event) => {
      callback(event)
      _bus.removeEventListener(type, wrapper, options)
    }
    _bus.addEventListener(type, wrapper, options)
    return () => _bus.removeEventListener(type, wrapper, options)
  },

  /**
   * Remove um listener específico.
   * @param {string} type — Nome do evento.
   * @param {EventCallback} callback — Função previamente registada.
   * @param {EventListenerOptions|boolean} [options=false]
   *   As mesmas opções usadas ao registrar o listener.
   */
  off(type, callback, options = false) {
    _bus.removeEventListener(type, callback, options)
  },

  /**
   * Emite um evento customizado, com detalhes opcionais.
   * @param {string} type — Nome do evento.
   * @param {any} [detail] — Dados a serem enviados no evento.
   */
  emit(type, detail = {}) {
    _bus.dispatchEvent(new CustomEvent(type, { detail }))
  }
}
