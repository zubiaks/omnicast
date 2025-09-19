# Omnicast Dashboard

[![CI Pipeline](https://github.com/zubiaks/omnicast/actions/workflows/ci.yml/badge.svg)](https://github.com/zubiaks/omnicast/actions/workflows/ci.yml)  
[![Global Coverage](https://codecov.io/gh/zubiaks/omnicast/branch/main/graph/badge.svg)](https://codecov.io/gh/zubiaks/omnicast)  
[![Modules Coverage](https://codecov.io/gh/zubiaks/omnicast/branch/main/graph/badge.svg?flag=modules)](https://codecov.io/gh/zubiaks/omnicast/tree/main/frontend/js/modules)
[![Utils Coverage](https://codecov.io/gh/zubiaks/omnicast/branch/main/graph/badge.svg?flag=utils)](https://codecov.io/gh/zubiaks/omnicast/tree/main/frontend/js/utils)
[![UI Coverage](https://codecov.io/gh/zubiaks/omnicast/branch/main/graph/badge.svg?flag=ui)](https://codecov.io/gh/zubiaks/omnicast/tree/main/frontend/js/ui)
[![Pages Coverage](https://codecov.io/gh/zubiaks/omnicast/branch/main/graph/badge.svg?flag=pages)](https://codecov.io/gh/zubiaks/omnicast/tree/main/frontend/js/pages)
[![Dashboard Coverage](https://codecov.io/gh/zubiaks/omnicast/branch/main/graph/badge.svg?flag=dashboard)](https://codecov.io/gh/zubiaks/omnicast/tree/main/frontend/js/dashboard)
[![Network Coverage](https://codecov.io/gh/zubiaks/omnicast/branch/main/graph/badge.svg?flag=network)](https://codecov.io/gh/zubiaks/omnicast/tree/main/frontend/js/network)

---

## Sobre o projeto

Omnicast Dashboard é uma arquitetura modular para dashboards, media streaming, PWA e integrações de rede.  
Todos os módulos são expostos via `@modules`, disponibilizando funções isoladas e objetos agregados (`xxxModule` ou `xxxManager`) para uso consistente.

---

## Estrutura de módulos

@modules (frontend/js/modules/index.js) 
│ 
├── adaptersManager 
├── configModule 
├── dashboardModule 
├── dataServiceModule 
├── listModule 
├── mediaModule 
├── networkModule 
├── uiModule 
└── utilsModule


---

## Exemplo de fluxo completo

```js
import { configModule, dashboardModule, mediaModule, uiModule } from '@modules'

async function startApp() {
  const cfg = configModule.loadConfig()
  dashboardModule.initDashboard()
  dashboardModule.startPanelCycle()

  try {
    await mediaModule.playStream(cfg.iptvUrl || 'http://demo-stream.m3u8')
    uiModule.showToast('Stream iniciado com sucesso 🎬', 'info')
  } catch {
    uiModule.showToast('Erro ao iniciar stream', 'error')
  }

  uiModule.applyTheme(cfg.tema || 'light')
}

startApp()

Metas de cobertura
Pasta / Camada	Statements	Branches	Functions	Lines
Global	≥ 80%	≥ 75%	≥ 80%	≥ 80%
Modules	≥ 90%	≥ 85%	≥ 90%	≥ 90%
Utils	≥ 95%	≥ 90%	≥ 95%	≥ 95%
UI	≥ 85%	≥ 80%	≥ 85%	≥ 85%
Pages	≥ 80%	≥ 70%	≥ 80%	≥ 80%
Dashboard	≥ 90%	≥ 85%	≥ 90%	≥ 90%
Network	≥ 85%	≥ 80%	≥ 85%	≥ 85%


---

👉 Agora já tens o **README pronto para commit** no `zubiaks/omnicast`.  
O próximo passo natural é **Passo 2**: adicionar o helper `startApp.js` e os testes de integração (positivo e negativo).  

Queres que eu já te entregue a pasta `tests/integration/` com os dois ficheiros de teste prontos para commit?