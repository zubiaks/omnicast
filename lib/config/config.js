// core/config/cockpit-config.js
window.COCKPIT_CONFIG = {
  formatoInicial: '16x9', // '16x9' | '4x3'
  idioma: 'pt',           // ISO 639-1
  tema: 'escuro',         // 'escuro' | 'claro'
  videoSrc: 'assets/videos/demo.mp4',

  polling: {
    statusMs: 5000,
    painelMs: 7000
  },

  persist: true,

  // Valida e aplica formato
  setFormato(formato) {
    const suportados = ['16x9', '4x3'];
    if (suportados.includes(formato)) {
      this.formatoInicial = formato;
      this.save();
    } else {
      console.warn(`Formato inválido: ${formato}`);
    }
  },

  // Alterna tema
  toggleTema() {
    this.tema = this.tema === 'escuro' ? 'claro' : 'escuro';
    this.save();
  },

  // Guarda no localStorage
  save() {
    if (!this.persist) return;
    try {
      localStorage.setItem('cockpitConfig', JSON.stringify(this));
    } catch (e) {
      console.error('Erro ao guardar config:', e);
    }
  },

  // Carrega do localStorage
  load() {
    try {
      const saved = localStorage.getItem('cockpitConfig');
      if (saved) Object.assign(this, JSON.parse(saved));
    } catch (e) {
      console.error('Erro ao carregar config:', e);
    }
  }
};

// Carrega config persistida no arranque
window.COCKPIT_CONFIG.load();
