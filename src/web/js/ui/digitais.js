// ui/digitais.js — lista de atividades digitais
// ---------- digital ----------
function renderDig() {
  // "Só pendentes" também vale aqui: mostra só as atividades digitais da planilha de pendências
  const lista = DIGITAIS.filter(x => !filt.onlyPend || isPrio(x.c));
  if (!lista.length) {
    $('dig').innerHTML = `<p class="note">${filt.onlyPend ? 'Nenhuma atividade digital entre as suas pendências neste bimestre.' : 'Nenhuma atividade digital ofertada neste bimestre.'}</p>`;
    return;
  }
  $('dig').innerHTML = [...lista].sort((x, y) => isPrio(y.c) - isPrio(x.c)).map(x => `<label class="${isPrio(x.c) ? 'is-prio' : ''}"><input type="checkbox" data-id="${esc(x.id)}" ${state.dig.includes(x.id) ? 'checked' : ''}>
    <span class="nm">${isPrio(x.c) ? PRIO + ' ' : ''}${esc(x.n)}</span><span class="meta"><span class="code">${esc(x.c)}</span> · ${chLabel(x.c)} · ${esc(x.p)}</span>
    <span class="meta chips">${x.t.map(chip).join('')}</span></label>`).join('');
}
$('dig').addEventListener('change', e => {
  const id = e.target.dataset.id; if (!id) return;
  state.dig = e.target.checked ? [...new Set([...state.dig, id])] : state.dig.filter(x => x !== id);
  save(); renderSummary(); renderPend();
});

