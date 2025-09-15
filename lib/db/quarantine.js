import { pool } from './index.js';
import cron from 'node-cron';
import { reprocessQuarantineJob } from './reprocess-quarantine.js';

const CRON_EXPR = process.env.QUARANTINE_CRON || '0 3 * * *'; // padrão: 03:00

// Agendamento
cron.schedule(CRON_EXPR, () => {
  console.log(`[${new Date().toISOString()}] Reprocessamento de quarentena iniciado`);
  reprocessQuarantineJob().catch(err =>
    console.error(`Erro no reprocessamento de quarentena: ${err.message}`)
  );
});

export async function getQuarantineItems(type, limit = 100, offset = 0) {
  const { rows } = await pool.query(
    `SELECT * FROM quarantine WHERE type = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
    [type, limit, offset]
  );
  return rows;
}

export async function saveToQuarantine(stream) {
  if (!stream?.id || !stream?.type || !stream?.name || !stream?.canonicalUrl) {
    throw new Error('Stream inválido para quarentena');
  }

  await pool.query(
    `INSERT INTO quarantine (id, type, name, canonical_url, quarantine_reason, policy_version, subtitles, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       quarantine_reason = EXCLUDED.quarantine_reason,
       subtitles = EXCLUDED.subtitles,
       updated_at = NOW()`,
    [
      stream.id,
      stream.type,
      stream.name,
      stream.canonicalUrl,
      stream.quarantineReason || 'unspecified',
      stream.policyVersion || 'unknown',
      stream.subtitles || []
    ]
  );

  console.log(`[${new Date().toISOString()}] Stream ${stream.id} (${stream.name}) colocado em quarentena`);
}

export async function removeFromQuarantine(id) {
  await pool.query(`DELETE FROM quarantine WHERE id = $1`, [id]);
  console.log(`[${new Date().toISOString()}] Stream ${id} removido da quarentena`);
}
