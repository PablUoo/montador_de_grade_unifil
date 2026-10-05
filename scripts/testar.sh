#!/usr/bin/env bash
# Roda os testes de fumaça sobre public/jobs/dados e public/jobs/exports
source "$(dirname "$0")/_comum.sh"
etapa "Testes"
perl "$RAIZ/tests/verificar_saidas.pl" "$RAIZ"
