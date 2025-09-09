let vjs = null;
let hlsInstance = null;
let retryCount = 0;
const MAX_RETRIES = 3;

function openModal() {
  const m = document.getElementById('player-modal');
  if (m) {
    m.setAttribute('aria-hidden', 'false');
    m.focus?.();
  }
}

function closePlayer() {
  const m = document.getElementById('player-modal');

  if (vjs) {
    vjs.pause();
    vjs.dispose();
    vjs = null;
  }

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (m) m.setAttribute('aria-hidden', 'true');
}
window.closePlayer = closePlayer;

function mountPlayer(item) {
  const videoEl = document.getElementById('player');
  if (!videoEl) return;

  const src = item.stream_url || item.url || item.src;
  const type = item.mime || (item.type === 'radio' ? 'audio/mpeg' : 'application/x-mpegURL');

  // Limpar instâncias anteriores
  if (vjs) {
    vjs.dispose();
    vjs = null;
  }
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  const modal = document.getElementById('player-modal');
  if (modal) modal.setAttribute('aria-label', `Player — ${item.name}`);

  // HLS com hls.js
  if (type === 'application/x-mpegURL') {
    if (Hls.isSupported()) {
      hlsInstance = new Hls();
      hlsInstance.loadSource(src);
      hlsInstance.attachMedia(videoEl);
      videoEl.play().catch(() => {});
      return;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Suporte nativo (Safari, iOS)
      videoEl.src = src;
      videoEl.play().catch(() => {});
      return;
    }
  }

  // Video.js para outros formatos
  vjs = videojs(videoEl, {
    autoplay: true,
    controls: true,
    preload: 'auto',
    liveui: true,
    fluid: true
  });
  vjs.src({ src, type });
  retryCount = 0;

  vjs.on('error', () => {
    if ((item.type === 'iptv' || item.type === 'webcam' || item.type === 'radio') && retryCount < MAX_RETRIES) {
      const timeout = Math.pow(2, retryCount) * 1000;
      retryCount++;
      OC.showToast(`Ligação falhou, a tentar novamente... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(() => {
        vjs.reset();
        vjs.src({ src, type });
        vjs.play().catch(() => {});
      }, timeout);
    } else {
      OC.showToast(`Não foi possível reproduzir "${item.name}".`);
    }
  });

  vjs.on('loadedmetadata', () => { retryCount = 0; });
}

function playItem(item) {
  openModal();
  mountPlayer(item);
}
window.playItem = playItem;

// -------------------- Eventos extra --------------------

// Fechar com tecla Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePlayer();
});

// Fechar ao clicar fora do conteúdo
document.getElementById('player-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'player-modal') closePlayer();
});
