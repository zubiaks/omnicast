#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import logging
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_DIR        = Path(__file__).parent.parent
INVENTARIO_FILE = BASE_DIR / "core" / "inventario.json"
API_URL         = os.getenv("STATUS_API_URL", "http://localhost:8081/update_status")
API_KEY         = os.getenv("STATUS_API_KEY", "")

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(asctime)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

def load_inventario(path: Path) -> dict:
    if not path.exists():
        logging.error("Inventário não encontrado: %s", path)
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        logging.error("JSON inválido em %s: %s", path, e)
        return {}

def build_payload(inventario: dict) -> dict:
    now_ms   = int(time.time() * 1000)
    adapters = inventario.get("adapters", {})
    return {
        "generated_at": now_ms,
        "vod":     adapters.get("vod", []),
        "iptv":    adapters.get("iptv", []),
        "radios":  adapters.get("radios", []),
        "webcams": adapters.get("webcams", [])
        # removido "adapters" para não quebrar o schema
    }

def send_payload(payload: dict) -> None:
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["X-API-Key"] = API_KEY

    try:
        resp = requests.post(API_URL, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        logging.info("Enviado com êxito: %s %s", resp.status_code, resp.text)
    except requests.HTTPError as http_err:
        # Mostra o corpo da resposta de erro para entender o motivo exato
        logging.error("HTTP %s: %s", http_err.response.status_code, http_err.response.text)
    except requests.RequestException as e:
        logging.error("Falha ao enviar payload: %s", e)

def main():
    inventario = load_inventario(INVENTARIO_FILE)
    if not inventario:
        return

    payload = build_payload(inventario)
    send_payload(payload)

if __name__ == "__main__":
    main()
