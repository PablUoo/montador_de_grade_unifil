// ui/grade.js — grade semanal (segunda a sábado × 2 horários)
// ---------- grid ----------
function renderGrid() {
  let html = '<div class="dh corner" style="grid-row:1;grid-column:1"></div>' +
    DIAS.map((d, i) => `<div class="dh" style="grid-row:1;grid-column:${i + 2}">${d}</div>`).join('');
  HORAS.forEach((hr, h) => {
    const row = h === 0 ? 2 : 4;
    const [a1, a2] = hr.split(' - ');
    html += `<div class="tl" style="grid-row:${row}">${a1}<i>às</i>${a2}</div>`;
    for (let d = 0; d < 6; d++) {
      const k = slotKey(d, h), a = BY_ID[state.sel[k]];
      html += `<div class="cell h${h}" style="grid-row:${row};grid-column:${d + 2};order:${d * 2 + h}"><div class="mlabel"><b>${DIAS[d]}</b><span>${hr.replace(' - ', ' – ')}</span></div>`;
      if (a) {
        const need = slotsNeeded(a.c), used = slotsUsed(a.c);
        const order = Object.keys(state.sel).filter(x => BY_ID[state.sel[x]]?.c === a.c).sort().indexOf(k) + 1;
        html += `<div class="card${isPrio(a.c) ? ' is-prio' : ''}${used > need ? ' over' : ''}">
          ${isPrio(a.c) ? PRIO : ''}<div class="nm">${esc(a.n)}</div>
          <span class="code">${esc(a.c)}</span>
          <span class="chpill" title="Cada horário vale ${SLOT_H}h">${chLabel(a.c)} · ${SLOT_H}h aqui (${order}/${need})</span>
          ${used > need ? `<span class="warnline">Excede a C.H.: ${used} horários para ${need}</span>` : ''}
          <div class="meta">${esc(a.p || 'Professor a definir')}</div>
          <div class="room">${a.s ? 'Sala ' + esc(a.s) : 'Sem sala'}</div>
          <div class="tur">${a.t.map(esc).join(' · ')}</div>
          <div class="acts"><button type="button" class="btn small" data-open="${k}">Trocar</button><button type="button" class="btn small danger" data-rm="${k}">Remover</button></div>
        </div>`;
      } else {
        const all = offersAt(d, h), fl = all.filter(a => matches(a) && disponivelEm(a, k)), n = fl.length, np = fl.filter(a => isPrio(a.c)).length;
        if (!all.length) html += '<div class="none">Sem oferta</div>';
        else html += `<button type="button" class="add${np ? ' has-prio' : ''}" data-open="${k}" aria-label="Escolher disciplina: ${DIAS[d]} ${hr}"><b>+</b><span>${n} ${n === 1 ? 'oferta' : 'ofertas'}${n !== all.length ? ` <small>(de ${all.length})</small>` : ''}</span>${np ? `<span class="pcount">${np} ${np === 1 ? 'pendente' : 'pendentes'}</span>` : ''}</button>`;
      }
      html += '</div>';
    }
    if (h === 0) html += '<div class="band" style="grid-row:3">INTERVALO · 20:30 – 20:45</div>';
  });
  $('grade').innerHTML = html;
  renderSummary();
}
$('grade').addEventListener('click', e => {
  const o = e.target.closest('[data-open]'), r = e.target.closest('[data-rm]');
  if (o) openPanel(o.dataset.open);
  if (r) { const a = BY_ID[state.sel[r.dataset.rm]]; delete state.sel[r.dataset.rm]; save(); renderAll(); toast(`${a.c} removida de ${whenTxt(a)}`); }
});
