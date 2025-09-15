// core/quarantine/vod-quarantine.js
import { saveToQuarantine } from '../db/quarantine.js';
import { ptFirstVodPolicy } from '../policies/pt-first-vod.js';

/**
 * Processa um stream VOD para quarentena
 * - Guarda na BD com motivo e versão da política
 * - Garante estrutura consistente
 */
export async function processVodForQuarantine(stream) {
  if (!stream?.id || !stream?.name) {
    throw new Error('Stream VOD inválido para quarentena');
  }

  const record = {
    ...stream,
    quarantineReason: stream.quarantineReason || 'Não cumpre política PT-first',
    policyVersion: ptFirstVodPolicy.id,
    subtitles: Array.isArray(stream.subtitles) ? stream.subtitles : []
  };

  await saveToQuarantine(record);

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event: 'vod_quarantine_saved',
    streamId: record.id,
    streamName: record.name,
    reason: record.quarantineReason,
    policyVersion: record.policyVersion
  }));
}
