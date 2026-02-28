// web/js/hls-loader.js

/**
 * Carrega o Hls.js de forma dinâmica e garante que ele só seja importado uma vez.
 * @returns {Promise<import('hls.js').default>}
 */
let hlsPromise = null

export function loadHls() {
  if (!hlsPromise) {
    hlsPromise = import('hls.js')
      .then(mod => {
        const Hls = mod.default
        if (!Hls) {
          throw new Error('[hls-loader] módulo carregado sem export default.')
        }
        return Hls
      })
      .catch(err => {
        console.error('[hls-loader] falha ao importar hls.js:', err)
        throw err
      })
  }
  return hlsPromise
}
