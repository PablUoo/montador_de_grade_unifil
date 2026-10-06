// core/estado.js — grade escolhida (uma por bimestre), dados do aluno e persistência no navegador
const CHAVE_GRADE = b => `montador-grade:${b}`;
const CHAVE_ALUNO = 'montador-grade:aluno';
const CHAVE_BIMESTRE = 'montador-grade:bimestre';
const CHAVE_LEGADA = 'grade-2026-v2';   // versão anterior (uma grade só, do B4-2026)
const ALUNO_VAZIO = () => ({ nome: '', mat: '', turma: '' });

const lerJSON = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const gravarJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let BIM = '';   // bimestre aberto, ex.: B4-2026
let state = { sel: {}, dig: [], aluno: { ...ALUNO_VAZIO(), ...(lerJSON(CHAVE_ALUNO) || lerJSON(CHAVE_LEGADA)?.aluno || {}) } };

// abre a grade salva do bimestre (descarta escolhas que não existem na oferta carregada)
function carregarGradeSalva(b) {
  let s = lerJSON(CHAVE_GRADE(b));
  if (!s && b === 'B4-2026') s = lerJSON(CHAVE_LEGADA);
  state.sel = {}; state.dig = [];
  for (const [k, id] of Object.entries(s?.sel || {})) {
    if (BY_ID[id]) { state.sel[k] = id; continue; }
    // grade salva antes de as ofertas serem separadas por Classroom: escolhe a turma do aluno, se houver
    const cand = OFERTAS.filter(o => o.id.startsWith(id + '|'));
    const tAluno = (state.aluno.turma || '').trim().toUpperCase();
    const pick = cand.find(o => tAluno && o.t.some(t => t.toUpperCase() === tAluno)) || cand[0];
    if (pick) state.sel[k] = pick.id;
  }
  state.dig = (s?.dig || []).filter(id => DIGITAIS.some(x => x.id === id));
}
const save = () => {
  if (BIM) gravarJSON(CHAVE_GRADE(BIM), { sel: state.sel, dig: state.dig });
  gravarJSON(CHAVE_ALUNO, state.aluno);
};

// nome da grade = bimestre; identificação do aluno: usados no PDF, no Excel, no texto copiado e no nome dos arquivos
const gradeNome = () => BIM || 'grade';
const aluno = () => ({ nome: state.aluno.nome.trim(), mat: state.aluno.mat.trim(), turma: state.aluno.turma.trim() });
const alunoLinha = () => { const a = aluno(); return [a.nome && `Aluno: ${a.nome}`, a.mat && `Matrícula: ${a.mat}`, a.turma && `Turma: ${a.turma}`].filter(Boolean).join(' · '); };
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
// ex.: Fulano-de-Tal_000000000_E1-2023-ES_B4-2026
const arquivoNome = () => { const a = aluno(); return [a.nome, a.mat, a.turma, gradeNome()].filter(Boolean).map(slug).filter(Boolean).join('_') || 'grade'; };
