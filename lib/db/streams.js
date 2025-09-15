import { pool } from './index.js';

/**
 * Insere ou atualiza um stream na BD
 * @param {object} rec - StreamRecord normalizado
 */
export async function insertStream(rec) {
  if (!rec?.id || !rec?.name || !rec?.type) {
    throw new Error('Stream inválido: campos obrigatórios em falta');
  }

  // Garantir consistência dos campos
  if (!Array.isArray(rec.subtitles)) rec.subtitles = [];
  if (typeof rec.media !== 'object' || rec.media === null) rec.media = {};
  if (typeof rec.url !== 'string') rec.url = '';
  if (typeof rec.canonicalUrl === 'string') {
    rec.canonicalurl = rec.canonicalUrl;
  }

  await pool.query(`
    INSERT INTO streams (
      id, name, type, url, canonicalurl, country, language, category,
      status, score, media, subtitles, updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11::jsonb, $12::jsonb, NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        type = EXCLUDED.type,
        url = EXCLUDED.url,
        canonicalurl = EXCLUDED.canonicalurl,
        country = EXCLUDED.country,
        language = EXCLUDED.language,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        score = EXCLUDED.score,
        media = EXCLUDED.media,
        subtitles = EXCLUDED.subtitles,
        updated_at = NOW();
  `, [
    rec.id,
    rec.name,
    rec.type,
    rec.url,
    rec.canonicalurl,
    rec.country || null,
    rec.language || null,
    rec.category || null,
    rec.status || 'unknown',
    rec.score || 0,
    JSON.stringify(rec.media),
    JSON.stringify(rec.subtitles)
  ]);

  console.log(`[${new Date().toISOString()}] Stream ${rec.id} (${rec.name}) inserido/atualizado`);
}
