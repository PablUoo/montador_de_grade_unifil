# Funções e variáveis compartilhadas pelos scripts (use: source scripts/_comum.sh)
set -euo pipefail
RAIZ=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$RAIZ"
# shellcheck source=../config/projeto.conf
source config/projeto.conf
INTERIM="$RAIZ/data/interim"   # intermediários do pipeline (local, não versionado)
PIPE="$RAIZ/src/pipeline"
WEB="$RAIZ/src/web"
winpath() { cygpath -w "$1"; }
etapa() { printf '\n▶ %s\n' "$*"; }
