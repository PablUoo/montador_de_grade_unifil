// ui/filtros.js — filtros de curso, turma(s), disciplina(s), busca e "só pendentes"; renderAll() redesenha a tela
// Turma e Disciplina usam Tom Select (busca + seleção múltipla). Sem a biblioteca, os <select multiple> nativos continuam funcionando.
const filt = { curso: '', turmas: [], codes: [], q: '', onlyPend: false };

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
$('q').addEventListener('input', e => { filt.q = e.target.value.trim(); renderAll(); });
$('onlyPend').addEventListener('change', e => { filt.onlyPend = e.target.checked; renderAll(); });

// selects com busca e múltipla escolha
const valoresDe = sel => [...sel.selectedOptions].map(o => o.value).filter(Boolean);
function criarMulti(id, placeholder, aoMudar, itemCurto) {
  const el = $(id);
  el.addEventListener('change', () => aoMudar(el.tomselect ? el.tomselect.getValue() : valoresDe(el)));
  if (!window.TomSelect) return null;
  return new TomSelect(el, {
    plugins: { remove_button: { title: 'Remover' }, clear_button: { title: 'Limpar' }, checkbox_options: {} },
    placeholder, maxOptions: null, hidePlaceholder: true, closeAfterSelect: false,
    searchField: ['text', 'value'], lockOptgroupOrder: true,
    render: {
      no_results: () => '<div class="no-results">Nada encontrado</div>',
      // etiqueta da escolha: só o código (o nome aparece ao passar o mouse)
      ...(itemCurto ? { item: (d, e) => `<div title="${e(d.text.replace(/^★ /, ''))}">${e(d.value)}</div>` } : {}),
    },
  });
}
const tsTurma = criarMulti('selTurma', 'Todas as turmas', v => { filt.turmas = v; renderAll(); });
const tsCode = criarMulti('selCode', 'Todas as disciplinas', v => { filt.codes = v; renderAll(); }, true);

// troca as opções de um select (Tom Select ou nativo) mantendo só os valores que ainda existem
function preencherMulti(ts, el, grupos, valores) {
  const validos = new Set(grupos.flatMap(g => g.opcoes.map(o => o.value)));
  const manter = valores.filter(v => validos.has(v));
  if (ts) {
    ts.clear(true); ts.clearOptions(); ts.clearOptionGroups();
    grupos.forEach((g, i) => { ts.addOptionGroup('g' + i, { label: g.label }); g.opcoes.forEach(o => ts.addOption({ ...o, optgroup: 'g' + i })); });
    ts.refreshOptions(false); ts.setValue(manter, true);
  } else {
    el.innerHTML = grupos.map(g => `<optgroup label="${esc(g.label)}">${g.opcoes.map(o => `<option value="${esc(o.value)}"${manter.includes(o.value) ? ' selected' : ''}>${esc(o.text)}</option>`).join('')}</optgroup>`).join('');
  }
  return manter;
}

// opções que dependem da oferta carregada e das pendências: turmas e disciplinas (pendentes ofertadas primeiro)
function montarFiltros() {
  turmas = [...new Set(OFERTAS.flatMap(a => a.t))].sort(ordemTurma);
  filt.turmas = preencherMulti(tsTurma, $('selTurma'), [{ label: 'Turmas', opcoes: turmas.map(t => ({ value: t, text: t })) }], filt.turmas);
  $('turmasList').innerHTML = turmas.map(t => `<option value="${esc(t)}"></option>`).join('');
  const presCodes = [...new Set(OFERTAS.map(a => a.c))].sort();
  const opt = c => ({ value: c, text: `${isPrio(c) ? '★ ' : ''}${c} · ${NOMES[c]}` });
  const pend = presCodes.filter(isPrio);
  filt.codes = preencherMulti(tsCode, $('selCode'), [
    ...(pend.length ? [{ label: 'Pendentes ofertadas', opcoes: pend.map(opt) }] : []),
    { label: pend.length ? 'Demais disciplinas presenciais' : 'Disciplinas presenciais', opcoes: presCodes.filter(c => !isPrio(c)).map(opt) },
  ], filt.codes);
}
// atalho do quadro de pendências: mostra só essa disciplina (ou volta a mostrar todas)
function setCode(c) {
  filt.codes = c ? [c] : [];
  if (tsCode) tsCode.setValue(filt.codes, true); else for (const o of $('selCode').options) o.selected = filt.codes.includes(o.value);
  renderAll();
}
function renderAll() { renderGrid(); renderPend(); renderFiltroInfo(); renderClassroomBotoes(); if (!$('panel').hidden) renderPanel(); }

// quantas ofertas os filtros deixam aparecer + atalho para limpar
const filtrosAtivos = () => [filt.q, filt.curso, filt.turmas.length, filt.codes.length, filt.onlyPend].filter(Boolean).length;
function renderFiltroInfo() {
  const n = filtrosAtivos(), total = OFERTAS.length, vis = OFERTAS.filter(matches).length;
  $('filtroInfo').innerHTML = !total ? '' : n
    ? (vis ? `<b>${vis}</b> ${vis === 1 ? 'oferta' : 'ofertas'} no filtro` : 'Nenhuma oferta com esses filtros')
    : `${total} ofertas neste bimestre`;
  $('btnFiltrosLimpar').hidden = !n;
}
$('btnFiltrosLimpar').onclick = () => {
  Object.assign(filt, { q: '', curso: '', turmas: [], codes: [], onlyPend: false });
  $('q').value = ''; $('onlyPend').checked = false;
  for (const [ts, el] of [[tsTurma, $('selTurma')], [tsCode, $('selCode')]]) { if (ts) ts.clear(true); else for (const o of el.options) o.selected = false; }
  for (const x of $('segCurso').children) x.setAttribute('aria-pressed', x.dataset.v === '');
  renderAll(); $('q').focus();
};
