// ui/pendencias.js — quadro "Pendências": importar planilha, situação de cada pendência no bimestre aberto
function renderPend() {
  $('btnPendLimpar').hidden = !PENDENTES.length;
  if (!PENDENTES.length) {
    $('pendStats').innerHTML = '';
    $('pendList').innerHTML = `<div class="pend-vazio"><b>Nenhuma pendência importada.</b>
      <span>Importe um Excel com a coluna <b>Código</b>, uma disciplina por linha. Use “Baixar modelo” para ver o formato. Também serve a planilha de pendências do portal: se ela tiver a coluna STATUS, entram só as linhas PENDENTE.</span></div>`;
    return;
  }
  const chosen = new Set(Object.values(state.sel).map(id => BY_ID[id]?.c));
  DIGITAIS.forEach(x => { if (state.dig.includes(x.id)) chosen.add(x.c); });
  let nOf = 0, nIn = 0;
  const items = PENDENTES.map(p => {
    const pres = OFERTAS.filter(a => a.c === p.c), dig = DIGITAIS.filter(x => x.c === p.c);
    const offered = pres.length || dig.length; if (offered) nOf++;
    const inGrade = chosen.has(p.c); if (inGrade) nIn++;
    let st;
    if (pres.length) st = 'Presencial: ' + [...new Set(pres.map(whenTxt))].join(', ');
    else if (dig.length) st = 'Atividade digital (marque na lista abaixo)';
    else st = `Não ofertada em ${gradeNome()}`;
    let hint = '';
    if (pres.length) {
      const need = slotsNeeded(p.c), used = slotsUsed(p.c);
      hint = `<div class="st">${chLabel(p.c)} = ${need} ${need === 1 ? 'horário' : 'horários'} na semana · na grade: <b class="${used > need ? 'over' : used === need ? 'ok' : ''}">${used} de ${need}</b>${used > need ? ' (sobrando)' : ''}</div>`;
    }
    const inner = `<div class="top"><span class="code">${esc(p.c)}</span><span class="ch">${offered || p.ch ? chLabel(p.c) : ''}</span>${inGrade ? '<span class="done">✓ na grade</span>' : ''}</div>
      <div class="nm">${esc(nomeDe(p.c) || 'Disciplina sem nome na planilha')}</div><div class="st">${st}</div>${hint}`;
    return pres.length
      ? `<button type="button" class="pitem${filt.codes.length === 1 && filt.codes[0] === p.c ? ' active' : ''}" data-code="${esc(p.c)}" title="Mostrar só ${esc(p.c)} na grade">${inner}</button>`
      : `<div class="pitem${offered ? '' : ' off'}">${inner}</div>`;
  });
  $('pendList').innerHTML = items.join('');
  $('pendStats').innerHTML = `<div class="stat"><b>${PENDENTES.length}</b><span>pendentes</span></div><div class="stat"><b>${nOf}</b><span>ofertadas</span></div><div class="stat"><b>${nIn}</b><span>na grade</span></div>`;
}
$('pendList').addEventListener('click', e => {
  const b = e.target.closest('[data-code]'); if (!b) return;
  setCode(filt.codes.length === 1 && filt.codes[0] === b.dataset.code ? '' : b.dataset.code);
  document.querySelector('.sheet').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function aplicarPendencias(lista) { salvarPendencias(lista); montarFiltros(); renderAll(); renderDig(); ajustarQuadroPend(true); }
$('btnPendImport').onclick = () => $('pendIn').click();
$('pendIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const { lista } = lerPlanilhaPendencias(await f.arrayBuffer());
    aplicarPendencias(lista);
    const of = lista.filter(p => OFERTAS.some(a => a.c === p.c) || DIGITAIS.some(x => x.c === p.c)).length;
    toast(`${lista.length} pendências importadas · ${of} ofertadas em ${gradeNome()}`);
  } catch (err) { toast('Não consegui importar: ' + err.message); }
});
$('btnPendModelo').onclick = () => offerFile('modelo-pendencias.xlsx', planilhaModeloPendencias(), 'Modelo salvo. Preencha a coluna Código e importe.');
let pendArmed = null;
$('btnPendLimpar').onclick = () => {
  const b = $('btnPendLimpar');
  if (!pendArmed) { b.textContent = 'Clique de novo para remover'; pendArmed = setTimeout(() => { b.textContent = 'Remover pendências'; pendArmed = null; }, 3000); return; }
  clearTimeout(pendArmed); pendArmed = null; b.textContent = 'Remover pendências';
  aplicarPendencias([]); toast('Pendências removidas');
};

// quadro recolhível: abre sozinho enquanto não há pendências; depois lembra a escolha do usuário
const CHAVE_PEND_ABERTO = 'montador-grade:pendencias-aberto';
function ajustarQuadroPend(forcarAbrir) {
  const salvo = lerJSON(CHAVE_PEND_ABERTO);
  $('passoPend').open = forcarAbrir || !PENDENTES.length || (salvo ?? true);
}
$('passoPend').addEventListener('toggle', () => { if (PENDENTES.length) gravarJSON(CHAVE_PEND_ABERTO, $('passoPend').open); });
