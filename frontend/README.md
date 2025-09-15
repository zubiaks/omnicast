🚀 Omnicast — Fluxo Completo de Verificação e Atualização Automática
🛠️ 1. Servidor de Estado (update_status.py)
Função: Recebe payloads JSON, valida e guarda estado/histórico.

O que faz:

✅ Valida com JSON Schema

💾 Guarda estado atual (status.json)

📂 Cria snapshot histórico (historico_TIMESTAMP.json)

📋 Atualiza lista de históricos (lista_historicos.json)

Execução:
python update_status.py

Mantém esta janela aberta — é o servidor que recebe os dados.

🔍 2. Verificação de Adapters (check-adapters.js)
Função: Testa todos os adapters registados e recolhe métricas.

O que faz:

⏱️ Mede tempos de resposta (responseTime) e duração total (executionDuration)

📝 Atualiza o inventário (inventario.json) com bloco adapters

💾 Guarda histórico técnico (inventario-AAAA-MM-DD-HH-mm-ss.json)

📊 Gera CSV consolidado (historico.csv)

📤 3. Envio Automático (send_status_payload.py)
Função: Lê o inventário atualizado e envia para o servidor.

O que faz:

📦 Lê inventario.json

🔗 Junta dados de vod, iptv, radios e webcams

🛠️ Monta payload JSON completo

🌐 Envia via POST para o update_status.py

Execução automática: Integrado no final do check-adapters.js:
import { exec } from 'child_process';
const sendScript = './backend/send_status_payload.py';
exec(`python "${sendScript}"`, (error, stdout, stderr) => {
  if (error) console.error(`[AutoSend] Erro: ${error.message}`);
  if (stderr) console.error(`[AutoSend] STDERR: ${stderr}`);
  console.log(`[AutoSend] Resposta:\n${stdout}`);
});

🔄 4. Processamento no Servidor
update_status.py:

📥 Recebe o payload

✅ Valida com JSON Schema

💾 Guarda status.json (estado atual)

📂 Cria historico_TIMESTAMP.json (snapshot)

📋 Atualiza lista_historicos.json

🌐 5. Frontend
Função: Lê os ficheiros gerados pelo servidor.

O que mostra:

📡 Estado atual dos adapters e conteúdos

📜 Histórico de execuções

📈 Estatísticas e métricas

🎯 Diagrama Visual Estilizado
┌─────────────────────────────┐
│        🟢 check-adapters.js  │
└───────────────┬─────────────┘
                │
                ▼
        🔍 Testa adapters
                │
                ▼
 📝 Atualiza inventario.json (adapters)
                │
                ▼
 💾 Guarda histórico técnico + CSV
                │
                ▼
 📤 Chama send_status_payload.py
                │
                ▼
 📦 Lê inventário + dados frontend
 🛠️ Monta payload JSON
 🌐 POST → update_status.py
                │
                ▼
 ✅ Valida payload
 💾 Guarda status.json
 📂 Cria histórico
 📋 Atualiza lista_historicos.json
                │
                ▼
       🖥️ Frontend atualizado

🚀 Como usar no dia-a-dia
1. Levantar servidor:
python update_status.py

2. Correr verificação:
node check-adapters.js

3. Resultado:

Inventário técnico atualizado

Histórico técnico e CSV

Estado e histórico no servidor

Frontend atualizado automaticamente

✅ Benefícios desta arquitetura
🤖 Automatização total: do teste de adapters até à atualização do frontend

📚 Histórico duplo: técnico e funcional

📊 Métricas detalhadas: tempos de resposta, erros, número de itens

🚀 Pronto para escalar: fácil adicionar novos adapters ou endpoints