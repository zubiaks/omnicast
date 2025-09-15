#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
import time
import requests
from datetime import datetime

# =========================
# CONFIGURAÇÕES
# =========================
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INVENTARIO_PATH = os.path.join(BASE_DIR, "core", "inventario.json")

API_URL = os.environ.get("STATUS_API_URL", "http://localhost:8081/update_status")
API_KEY = os.environ.get("STATUS_API_KEY", "")  # se definido no servidor

# =========================
# FUNÇÃO PRINCIPAL
# =========================
def main():
    # Lê inventário real
    if not os.path.exists(INVENTARIO_PATH):
        print(f"[ERRO] Inventário não encontrado em {INVENTARIO_PATH}")
        return

    with open(INVENTARIO_PATH, "r", encoding="utf-8") as f:
        inventario = json.load(f)

    adapters_data = inventario.get("adapters", {})

    # Monta payload
    payload = {
        "generated_at": int(time.time() * 1000),
        "vod": [
            {"id": "vod1", "name": "Filme Exemplo", "url": "https://exemplo.com/vod1.m3u8"}
        ],
        "iptv": [
            {"id": "live1", "name": "Canal Exemplo", "url": "https://exemplo.com/live1.m3u8"}
        ],
        "radios": [
            {"id": "radio1", "name": "Rádio Exemplo", "url": "https://exemplo.com/stream.mp3"}
        ],
        "webcams": [
            {"id": "cam1", "name": "Praia Exemplo", "url": "https://exemplo.com/cam1.m3u8"}
        ],
        "adapters": adapters_data
    }

    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["X-API-Key"] = API_KEY

    # Envia para o servidor
    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        print(f"[INFO] Resposta {resp.status_code}: {resp.text}")
    except requests.RequestException as e:
        print(f"[ERRO] Falha ao enviar payload: {e}")

if __name__ == "__main__":
    main()
