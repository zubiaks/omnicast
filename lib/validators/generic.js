// core/validators/generic.js
import fetch from 'node-fetch';

export const genericValidator = {
  id: 'generic@1.1.0',

  /**
   * Valida um stream de forma genérica
   * @param {object} stream - { name: string, url: string }
   * @param {object} config - { testMode?: boolean }
   * @returns {Promise<{ok: boolean, status: string, score: number, reason?: string}>}
   */
  async validate(stream, config = {}) {
    const { testMode = false } = config;

    if (!stream?.url) {
      return { ok: false, status: 'offline', score: 0, reason: 'URL ausente' };
    }

    console.log(`[Generic Validator] Validando ${stream.name || '(sem nome)'}`);

    if (testMode) {
      console.log('[Generic Validator] Modo de teste ativo — resultado simulado.');
      return { ok: true, status: 'online', score: 80 };
    }

    try {
      // Teste simples: HEAD request para ver se responde
      const res = await fetch(stream.url, { method: 'HEAD', timeout: 5000 });
      if (res.ok) {
        return { ok: true, status: 'online', score: 80 };
      } else {
        return { ok: false, status: 'offline', score: 0, reason: `HTTP ${res.status}` };
      }
    } catch (err) {
      return { ok: false, status: 'offline', score: 0, reason: err.message };
    }
  }
};
