// io/arquivos.js — exportar PDF/Excel, salvar e carregar a grade (.json ou Excel exportado)

// ---------- export / save / load ----------
const FILE_TAG = 'montador-grade-2026';
let downloadsNs;
const downloadsReady = (window.claude?.use ? window.claude.use('downloads') : Promise.resolve(null))
  .then(ns => (downloadsNs = ns)).catch(() => (downloadsNs = null));

const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const chosenList = () => {
  const out = [];
  DIAS.forEach((dn, d) => HORAS.forEach((hr, h) => { const a = BY_ID[state.sel[slotKey(d, h)]]; if (a) out.push({ d, h, a }); }));
  return out;
};
const chosenDig = () => DIGITAIS.filter(x => state.dig.includes(x.id));
const fileState = () => ({ app: FILE_TAG, versao: 1, nome: gradeNome(), bimestre: BIM, aluno: aluno(), salvoEm: new Date().toISOString(),
  aulas: chosenList().map(({ d, h, a }) => ({ dia: DIAS[d], horario: HORAS[h], codigo: a.c, sala: a.s, professor: a.p, id: a.id })),
  digitais: chosenDig().map(x => ({ codigo: x.c, professor: x.p, id: x.id })) });

async function offerFile(filename, data, okMsg) {
  await downloadsReady;
  if (!downloadsNs) {
    // page opened straight in a browser (e.g. the .html in Chrome): use a normal download
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast(okMsg + ' (veja a pasta Downloads)'); return true;
    } catch (e) { toast('O navegador bloqueou o download. Tente abrir a página pelo link do claude.ai.'); return false; }
  }
  try { const r = await downloadsNs.save({ filename, data }); if (r.status === 'saved') toast(okMsg); return true; }
  catch (e) {
    const c = e && e.code;
    if (c === 'declined') toast('Download cancelado.');
    else if (c === 'rate_limited') toast('Já existe uma confirmação de download aberta.');
    else toast('Não foi possível salvar o arquivo aqui (' + (c || 'erro') + ').');
    return false;
  }
}
async function busy(btn, fn) { btn.disabled = true; try { await fn(); } finally { btn.disabled = false; } }
const needOne = () => { if (!Object.keys(state.sel).length && !state.dig.length) { toast('Sua grade está vazia. Escolha ao menos uma disciplina.'); return false; } return true; };

// ---- Excel ----
function buildWorkbook() {
  const XL = window.XLSX;
  const wb = XL.utils.book_new();
  const cellTxt = a => a ? `${isPrio(a.c) ? '★ PENDENTE\n' : ''}${a.n}\n${a.c} · ${chLabel(a.c)}\n${a.p || ''}\nSala ${a.s || '-'}\n${a.t.join(', ')}` : '';
  const a0 = aluno();
  const info = [['Grade', gradeNome()], ['Aluno', a0.nome], ['Matrícula', a0.mat], ['Turma', a0.turma], []];
  const g = [...info, ['Horário', ...DIAS]];
  HORAS.forEach((hr, h) => {
    if (h === 1) g.push(['INTERVALO 20:30 - 20:45', '', '', '', '', '', '']);
    g.push([hr, ...DIAS.map((_, d) => cellTxt(BY_ID[state.sel[slotKey(d, h)]]))]);
  });
  const ws1 = XL.utils.aoa_to_sheet(g);
  ws1['!cols'] = [{ wch: 16 }, ...DIAS.map(() => ({ wch: 34 }))];
  ws1['!rows'] = [...info.map(() => ({ hpt: 16 })), { hpt: 20 }, { hpt: 110 }, { hpt: 18 }, { hpt: 110 }];
  ws1['!merges'] = [{ s: { r: info.length + 2, c: 0 }, e: { r: info.length + 2, c: 6 } }];
  XL.utils.book_append_sheet(wb, ws1, 'Grade');

  const l = [['Dia', 'Horário', 'Código', 'Disciplina', 'C.H.', 'Professor', 'Sala', 'Turmas', 'Prioridade (pendente)']];
  chosenList().forEach(({ d, h, a }) => l.push([DIAS[d], HORAS[h], a.c, a.n, chLabel(a.c), a.p, a.s, a.t.join(', '), isPrio(a.c) ? 'SIM' : '']));
  const ws2 = XL.utils.aoa_to_sheet(l);
  ws2['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 60 }, { wch: 14 }, { wch: 30 }, { wch: 8 }, { wch: 30 }, { wch: 12 }];
  ws2['!autofilter'] = { ref: `A1:I${l.length}` };
  XL.utils.book_append_sheet(wb, ws2, 'Lista');

  const dg = [['Código', 'Disciplina', 'Professor', 'Turmas', 'Prioridade (pendente)']];
  chosenDig().forEach(x => dg.push([x.c, x.n, x.p, x.t.join(', '), isPrio(x.c) ? 'SIM' : '']));
  const ws3 = XL.utils.aoa_to_sheet(dg);
  ws3['!cols'] = [{ wch: 12 }, { wch: 70 }, { wch: 30 }, { wch: 30 }, { wch: 12 }];
  XL.utils.book_append_sheet(wb, ws3, 'Atividades Digitais');

  const chosen = new Set([...chosenList().map(o => o.a.c), ...chosenDig().map(x => x.c)]);
  const pd = [['Código', 'Disciplina', 'C.H.', 'Ofertada', 'Na grade']];
  PENDENTES.forEach(p => {
    const pres = OFERTAS.filter(a => a.c === p.c), dig = DIGITAIS.some(x => x.c === p.c);
    pd.push([p.c, nomeDe(p.c), chInfo(p.c).h, pres.length ? 'Presencial: ' + [...new Set(pres.map(whenTxt))].join(', ') : dig ? 'Atividade digital' : 'Não ofertada', chosen.has(p.c) ? 'SIM' : '']);
  });
  const ws4 = XL.utils.aoa_to_sheet(pd);
  ws4['!cols'] = [{ wch: 12 }, { wch: 70 }, { wch: 6 }, { wch: 40 }, { wch: 9 }];
  XL.utils.book_append_sheet(wb, ws4, 'Pendências');

  // hidden sheet used by "Carregar grade" to restore exactly this grade
  const ws5 = XL.utils.aoa_to_sheet([[FILE_TAG], [JSON.stringify(fileState())]]);
  XL.utils.book_append_sheet(wb, ws5, '_dados');
  wb.Workbook = { Sheets: [{}, {}, {}, {}, { Hidden: 1 }] };
  return wb;
}
$('btnXlsx').onclick = e => busy(e.currentTarget, async () => {
  if (!needOne()) return;
  if (!window.XLSX) { toast('A biblioteca do Excel ainda está carregando. Tente de novo em instantes.'); return; }
  const buf = XLSX.write(buildWorkbook(), { bookType: 'xlsx', type: 'array' });
  await offerFile(`${arquivoNome()}.xlsx`, new Blob([buf]), 'Excel salvo. Ele também pode ser usado em “Carregar grade”.');
});

// ---- PDF ----
$('btnPdf').onclick = e => busy(e.currentTarget, async () => {
  if (!needOne()) return;
  if (!window.jspdf || !window.jspdf.jsPDF) { toast('A biblioteca de PDF ainda está carregando. Tente de novo em instantes.'); return; }
  const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const ORANGE = [226, 87, 15], PINK = [194, 29, 91];
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(`Grade ${gradeNome()}`, 32, 36);
  let topo = 52;
  if (alunoLinha()) { doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(40); doc.text(alunoLinha(), 32, topo); topo += 14; }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(110);
  doc.text(`Gerada em ${new Date().toLocaleDateString('pt-BR')} · borda rosa: disciplina pendente (prioridade)`, 32, topo); doc.setTextColor(0);

  // quadro da semana no mesmo layout da página: um cartão por horário escolhido
  const slotDe = c => BY_ID[state.sel[slotKey(c.column.index - 1, c.row.index === 0 ? 0 : 1)]];
  const body = [];
  HORAS.forEach((hr, h) => {
    if (h === 1) body.push([{ content: 'INTERVALO · 20:30 – 20:45', colSpan: 7, styles: { halign: 'center', fillColor: [238, 234, 229], textColor: 110, fontStyle: 'bold', fontSize: 7, cellPadding: 3, minCellHeight: 0 } }]);
    body.push([hr.replace(' - ', '\nàs\n'), ...DIAS.map(() => '')]);
  });
  const desenharCartao = (a, x, y, w, hCel) => {
    const pad = 4, cx = x + w / 2, iw = w - 2 * pad - 10;
    const prio = isPrio(a.c), order = Object.keys(state.sel).filter(k => BY_ID[state.sel[k]]?.c === a.c).sort().indexOf(slotKey(a.d, a.h)) + 1;
    doc.setFillColor(255, 247, 241);
    if (prio) { doc.setDrawColor(...PINK); doc.setLineWidth(1.2); } else { doc.setDrawColor(228, 222, 215); doc.setLineWidth(.6); }
    doc.roundedRect(x + pad, y + pad, w - 2 * pad, hCel - 2 * pad, 4, 4, 'FD');
    if (prio) { doc.setFillColor(...PINK); doc.rect(x + pad + 3, y + pad, w - 2 * pad - 6, 2.2, 'F'); }
    let ty = y + pad + 13;
    const linhas = (txt, font, style, size, color, lh) => {
      doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(...color);
      for (const ln of doc.splitTextToSize(txt, iw)) { doc.text(ln, cx, ty, { align: 'center' }); ty += lh; }
    };
    linhas(a.n, 'helvetica', 'bold', 8, [30, 26, 22], 9.4);
    // código numa caixinha laranja
    doc.setFont('courier', 'bold'); doc.setFontSize(7.5);
    const cw = doc.getTextWidth(a.c) + 8; ty += 2;
    doc.setDrawColor(...ORANGE); doc.setLineWidth(.9); doc.roundedRect(cx - cw / 2, ty - 7.5, cw, 10.5, 1.5, 1.5, 'S');
    doc.setTextColor(...ORANGE); doc.text(a.c, cx, ty, { align: 'center' }); ty += 12;
    linhas(`${chLabel(a.c)} · ${SLOT_H}h aqui (${order}/${slotsNeeded(a.c)})`, 'helvetica', 'normal', 6.5, [110, 104, 97], 8.5);
    linhas(a.p || 'Professor a definir', 'helvetica', 'normal', 7, [110, 104, 97], 8.5);
    ty += 2; linhas(a.s ? `Sala ${a.s}` : 'Sem sala', 'courier', 'bold', 8.5, [30, 26, 22], 11);
    linhas(a.t.join(' · '), 'helvetica', 'normal', 6.5, [110, 104, 97], 8);
    doc.setTextColor(0); doc.setLineWidth(.6);
  };
  doc.autoTable({
    startY: topo + 10, head: [['', ...DIAS]], body, theme: 'grid', margin: { left: 32, right: 32 },
    styles: { fontSize: 7.5, cellPadding: 5, valign: 'middle', halign: 'center', lineColor: [228, 222, 215], lineWidth: .6, minCellHeight: 128 },
    headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: 'bold', fontSize: 9, minCellHeight: 0 },
    columnStyles: Object.assign({ 0: { cellWidth: 46, fillColor: [253, 238, 228], textColor: ORANGE, fontStyle: 'bold' } }, ...DIAS.map((_, i) => ({ [i + 1]: { cellWidth: (W - 64 - 46) / 6 } }))),
    didDrawCell: c => {
      if (c.section !== 'body' || c.column.index === 0 || c.row.index === 1) return;
      const a = slotDe(c);
      if (a) desenharCartao(a, c.cell.x, c.cell.y, c.cell.width, c.cell.height);
      else if (!offersAt(c.column.index - 1, c.row.index === 0 ? 0 : 1).length) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(150);
        doc.text('Sem oferta', c.cell.x + c.cell.width / 2, c.cell.y + c.cell.height / 2, { align: 'center' }); doc.setTextColor(0);
      }
    }
  });
  const M = { left: 32, right: 32 };
  const PINK_SOFT = [253, 235, 242], GREEN = [31, 122, 74];
  // tabelas no formato do "Resumo da grade" da página
  const RES_HEAD = [['Código', 'Disciplina', 'Professor', 'C.H.', 'Horários', 'Sala', 'Turma']];
  const RES_STYLE = { theme: 'grid', margin: M, styles: { fontSize: 8, cellPadding: 4, lineColor: [228, 222, 215], lineWidth: .5, valign: 'middle' },
    headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold', textColor: ORANGE }, 3: { cellWidth: 70 }, 4: { cellWidth: 90 }, 5: { cellWidth: 48 }, 6: { cellWidth: 120 } } };
  const pinkRows = codes => c => { if (c.section === 'body' && codes[c.row.index]) c.cell.styles.fillColor = PINK_SOFT; };
  const secao = (txt, y) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(40); doc.text(txt, 32, y); doc.setTextColor(0); };

  // página 1: quadro de horários + atividades digitais marcadas
  const dg = chosenDig().sort((x, y) => x.n.localeCompare(y.n));
  const hDig = dg.reduce((s, x) => s + chInfo(x.c).h, 0);
  const digRow = x => [x.c, x.n, x.p, chLabel(x.c), 'Digital · sem horário fixo', 'Online', x.t.join(', ')];
  if (dg.length) {
    let y = doc.lastAutoTable.finalY + 22;
    secao(`Atividades digitais marcadas · ${hDig}h`, y);
    doc.autoTable({ ...RES_STYLE, startY: y + 6, head: RES_HEAD, body: dg.map(digRow), didParseCell: pinkRows(dg.map(x => isPrio(x.c))) });
  }

  // página 2: resumo geral da grade
  doc.addPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('Resumo geral da grade', 32, 36);
  const groups = {};
  chosenList().forEach(({ a }) => { (groups[a.c] ||= { a, slots: [], salas: new Set(), turmas: new Set() }); groups[a.c].slots.push(a); if (a.s) groups[a.c].salas.add(a.s); a.t.forEach(t => groups[a.c].turmas.add(t)); });
  const pres = Object.values(groups).sort((x, y) => x.a.n.localeCompare(y.a.n));
  const hPres = pres.reduce((s, g) => s + chInfo(g.a.c).h, 0);
  const nPend = new Set([...pres.map(g => g.a.c), ...dg.map(x => x.c)].filter(isPrio)).size;
  const stats = [[`${pres.length + dg.length}`, 'disciplinas'], [`${Object.keys(state.sel).length}`, 'horários/semana'], [`${hPres + hDig}h`, 'carga horária total'],
    [`${hPres}h`, 'presencial'], [`${hDig}h`, 'digital'], [`${nPend} de ${PENDENTES.length}`, 'pendências na grade']];
  const bw = (W - 64 - 5 * 10) / 6;
  stats.forEach(([v, l], i) => {
    const x = 32 + i * (bw + 10);
    doc.setDrawColor(228, 222, 215); doc.setFillColor(250, 248, 246); doc.roundedRect(x, 48, bw, 44, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(30); doc.text(v, x + 10, 70);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110); doc.text(l.toUpperCase(), x + 10, 84);
  });
  doc.setTextColor(0);
  const presRow = g => { const need = slotsNeeded(g.a.c), used = g.slots.length;
    return [g.a.c, g.a.n, g.a.p, `${chLabel(g.a.c)}\n${used}/${need} horários`,
      g.slots.sort((x, y) => x.d - y.d || x.h - y.h).map(whenTxt).join('\n'), [...g.salas].join(', ') || '-', [...g.turmas].join(', ')]; };
  const resBody = [];
  const prioFlags = [];
  if (pres.length) {
    resBody.push([{ content: `Presenciais · ${hPres}h`, colSpan: 7, styles: { fillColor: [238, 234, 229], fontStyle: 'bold', textColor: 90 } }]); prioFlags.push(false);
    pres.forEach(g => { resBody.push(presRow(g)); prioFlags.push(isPrio(g.a.c)); });
  }
  if (dg.length) {
    resBody.push([{ content: `Atividades digitais · ${hDig}h`, colSpan: 7, styles: { fillColor: [238, 234, 229], fontStyle: 'bold', textColor: 90 } }]); prioFlags.push(false);
    dg.forEach(x => { resBody.push(digRow(x)); prioFlags.push(isPrio(x.c)); });
  }
  doc.autoTable({ ...RES_STYLE, startY: 108, head: RES_HEAD, body: resBody, didParseCell: pinkRows(prioFlags) });

  const chosen = new Set([...pres.map(g => g.a.c), ...dg.map(x => x.c)]);
  // página 3 em diante: pendências e a situação de cada uma
  doc.addPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('Pendências', 32, 36);
  const pendRows = PENDENTES.map(p => {
    const pr = OFERTAS.filter(a => a.c === p.c), dgt = DIGITAIS.some(x => x.c === p.c);
    const oferta = pr.length ? 'Presencial: ' + [...new Set(pr.map(whenTxt))].join(', ') : dgt ? 'Atividade digital' : 'Não ofertada';
    const usados = slotsUsed(p.c), need = slotsNeeded(p.c);
    const status = chosen.has(p.c) ? (pr.length ? `Na grade (${usados}/${need} horários)` : 'Na grade (digital)') : (pr.length || dgt) ? 'Ofertada, fora da grade' : 'Não ofertada';
    return [p.c, nomeDe(p.c), chLabel(p.c), oferta, status];
  });
  const cont = s => pendRows.filter(r => r[4].startsWith(s)).length;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(110);
  doc.text(`${PENDENTES.length} pendentes · ${cont('Na grade')} na grade · ${cont('Ofertada')} ofertadas fora da grade · ${cont('Não ofertada')} não ofertadas neste período`, 32, 52);
  doc.setTextColor(0);
  doc.autoTable({ startY: 64, head: [['Código', 'Disciplina', 'C.H.', 'Oferta neste período', 'Status']], body: pendRows,
    theme: 'grid', margin: M, styles: { fontSize: 8, cellPadding: 4, lineColor: [228, 222, 215], lineWidth: .5, valign: 'middle' },
    headStyles: { fillColor: PINK, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 2: { cellWidth: 36 }, 3: { cellWidth: 170 }, 4: { cellWidth: 130, fontStyle: 'bold' } },
    didParseCell: c => {
      if (c.section !== 'body') return;
      const st = c.row.raw[4];
      if (st.startsWith('Na grade')) { c.cell.styles.fillColor = [230, 244, 236]; if (c.column.index === 4) c.cell.styles.textColor = GREEN; }
      else if (st.startsWith('Ofertada')) { if (c.column.index === 4) c.cell.styles.textColor = [168, 70, 12]; }
      else { c.cell.styles.textColor = 140; }
    } });

  // rodapé com numeração
  const n = doc.getNumberOfPages(), H = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(140); doc.text(`Página ${i} de ${n}`, W - 32, H - 16, { align: 'right' }); doc.text([`Grade ${gradeNome()}`, alunoLinha()].filter(Boolean).join(' · '), 32, H - 16); }
  await offerFile(`${arquivoNome()}.pdf`, doc.output('blob'), 'PDF salvo.');
});

// ---- save / load grade file ----
$('btnSaveFile').onclick = e => busy(e.currentTarget, async () => {
  if (!needOne()) return;
  await offerFile(`${arquivoNome()}.json`, JSON.stringify(fileState(), null, 2), 'Arquivo da grade salvo. Use “Carregar grade” para abrir de novo.');
});
$('btnLoad').onclick = () => $('fileIn').click();
$('fileIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    let data;
    if (/\.xlsx$/i.test(f.name)) {
      if (!window.XLSX) throw new Error('A biblioteca do Excel ainda está carregando.');
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets['_dados'];
      if (!ws) throw new Error('Esse Excel não foi exportado por esta página.');
      data = JSON.parse(XLSX.utils.sheet_to_json(ws, { header: 1 })[1][0]);
    } else data = JSON.parse(await f.text());
    if (!data || data.app !== FILE_TAG) throw new Error('Esse arquivo não é uma grade salva por esta página.');
    // grade de outro bimestre: abre a oferta dele antes de aplicar as escolhas
    const bimArq = data.bimestre || (/^B\d-\d{4}$/.test(data.nome || '') ? data.nome : '');
    if (bimArq && bimArq !== BIM && !(await selecionarBimestre(bimArq))) throw new Error(`a oferta de ${bimArq} não está disponível`);
    const sel = {}, miss = [];
    for (const x of data.aulas || []) {
      let a = BY_ID[x.id];
      if (!a) { const d = DIAS.indexOf(x.dia), h = HORAS.indexOf(x.horario); a = OFERTAS.find(o => o.d === d && o.h === h && o.c === x.codigo); }
      if (a) sel[slotKey(a.d, a.h)] = a.id; else miss.push(x.codigo);
    }
    const dig = (data.digitais || []).map(x => DIGITAIS.find(y => y.id === x.id) || DIGITAIS.find(y => y.c === x.codigo)).filter(Boolean).map(y => y.id);
    state.sel = sel; state.dig = dig; state.aluno = { ...ALUNO_VAZIO(), ...(data.aluno || state.aluno) }; preencherAluno(); save(); renderAll(); renderDig();
    toast(`Grade carregada: ${Object.keys(sel).length} aulas, ${dig.length} digitais` + (miss.length ? ` · não encontradas: ${miss.join(', ')}` : ''));
  } catch (err) { toast('Não consegui carregar: ' + (err.message || 'arquivo inválido')); }
});
