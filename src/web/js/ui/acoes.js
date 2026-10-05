// ui/acoes.js — copiar texto, limpar grade e avisos (toast)
// ---------- copy / clear ----------
function asText() {
  const lines = [`GRADE ${gradeNome().toUpperCase()}`, ...(alunoLinha() ? [alunoLinha()] : []), ''];
  DIAS.forEach((dn, d) => HORAS.forEach((hr, h) => {
    const a = BY_ID[state.sel[slotKey(d, h)]];
    if (a) lines.push(`${dn} ${hr} | ${a.c} | ${a.n} | Sala ${a.s || '-'} | ${a.p} | ${a.t.join(', ')}`);
  }));
  const dg = DIGITAIS.filter(x => state.dig.includes(x.id));
  if (dg.length) { lines.push('', 'ATIVIDADES DIGITAIS'); dg.forEach(x => lines.push(`${x.c} | ${x.n} | ${x.p} | ${x.t.join(', ')}`)); }
  return lines.join('\n');
}
$('btnCopy').onclick = () => {
  const txt = asText(), ta = $('copyArea');
  const fallback = () => { ta.value = txt; ta.hidden = false; ta.focus(); ta.select(); toast('Selecionei o texto abaixo do resumo. Use Ctrl+C para copiar.'); };
  try { navigator.clipboard.writeText(txt).then(() => toast('Grade copiada'), fallback); } catch (e) { fallback(); }
};
let clearArmed = null;
$('btnClear').onclick = () => {
  const b = $('btnClear');
  if (!clearArmed) { b.textContent = 'Clique de novo para confirmar'; clearArmed = setTimeout(() => { b.textContent = 'Limpar grade'; clearArmed = null; }, 3000); return; }
  clearTimeout(clearArmed); clearArmed = null; b.textContent = 'Limpar grade';
  state.sel = {}; state.dig = []; save(); renderAll(); renderDig(); toast('Grade limpa');
};

let tt;
function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 3200); }


// identificação do aluno (vale para todos os bimestres)
const CAMPOS_ALUNO = { alunoNome: 'nome', alunoMat: 'mat', alunoTurma: 'turma' };
function preencherAluno() { for (const [id, k] of Object.entries(CAMPOS_ALUNO)) $(id).value = state.aluno[k] || ''; }
for (const [id, k] of Object.entries(CAMPOS_ALUNO)) $(id).addEventListener('input', e => { state.aluno[k] = e.target.value; save(); });
preencherAluno();
