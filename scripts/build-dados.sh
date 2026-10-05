#!/usr/bin/env bash
# Pipeline de dados: PDF da oferta -> public/jobs/ofertas/<BIMESTRE>.xlsx
# Uso: scripts/build-dados.sh            (usa BIMESTRE e GRADE_PDF de config/projeto.conf)
#      scripts/build-dados.sh B1-2026 assets/ofertas-B1-2026.pdf
source "$(dirname "$0")/_comum.sh"
BIM="${1:-$BIMESTRE}"; PDF="$RAIZ/${2:-$GRADE_PDF}"
[ -f "$PDF" ] || { echo "PDF não encontrado: $PDF (ajuste config/projeto.conf)"; exit 1; }
mkdir -p "$INTERIM"
cd "$INTERIM"
find . -mindepth 1 -delete   # limpa só o conteúdo (a pasta pode estar aberta em outro programa)

etapa "Extração 1/3 · texto do PDF ($BIM)"
pdftotext -q -enc UTF-8 -raw "$PDF" raw.txt
PAGINAS=$(( $(grep -c $'\f' raw.txt) + 1 ))

etapa "Extração 2/3 · células dia × horário ($PAGINAS páginas, 1-3 min)"
export GRADE_PDF="$PDF"
seq 1 "$PAGINAS" | xargs -P "$PAGINAS" -I{} perl "$PIPE/extracao/extrair_celulas.pl" {} > extrair.log 2>&1

etapa "Extração 3/3 · aulas e atividades digitais"
perl "$PIPE/extracao/ler_aulas.pl"
perl "$PIPE/extracao/ler_digitais.pl"

etapa "Transformação · tabelas e oferta pública"
perl "$PIPE/transformacao/montar_tabelas.pl"
EXTRA=()
if [ -f "$RAIZ/$PENDENTES_XLSX" ]; then
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(winpath "$PIPE/excel/ler_pendentes.ps1")" \
    -xlsx "$(winpath "$RAIZ/$PENDENTES_XLSX")" -out "$(winpath "$INTERIM/pend.tsv")" -outCh "$(winpath "$INTERIM/ch.tsv")"
  EXTRA=("$INTERIM/ch.tsv")
fi
perl "$PIPE/transformacao/montar_oferta_publica.pl" "$PIPE/referencia/carga_horaria.csv" "${EXTRA[@]}"

etapa "Excel · $OFERTAS_DIR/$BIM.xlsx"
mkdir -p "$RAIZ/$OFERTAS_DIR"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(winpath "$PIPE/excel/escrever_oferta.ps1")" \
  -dir "$(winpath "$INTERIM")" -out "$(winpath "$RAIZ/$OFERTAS_DIR/$BIM.xlsx")"
