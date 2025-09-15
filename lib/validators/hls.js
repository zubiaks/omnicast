// core/validators/hls.js
import fetch from 'node-fetch';

export const hlsValidator = {
  id: 'hls@1.3.0',

  /**
   * Valida um stream HLS
   * @param {object} stream - { name: string, url: string }
   * @param {object} config - { timeoutMs?: number, minSegmentSize?: number, testMode?: boolean }
   * @returns {Promise<{ok: boolean, status: string, score: number, reason?: string}>}
   */
  async validate(stream, config = {}) {
    const { timeoutMs = 5000, minSegmentSize = 1024, testMode = false } = config;

    if (!stream?.url) {
      return { ok: false, status: 'offline', score: 0, reason: 'URL ausente' };
    }

    console.log(`[HLS Validator] Validando ${stream.name || '(sem nome)'}`);

    if (testMode) {
      console.log('[HLS Validator] Modo de teste ativo — resultado simulado.');
      return { ok: true, status: 'online', score: 100 };
    }

    let controller, timeout;
    try {
      // 1️⃣ Buscar a playlist
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(stream.url, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        return { ok: false, status: 'offline', score: 0, reason: `HTTP ${res.status}` };
      }

      const playlist = await res.text();

      // 2️⃣ Validar formato HLS
      if (!playlist.includes('#EXTM3U') || !playlist.includes('#EXTINF')) {
        return { ok: false, status: 'offline', score: 0, reason: 'Formato HLS inválido' };
      }

      // 3️⃣ Extrair primeiro segmento
      const lines = playlist.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      if (lines.length === 0) {
        return { ok: false, status: 'offline', score: 0, reason: 'Sem segmentos de vídeo' };
      }

      let segmentUrl = lines[0];
      if (!segmentUrl.startsWith('http')) {
        segmentUrl = new URL(segmentUrl, new URL(stream.url)).href;
      }

      // 4️⃣ Testar segmento
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), timeoutMs);

      const segRes = await fetch(segmentUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timeout);

      if (!segRes.ok) {
        return { ok: false, status: 'offline', score: 50, reason: `Segmento HTTP ${segRes.status}` };
      }

      const segBuffer = await segRes.arrayBuffer();
      if (segBuffer.byteLength < minSegmentSize) {
        return { ok: false, status: 'offline', score: 50, reason: `Segmento pequeno (${segBuffer.byteLength} bytes)` };
      }

      // ✅ Tudo certo
      return { ok: true, status: 'online', score: 100 };

    } catch (err) {
      clearTimeout(timeout);
      return { ok: false, status: 'offline', score: 0, reason: err.message };
    }
  }
};
