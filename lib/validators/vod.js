// core/validators/vod.js
import fetch from 'node-fetch';

export const vodValidator = {
  id: 'vod@1.1.0',

  canValidate: (stream) => String(stream?.type).toLowerCase() === 'vod',

  /**
   * Valida um stream VOD
   * @param {object} stream - { name: string, url: string }
   * @param {object} config - { timeoutMs?: number, minSize?: number, testMode?: boolean }
   */
  async validate(stream, config = {}) {
    const { timeoutMs = 5000, minSize = 1024, testMode = false } = config;

    if (!stream?.url) {
      return { ok: false, status: 'offline', score: 0, reason: 'URL ausente' };
    }

    console.log(`[VOD Validator] Validando ${stream.name || '(sem nome)'}`);

    if (testMode) {
      return { ok: true, status: 'online', score: 100 };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // HEAD para verificar se o recurso existe e obter tamanho
      const res = await fetch(stream.url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        return { ok: false, status: 'offline', score: 0, reason: `HTTP ${res.status}` };
      }

      const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
      if (contentLength > 0 && contentLength < minSize) {
        return { ok: false, status: 'offline', score: 50, reason: `Ficheiro demasiado pequeno (${contentLength} bytes)` };
      }

      return { ok: true, status: 'online', score: 100 };

    } catch (err) {
      return { ok: false, status: 'offline', score: 0, reason: err.message };
    }
  }
};
