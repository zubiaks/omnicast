// assets/js/modules/alerts.js
const SOUND_PATHS = {
  critical: '/assets/sounds/alert-critical.mp3',
  warning:  '/assets/sounds/alert-warning.mp3',
  info:     '/assets/sounds/alert-info.mp3'
};

const audioCache = {};

if (typeof Math.clamp !== 'function') {
  Math.clamp = (v, min, max) => Math.min(Math.max(v, min), max);
}

export async function tocarSom(type, config = {}) {
  if (!config.sonsAtivos?.[type]) return;
  const src = SOUND_PATHS[type];
  if (!src) return;

  let audio = audioCache[type];
  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = Math.clamp(config.volume ?? 1, 0, 1);
    audioCache[type] = audio;
  }

  try {
    audio.currentTime = 0;
    await audio.play();
  } catch {
    // autoplay bloqueado ou erro de arquivo
  }
}

export function addPulse(el, duration = 2000) {
  if (!(el instanceof HTMLElement)) return;

  if (typeof el.animate === 'function') {
    const anim = el.animate(
      [
        { boxShadow: '0 0 0 rgba(255,0,0,0)' },
        { boxShadow: '0 0 8px rgba(255,0,0,0.8)' },
        { boxShadow: '0 0 0 rgba(255,0,0,0)' }
      ],
      { duration, easing: 'ease-in-out', iterations: 1 }
    );
    anim.onfinish = () => anim.cancel();
  } else {
    el.classList.add('alerta');
    setTimeout(() => el.classList.remove('alerta'), duration);
  }
}
