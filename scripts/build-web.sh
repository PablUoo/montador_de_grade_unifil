#!/usr/bin/env bash
# Monta o site do GitHub Pages: public/index.html (página única) + public/jobs/ofertas/index.json
source "$(dirname "$0")/_comum.sh"

# ordem importa: core -> io -> ui -> main
MODULOS=(
  "$WEB/js/core/util.js" "$WEB/js/core/dominio.js" "$WEB/js/core/estado.js"
  "$WEB/js/io/ofertas.js" "$WEB/js/io/pendencias.js"
  "$WEB/js/ui/filtros.js" "$WEB/js/ui/pendencias.js" "$WEB/js/ui/grade.js" "$WEB/js/ui/seletor.js"
  "$WEB/js/ui/resumo.js" "$WEB/js/ui/digitais.js" "$WEB/js/ui/acoes.js" "$WEB/js/ui/bimestre.js"
  "$WEB/js/io/arquivos.js" "$WEB/js/main.js"
)
LIBS='<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>'

etapa "Web · índice de ofertas"
mkdir -p "$RAIZ/$OFERTAS_DIR"
DISP=$(cd "$RAIZ/$OFERTAS_DIR" && ls -1 *.xlsx 2>/dev/null | sed 's/\.xlsx$//' | sort || true)
json_lista() { local primeiro=1; printf '['; for x in "$@"; do [ $primeiro = 1 ] || printf ', '; printf '"%s"' "$x"; primeiro=0; done; printf ']'; }
# shellcheck disable=SC2086
TODOS=$(printf '%s\n' $BIMESTRES $DISP | awk 'NF && !v[$0]++')
# shellcheck disable=SC2086
{ printf '{\n  "bimestres": %s,\n' "$(json_lista $TODOS)"
  printf '  "disponiveis": %s\n}\n' "$(json_lista $DISP)"; } > "$RAIZ/$OFERTAS_DIR/index.json"
cat "$RAIZ/$OFERTAS_DIR/index.json"

etapa "Web · montando $SAIDA_PAGINA"
SAIDA="$RAIZ/$SAIDA_PAGINA"
mkdir -p "$(dirname "$SAIDA")"
while IFS= read -r linha; do
  case "$linha" in
    '/*@@ESTILOS@@*/') cat "$WEB/css/estilos.css" ;;
    '<!--@@SCRIPTS@@-->') printf '%s\n<script>\n' "$LIBS"; cat "${MODULOS[@]}"; printf '</script>\n' ;;
    *) printf '%s\n' "$linha" ;;
  esac
done < "$WEB/index.html" > "$SAIDA"
touch "$RAIZ/public/.nojekyll"
echo "ok: $(wc -c < "$SAIDA") bytes"
