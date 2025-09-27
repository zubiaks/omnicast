// js/hls-loader.js
let HlsConstructor

export async function loadHls() {
  if (!HlsConstructor) {
    const mod = await import('hls.js')
    HlsConstructor = mod.default
  }
  return HlsConstructor
}
