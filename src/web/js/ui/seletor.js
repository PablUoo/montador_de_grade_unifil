// ui/seletor.js — janela de escolha da disciplina de um horário; completa até a C.H.
// ---------- picker ----------
let cur = null;
function openPanel(k) { cur = k; $('panel').hidden = false; $('scrim').hidden = false; renderPanel(); $('pClose').focus(); }
function closePanel() { $('panel').hidden = true; $('scrim').hidden = true; cur = null; }
$('pClose').onclick = closePanel; $('scrim').onclick = closePanel;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('panel').hidden) closePanel(); });

function renderPanel() {
  const [d, h] = cur.split('|').map(Number);
  $('pWhen').textContent = `${DIAS[d]} · ${HORAS[h]}`;
  const all = offersAt(d, h), done = all.filter(a => !disponivelEm(a, cur)), list = all.filter(a => matches(a) && disponivelEm(a, cur)).sort((x, y) => isPrio(y.c) - isPrio(x.c));
  const chosenCodes = new Set(Object.values(state.sel).map(id => BY_ID[id]?.c));
  $('pTitle').textContent = `${list.length} ${list.length === 1 ? 'disciplina ofertada' : 'disciplinas ofertadas'}`;
  let html = '';
  if (state.sel[cur]) html += `<button type="button" class="btn small danger" data-pick="" style="justify-self:start">Deixar este horário vazio</button>`;
  html += list.map(a => {
    const sib = siblings(a), need = slotsNeeded(a.c), used = slotsUsed(a.c);
    return `<button type="button" class="opt${isPrio(a.c) ? ' is-prio' : ''}${state.sel[cur] === a.id ? ' current' : ''}" data-pick="${esc(a.id)}">
      <div class="top"><span class="nm">${esc(a.n)}</span><span class="code">${esc(a.c)}</span></div>
      <div class="meta"><b>C.H. ${chLabel(a.c)}</b> = ${need} ${need === 1 ? 'horário' : 'horários'} na semana${used ? ` · você já tem ${used} de ${need}` : ''}</div>
      <div class="meta">${esc(a.p || 'Professor a definir')} · ${a.s ? 'Sala ' + esc(a.s) : 'sem sala'}${a.tp && a.tp !== 'CORE' ? ' · ' + esc(a.tp) : ''}</div>
      <div class="chips">${isPrio(a.c) ? PRIO : ''}${a.t.map(chip).join('')}${chosenCodes.has(a.c) && state.sel[cur] !== a.id ? '<span class="chip in">já está na sua grade</span>' : ''}</div>
      ${sib.length ? `<div class="also">Também em: ${sib.map(b => `${whenTxt(b)}${b.s ? ' (sala ' + esc(b.s) + ')' : ''}`).join(', ')}</div>` : ''}
    </button>`;
  }).join('');
  if (!list.length) html += `<p class="empty-list">${all.length ? 'Nenhuma oferta neste horário com os filtros atuais. Ajuste curso, turma, código ou busca.' : 'Não há disciplinas ofertadas neste horário.'}</p>`;
  if (done.length) html += `<p class="note">${done.length} ${done.length === 1 ? 'disciplina oculta' : 'disciplinas ocultas'} porque a carga horária já está completa na sua grade: ${[...new Set(done.map(a => a.c))].map(esc).join(', ')}.</p>`;
  const filtradas = all.length - list.length - done.length;
  if (list.length && filtradas > 0) html += `<p class="note">${filtradas} outras ofertas escondidas pelos filtros.</p>`;
  $('pList').innerHTML = html;
}
$('pList').addEventListener('click', e => {
  const b = e.target.closest('[data-pick]'); if (!b) return;
  const id = b.dataset.pick;
  if (!id) { delete state.sel[cur]; save(); renderAll(); closePanel(); return; }
  const a = BY_ID[id], need = slotsNeeded(a.c);
  state.sel[cur] = id;
  const added = [], blocked = [];
  // completa só até a carga horária: 15h = 1 horário, 30h = 2 horários
  if ($('alsoFill').checked) {
    for (const s of siblings(a)) {
      if (slotsUsed(a.c) >= need) break;
      const k = slotKey(s.d, s.h);
      if (state.sel[k] === s.id) continue;
      if (!state.sel[k]) { state.sel[k] = s.id; added.push(whenTxt(s)); }
      else if (BY_ID[state.sel[k]].c !== a.c) blocked.push(whenTxt(s));
    }
  }
  const used = slotsUsed(a.c);
  save(); renderAll(); closePanel();
  let msg = `${a.c} (${chLabel(a.c)}) adicionada`;
  if (added.length) msg += ` + ${added.join(', ')}`;
  if (used < need && blocked.length) msg += ` · falta ${need - used} horário: ${blocked.join(', ')} já ocupado`;
  if (used > need) msg += ` · atenção: ${used} horários para ${need} da C.H.`;
  toast(msg);
});

