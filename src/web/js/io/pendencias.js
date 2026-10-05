// io/pendencias.js — importa as disciplinas pendentes de uma planilha Excel do usuário
// Padrão de importação: uma coluna "Código" (ou "Código da disciplina") com os códigos, ex.: INAR230002.
// Opcionais: "Disciplina" (nome), "C.H." (carga horária) e "STATUS" (se existir, só entram as linhas PENDENTE).
const CHAVE_PEND = 'montador-grade:pendencias';
const RE_CODIGO = /^[A-Z]{3,4}\d{6}$/;

function lerPendenciasSalvas() { const p = lerJSON(CHAVE_PEND); return Array.isArray(p) ? p : []; }
function salvarPendencias(lista) { definirPendencias(lista); gravarJSON(CHAVE_PEND, lista); }

function lerPlanilhaPendencias(buf) {
  const wb = XLSX.read(buf, { type: 'array' });
  for (const nomeAba of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[nomeAba], { header: 1, defval: '', raw: false });
    // o cabeçalho pode não estar na 1ª linha: procura nas 10 primeiras
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const cab = rows[i].map(h => norm(String(h)).trim());
      const iCod = cab.findIndex(h => /^codigo( da (disciplina|uc))?$/.test(h));
      if (iCod < 0) continue;
      const iNome = cab.findIndex(h => /^(disciplina|unidade curricular|nome)/.test(h));
      const iCh = cab.findIndex(h => /^c\.?h\.?( \(horas\))?$/.test(h));
      const iSt = cab.findIndex(h => h === 'status' || h === 'situacao');
      const vistos = new Set(), lista = [];
      for (const r of rows.slice(i + 1)) {
        const c = String(r[iCod] || '').trim().toUpperCase();
        if (!RE_CODIGO.test(c) || vistos.has(c)) continue;
        if (iSt >= 0 && !/pendente/i.test(r[iSt])) continue;   // com coluna STATUS, só as pendentes
        vistos.add(c);
        lista.push({ c, n: iNome >= 0 ? String(r[iNome]).replace(/\s*@\s*$/, '').trim() : '', ch: iCh >= 0 ? (+r[iCh] || 0) : 0 });
      }
      if (lista.length) return { lista, aba: nomeAba };
    }
  }
  throw new Error('não achei uma coluna "Código" com códigos de disciplina (ex.: INAR230002)');
}

// planilha modelo para o usuário preencher
function planilhaModeloPendencias() {
  const ws = XLSX.utils.aoa_to_sheet([['Código', 'Disciplina (opcional)', 'C.H. (opcional)'], ['INAR230002', 'Inteligência Artificial: Algoritmos evolutivos', 30], ['ESDS230001', 'Estatística: Estatística Descritiva', 15]]);
  ws['!cols'] = [{ wch: 14 }, { wch: 60 }, { wch: 16 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Pendências');
  return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]);
}
