(function(){
  const THEME_KEY = 'oc:theme';
  const VIEW_KEY = 'oc:viewmode';

  const btn = document.getElementById('display-settings');
  const menu = document.getElementById('display-menu');
  const themeLabel = document.getElementById('theme-label');
  const viewLabel = document.getElementById('viewmode-label');

  if (!btn || !menu) return;

  // Aplicar estado guardado
  try {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.dataset.theme = savedTheme;
    if (themeLabel) themeLabel.textContent = savedTheme === 'dark' ? 'Escuro' : 'Claro';

    const savedView = localStorage.getItem(VIEW_KEY);
    if (savedView) document.body.classList.add(savedView);
    if (viewLabel) viewLabel.textContent = savedView ? capitalizar(savedView) : 'Normal';
  } catch (e) {
    console.warn('LocalStorage indisponível:', e);
  }

  // Abrir/fechar menu
  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('show');
    btn.setAttribute('aria-expanded', isOpen);
  });

  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  // Fechar com Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('show')) {
      menu.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });

  // Ações do menu
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    const action = item.dataset.action;
    if (action === 'theme') toggleTheme();
    if (action === 'viewmode') toggleViewMode();
    menu.classList.remove('show');
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  });

  function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    if (themeLabel) themeLabel.textContent = next === 'dark' ? 'Escuro' : 'Claro';
  }

  function toggleViewMode() {
    if (document.body.classList.contains('compact')) {
      document.body.classList.remove('compact');
      document.body.classList.add('cinema');
      try { localStorage.setItem(VIEW_KEY, 'cinema'); } catch {}
      if (viewLabel) viewLabel.textContent = 'Cinema';
    } else if (document.body.classList.contains('cinema')) {
      document.body.classList.remove('cinema');
      try { localStorage.removeItem(VIEW_KEY); } catch {}
      if (viewLabel) viewLabel.textContent = 'Normal';
    } else {
      document.body.classList.add('compact');
      try { localStorage.setItem(VIEW_KEY, 'compact'); } catch {}
      if (viewLabel) viewLabel.textContent = 'Compacto';
    }
  }

  function capitalizar(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
})();
