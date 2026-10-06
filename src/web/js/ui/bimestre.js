// ui/bimestre.js — escolha do bimestre (B1-2026 … B4-2026) e carregamento da oferta correspondente
let BIMESTRES = { bimestres: [], disponiveis: [] };

function renderBimestres() {
  $('bimOpcoes').innerHTML = BIMESTRES.bimestres.map(b => {
    const ok = BIMESTRES.disponiveis.includes(b) || b === BIM;
    const [bi, ano] = b.split('-');
    return `<button type="button" class="bim-op${b === BIM ? ' on' : ''}" role="radio" aria-checked="${b === BIM}" data-bim="${esc(b)}" ${ok ? '' : 'disabled'}>
      <b>${esc(bi)}</b><span>${esc(ano || '')}</span><small>${ok ? (b === BIM ? 'aberta' : 'ofertas publicadas') : 'sem oferta ainda'}</small></button>`;
  }).join('');
}

// aplica uma oferta já lida (do site ou de um arquivo) como o bimestre aberto
function abrirOferta(bim, dados) {
  definirOfertas(dados.aulas, dados.digitais, dados.ch);
  BIM = bim;
  gravarJSON(CHAVE_BIMESTRE, bim);
  if (!BIMESTRES.bimestres.includes(bim)) BIMESTRES.bimestres.push(bim);
  carregarGradeSalva(bim); carregarClassroomSalvo();
  $('bimStatus').textContent = `${bim}: ${new Set(OFERTAS.map(a => a.c)).size} disciplinas presenciais em ${OFERTAS.length} ofertas e ${DIGITAIS.length} atividades digitais.`;
  document.body.classList.remove('sem-oferta');
  renderBimestres(); montarFiltros(); renderAll(); renderDig();
}

async function selecionarBimestre(bim) {
  $('bimStatus').textContent = `Carregando ofertas de ${bim}…`;
  try { abrirOferta(bim, await baixarOfertas(bim)); return true; }
  catch (e) { $('bimStatus').textContent = `Não consegui carregar ${bim}: ${e.message}. Tente recarregar a página.`; return false; }
}

$('bimOpcoes').addEventListener('click', e => {
  const b = e.target.closest('[data-bim]'); if (!b || b.disabled || b.dataset.bim === BIM) return;
  selecionarBimestre(b.dataset.bim);
});

async function iniciarBimestres() {
  document.body.classList.add('sem-oferta');
  try { BIMESTRES = await lerIndiceOfertas(); }
  catch (e) { BIMESTRES = { bimestres: [], disponiveis: [] }; }
  renderBimestres();
  const salvo = lerJSON(CHAVE_BIMESTRE);
  const inicial = BIMESTRES.disponiveis.includes(salvo) ? salvo : BIMESTRES.disponiveis[BIMESTRES.disponiveis.length - 1];
  if (inicial) await selecionarBimestre(inicial);
  else $('bimStatus').textContent = BIMESTRES.bimestres.length
    ? 'Nenhum bimestre tem oferta publicada ainda.'
    : 'Não consegui ler a lista de ofertas do site. Tente recarregar a página.';
}
