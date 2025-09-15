import { pool } from './index.js';

/**
 * Lê todas as fontes ativas da BD, opcionalmente filtradas por tipo
 * @param {string} [type] - Tipo de fonte (ex.: 'vod', 'iptv')
 */
export async function getActiveSources(type) {
  let query = `SELECT id, name, adapter_id, config FROM sources WHERE active = true`;
  const params = [];

  if (type) {
    params.push(type);
    query += ` AND type = $${params.length}`;
  }

  query += ` ORDER BY name ASC`;

  const { rows } = await pool.query(query, params);

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    adapterId: row.adapter_id,
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config
  }));
}
