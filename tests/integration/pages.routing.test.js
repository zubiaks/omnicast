/** @jest-environment jsdom */
import { jest } from '@jest/globals'
import path from 'path'
import { pathToFileURL } from 'url'

const ROOT = path.resolve('./frontend/js/modules')
const PAGES_DIR = path.join(ROOT, 'pages')
const PAGES_INDEX = path.join(PAGES_DIR, 'index.js')

const PAGE_FILES = [
  'home.js',
  'iptv.js',
  'vod.js',
  'radio.js',
  'webcams.js',
  'favoritos.js',
  'dashboard.js',
  'configPage.js',
  'help.js',
]

// Polyfill leve para HashChangeEvent (apenas se o ambiente não expuser)
if (typeof window !== 'undefined' && typeof window.HashChangeEvent === 'undefined') {
  class HashChangeEvent extends Event {
    constructor(type, init) { super(type, init) }
  }
  // @ts-ignore
  window.HashChangeEvent = HashChangeEvent
}

function mockAllPageControllers(overrides = {}) {
  for (const file of PAGE_FILES) {
    const isOverridden = Object.prototype.hasOwnProperty.call(overrides, file)
    const impl = isOverridden ? overrides[file] : jest.fn()
    jest.unstable_mockModule(
      pathToFileURL(path.join(PAGES_DIR, file)).href,
      () => ({ __esModule: true, default: impl })
    )
  }
}

function resetHash() {
  const base = window.location.href.split('#')[0]
  window.history.replaceState(null, '', base)
}

describe('pages/index roteamento + telemetria (happy path e fallback)', () => {
  beforeEach(() => {
    jest.resetModules()
    resetHash()
  })

  test('navegação inicial chama initHome e emite ROUTE_CHANGE_EVENT ok=true', async () => {
    mockAllPageControllers()

    const { eventBus } = await import('@modules/utils/eventBus.js')
    const emitSpy = jest.spyOn(eventBus, 'emit')

    const domEventSpy = jest.fn()
    window.addEventListener('route:change', domEventSpy)

    const pages = await import(pathToFileURL(PAGES_INDEX).href)
    const { initPages, ROUTE_CHANGE_EVENT } = pages

    const cleanup = initPages()

    const { default: initHome } = await import(pathToFileURL(path.join(PAGES_DIR, 'home.js')).href)
    expect(initHome).toHaveBeenCalledTimes(1)
    expect(emitSpy).toHaveBeenCalledWith(
      ROUTE_CHANGE_EVENT,
      expect.objectContaining({ hash: '', ok: true })
    )
    expect(domEventSpy).toHaveBeenCalledTimes(1)
    expect(domEventSpy.mock.calls[0][0].type).toBe('route:change')

    cleanup()
    window.removeEventListener('route:change', domEventSpy)
    emitSpy.mockRestore()
  })

  test('navegação para #vod chama initVod e emite eventos', async () => {
    mockAllPageControllers()

    const { eventBus } = await import('@modules/utils/eventBus.js')
    const emitSpy = jest.spyOn(eventBus, 'emit')

    const domEventSpy = jest.fn()
    window.addEventListener('route:change', domEventSpy)

    const pages = await import(pathToFileURL(PAGES_INDEX).href)
    const { initPages, ROUTE_CHANGE_EVENT } = pages
    const cleanup = initPages()

    window.location.hash = '#vod'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    const { default: initVod } = await import(pathToFileURL(path.join(PAGES_DIR, 'vod.js')).href)
    expect(initVod).toHaveBeenCalledTimes(1)
    expect(emitSpy).toHaveBeenCalledWith(
      ROUTE_CHANGE_EVENT,
      expect.objectContaining({ hash: '#vod', ok: true })
    )
    const lastEvent = domEventSpy.mock.calls.at(-1)[0]
    expect(lastEvent.type).toBe('route:change')

    cleanup()
    window.removeEventListener('route:change', domEventSpy)
    emitSpy.mockRestore()
  })

  test('rota desconhecida cai no controller default (home) e emite ok=true', async () => {
    mockAllPageControllers()

    const { eventBus } = await import('@modules/utils/eventBus.js')
    const emitSpy = jest.spyOn(eventBus, 'emit')

    const pages = await import(pathToFileURL(PAGES_INDEX).href)
    const { initPages, ROUTE_CHANGE_EVENT } = pages
    const cleanup = initPages()

    window.location.hash = '#rota-inexistente'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    const { default: initHome } = await import(pathToFileURL(path.join(PAGES_DIR, 'home.js')).href)
    expect(initHome).toHaveBeenCalledTimes(2) // inicial + default desconhecido

    expect(emitSpy).toHaveBeenCalledWith(
      ROUTE_CHANGE_EVENT,
      expect.objectContaining({ hash: '#rota-inexistente', ok: true })
    )

    cleanup()
    emitSpy.mockRestore()
  })

  test('erro no controller (#radio) emite ok=false e faz fallback home ok=true', async () => {
    jest.resetModules()
    resetHash()

    mockAllPageControllers({
      'radio.js': jest.fn(() => { throw new Error('boom') }),
    })

    const { eventBus } = await import('@modules/utils/eventBus.js')
    const emitSpy = jest.spyOn(eventBus, 'emit')

    const pages = await import(pathToFileURL(PAGES_INDEX).href)
    const { initPages, ROUTE_CHANGE_EVENT } = pages
    const cleanup = initPages()

    window.location.hash = '#radio'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    const { default: initHome } = await import(pathToFileURL(path.join(PAGES_DIR, 'home.js')).href)
    const { default: initRadio } = await import(pathToFileURL(path.join(PAGES_DIR, 'radio.js')).href)

    expect(initRadio).toHaveBeenCalledTimes(1)
    expect(initHome).toHaveBeenCalledTimes(2) // inicial + fallback

    expect(emitSpy).toHaveBeenCalledWith(
      ROUTE_CHANGE_EVENT,
      expect.objectContaining({ hash: '#radio', ok: false })
    )
    expect(emitSpy).toHaveBeenCalledWith(
      ROUTE_CHANGE_EVENT,
      expect.objectContaining({ hash: '#home', ok: true, fallback: true })
    )

    cleanup()
    emitSpy.mockRestore()
  })
})

describe('pages/index edge cases', () => {
  beforeEach(() => {
    jest.resetModules()
    resetHash()
  })

  test('normalizeHash trata "#home?x=1" como "#home"', async () => {
    mockAllPageControllers()

    const pages = await import(pathToFileURL(PAGES_INDEX).href)
    const { initPages } = pages
    const cleanup = initPages()

    window.location.hash = '#home?x=1'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    const { default: initHome } = await import(pathToFileURL(path.join(PAGES_DIR, 'home.js')).href)
    expect(initHome).toHaveBeenCalledTimes(2) // inicial + normalizado

    cleanup()
  })

  test('mesmo hash normalizado não re-renderiza', async () => {
    mockAllPageControllers()

    const pages = await import(pathToFileURL(PAGES_INDEX).href)
    const { initPages } = pages
    const cleanup = initPages()

    const { default: initHome } = await import(pathToFileURL(path.join(PAGES_DIR, 'home.js')).href)
    expect(initHome).toHaveBeenCalledTimes(1)

    window.location.hash = '#home'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    window.dispatchEvent(new HashChangeEvent('hashchange')) // repetido

    expect(initHome).toHaveBeenCalledTimes(2)

    cleanup()
  })

  test('cleanup remove o listener de hashchange', async () => {
    mockAllPageControllers()

    const pages = await import(pathToFileURL(PAGES_INDEX).href)
    const { initPages } = pages
    const cleanup = initPages()

    cleanup()

    const { default: initVod } = await import(pathToFileURL(path.join(PAGES_DIR, 'vod.js')).href)
    window.location.hash = '#vod'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(initVod).not.toHaveBeenCalled()
  })
})
