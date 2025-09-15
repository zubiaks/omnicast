// core/validators/icy.js
import fetch from 'node-fetch';

export const icyValidator = {
  id: 'icy@1.1.0',

  canValidate: (stream) => {
    const url = stream?.url?.toLowerCase() || '';
    return url.endsWith('.mp3') || url.startsWith('http');
  },

  /**
   * Valida um stream ICY
   * @param {object} stream - { name: string, url: string }
   * @param {object} config - { timeoutMs?: number, testMode?: boolean }
   */
  async validate(stream, config = {}) {
    const { timeoutMs = 5000, testMode = false } = config;

    if (!stream?.url) {
      return { ok: false, status: 'offline', score: 0, reason: 'URL ausente' };
    }

    console.log(`[ICY Validator] Validando ${stream.name || '(sem nome)'}`);

    if (testMode) {
      return { ok: true, status: 'online', score: 90, icyMeta: { StreamTitle: 'Demo Title' } };
    }

    try {
      const startTime = Date.now();
      const res = await fetch(stream.url, {
        method: 'GET',
        headers: { 'Icy-MetaData': '1' },
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!res.ok) {
        return { ok: false, status: 'offline', score: 0, reason: `HTTP ${res.status}` };
      }

      const responseTime = Date.now() - startTime;
      let score = 100;
      if (responseTime > 2000) score = 80;
      if (responseTime > 4000) score = 60;

      const icyMeta = {};
      for (const [key, value] of res.headers) {
        if (key.toLowerCase().startsWith('icy-')) {
          icyMeta[key] = value;
        }
      }

      return { ok: true, status: 'online', score, responseTime, icyMeta };

    } catch (err) {
      return { ok: false, status: 'offline', score: 0, reason: err.message };
    }
  }
};
