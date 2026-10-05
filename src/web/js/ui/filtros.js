// ui/filtros.js — filtros de curso, turma, código e busca; renderAll() redesenha a tela
const filt = { curso: '', turma: '', q: '', code: '', onlyPend: false };

// ---------- filters ----------
let turmas = [];
const ordemTurma = (x, y) => {
  const [ex, yx] = [x.match(/E(\d+)\/(\d{4})/), y.match(/E(\d+)\/(\d{4})/)];
  if (ex && yx) return (yx[2] - ex[2]) || (ex[1] - yx[1]) || x.localeCompare(y);
  return ex ? -1 : yx ? 1 : x.localeCompare(y);
};
$('segCurso').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  filt.curso = b.dataset.v;
  for (const x of $('segCurso').children) x.setAttribute('aria-pressed', x === b);
  renderAll();
});
$('selTurma').addEventListener('change', e => { filt.turma = e.target.value; renderAll(); });
$('q').addEventListener('input', e => { filt.q = e.target.value.trim(); renderAll(); });

// opções que dependem da oferta carregada e das pendências: turmas e códigos (pendentes ofertadas primeiro)
function montarFiltros() {
  turmas = [...new Set(OFERTAS.flatMap(a => a.t))].sort(ordemTurma);
  if (filt.turma && !turmas.includes(filt.turma)) filt.turma = '';
  $('selTurma').innerHTML = '<option value="">Todas as turmas</option>' + turmas.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  $('selTurma').value = filt.turma;
  $('turmasList').innerHTML = turmas.map(t => `<option value="${esc(t)}"></option>`).join('');
  const presCodes = new Set(OFERTAS.map(a => a.c));
  if (filt.code && !presCodes.has(filt.code)) filt.code = '';
  const opt = c => `<option value="${esc(c)}">${isPrio(c) ? '★ ' : ''}${esc(c)} · ${esc(NOMES[c])}</option>`;
  const pendPres = [...presCodes].filter(isPrio).sort();
  $('selCode').innerHTML = '<option value="">Todos os códigos</option>' +
    (pendPres.length ? `<optgroup label="Pendentes ofertadas">${pendPres.map(opt).join('')}</optgroup>` : '') +
    `<optgroup label="Todas as disciplinas presenciais">${[...presCodes].sort().map(opt).join('')}</optgroup>`;
  $('selCode').value = filt.code;
}
function setCode(c) { filt.code = c; $('selCode').value = c; renderAll(); }
$('selCode').addEventListener('change', e => setCode(e.target.value));
$('onlyPend').addEventListener('change', e => { filt.onlyPend = e.target.checked; renderAll(); });
function renderAll() { renderGrid(); renderPend(); if (!$('panel').hidden) renderPanel(); }
