// frontend/js/modules/media/playerControls.js

import { loadConfig }  from '@modules/config'
import { showToast }   from '@modules/ui'

/**
 * Inicializa controles de vídeo: play/pause, seek, volume, mute,
 * fullscreen, Picture-in-Picture e captura de snapshot.
 *
 * @param {Object} [opts]
 * @param {string} [opts.videoId='player-video']
 * @param {string} [opts.rootId='cockpit-root']
 * @param {number} [opts.seekStep=10] — passo de seek em segundos.
 * @returns {() => void} Função de cleanup para remover listeners.
 */
export function initPlayerControls({
  videoId  = 'player-video',
  rootId   = 'cockpit-root',
  seekStep = 10
} = {}) {
  const cfg    = loadConfig()
  const video  = document.getElementById(videoId)
  const root   = document.getElementById(rootId)
  if (!video || !root) return () => {}

  // Estado inicial de volume
  if (typeof cfg.defaultVolume === 'number') {
    video.volume = Math.min(Math.max(cfg.defaultVolume, 0), 1)
  }

  // Mapeamento dos controles no DOM (data-attributes)
  const controls = {
    playBtn:       root.querySelector('[data-action="play"]'),
    pauseBtn:      root.querySelector('[data-action="pause"]'),
    seekBackBtn:   root.querySelector('[data-action="seek-backward"]'),
    seekFwdBtn:    root.querySelector('[data-action="seek-forward"]'),
    seekSlider:    root.querySelector('[data-control="seek-slider"]'),
    volumeSlider:  root.querySelector('[data-control="volume-slider"]'),
    muteBtn:       root.querySelector('[data-action="mute"]'),
    fullscreenBtn: root.querySelector('[data-action="fullscreen"]'),
    pipBtn:        root.querySelector('[data-action="pip"]'),
    snapshotBtn:   root.querySelector('[data-action="snapshot"]')
  }

  // Funções de update da UI
  function updateSeek() {
    if (controls.seekSlider && video.duration) {
      controls.seekSlider.value =
        String((video.currentTime / video.duration) * 100)
    }
  }

  function updateVolumeUI() {
    const vol = video.muted ? 0 : video.volume
    if (controls.volumeSlider) {
      controls.volumeSlider.value = String(vol * 100)
    }
    if (controls.muteBtn) {
      controls.muteBtn.classList.toggle('active', video.muted)
    }
  }

  // Helper para registrar e rastrear listeners
  const listeners = []
  function on(el, evt, fn) {
    if (!el) return
    el.addEventListener(evt, fn)
    listeners.push({ el, evt, fn })
  }

  // Bind dos eventos
  on(controls.playBtn, 'click', () => video.play())
  on(controls.pauseBtn, 'click', () => video.pause())

  on(video, 'timeupdate', updateSeek)
  on(video, 'loadedmetadata', updateSeek)

  on(controls.seekBackBtn, 'click', () => {
    video.currentTime = Math.max(video.currentTime - seekStep, 0)
  })
  on(controls.seekFwdBtn, 'click', () => {
    video.currentTime = Math.min(video.currentTime + seekStep, video.duration)
  })
  on(controls.seekSlider, 'input', e => {
    const pct = Number(e.target.value) / 100
    video.currentTime = pct * video.duration
  })

  on(controls.volumeSlider, 'input', e => {
    video.volume = Number(e.target.value) / 100
    video.muted = false
    updateVolumeUI()
  })
  on(controls.muteBtn, 'click', () => {
    video.muted = !video.muted
    updateVolumeUI()
  })

  on(controls.fullscreenBtn, 'click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      root.requestFullscreen().catch(err => {
        console.error('[playerControls] fullscreen falhou', err)
      })
    }
  })

  on(controls.pipBtn, 'click', async () => {
    if (!document.pictureInPictureEnabled) {
      showToast('Picture-in-Picture não suportado', { type: 'error' })
      return
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await video.requestPictureInPicture()
      }
    } catch (err) {
      console.error('[playerControls] PiP falhou', err)
      showToast('Falha ao alternar PiP', { type: 'error' })
    }
  })

  on(controls.snapshotBtn, 'click', () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')
      const win = window.open()
      if (win) win.document.write(`<img src="${dataUrl}" alt="Snapshot">`)
    } catch (err) {
      console.error('[playerControls] snapshot falhou', err)
      showToast('Não foi possível capturar imagem', { type: 'error' })
    }
  })

  // Inicializa UI
  updateVolumeUI()

  // Retorna cleanup
  return () => {
    listeners.forEach(({ el, evt, fn }) => el.removeEventListener(evt, fn))
    listeners.length = 0
  }
}
