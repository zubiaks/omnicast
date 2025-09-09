// ===========================
// Omnicast — Dashboard Turbo
// Alertas + Auto-ciclo + Configurações Globais + PWA Update
// ===========================

// Seletores
const paineis = document.querySelectorAll('.painel');
const timeEl = document.getElementById('dashboard-time');
const metricBackend = document.getElementById('metric-backend');
const metricRede = document.getElementById('metric-rede');
const metricSistema = document.getElementById('metric-sistema');
const metricConteudos = document.getElementById('metric-conteudos');
const listaDestaques = document.getElementById('lista-destaques');

const btnAbrirConfig = document.getElementById('abrir-config-global');
const painelConfig = document.getElementById('painel-config-global');
const btnGuardarConfig = document.getElementById('guardar-config-global');
const btnRefreshManual = document.getElementById('btn-refresh-manual');

// Configuração base
let indiceAtual = 0;
const INTERVALO_CICLO_MS = 10000;
const INTERVALO_UPDATE_MS = 5000;
const LIMITE_LATENCIA_WARNING_MS = 500;

// Preferências
let configApp = {
  sonsAtivos: { critical: true, warning: true, info: true },
  updateAlert: true,
  tema: document.body.classList.contains('theme-light') ? 'light' : 'dark',
  autoRefresh: true
};
const cfg = localStorage.getItem('configApp');
if (cfg) {
  try { configApp = { ...configApp, ...JSON.parse(cfg) }; } catch {}
  document.body.classList.toggle('theme-light', configApp.tema === 'light');
  document.body.classList.toggle('theme-dark', configApp.tema === 'dark');
}

// Sons
const sons = {
  warning: new Audio('../assets/sounds/alert-warning.mp3'),
  critical: new Audio('../assets/sounds/alert-critical.mp3'),
  info: new Audio('../assets/sounds/alert-info.mp3')
};

// Gráficos
const chartLatencia = new Chart(document.getElementById('chart-latencia'), {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Latência (ms)', data: [], borderColor: 'lime', tension: 0.25 }] },
  options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
});
const chartItens = new Chart(document.getElementById('chart-itens'), {
  type: 'bar',
  data: { labels: ['VOD', 'IPTV', 'Rádios', 'Webcams'], datasets: [{ label: 'Itens', data: [0,0,0,0], backgroundColor: ['#e74c3c','#27ae60','#f39c12','#8e44ad'] }] },
  options: { responsive: true, maintainAspectRatio: false }
});
const chartCarregamento = new Chart(document.getElementById('chart-carregamento'), {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Tempo de Carregamento (s)', data: [], borderColor: '#3498db', tension: 0.25 }] },
  options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
});

// Utilitários
function mostrarPainel(indice) { paineis.forEach((p, i) => p.classList.toggle('ativo', i === indice)); }
function tocarSom(tipo) { if (!configApp.sonsAtivos[tipo]) return; const s = sons[tipo]; if (!s) return; s.currentTime = 0; s.play().catch(() => {}); }
function addPulse(el) { el.classList.add('alerta'); setTimeout(() => el.classList.remove('alerta'), 2000); }
function atualizaDestaques(data) {
  if (!listaDestaques || !data?.vod || !Array.isArray(data.vod)) return;
  listaDestaques.innerHTML = data.vod.slice(0, 5).map(item => `<div class="item">🎬 ${item?.nome || item?.title || 'Item'}</div>`).join('');
}
function verificarAlertas(statusData, latencia) {
  if (!statusData) { metricBackend.classList.add('alerta'); tocarSom('critical'); return; }
  if (latencia > LIMITE_LATENCIA_WARNING_MS) { metricBackend.classList.add('alerta'); tocarSom('warning'); }
  else { metricBackend.classList.remove('alerta'); }
}
let prevCounts = null;
function detectarNovosConteudos(statusData) {
  if (!statusData) return;
  const counts = {
    vod: statusData.vod?.length || 0,
    iptv: statusData.iptv?.length || 0,
    radios: statusData.radios?.length || 0,
    webcams: statusData.webcams?.length || 0
  };
  if (prevCounts && Object.keys(counts).some(k => counts[k] > prevCounts[k])) {
    tocarSom('info'); addPulse(metricConteudos);
  }
  prevCounts = counts;
}

// Atualização principal
async function atualizarDashboard() {
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();

  const t0 = performance.now();
  let statusData = null; let latencia = 0;

  try {
    const endpoint = (window.OMNICAST_API || 'http://localhost:8081') + '/status';
    const res = await fetch(endpoint, { cache: 'no-store' });
    latencia = Math.round(performance.now() - t0);
    if (res.ok) statusData = await res.json();
  } catch {}

  metricBackend.innerHTML = `
    <h3>Backend</h3>
    Status: ${statusData ? '🟢 Online' : '🔴 Offline'}<br>
    Latência: ${latencia} ms<br>
    Última: ${statusData?.generated_at ? new Date(statusData.generated_at).toLocaleTimeString() : '-'}
  `;
  metricRede.innerHTML = `<h3>Rede</h3>Ligação: 🟢<br>Down: 50 Mbps<br>Up: 10 Mbps`;
  metricSistema.innerHTML = `<h3>Sistema</h3>CPU: 35%<br>Memória: 2.1 GB`;

  if (statusData) {
    const cVod = statusData.vod?.length || 0;
    const cIptv = statusData.iptv?.length || 0;
    const cRadios = statusData.radios?.length || 0;
    const cWebcams = statusData.webcams?.length || 0;

    metricConteudos.innerHTML = `<h3>Conteúdos</h3>VOD: ${cVod}<br>IPTV: ${cIptv}<br>Rádios: ${cRadios}<br>Webcams: ${cWebcams}`;

    chartItens.data.datasets[0].data = [cVod, cIptv, cRadios, cWebcams]; chartItens.update();

    atualizaDestaques(statusData); detectarNovosConteudos(statusData);
  }

  chartLatencia.data.labels.push(''); chartLatencia.data.datasets[0].data.push(latencia);
  if (chartLatencia.data.datasets[0].data.length > 60) { chartLatencia.data.datasets[0].data.shift(); chartLatencia.data.labels.shift(); }
  chartLatencia.update();

  const tempoCarregamento = +(performance.now() / 1000).toFixed(2);
  chartCarregamento.data.labels.push(''); chartCarregamento.data.datasets[0].data.push(tempoCarregamento);
  if (chartCarregamento.data.datasets[0].data.length > 60) { chartCarregamento.data.datasets[0].data.shift(); chartCarregamento.data.labels.shift(); }
  chartCarregamento.update();

  verificarAlertas(statusData, latencia);
}

// Configurações Globais
btnAbrirConfig.addEventListener('click', () => {
  painelConfig.style.display = painelConfig.style.display === 'none' ? 'block' : 'none';
  painelConfig.querySelectorAll('input[data-som]').forEach(cb => cb.checked = !!configApp.sonsAtivos[cb.dataset.som]);
  document.getElementById('toggle-update-alert').checked = configApp.updateAlert;
  document.querySelector(`input[name="tema"][value="${configApp.tema}"]`).checked = true;
  document.getElementById('toggle-auto-refresh').checked = configApp.autoRefresh;
});
btnGuardarConfig.addEventListener('click', () => {
  painelConfig.querySelectorAll('input[data-som]').forEach(cb => { configApp.sonsAtivos[cb.dataset.som] = cb.checked; });
  configApp.updateAlert = document.getElementById('toggle-update-alert').checked;
  configApp.tema = document.querySelector('input[name="tema"]:checked').value;
  configApp.autoRefresh = document.getElementById('toggle-auto-refresh').checked;

  document.body.classList.toggle('theme-light', configApp.tema === 'light');
  document.body.classList.toggle('theme-dark', configApp.tema === 'dark');

  localStorage.setItem('configApp', JSON.stringify(configApp));
  atualizarBotaoManual();
  if (configApp.autoRefresh) iniciarAutoRefresh(); else pararAutoRefresh();
  painelConfig.style.display = 'none';
});

// Refresh auto/manual
let refreshIntervalId = null;
function iniciarAutoRefresh() { if (refreshIntervalId) clearInterval(refreshIntervalId); refreshIntervalId = setInterval(atualizarDashboard, INTERVALO_UPDATE_MS); }
function pararAutoRefresh() { if (refreshIntervalId) { clearInterval(refreshIntervalId); refreshIntervalId = null; } }
function atualizarBotaoManual() { btnRefreshManual.style.display = configApp.autoRefresh ? 'none' : 'block'; }
btnRefreshManual.addEventListener('click', atualizarDashboard);

// PWA — aviso de atualização
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'UPDATE_READY' && configApp.updateAlert) { mostrarAvisoAtualizacao(); }
  });
}
function mostrarAvisoAtualizacao() {
  if (document.getElementById('aviso-update')) return;
  const el = document.createElement('div'); el.id = 'aviso-update';
  el.innerHTML = `
    <div class="update-banner">
      <span class="update-text">🚀 Nova versão do Omnicast disponível!</span>
      <div class="update-actions">
        <button class="update-btn">Atualizar</button>
        <button class="update-close" title="Fechar">✖</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.querySelector('.update-btn').addEventListener('click', () => { el.classList.add('fade-out'); setTimeout(() => window.location.reload(true), 300); });
  el.querySelector('.update-close').addEventListener('click', () => { el.classList.add('fade-out'); setTimeout(() => el.remove(), 300); });
}

// Inicialização
mostrarPainel(indiceAtual);
setInterval(() => { indiceAtual = (indiceAtual + 1) % paineis.length; mostrarPainel(indiceAtual); }, INTERVALO_CICLO_MS);
atualizarDashboard();
atualizarBotaoManual();
iniciarAutoRefresh();
