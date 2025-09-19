#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_status.py

Servidor HTTP que recebe o payload de status, valida com JSON Schema,
salva o estado atual e mantém um histórico limitado.
"""

import os
import json
import time
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from jsonschema import validate, ValidationError

# Carrega variáveis de ambiente de .env
load_dotenv()

# Configurações
HOST           = "0.0.0.0"
PORT           = int(os.getenv("STATUS_PORT", "8081"))
API_KEY        = os.getenv("STATUS_API_KEY", "")
DATA_DIR       = Path(os.getenv("STATUS_DATA_DIR", "")) or Path(__file__).parent.parent / "frontend" / "assets" / "data"
MAX_HISTORICOS = int(os.getenv("STATUS_MAX_HISTORICOS", "100"))
DEBUG          = os.getenv("STATUS_DEBUG", "false").lower() == "true"
LOG_FILE       = os.getenv("STATUS_LOG_FILE", "")

DATA_DIR.mkdir(parents=True, exist_ok=True)

# Logging
logging.basicConfig(
    level    = logging.DEBUG if DEBUG else logging.INFO,
    format   = "[%(levelname)s] %(asctime)s %(message)s",
    datefmt  = "%Y-%m-%d %H:%M:%S",
    handlers = [logging.FileHandler(LOG_FILE) if LOG_FILE else logging.StreamHandler()]
)

# JSON Schema de validação (sem validação de 'adapters')
STATUS_SCHEMA = {
    "type": "object",
    "properties": {
        "generated_at": {"type": "integer", "minimum": 0},
        "vod":    {"type": "array", "items": {"type": "object"}},
        "iptv":   {"type": "array", "items": {"type": "object"}},
        "radios": {"type": "array", "items": {"type": "object"}},
        "webcams": {"type": "array", "items": {"type": "object"}}
    },
    "required": ["vod", "iptv", "radios", "webcams"]
}

def write_json_atomic(path: Path, data: dict):
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)
    logging.debug("Escrito: %s", path)

def list_historicos() -> list:
    files = [
        f for f in os.listdir(DATA_DIR)
        if f.startswith("historico_") and f.endswith(".json")
    ]
    return sorted(files, key=lambda fn: int(fn.split("_")[1].split(".")[0]))

class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(body, ensure_ascii=False).encode("utf-8"))

    def _auth(self) -> bool:
        if API_KEY and self.headers.get("X-API-Key") != API_KEY:
            self._send(403, {"status": "erro", "mensagem": "Chave inválida"})
            return False
        return True

    def do_OPTIONS(self):
        self._send(200, {})

    def do_GET(self):
        if self.path == "/status":
            path = DATA_DIR / "status.json"
            if path.exists():
                data = json.loads(path.read_text(encoding="utf-8"))
                return self._send(200, data)
            return self._send(404, {"status": "erro", "mensagem": "status.json não encontrado"})

        if self.path == "/historicos":
            return self._send(200, {"historicos": list_historicos()})

        return self._send(404, {"status": "erro", "mensagem": "Endpoint não encontrado"})

    def do_POST(self):
        if self.path != "/update_status":
            return self._send(404, {"status": "erro", "mensagem": "Endpoint não encontrado"})
        if not self._auth():
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return self._send(400, {"status": "erro", "mensagem": "JSON inválido"})

        data.setdefault("generated_at", int(time.time() * 1000))

        try:
            validate(instance=data, schema=STATUS_SCHEMA)
        except ValidationError as ve:
            return self._send(400, {"status": "erro", "mensagem": f"Schema inválido: {ve.message}"})

        # Salva status atual
        write_json_atomic(DATA_DIR / "status.json", data)

        # Cria histórico
        stamp = int(time.time() * 1000)
        nome = f"historico_{stamp}.json"
        write_json_atomic(DATA_DIR / nome, data)

        historicos = list_historicos()
        # Rotaciona históricos excedentes
        if len(historicos) > MAX_HISTORICOS:
            for old in historicos[:-MAX_HISTORICOS]:
                (DATA_DIR / old).unlink(missing_ok=True)
                logging.debug("Removido histórico: %s", old)
            historicos = historicos[-MAX_HISTORICOS:]

        write_json_atomic(DATA_DIR / "lista_historicos.json", {"historicos": historicos})
        logging.debug("Atualizado e registado: %s", nome)

        return self._send(200, {
            "status": "ok",
            "ficheiro": nome,
            "total_historicos": len(historicos)
        })

    def log_message(self, format, *args):
        if DEBUG:
            super().log_message(format, *args)

if __name__ == "__main__":
    logging.info("Servidor rodando em http://%s:%s", HOST, PORT)
    if API_KEY:
        logging.info("Protegido por API_KEY")
    if DEBUG:
        logging.info("Modo DEBUG ativo")
    try:
        HTTPServer((HOST, PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        logging.info("Servidor encerrado pelo usuário")
