// core/validators/hls-batch.js
import fetch from 'node-fetch';

async function validateSingle(stream, config = {}) {
  const { timeoutMs = 5000, minSegmentSize = 1024, testMode = false } = config;

  if (!stream?.url) {
    return { ...stream, ok: false, status: 'offline', score: 0, reason: 'URL ausente' };
  }

  console.log(`[HLS Validator] Validando ${stream.name || '(sem nome)'}`);

  if (testMode) {
    return { ...stream, ok: true, status: 'online', score: 100 };
  }

  let controller, timeout;
  try {
    // 1️⃣ Buscar playlist
    controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(stream.url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ...stream, ok: false, status: 'offline', score: 0, reason: `HTTP ${res.status}` };
    }

    const playlist = await res.text();

    // 2️⃣ Validar formato
    if (!playlist.includes('#EXTM3U') || !playlist.includes('#EXTINF')) {
      return { ...stream, ok: false, status: 'offline', score: 0, reason: 'Formato HLS inválido' };
    }

    // 3️⃣ Extrair primeiro segmento
    const lines = playlist.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    if (lines.length === 0) {
      return { ...stream, ok: false, status: 'offline', score: 0, reason: 'Sem segmentos' };
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
      return { ...stream, ok: false, status: 'offline', score: 50, reason: `Segmento HTTP ${segRes.status}` };
    }

    const segBuffer = await segRes.arrayBuffer();
    if (segBuffer.byteLength < minSegmentSize) {
      return { ...stream, ok: false, status: 'offline', score: 50, reason: `Segmento pequeno (${segBuffer.byteLength} bytes)` };
    }

    return { ...stream, ok: true, status: 'online', score: 100 };

  } catch (err) {
    clearTimeout(timeout);
    return { ...stream, ok: false, status: 'offline', score: 0, reason: err.message };
  }
}

/**
 * Valida múltiplos streams HLS
 * @param {Array} streams
 * @param {object} config
 * @returns {Promise<Array>}
 */
export async function validateStreamsBatch(streams, config = {}) {
  const results = [];
  for (const stream of streams) {
    results.push(await validateSingle(stream, config));
  }
  return results;
}
