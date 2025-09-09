window.OC = (() => {
  // Toast simples e flexível
  let toastEl = null;
  let toastTimeout;
  function showToast(msg = '', type = 'info', duration = 2200) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.className = `toast ${type}`;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      if (toastEl) toastEl.classList.remove('show');
    }, duration);
  }

  // Fallback por tipo
  function getFallback(type) {
    const safeType = (type || 'vod').toLowerCase();
    return `assets/img/fallbacks/${safeType}.png`;
  }

  // Candidatos de imagem a partir do item
  function buildCandidates(item, extra = []) {
    const c = [];
    if (item.thumb) c.push(item.thumb);
    if (item.logo) c.push(item.logo);
    if (item.image) c.push(item.image);
    if (Array.isArray(extra)) c.push(...extra);
    // fallback final
    c.push(getFallback(item.type));
    return [...new Set(c.filter(Boolean))];
  }

  // Lazy loading + fallback
  function applyImgFallback(container) {
    if (!container) return;
    const imgs = Array.from(container.querySelectorAll('img[data-candidates]'));
    if (!imgs.length) return;

    const loadWithFallback = (img) => {
      const candidates = img.dataset.candidates.split('|').filter(Boolean);
      let idx = 0;
      const tryNext = () => {
        if (idx >= candidates.length) return;
        img.onerror = () => { idx++; tryNext(); };
        img.onload = () => { img.onerror = null; };
        img.loading = 'lazy';
        img.src = candidates[idx++];
      };
      tryNext();
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            loadWithFallback(e.target);
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: '200px' });
      imgs.forEach(img => io.observe(img));
    } else {
      imgs.forEach(loadWithFallback);
    }
  }

  return { showToast, getFallback, buildCandidates, applyImgFallback };
})();
