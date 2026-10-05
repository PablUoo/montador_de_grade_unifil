# Montador de Grade UniFil

Monte sua grade de segunda a sábado (19:00–20:30 e 20:45–22:15) com as disciplinas ofertadas em cada bimestre para Ciência da Computação e Engenharia de Software.

**Acesse:** https://pabluoo.github.io/montador_de_grade_unifil/

## O que dá para fazer

- **Escolher o bimestre** (B1-2026 … B4-2026): a página carrega as ofertas daquele bimestre.
- **Importar suas pendências:** um Excel com a coluna **Código** (ex.: `INAR230002`). As pendências ofertadas viram prioridade, em destaque rosa.
- **Montar a grade respeitando a carga horária:** cada horário vale 15h. Disciplina de 15h ocupa 1 horário e de 30h ocupa 2. Com a C.H. completa, ela some das opções.
- **Filtrar** por curso, turma, código, busca ou "Só pendentes".
- **Exportar** em PDF ou Excel, com nome, matrícula e turma do aluno. Também dá para **salvar e carregar** a grade.

Tudo roda no navegador: as pendências, a grade e os dados do aluno ficam só no seu computador.

## Estrutura

```
├── public/                     SITE (publicado no GitHub Pages)
│   ├── index.html                  página única, gerada por scripts/build-web.sh
│   └── jobs/ofertas/
│       ├── index.json              bimestres e quais já têm oferta
│       └── B4-2026.xlsx            ofertas do bimestre (abas "Aulas" e "Digitais")
├── src/
│   ├── web/                        código da página: index.html, css/, js/{core,io,ui}
│   └── pipeline/                   PDF da faculdade → planilha de ofertas do bimestre
├── scripts/                    build.sh · build-dados.sh · build-web.sh · testar.sh · servir.sh
├── config/projeto.conf         bimestre, PDF de entrada e saídas
├── assets/                     entradas locais (PDF, planilha pessoal) — fora do Git
├── docs/                       ARQUITETURA.md · COMO-USAR.md
└── tests/verificar_saidas.pl   testes de fumaça (dados, site e privacidade)
```

## Desenvolvimento

Requisitos: Git for Windows (Git Bash, Perl, `pdftotext`) e Microsoft Excel. O Excel só é necessário para gerar ofertas a partir do PDF.

```bash
./scripts/build.sh        # PDF do bimestre (config) -> public/jobs/ofertas/<bimestre>.xlsx + site + testes
./scripts/build-web.sh    # só o site (depois de mexer em src/web)
./scripts/servir.sh       # abre http://localhost:8080 para testar
```

Veja [docs/COMO-USAR.md](docs/COMO-USAR.md) e [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
