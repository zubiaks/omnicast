(function(){
  const THEME_KEY = 'oc:theme';
  const VIEW_KEY  = 'oc:viewmode';

  function initDisplaySettings() {
    const btn        = document.getElementById('display-settings');
    const menu       = document.getElementById('display-menu');
    const themeLabel = document.getElementById('theme-label');
    const viewLabel  = document.getElementById('viewmode-label');

    if (!btn || !menu) {
      console.warn('Botão ou menu de display não encontrados.');
      return;
    }

    // Estado inicial
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.dataset.theme = savedTheme;
    if (themeLabel) themeLabel.textContent = savedTheme === 'dark' ? 'Escuro' : 'Claro';

    const savedView = localStorage.getItem(VIEW_KEY) || '';
    if (savedView) document.body.classList.add(savedView);
    if (viewLabel) viewLabel.textContent = traduzirViewMode(savedView);

    // Dispara eventos iniciais com valores crus
    document.dispatchEvent(new CustomEvent('oc:theme-changed', { detail: themeLabel.textContent }));
    document.dispatchEvent(new CustomEvent('oc:viewmode-changed', { detail: savedView }));

    // Abrir/fechar menu
    btn.addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.toggle('show');
      btn.setAttribute('aria-expanded', menu.classList.contains('show'));
    });

    document.addEventListener('click', e => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) fecharMenu();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('show')) {
        fecharMenu();
        btn.focus();
      }
    });

    // Ações do menu
    menu.addEventListener('click', e => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;
      if (item.dataset.action === 'theme') toggleTheme();
      if (item.dataset.action === 'viewmode') toggleViewMode();
      fecharMenu();
      btn.focus();
    });

    function toggleTheme() {
      const current = document.documentElement.dataset.theme || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
      const label = next === 'dark' ? 'Escuro' : 'Claro';
      if (themeLabel) themeLabel.textContent = label;
      document.dispatchEvent(new CustomEvent('oc:theme-changed', { detail: label }));
    }

    function toggleViewMode() {
      // Limpa classes antigas
      document.body.classList.remove('compact', 'cinema');

      let value = '';
      if (!localStorage.getItem(VIEW_KEY)) {
        value = 'compact';
      } else if (localStorage.getItem(VIEW_KEY) === 'compact') {
        value = 'cinema';
      } else {
        value = '';
      }

      if (value) {
        localStorage.setItem(VIEW_KEY, value);
        document.body.classList.add(value);
      } else {
        localStorage.removeItem(VIEW_KEY);
      }

      if (viewLabel) viewLabel.textContent = traduzirViewMode(value);
      document.dispatchEvent(new CustomEvent('oc:viewmode-changed', { detail: value }));
    }

    function traduzirViewMode(valor) {
      switch (valor) {
        case 'compact': return 'Compacto';
        case 'cinema': return 'Cinema';
        default: return 'Normal';
      }
    }

    function fecharMenu() {
      menu.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  document.addEventListener('oc:header-mounted', initDisplaySettings);
  if (document.getElementById('display-settings')) initDisplaySettings();
})();
