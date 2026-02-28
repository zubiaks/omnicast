// web/js/utils/analytics.js

/**
 * Central de telemetria que usa Beacon API + fallback fetch
 */
export default {
  track(eventName, payload = {}) {
    const data = {
      event: eventName,
      timestamp: Date.now(),
      route: location.hash || location.pathname,
      ...payload
    }
    const body = JSON.stringify(data)

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics', blob)
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      }).catch(err => console.warn('[Analytics] falha no fallback:', err))
    }
  }
}
