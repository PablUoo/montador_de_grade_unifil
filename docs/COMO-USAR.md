# Como usar

## Montar a grade

1. Abra https://pabluoo.github.io/montador_de_grade_unifil/.
2. **Escolha o bimestre** (B1-2026 … B4-2026). Os que ainda não têm oferta aparecem desativados.
3. Preencha **nome, matrícula e turma**. Eles saem no PDF, no Excel e no nome dos arquivos exportados.
4. **Importe suas pendências** em "Importar pendências (.xlsx)".
5. Clique no **+** de um horário e escolha a disciplina. As pendentes aparecem primeiro, em rosa.
   - Cada horário vale **15h**: disciplina de 15h ocupa 1 horário e de 30h ocupa 2.
   - A página completa os outros horários da mesma turma até fechar a C.H.
   - Com a C.H. completa, a disciplina some das opções dos outros horários.
6. Marque as **atividades digitais** que vai fazer.

### Planilha de pendências

| Coluna | Obrigatória | Exemplo |
|---|---|---|
| Código | sim | `INAR230002` |
| Disciplina | não | Inteligência Artificial: Algoritmos evolutivos |
| C.H. | não | 30 |

- O botão "Baixar modelo" gera uma planilha nesse formato.
- A planilha de pendências do portal também funciona. Se ela tiver a coluna **STATUS**, entram só as linhas `PENDENTE`.

## Guardar e reabrir

| Botão | O que faz |
|---|---|
| Salvar PDF | Página 1: quadro da semana + atividades digitais. Página 2: resumo geral. Página 3 em diante: pendências e situação de cada uma |
| Exportar Excel | Abas Grade, Lista, Atividades Digitais e Pendências (também serve para reabrir) |
| Salvar grade | Arquivo `.json` com a grade, o bimestre e os dados do aluno |
| Carregar grade | Reabre a partir do `.json` ou do Excel exportado; troca para o bimestre do arquivo se precisar |

Os arquivos saem com o nome `Nome-do-Aluno_Matricula_Turma_B4-2026.pdf`.

## Publicar a oferta de um novo bimestre

1. Coloque o PDF em `assets/` (ex.: `assets/ofertas-B1-2026.pdf`).
2. No Git Bash, na raiz do projeto:

   ```bash
   ./scripts/build.sh B1-2026 assets/ofertas-B1-2026.pdf
   ```

   Isso gera `public/jobs/ofertas/B1-2026.xlsx`, atualiza o `index.json`, monta o site e roda os testes.
3. Suba para o GitHub:

   ```bash
   git add public && git commit -m "Oferta B1-2026" && git push
   ```

   O GitHub Actions publica o site sozinho.

As ofertas vêm só do próprio projeto: a página lê os arquivos de `public/jobs/ofertas/`. Formato atual da planilha gerada (pode mudar quando houver um padrão oficial):

- **Aulas:** Código, Disciplina, Dia (Segunda-feira … Sábado), Horário (`19:00 - 20:30` ou `20:45 - 22:15`), Turma (ex.: `E1/2026`), Curso (`CC`/`ES`), Sala, Professor, Tipo, C.H., Classroom (código do Google Classroom, aparece nos quadros, no PDF e no Excel)
- **Digitais:** Código, Disciplina, Turma, Curso, Professor, C.H.

## Testar localmente

```bash
./scripts/servir.sh
```

Abrir o `public/index.html` direto (duplo clique) não carrega as ofertas, porque o navegador bloqueia leitura de arquivos locais. Use sempre o `servir.sh` ou o site publicado.
