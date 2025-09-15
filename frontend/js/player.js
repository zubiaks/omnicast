// assets/js/modules/player.js
import Hls from 'hls.js';
import videojs from 'video.js';
import { loadConfig } from './configManager.js';
import { showToast } from './alerts.js';

/**
 * Inicializa o modal de player de vídeo/áudio e retorna métodos de controle.
 *
 * @param {Object} options
 * @param {string} [options.modalSelector='#player-modal']   — seletor do elemento modal
 * @param {string} [options.videoSelector='#player']         — seletor do <video> ou <audio>
 * @param {string} [options.closeBtnSelector='#player-close']— seletor do botão de fechar
 * @param {number} [options.maxRetries]                      — tentativas de reconexão (default do config)
 * @returns {{ playItem: Function, closePlayer: Function }}
 */
export function initPlayerModal({
  modalSelector    = '#player-modal',
  videoSelector    = '#player',
  closeBtnSelector = '#player-close',
  maxRetries
} = {}) {
  const config      = loadConfig();
  const retriesMax  = Number(maxRetries ?? config.playerMaxRetries) || 3;
  let retryCount    = 0;
  let hlsInstance   = null;
  let vjsInstance   = null;
  let lastTrigger   = null;

  const modalEl     = document.querySelector(modalSelector);
  const videoEl     = document.querySelector(videoSelector);
  const closeBtn    = document.querySelector(closeBtnSelector);

  if (!modalEl || !videoEl) {
    console.warn('[player] Modal ou elemento de mídia não encontrado.');
    return { playItem: () => {}, closePlayer: () => {} };
  }

  // Abertura do modal e gerenciamento de foco
  function openModal(triggerEl) {
    lastTrigger = triggerEl || null;
    modalEl.setAttribute('aria-hidden', 'false');
    modalEl.classList.remove('hidden');
    (closeBtn || videoEl).focus();
  }

  // Fecha o modal e limpa instâncias
  function closePlayer() {
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.classList.add('hidden');

    // Para e destroi video.js
    if (vjsInstance) {
      vjsInstance.pause();
      vjsInstance.dispose();
      vjsInstance = null;
    }

    // Destroi HLS.js
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    // Limpa src e reinicia elemento
    videoEl.removeAttribute('src');
    videoEl.load();

    // Restaura foco
    lastTrigger?.focus();
    lastTrigger = null;
  }

  // Monta e inicia reprodução do item fornecido
  function mountItem(item) {
    if (!item) {
      showToast('Item inválido para reprodução.');
      return;
    }

    const src  = item.stream_url || item.url || item.src;
    if (!src) {
      showToast('URL de stream não fornecida.');
      return;
    }

    // Define MIME: audio/radio ou HLS
    const isHls = /\.m3u8(\?.*)?$/.test(src);
    const mime  = isHls ? 'application/x-mpegURL'
                : item.mime || 'video/mp4';

    // Dispose de instâncias anteriores
    vjsInstance?.dispose();
    hlsInstance?.destroy();
    retryCount = 0;

    // Ajusta aria-label do modal
    modalEl.setAttribute('aria-label', `Player — ${item.name || item.title || ''}`);

    // Se for HLS nativo ou via hls.js
    if (isHls) {
      if (Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(videoEl);
        videoEl.play().catch(() => {});
        return;
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = src;
        videoEl.play().catch(() => {});
        return;
      }
    }

    // Usa Video.js para MP4, rádio ou fallback
    if (typeof videojs === 'undefined') {
      console.error('[player] video.js não está carregado.');
      return;
    }

    vjsInstance = videojs(videoEl, {
      autoplay: true,
      controls: true,
      preload: 'auto',
      fluid: true,
      liveui: isHls
    });
    vjsInstance.src({ src, type: mime });

    vjsInstance.on('error', () => handleError(src, mime, item));
    vjsInstance.on('loadedmetadata', () => { retryCount = 0; });
  }

  // Tratamento de erro e retentativa
  function handleError(src, mime, item) {
    const canRetry = ['iptv', 'webcam', 'radio'].includes(item.type);
    if (canRetry && retryCount < retriesMax) {
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000;
      showToast(`Conexão falhou, tentanto novamente (${retryCount}/${retriesMax})...`);
      setTimeout(() => {
        vjsInstance.reset();
        vjsInstance.src({ src, type: mime });
        vjsInstance.play().catch(() => {});
      }, delay);
    } else {
      showToast(`Não foi possível reproduzir "${item.name || item.title}".`);
    }
  }

  // Expõe função para iniciar o player a partir de um "item" e elemento que disparou
  function playItem(item, triggerEl) {
    openModal(triggerEl);
    mountItem(item);
  }

  // Eventos de fechamento: clique, ESC
  closeBtn?.addEventListener('click', closePlayer);
  modalEl.addEventListener('click', e => {
    if (e.target === modalEl) closePlayer();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalEl.getAttribute('aria-hidden') === 'false') {
      closePlayer();
    }
  });

  return { playItem, closePlayer };
}
