from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import time
from datetime import datetime

# =========================
# CONFIGURAÇÕES
# =========================
HOST = "0.0.0.0"
PORT = 8081

# Diretório de dados definido pelo .bat ou valor por defeito
DATA_DIR = os.environ.get("STATUS_DATA_DIR")
if not DATA_DIR:
    BASE_DIR = os.path.dirname(__file__)
    DATA_DIR = os.path.join(BASE_DIR, "assets", "data")

# Número máximo de históricos (configurável via variável de ambiente)
MAX_HISTORICOS = int(os.environ.get("STATUS_MAX_HISTORICOS", "100"))

# Modo debug (ativar com STATUS_DEBUG=true)
DEBUG = os.environ.get("STATUS_DEBUG", "false").lower() == "true"

# Criar pasta se não existir
os.makedirs(DATA_DIR, exist_ok=True)

# =========================
# FUNÇÕES AUXILIARES
# =========================
def log_debug(msg):
    if DEBUG:
        print(f"[DEBUG] {msg}")

def write_json_atomic(path, obj):
    """Escreve JSON de forma atómica para evitar ficheiros corrompidos."""
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)
    log_debug(f"Ficheiro escrito: {path}")

# =========================
# DADOS DEMO (substituir por dados reais)
# =========================
def gerar_vod_demo():
    return [
        {
            "id": "vod001",
            "name": "Filme Exemplo",
            "category": "Ação",
            "thumb": "/assets/img/vod/filme-exemplo.jpg",
            "streamUrl": "http://servidor/filme-exemplo.m3u8"
        }
    ]

def gerar_iptv_demo():
    return [
        {
            "id": "iptv001",
            "name": "Canal Notícias",
            "country": "PT",
            "category": "Notícias",
            "logo": "/assets/img/iptv/noticias.png",
            "streamUrl": "http://servidor/canal-noticias.m3u8",
            "status": "online"
        }
    ]

def gerar_radios_demo():
    return [
        {
            "Nome": "Rádio Exemplo",
            "Estado": "online",
            "Pontuação": 5,
            "Tempo de Resposta": "120ms",
            "Bitrate": "128kbps",
            "Género": "Pop",
            "Música Atual": "Música de Exemplo"
        }
    ]

def gerar_webcams_demo():
    return [
        {
            "id": "cam001",
            "name": "Praia Central",
            "location": "Lisboa",
            "thumb": "/assets/img/webcams/praia-central.jpg",
            "streamUrl": "http://servidor/praia-central.m3u8"
        }
    ]

# =========================
# HANDLER HTTP
# =========================
class Handler(BaseHTTPRequestHandler):
    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        if self.path == "/status":
            status_path = os.path.join(DATA_DIR, "status.json")
            if os.path.exists(status_path):
                with open(status_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return self._send_json(200, data)
            else:
                return self._send_json(404, {"status": "erro", "mensagem": "status.json não encontrado"})
        else:
            return self._send_json(404, {"status": "erro", "mensagem": "Endpoint não encontrado"})

    def do_POST(self):
        if self.path != "/update_status":
            return self._send_json(404, {"status": "erro", "mensagem": "Endpoint não encontrado"})

        try:
            length = int(self.headers.get('Content-Length', '0'))
            payload = self.rfile.read(length) if length else b'{}'

            try:
                status_data = json.loads(payload.decode('utf-8') or '{}')
            except json.JSONDecodeError:
                return self._send_json(400, {"status": "erro", "mensagem": "JSON inválido"})

            # Acrescenta timestamp
            status_data.setdefault("generated_at", int(time.time() * 1000))

            # Acrescenta blocos para todas as secções
            status_data["vod"] = gerar_vod_demo()
            status_data["iptv"] = gerar_iptv_demo()
            status_data["radios"] = gerar_radios_demo()
            status_data["webcams"] = gerar_webcams_demo()

            # Guarda estado atual
            write_json_atomic(os.path.join(DATA_DIR, "status.json"), status_data)

            # Guarda histórico
            historico_nome = f"historico_{int(time.time()*1000)}.json"
            write_json_atomic(os.path.join(DATA_DIR, historico_nome), status_data)

            # Atualiza lista de históricos
            historicos = sorted([f for f in os.listdir(DATA_DIR) if f.startswith("historico_")])
            if len(historicos) > MAX_HISTORICOS:
                for old in historicos[:-MAX_HISTORICOS]:
                    os.remove(os.path.join(DATA_DIR, old))
                    log_debug(f"Histórico removido: {old}")
                historicos = historicos[-MAX_HISTORICOS:]
            write_json_atomic(os.path.join(DATA_DIR, "lista_historicos.json"), historicos)

            print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] [STATUS] Atualizado e registado em {historico_nome}")
            return self._send_json(200, {"status": "ok", "ficheiro": historico_nome})

        except Exception as e:
            return self._send_json(500, {"status": "erro", "mensagem": str(e)})

    def log_message(self, format, *args):
        if DEBUG:
            super().log_message(format, *args)
        else:
            return  # silencia logs padrão

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    print(f"[INFO] Atualizador a correr em http://{HOST}:{PORT}")
    print(f"[INFO] Pasta de dados: {DATA_DIR}")
    print(f"[INFO] Máx. históricos: {MAX_HISTORICOS}")
    if DEBUG:
        print("[INFO] Modo DEBUG ativo")
    HTTPServer((HOST, PORT), Handler).serve_forever()
