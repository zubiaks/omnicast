// assets/js/modules/playerControls.js

/**
 * Inicializa os controles do player de vídeo:
 * reprodução, seek, volume, mute, velocidade, fullscreen, PiP, captura de frame.
 *
 * @param {Object} [options]
 * @param {string} [options.videoId='player-video']        — ID do elemento <video>
 * @param {string} [options.rootId='cockpit-root']         — ID do container para fullscreen
 * @param {number} [options.seekStep=10]                  — segundos para avançar/retroceder
 */
export function initPlayerControls({
  videoId = 'player-video',
  rootId = 'cockpit-root',
  seekStep = 10
} = {}) {
  const video      = document.getElementById(videoId);
  const btnPlay    = document.getElementById('btn-play');
  const btnBack    = document.getElementById('btn-back');
  const btnFwd     = document.getElementById('btn-fwd');
  const btnMute    = document.getElementById('btn-mute');
  const volume     = document.getElementById('volume');
  const speed      = document.getElementById('speed');
  const btnFs      = document.getElementById('btn-fullscreen');
  const btnPip     = document.getElementById('btn-pip');
  const btnCapture = document.getElementById('btn-capture');
  const progress   = document.getElementById('progress');
  const playedBar  = progress?.querySelector('.progress-played');
  const bufferBar  = progress?.querySelector('.progress-buffer');
  const labelCurr  = document.getElementById('time-current');
  const labelTotal = document.getElementById('time-total');
  let isScrubbing = false;

  if (!video) return;

  // Utils
  const formatTime = t => {
    if (!isFinite(t)) return '00:00';
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    const m = Math.floor((t / 60) % 60).toString().padStart(2, '0');
    const h = Math.floor(t / 3600);
    return (h ? `${h.toString().padStart(2, '0')}:` : '') + `${m}:${s}`;
  };

  const updatePlayButton = () => {
    if (!btnPlay) return;
    btnPlay.textContent = video.paused ? '▶️' : '⏸️';
  };

  const updateTimes = () => {
    labelCurr  && (labelCurr.textContent  = formatTime(video.currentTime));
    labelTotal && (labelTotal.textContent = formatTime(video.duration));
    if (playedBar && video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      playedBar.style.width = `${Math.min(100, pct)}%`;
    }
  };

  const updateBuffer = () => {
    if (bufferBar && video.duration) {
      let end = 0;
      if (video.buffered.length) {
        try { end = video.buffered.end(video.buffered.length - 1); } catch {}
      }
      const pct = (end / video.duration) * 100;
      bufferBar.style.width = `${Math.min(100, pct)}%`;
    }
  };

  const seekTo = seconds => {
    const d = isFinite(video.duration) ? video.duration : 0;
    video.currentTime = Math.max(0, Math.min(d, seconds));
  };

  const stepBy = delta => seekTo(video.currentTime + delta);

  // Handlers
  const onPlayPause = () => {
    video.paused ? video.play() : video.pause();
  };

  const onVolumeChange = e => {
    video.volume = Math.max(0, Math.min(1, Number(e.target.value)));
    if (btnMute) btnMute.textContent = video.muted ? '🔇' : '🔈';
  };

  const onMuteToggle = () => {
    video.muted = !video.muted;
    if (btnMute) btnMute.textContent = video.muted ? '🔇' : '🔈';
  };

  const onSpeedChange = e => {
    const rate = Number(e.target.value);
    if (rate > 0) video.playbackRate = rate;
  };

  const onFsToggle = () => {
    const root = document.getElementById(rootId) || document.documentElement;
    document.fullscreenElement
      ? document.exitFullscreen()
      : root.requestFullscreen?.();
  };

  const onPiPToggle = async () => {
    if (!document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (!video.disablePictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP falhou', err);
    }
  };

  const onCapture = () => {
    if (!video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `captura_${Date.now()}.png`;
    a.click();
  };

  const onProgressPointer = e => {
    const rect = progress.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
    const pct = x / rect.width;
    seekTo(pct * video.duration);
  };

  // Event bindings
  // Video events
  video.addEventListener('play', updatePlayButton);
  video.addEventListener('pause', updatePlayButton);
  video.addEventListener('timeupdate', updateTimes);
  video.addEventListener('durationchange', updateTimes);
  video.addEventListener('progress', updateBuffer);

  // Control buttons
  btnPlay   && btnPlay.addEventListener('click', onPlayPause);
  btnBack   && btnBack.addEventListener('click', () => stepBy(-seekStep));
  btnFwd    && btnFwd.addEventListener('click', () => stepBy(+seekStep));
  btnMute   && btnMute.addEventListener('click', onMuteToggle);
  volume    && volume.addEventListener('input', onVolumeChange);
  speed     && speed.addEventListener('change', onSpeedChange);
  btnFs     && btnFs.addEventListener('click', onFsToggle);
  btnPip    && btnPip.addEventListener('click', onPiPToggle);
  btnCapture && btnCapture.addEventListener('click', onCapture);

  // Progress bar scrubbing
  if (progress) {
    // Pointer down / touch start
    progress.addEventListener('mousedown', e => {
      isScrubbing = true;
      onProgressPointer(e);
    });
    progress.addEventListener('touchstart', e => {
      isScrubbing = true;
      onProgressPointer(e);
    }, { passive: true });

    // Move
    window.addEventListener('mousemove', e => {
      if (isScrubbing) onProgressPointer(e);
    });
    window.addEventListener('touchmove', e => {
      if (isScrubbing) onProgressPointer(e);
    }, { passive: true });

    // Release
    window.addEventListener('mouseup', () => { isScrubbing = false; });
    window.addEventListener('touchend', () => { isScrubbing = false; });

    // Keyboard accessibility
    progress.setAttribute('tabindex', '0');
    progress.addEventListener('keydown', e => {
      if (e.code === 'ArrowLeft') stepBy(-seekStep);
      if (e.code === 'ArrowRight') stepBy(+seekStep);
    });
  }

  // Initial UI sync
  updatePlayButton();
  updateTimes();
  updateBuffer();
}
