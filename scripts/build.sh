#!/usr/bin/env bash
# Build completo: oferta do bimestre (config) + site + testes
set -euo pipefail
DIR=$(dirname "$0")
"$DIR/build-dados.sh" "$@"
"$DIR/build-web.sh"
"$DIR/testar.sh"
echo; echo "Pronto. Site em public/ (rode scripts/servir.sh para abrir local, ou publique no GitHub Pages)."
