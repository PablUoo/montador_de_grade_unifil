// ui/resumo.js — resumo da grade e totais de carga horária
// ---------- summary ----------
function renderSummary() {
  const groups = {};
  for (const [k, id] of Object.entries(state.sel)) {
    const a = BY_ID[id]; if (!a) continue;
    (groups[a.c] ||= { a, slots: [], salas: new Set(), turmas: new Set() });
    groups[a.c].slots.push(a); if (a.s) groups[a.c].salas.add(a.s); a.t.forEach(t => groups[a.c].turmas.add(t));
  }
  const rows = Object.values(groups).sort((x, y) => x.a.n.localeCompare(y.a.n));
  const nAulas = Object.keys(state.sel).length;
  const hPres = rows.reduce((s, g) => s + chInfo(g.a.c).h, 0);
  const digs = DIGITAIS.filter(x => state.dig.includes(x.id)).sort((x, y) => x.n.localeCompare(y.n));
  const hDig = digs.reduce((s, x) => s + chInfo(x.c).h, 0);
  $('stats').innerHTML = `<div class="stat"><b>${rows.length + digs.length}</b><span>disciplinas</span></div><div class="stat"><b>${nAulas}</b><span>horários/semana</span></div><div class="stat"><b>${hPres + hDig}h</b><span>carga horária</span></div><div class="stat"><b>${digs.length}</b><span>digitais</span></div>`;
  if (!rows.length && !digs.length) { $('summary').innerHTML = '<tr><td class="note">Nenhuma disciplina escolhida ainda. Clique em um horário vazio na grade ou marque uma atividade digital.</td></tr>'; return; }
  const cab = '<thead><tr><th>Código</th><th>Disciplina</th><th>C.H.</th><th>Horários</th><th>Sala</th><th>Turma</th></tr></thead><tbody>';
  const pres = rows.map(g => { const need = slotsNeeded(g.a.c), used = g.slots.length;
      return `<tr><td><span class="code">${esc(g.a.c)}</span></td><td>${isPrio(g.a.c) ? PRIO + '<br>' : ''}${esc(g.a.n)}<div class="note">${esc(g.a.p)}</div></td>
      <td class="n">${chLabel(g.a.c)}<div class="note ${used > need ? 'over' : used < need ? 'short' : 'ok'}">${used}/${need} horários</div></td>
      <td>${g.slots.sort((x, y) => x.d - y.d || x.h - y.h).map(whenTxt).join('<br>')}</td>
      <td>${[...g.salas].map(esc).join(', ') || '—'}</td><td>${[...g.turmas].map(chip).join(' ')}</td></tr>`; }).join('');
  const dig = digs.length ? `<tr class="sep"><td colspan="6">Atividades digitais · ${hDig}h</td></tr>` + digs.map(x => `<tr class="digrow">
      <td><span class="code">${esc(x.c)}</span></td><td>${isPrio(x.c) ? PRIO + '<br>' : ''}${esc(x.n)}<div class="note">${esc(x.p)}</div></td>
      <td class="n">${chLabel(x.c)}</td><td><span class="chip dg">Digital</span><div class="note">sem horário fixo</div></td>
      <td>Online</td><td>${x.t.map(chip).join(' ')}</td></tr>`).join('') : '';
  const sepPres = rows.length && digs.length ? `<tr class="sep"><td colspan="6">Presenciais · ${hPres}h</td></tr>` : '';
  $('summary').innerHTML = cab + sepPres + pres + dig + '</tbody>';
}

