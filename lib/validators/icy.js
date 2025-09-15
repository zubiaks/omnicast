// core/validators/icy.js
import fetch from 'node-fetch';

export const icyValidator = {
  id: 'icy@2.1.0',

  /**
   * Valida um stream ICY (rádio/áudio)
   * @param {object} stream - { name: string, url: string }
   * @param {object} config - { timeoutMs?: number, slowThreshold?: number, verySlowThreshold?: number, testMode?: boolean }
   * @returns {Promise<{ok: boolean, status: string, score: number, reason?: string, responseTime?: number, icyMeta?: object}>}
   */
  async validate(stream, config = {}) {
    const {
      timeoutMs = 5000,
      slowThreshold = 2000,
      verySlowThreshold = 4000,
      testMode = false
    } = config;

    if (!stream?.url) {
      return { ok: false, status: 'offline', score: 0, reason: 'URL ausente' };
    }

    console.log(`[ICY Validator] Validando ${stream.name || '(sem nome)'}`);

    if (testMode) {
      return { ok: true, status: 'online', score: 100, icyMeta: { StreamTitle: 'Demo Title' } };
    }

    const startTime = Date.now();
    let reader;

    try {
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
      if (responseTime > slowThreshold) score = 80;
      if (responseTime > verySlowThreshold) score = 60;

      const icyMeta = {};
      for (const [key, value] of res.headers) {
        if (key.toLowerCase().startsWith('icy-')) {
          icyMeta[key] = value;
        }
      }

      const metaInt = parseInt(res.headers.get('icy-metaint') || '0', 10);
      if (metaInt > 0 && res.body) {
        reader = res.body.getReader();
        let bytesRead = 0;

        while (bytesRead < metaInt) {
          const { done, value } = await reader.read();
          if (done) break;
          bytesRead += value.length;
        }

        const { value: metaBlockSizeArr } = await reader.read();
        if (metaBlockSizeArr?.length > 0) {
          const metaBlockSize = metaBlockSizeArr[0] * 16;
          if (metaBlockSize > 0) {
            const { value: metaDataArr } = await reader.read();
            if (metaDataArr) {
              const metaString = new TextDecoder('utf-8').decode(metaDataArr.slice(0, metaBlockSize));
              const match = /StreamTitle='([^']*)'/.exec(metaString);
              if (match?.[1]) {
                icyMeta['StreamTitle'] = match[1];
              }
            }
          }
        }
      }

      console.log(`[ICY Validator] ${stream.name} online (${responseTime}ms)`);
      return { ok: true, status: 'online', score, responseTime, icyMeta };

    } catch (err) {
      return { ok: false, status: 'offline', score: 0, reason: err.message };
    } finally {
      if (reader) {
        try { await reader.cancel(); } catch {}
      }
    }
  }
};
