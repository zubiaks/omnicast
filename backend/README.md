# Backend

Este diretório contém os scripts Python responsáveis por atualizar o estado dos streams (IPTV, VOD, Webcams, Rádio) e enviar payloads para o serviço de status.

---

## Estrutura

backend/ ├─ core/ │ └─ inventario.json Inventário de adapters e dados estáticos ├─ scripts/ │ ├─ send_status_payload.py Lê inventário e envia payload ao endpoint de status │ └─ update_status.py Recebe e processa atualizações de status (template) ├─ requirements.txt Dependências Python └─ README.md Esta documentação

Código

## Pré-requisitos

- Python 3.8 ou superior  
- Git (para clonar o repositório)

---

## Instalação e Setup

1. Clone o repositório e acesse o diretório `backend`:
   ```bash
   git clone https://github.com/seu-usuario/omnicast-dashboard.git
   cd omnicast-dashboard/backend
Crie um ambiente virtual e ative-o:

bash
python3 -m venv .venv
source .venv/bin/activate      # Linux/macOS
.venv\Scripts\activate         # Windows
Instale as dependências:

bash
pip install -r requirements.txt
Variáveis de Ambiente
Defina antes de rodar os scripts, via arquivo .env ou export no shell:

dotenv
STATUS_API_URL=https://api.omnicast.local/update_status
STATUS_API_KEY=abcdef123456
Uso
Lendo o inventário e enviando payload
bash
python scripts/send_status_payload.py
Este script:

Lê core/inventario.json

Monta o JSON de payload (adapters, listas VOD/IPTV/Webcam/Rádio e timestamp)

Envia via POST para STATUS_API_URL com cabeçalhos adequados

Processando atualizações de status
bash
python scripts/update_status.py
Este script atua como template de servidor HTTP para receber, validar e registrar atualizações de status.

Inventário
O arquivo core/inventario.json deve seguir este formato mínimo:

json
{
  "adapters": {
    "vod":    [ /* ... */ ],
    "iptv":   [ /* ... */ ],
    "radios": [ /* ... */ ],
    "webcams":[ /* ... */ ]
  }
}
Atualize este JSON sempre que adicionar ou remover pontos de ingestão.

Testes
No momento não há testes automatizados. Para adicionar:

Instale o pytest:

bash
pip install pytest
Crie arquivos em tests/test_*.py e execute:

bash
pytest --verbose
Contribuição
Siga as convenções de commit definidas no repositório (feat(scope): descrição…).

Documente novos scripts em README.md.

Abra issues ou PRs detalhando o propósito das mudanças.