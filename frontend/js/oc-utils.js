// assets/js/utils/ocUtils.js

/**
 * Converte texto para minúsculas, remove acentos e espaços extras,
 * facilitando comparações de busca.
 *
 * @param {string} str
 * @returns {string}
 */
export function normalize(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Escapa caracteres especiais em HTML para evitar XSS.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapa caracteres em RegExp para uso seguro em expressões regulares.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeRegExp(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let _toastEl = null;
let _toastTimer = null;

/**
 * Exibe um toast não-bloqueante no canto da tela.
 * Se já existir, atualiza a mensagem e reinicia o timer.
 *
 * @param {string} msg        — texto do toast
 * @param {'info'|'success'|'warning'|'error'} [type='info']
 * @param {number} [duration=2200] — duração em ms
 */
export function showToast(msg, type = 'info', duration = 2200) {
  if (!_toastEl || !_toastEl.isConnected) {
    _toastEl = document.createElement('div');
    _toastEl.className = 'oc-toast';
    _toastEl.setAttribute('role', 'status');
    _toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(_toastEl);
  }
  _toastEl.textContent = msg;
  _toastEl.className = `oc-toast oc-toast--${type}`;
  _toastEl.classList.add('oc-toast--show');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    _toastEl.classList.remove('oc-toast--show');
  }, duration);
}

const ICON_MAP = {
  iptv:   '/assets/img/icons/iptv.png',
  vod:    '/assets/img/icons/vod.png',
  webcam: '/assets/img/icons/webcam.png',
  radio:  '/assets/img/icons/radio.png',
  fav:    '/assets/img/icons/icon-fav.svg'
};

/**
 * Retorna caminho de ícone fallback para o tipo especificado.
 *
 * @param {string} [type='vod']
 * @returns {string}
 */
export function getFallback(type = 'vod') {
  return ICON_MAP[type.toLowerCase()] || ICON_MAP.vod;
}

/**
 * Monta uma lista de candidatos a imagem a partir de propriedades do item
 * e strings extras, mantendo ordem de prioridade.
 *
 * @param {object} item       — objeto com thumb, logo ou image
 * @param {string[]} [extra]  — URLs adicionais de fallback
 * @returns {string[]}
 */
export function buildCandidates(item, extra = []) {
  const urls = [];
  if (item?.thumb) urls.push(item.thumb);
  if (item?.logo)  urls.push(item.logo);
  if (item?.image) urls.push(item.image);
  if (Array.isArray(extra)) urls.push(...extra);
  urls.push(getFallback(item?.type));
  // Remove duplicados ou vazios
  return [...new Set(urls.filter(u => u))];
}

/**
 * Substitui `<img data-candidates="url1|url2|...">` por carregamento
 * preguiçoso e tentativa de fallback em sequência.
 *
 * @param {HTMLElement|Document} root
 */
export function applyImgFallback(root = document) {
  const imgs = Array.from(root.querySelectorAll('img[data-candidates]'));
  if (!imgs.length) return;

  function loadNext(img, candidates) {
    let idx = 0;
    const tryLoad = () => {
      if (idx >= candidates.length) return;
      img.onerror = () => {
        idx += 1;
        tryLoad();
      };
      img.onload = () => {
        img.onerror = null;
      };
      img.src = candidates[idx++];
    };
    tryLoad();
  }

  const observerSupported = 'IntersectionObserver' in window;
  if (observerSupported) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const list = img.dataset.candidates.split('|');
          loadNext(img, list);
          io.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    imgs.forEach(img => io.observe(img));
  } else {
    imgs.forEach(img => {
      const list = img.dataset.candidates.split('|');
      loadNext(img, list);
    });
  }
}
