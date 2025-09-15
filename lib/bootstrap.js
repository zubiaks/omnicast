// core/bootstrap.js
import {
  registerAdapter,
  registerValidator,
  registerSubtitleProvider
} from './registry.js';

// ===== Adapters =====
import { plutoVodAdapter } from './adapters/pluto-vod.js';
import { radioBrowserAdapter } from './adapters/radiobrowser.js';
import { rtpPlayAdapter } from './adapters/rtp-play.js';

// ===== Validadores =====
import { hlsValidator } from './validators/hls.js';
import { icyValidator } from './validators/icy.js';
import { vodValidator } from './validators/vod.js';
import { genericValidator } from './validators/generic.js';

// ===== Providers de legendas =====
import { openSubtitlesProvider } from './subtitles/opensubtitles.js';
import { translatorProvider } from './subtitles/translator.js';
import { syncerProvider } from './subtitles/syncer.js';

// ===== Registo de Adapters =====
registerAdapter(plutoVodAdapter);
registerAdapter(radioBrowserAdapter);
registerAdapter(rtpPlayAdapter);

// ===== Registo de Validadores =====
registerValidator('hls', hlsValidator);
registerValidator('icy', icyValidator);
registerValidator('vod', vodValidator);
registerValidator('generic', genericValidator);

// ===== Registo de Providers de Legendas =====
registerSubtitleProvider(openSubtitlesProvider);
registerSubtitleProvider(translatorProvider);
registerSubtitleProvider(syncerProvider);

console.log('[Bootstrap] Núcleo do Omnicast registado com sucesso.');
