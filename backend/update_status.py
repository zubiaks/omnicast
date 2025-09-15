#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import time
from datetime import datetime
from jsonschema import validate, ValidationError

# =========================
# CONFIGURAÇÕES
# =========================
HOST = "0.0.0.0"
PORT = int(os.environ.get("STATUS_PORT", "8081"))

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.environ.get("STATUS_DATA_DIR") or os.path.join(BASE_DIR, "frontend", "assets", "data")

MAX_HISTORICOS = int(os.environ.get("STATUS_MAX_HISTORICOS", "100"))
DEBUG = os.environ.get("STATUS_DEBUG", "false").lower() == "true"
API_KEY = os.environ.get("STATUS_API_KEY", "")
LOG_FILE = os.environ.get("STATUS_LOG_FILE", "")

os.makedirs(DATA_DIR, exist_ok=True)

# =========================
# SCHEMA DE VALIDAÇÃO
# =========================
STATUS_SCHEMA = {
    "type": "object",
    "properties": {
        "generated_at": {"type": "integer", "minimum": 0},
        "vod": {"type": "array", "items": {"type": "object"}},
        "iptv": {"type": "array", "items": {"type": "object"}},
        "radios": {"type": "array", "items": {"type": "object"}},
        "webcams": {"type": "array", "items": {"type": "object"}},
        # Bloco opcional para integração com inventário do core
        "adapters": {
            "type": "object",
            "additionalProperties": {
                "type": "object",
                "properties": {
                    "status": {"type": "string"},
                    "items": {"type": "integer"},
                    "lastCheck": {"type": ["string", "null"]},
                    "error": {"type": ["string", "null"]},
                    "errorType": {"type": "string"},
                    "responseTime": {"type": ["integer", "string"]},
                    "executionDuration": {"type": ["integer", "string"]}
                }
            }
        }
    },
    "required": ["vod", "iptv", "radios", "webcams"]
}

# =========================
# FUNÇÕES AUXILIARES
# =========================
def log_debug(msg):
    ts = f"{datetime.now():%Y-%m-%d %H:%M:%S}"
    if DEBUG:
        print(f"[DEBUG] {ts} {msg}")
    if LOG_FILE:
        with open(LOG_FILE, "a", encoding="utf-8") as lf:
            lf.write(f"{ts} {msg}\n")

def write_json_atomic(path, obj):
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)
    log_debug(f"Ficheiro escrito: {path}")

def list_historicos():
    return sorted(
        [f for f in os.listdir(DATA_DIR) if f.startswith("historico_") and f.endswith(".json")],
        key=lambda fn: int(fn.split("_")[1].split(".")[0])
    )

# =========================
# HANDLER HTTP
# =========================
class Handler(BaseHTTPRequestHandler):
    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _check_api_key(self):
        if API_KEY and self.headers.get("X-API-Key") != API_KEY:
            self._send_json(403, {"status": "erro", "mensagem": "Chave de API inválida"})
            return False
        return True

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
        self.end_headers()

    def do_GET(self):
        if self.path == "/status":
            status_path = os.path.join(DATA_DIR, "status.json")
            if os.path.exists(status_path):
                try:
                    with open(status_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    return self._send_json(200, data)
                except Exception as e:
                    return self._send_json(500, {"status": "erro", "mensagem": f"Falha a ler status.json: {e}"})
            else:
                return self._send_json(404, {"status": "erro", "mensagem": "status.json não encontrado"})

        elif self.path == "/historicos":
            return self._send_json(200, list_historicos())

        else:
            return self._send_json(404, {"status": "erro", "mensagem": "Endpoint não encontrado"})

    def do_POST(self):
        if self.path != "/update_status":
            return self._send_json(404, {"status": "erro", "mensagem": "Endpoint não encontrado"})

        if not self._check_api_key():
            return

        try:
            length = int(self.headers.get('Content-Length', '0'))
            payload = self.rfile.read(length) if length else b'{}'

            try:
                status_data = json.loads(payload.decode('utf-8') or '{}')
            except json.JSONDecodeError:
                return self._send_json(400, {"status": "erro", "mensagem": "JSON inválido"})

            status_data.setdefault("generated_at", int(time.time() * 1000))

            # Validação de schema
            try:
                validate(instance=status_data, schema=STATUS_SCHEMA)
            except ValidationError as ve:
                return self._send_json(400, {"status": "erro", "mensagem": f"Schema inválido: {ve.message}"})

            # Guarda estado atual
            write_json_atomic(os.path.join(DATA_DIR, "status.json"), status_data)

            # Guarda histórico
            historico_nome = f"historico_{int(time.time()*1000)}.json"
            write_json_atomic(os.path.join(DATA_DIR, historico_nome), status_data)

            # Atualiza lista de históricos
            historicos = list_historicos()
            if len(historicos) > MAX_HISTORICOS:
                for old in historicos[:-MAX_HISTORICOS]:
                    try:
                        os.remove(os.path.join(DATA_DIR, old))
                        log_debug(f"Histórico removido: {old}")
                    except Exception as e:
                        log_debug(f"Falha ao remover histórico {old}: {e}")
                historicos = historicos[-MAX_HISTORICOS:]
            write_json_atomic(os.path.join(DATA_DIR, "lista_historicos.json"), historicos)

            # Log extra se tiver bloco adapters
            if "adapters" in status_data:
                for aid, info in status_data["adapters"].items():
                    log_debug(f"[Adapter] {aid} — {info.get('status')} — {info.get('items')} itens — "
                              f"Resp: {info.get('responseTime')}ms — Dur: {info.get('executionDuration')}ms — "
                              f"Erro: {info.get('error')} ({info.get('errorType')})")

            log_debug(f"[STATUS] Atualizado e registado em {historico_nome}")
            return self._send_json(200, {
                "status": "ok",
                "ficheiro": historico_nome,
                "total_historicos": len(historicos)
            })

        except Exception as e:
            return self._send_json(500, {"status": "erro", "mensagem": str(e)})

    def log_message(self, format, *args):
        if DEBUG:
            super().log_message(format, *args)
        else:
            return

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    print(f"[INFO] Atualizador a correr em http://{HOST}:{PORT}")
    print(f"[INFO] Pasta de dados: {DATA_DIR}")
    print(f"[INFO] Máx. históricos: {MAX_HISTORICOS}")
    if API_KEY:
        print("[INFO] Protegido com chave de API")
    if DEBUG:
        print("[INFO] Modo DEBUG ativo")
    try:
        HTTPServer((HOST, PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Servidor encerrado pelo utilizador.")
