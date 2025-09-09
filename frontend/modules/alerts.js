// assets/js/modules/alerts.js

/**
 * Mapeamento de tipos de alerta para ficheiros de som.
 */
const SOUND_PATHS = {
  critical: '../assets/sounds/alert-critical.mp3',
  warning:  '../assets/sounds/alert-warning.mp3',
  info:     '../assets/sounds/alert-info.mp3'
};

/**
 * Cache dos objetos Audio para evitar reload repetido.
 * @type {Record<string, HTMLAudioElement>}
 */
const audioCache = {};

/**
 * Toca o som correspondente ao tipo de alerta, se permitido pela configuração.
 *
 * @param {'critical'|'warning'|'info'} type
 * @param {Object} config  — Deve conter config.sonsAtivos[type]: boolean
 */
export function playAlertSound(type, config) {
  if (!config.sonsAtivos?.[type]) return;

  let audio = audioCache[type];
  if (!audio) {
    const src = SOUND_PATHS[type];
    if (!src) return;
    audio = new Audio(src);
    audioCache[type] = audio;
  }

  try {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // swallow play() promise rejection (p.ex. autoplay bloqueado)
    });
  } catch {
    // silent fail
  }
}

/**
 * Adiciona um efeito de pulso (piscar) ao elemento para destacar visualmente.
 *
 * @param {HTMLElement} el
 * @param {number} [duration=2000] — duração em ms do efeito
 */
export function pulseElement(el, duration = 2000) {
  if (!el || !(el instanceof HTMLElement)) return;
  el.classList.add('alerta');
  setTimeout(() => el.classList.remove('alerta'), duration);
}
