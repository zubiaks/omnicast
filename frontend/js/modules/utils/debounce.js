// frontend/js/modules/utils/debounce.js

/**
 * Cria uma função debounced que aguarda um intervalo sem chamadas
 * antes de invocar a função original.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} func            — função a ser debounced
 * @param {number} wait       — tempo em ms para esperar após a última chamada
 * @param {Object} [opts]
 * @param {boolean} [opts.leading=false]
 *   — se true, invoca na borda de início do timeout
 * @param {boolean} [opts.trailing=true]
 *   — se true, invoca na borda final do timeout
 * @returns {F & { cancel: () => void; flush: () => void }}
 *   — a função debounced com métodos para cancelar ou forçar execução
 */
export function debounce(func, wait, { leading = false, trailing = true } = {}) {
  let timerId = null
  let lastArgs = null
  let lastThis = null
  let result

  function invoke() {
    result = func.apply(lastThis, lastArgs)
    lastThis = lastArgs = null
  }

  function startTimer() {
    timerId = setTimeout(() => {
      timerId = null
      if (trailing && lastArgs) {
        invoke()
      }
    }, wait)
  }

  function debounced(...args) {
    lastArgs = args
    lastThis = this

    const shouldInvokeNow = leading && !timerId

    if (!timerId) {
      startTimer()
    }

    if (shouldInvokeNow) {
      invoke()
    }

    return result
  }

  debounced.cancel = () => {
    clearTimeout(timerId)
    timerId = lastArgs = lastThis = null
  }

  debounced.flush = () => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
      invoke()
    }
  }

  return debounced
}

/**
 * Cria uma função throttled que limita a invocação
 * da função original a no máximo uma vez a cada wait ms.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} func      — função a ser throttled
 * @param {number} wait — intervalo mínimo em ms entre invocações
 * @param {Object} [opts]
 * @param {boolean} [opts.leading=true]
 *   — se true, invoca na primeira chamada imediatamente
 * @param {boolean} [opts.trailing=true]
 *   — se true, invoca após o atraso final
 * @returns {F & { cancel: () => void; flush: () => void }}
 *   — a função throttled com métodos para cancelar ou forçar execução
 */
export function throttle(func, wait, { leading = true, trailing = true } = {}) {
  let timerId = null
  let lastArgs = null
  let lastThis = null
  let lastCallTime = 0
  let result

  function invoke() {
    lastCallTime = Date.now()
    result = func.apply(lastThis, lastArgs)
    lastThis = lastArgs = null
  }

  function startTimer(remaining) {
    timerId = setTimeout(() => {
      timerId = null
      if (trailing && lastArgs) {
        invoke()
      }
    }, remaining)
  }

  function throttled(...args) {
    const now = Date.now()
    if (!lastCallTime && leading === false) {
      lastCallTime = now
    }

    const remaining = wait - (now - lastCallTime)
    lastArgs = args
    lastThis = this

    if (remaining <= 0 || remaining > wait) {
      if (timerId) {
        clearTimeout(timerId)
        timerId = null
      }
      invoke()
    } else if (!timerId && trailing) {
      startTimer(remaining)
    }

    return result
  }

  throttled.cancel = () => {
    clearTimeout(timerId)
    timerId = lastArgs = lastThis = null
    lastCallTime = 0
  }

  throttled.flush = () => {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
      invoke()
    }
  }

  return throttled
}
