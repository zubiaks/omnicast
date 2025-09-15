/**
 * Script de verificaÃ§Ã£o de adapters do Omnicast
 * - Testa todos os adapters registados
 * - Atualiza inventÃ¡rio (core/inventario.json)
 * - Guarda histÃ³rico (core/inventario-historico/)
 * - Gera CSV consolidado estendido (core/historico.csv)
 * - Envia automaticamente para update_status.py
 * Ãšltima revisÃ£o: 2025-09-12
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import adapters from '../adapters/index.js';

// FunÃ§Ã£o utilitÃ¡ria para escapar valores no CSV
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// FunÃ§Ã£o para guardar histÃ³rico
function saveInventarioHistorico() {
  const inventarioPath = path.resolve('./lib/inventario.json');
  const historicoDir = path.resolve('./lib/inventario-historico');

  if (!fs.existsSync(inventarioPath)) {
    console.warn('[HistÃ³rico] Nenhum inventÃ¡rio encontrado para guardar.');
    return;
  }

  fs.mkdirSync(historicoDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const historicoPath = path.join(historicoDir, `inventario-${timestamp}.json`);

  try {
    fs.copyFileSync(inventarioPath, historicoPath);
    console.log(`[HistÃ³rico] InventÃ¡rio guardado em: ${historicoPath}`);
  } catch (err) {
    console.error(`[HistÃ³rico] Erro ao guardar inventÃ¡rio: ${err.message}`);
  }
}

// FunÃ§Ã£o para gerar CSV consolidado estendido
function gerarHistoricoCSV() {
  const historicoDir = path.resolve('./lib/inventario-historico');
  const outputPath = path.resolve('./lib/historico.csv');

  if (!fs.existsSync(historicoDir)) {
    console.warn('[HistÃ³rico] Pasta de histÃ³rico nÃ£o encontrada.');
    return;
  }

  let linhas = ['date,adapter,status,items,error,responseTime(ms),errorType,executionDuration(ms)'];

  fs.readdirSync(historicoDir)
    .filter(file => file.endsWith('.json'))
    .sort()
    .forEach(file => {
      const data = JSON.parse(fs.readFileSync(path.join(historicoDir, file), 'utf-8'));

      if (data.adapters) {
        Object.entries(data.adapters).forEach(([adapter, info]) => {
          linhas.push([
            csvEscape(info.lastCheck || file.replace('inventario-', '').replace('.json', '')),
            csvEscape(adapter),
            csvEscape(info.status),
            csvEscape(info.items),
            csvEscape(info.error || ''),
            csvEscape(info.responseTime || ''),
            csvEscape(info.errorType || ''),
            csvEscape(info.executionDuration || '')
          ].join(','));
        });
      }
    });

  fs.writeFileSync(outputPath, linhas.join('\n'), 'utf-8');
  console.log(`[HistÃ³rico] CSV consolidado criado em: ${outputPath}`);
}

// ExecuÃ§Ã£o principal
(async () => {
  const dateNow = new Date().toISOString();
  const report = [];

  console.log(`\n[Check Adapters] InÃ­cio da verificaÃ§Ã£o â€” ${dateNow}\n`);

  for (const adapter of adapters) {
    const startTime = Date.now();
    let status = 'N/A';
    let items = 0;
    let error = null;
    let errorType = '';
    let responseTime = 0;

    try {
      const apiStart = Date.now();
      const result = await adapter.discover({ limit: 1 }) || [];
      responseTime = Date.now() - apiStart;

      if (Array.isArray(result) && result.length > 0) {
        status = 'OK';
        items = result.length;
      } else {
        status = 'SEM DADOS';
        error = 'Nenhum item retornado pela API.';
        errorType = 'NO_DATA';
      }

      console.log(`[${status}] ${adapter.id} â†’ ${items} items (API: ${responseTime}ms)`);

    } catch (err) {
      responseTime = Date.now() - startTime;
      status = 'ERRO';
      error = err.message;
      errorType = 'HTTP_ERROR';
      console.warn(`[ERRO] ${adapter.id} â†’ ${err.message}`);
    }

    const executionDuration = Date.now() - startTime;

    report.push({
      id: adapter.id,
      status,
      items,
      date: dateNow,
      error,
      errorType,
      responseTime,
      executionDuration
    });
  }

  // Atualizar inventÃ¡rio
  const inventarioPath = path.resolve('./lib/inventario.json');
  if (fs.existsSync(inventarioPath)) {
    const inventario = JSON.parse(fs.readFileSync(inventarioPath, 'utf-8'));

    report.forEach(r => {
      if (!inventario.adapters) inventario.adapters = {};
      inventario.adapters[r.id] = {
        status: r.status,
        items: r.items || 0,
        lastCheck: r.date,
        error: r.error || null,
        errorType: r.errorType || '',
        responseTime: r.responseTime || '',
        executionDuration: r.executionDuration || ''
      };
    });

    fs.writeFileSync(inventarioPath, JSON.stringify(inventario, null, 2), 'utf-8');
    console.log(`[Check Adapters] InventÃ¡rio atualizado em: ${inventarioPath}`);
  } else {
    console.warn('[Check Adapters] Nenhum inventÃ¡rio encontrado para atualizar.');
  }

  // Guardar histÃ³rico e gerar CSV
  saveInventarioHistorico();
  gerarHistoricoCSV();

  console.log(`\n[Check Adapters] VerificaÃ§Ã£o concluÃ­da.\n`);

  // Envio automÃ¡tico para update_status.py
  const sendScript = path.resolve('./backend/send_status_payload.py');
  exec(`python "${sendScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[AutoSend] Erro ao enviar payload: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[AutoSend] STDERR: ${stderr}`);
    }
    console.log(`[AutoSend] Resposta:\n${stdout}`);
  });

})();

