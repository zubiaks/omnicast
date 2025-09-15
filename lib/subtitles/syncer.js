// core/subtitles/syncer.js
import { execFile } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';

const exec = promisify(execFile);

export const syncerProvider = {
  id: 'syncer@1.1.0',

  /**
   * Sincroniza uma legenda com o áudio do stream
   * @param {string} subUrl - URL da legenda
   * @param {object} stream - StreamRecord com URL do vídeo
   * @param {object} config - { duration?: number, storageBaseUrl?: string }
   * @returns {Promise<{url: string, synced: boolean}>}
   */
  async sync(subUrl, stream, config = {}) {
    const { duration = 60, storageBaseUrl = 'https://cdn.omnicast.local/subs' } = config;

    let tmpDir;
    try {
      if (!subUrl || !stream?.canonicalUrl) {
        throw new Error('Parâmetros inválidos: subUrl ou stream.canonicalUrl ausentes.');
      }

      console.log(`[Syncer] A sincronizar legenda de ${subUrl} com áudio de ${stream.canonicalUrl}`);

      // 1. Download da legenda
      const subRes = await fetch(subUrl);
      if (!subRes.ok) throw new Error(`Falha ao obter legenda: ${subRes.status} ${subRes.statusText}`);
      const subText = await subRes.text();

      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-'));
      const subPath = path.join(tmpDir, 'input.srt');
      fs.writeFileSync(subPath, subText, 'utf8');

      // 2. Download de um excerto do áudio
      const audioPath = path.join(tmpDir, 'audio.wav');
      await exec('ffmpeg', [
        '-y',
        '-i', stream.canonicalUrl,
        '-t', String(duration),
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        audioPath
      ]);

      // 3. Sincronização com ffsubsync
      const outPath = path.join(tmpDir, 'synced.srt');
      await exec('ffsubsync', [
        subPath,
        '--audio', audioPath,
        '-o', outPath
      ]);

      // 4. Ler legenda sincronizada
      const syncedText = fs.readFileSync(outPath, 'utf8');

      // 5. Guardar no storage/CDN (simulado)
      const finalUrl = `${storageBaseUrl}/${Date.now()}.srt`;
      // Aqui poderias fazer upload real para o storage

      return { url: finalUrl, synced: true };

    } catch (err) {
      console.error(`[Syncer] Erro: ${err.message}`);
      return { url: subUrl, synced: false };
    } finally {
      if (tmpDir) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      }
    }
  }
};
