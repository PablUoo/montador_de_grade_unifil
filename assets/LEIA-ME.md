# assets/ (só local, não vai para o Git)

Coloque aqui as entradas do pipeline:

- `ofertas-<BIMESTRE>.pdf`: PDF da grade ofertada pela faculdade (ex.: `ofertas-B4-2026.pdf`)
- `Pendentes.xlsx` (opcional): sua planilha do portal. O pipeline só aproveita dela a carga horária das disciplinas.

O build também gera aqui:

- `classroom-<BIMESTRE>.xlsx`: códigos do Google Classroom de cada aula e turma. Na página, use "Importar códigos do Classroom" (passo 3) para eles aparecerem nos quadros, no PDF e no Excel. Ficam só no seu navegador.

Esses arquivos ficam fora do repositório porque o PDF tem nomes de representantes de turma e códigos de Google Classroom, e a planilha tem nome e matrícula.
