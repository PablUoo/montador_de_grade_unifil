#!/usr/bin/env bash
# Abre o site (public/) em http://localhost:8080 para testar antes de subir
source "$(dirname "$0")/_comum.sh"
PORTA="${1:-8080}"
start "http://localhost:$PORTA/" 2>/dev/null || true
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(winpath "$RAIZ/scripts/servir.ps1")" -porta "$PORTA"
