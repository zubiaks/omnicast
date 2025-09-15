/**
 * Script para guardar histÃ³rico do inventÃ¡rio do Omnicast
 * - Copia o core/inventario.json atual para core/inventario-historico/
 * - Nome do ficheiro inclui timestamp (YYYY-MM-DDTHH-mm-ss)
 * Ãšltima revisÃ£o: 2025-09-12
 */

import fs from 'fs';
import path from 'path';

export function saveInventarioHistorico() {
  const inventarioPath = path.resolve('./lib/inventario.json');
  const historicoDir = path.resolve('./lib/inventario-historico');

  // Verifica se o inventÃ¡rio existe
  if (!fs.existsSync(inventarioPath)) {
    console.warn('[HistÃ³rico] Nenhum inventÃ¡rio encontrado para guardar.');
    return;
  }

  // Garante que a pasta de histÃ³rico existe
  fs.mkdirSync(historicoDir, { recursive: true });

  // Cria timestamp seguro para nome de ficheiro
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const historicoPath = path.join(historicoDir, `inventario-${timestamp}.json`);

  try {
    fs.copyFileSync(inventarioPath, historicoPath);
    console.log(`[HistÃ³rico] InventÃ¡rio guardado em: ${historicoPath}`);
  } catch (err) {
    console.error(`[HistÃ³rico] Erro ao guardar inventÃ¡rio: ${err.message}`);
  }
}

