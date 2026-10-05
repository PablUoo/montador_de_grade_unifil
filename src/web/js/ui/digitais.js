// ui/digitais.js — lista de atividades digitais
// ---------- digital ----------
function renderDig() {
  $('dig').innerHTML = [...DIGITAIS].sort((x, y) => isPrio(y.c) - isPrio(x.c)).map(x => `<label class="${isPrio(x.c) ? 'is-prio' : ''}"><input type="checkbox" data-id="${esc(x.id)}" ${state.dig.includes(x.id) ? 'checked' : ''}>
    <span class="nm">${isPrio(x.c) ? PRIO + ' ' : ''}${esc(x.n)}</span><span class="meta"><span class="code">${esc(x.c)}</span> · ${chLabel(x.c)} · ${esc(x.p)}</span>
    <span class="meta chips">${x.t.map(chip).join('')}</span></label>`).join('');
}
$('dig').addEventListener('change', e => {
  const id = e.target.dataset.id; if (!id) return;
  state.dig = e.target.checked ? [...new Set([...state.dig, id])] : state.dig.filter(x => x !== id);
  save(); renderSummary(); renderPend();
});

