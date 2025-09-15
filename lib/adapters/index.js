/**
 * Lista central de adapters do Omnicast
 * - Importa e agrega todos os adapters ativos
 * - Qualquer novo adapter deve seguir o padrão com createFallback()
 *
 * Para adicionar um novo adapter:
 *    1. Criar ficheiro em ./<nome-do-adapter>.js
 *    2. Implementar método async discover(config) e fallback()
 *    3. Importar aqui e adicionar ao array adapters
 *
 * Nota: A ordem no array 'adapters' define a sequência de execução
 *       nos testes/checks e pode influenciar relatórios.
 *
 * Última revisão: 2025-09-12
 */

import { plutoLiveAdapter } from './pluto-live.js';
import { plutoVodAdapter } from './pluto-vod.js';
import { radioBrowserAdapter } from './radiobrowser.js';
import { rtpPlayAdapter } from './rtp-play.js';

/**
 * Array com todos os adapters registados no Omnicast.
 * A ordem aqui define a ordem de execução nos testes/checks.
 */
const adapters = [
  plutoVodAdapter,       // 1º: VOD
  plutoLiveAdapter,      // 2º: Live
  radioBrowserAdapter,   // 3º: Rádio
  rtpPlayAdapter         // 4º: RTP Play
];

export { adapters }; // Export nomeado opcional
export default adapters;
