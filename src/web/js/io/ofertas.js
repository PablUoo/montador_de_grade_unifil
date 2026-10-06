// io/ofertas.js — lê as ofertas de um bimestre (jobs/ofertas/<bimestre>.xlsx) e o índice de bimestres
// Formato da planilha (gerada por scripts/build-dados.sh):
//   aba "Aulas":    Código | Disciplina | Dia | Horário | Turma | Curso | Sala | Professor | Tipo | C.H. | Classroom
//   aba "Digitais": Código | Disciplina | Turma | Curso | Professor | C.H.
const OFERTAS_URL = 'jobs/ofertas/';

async function lerIndiceOfertas() {
  const r = await fetch(OFERTAS_URL + 'index.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('índice de ofertas não encontrado');
  return r.json();
}

async function baixarOfertas(bim) {
  const r = await fetch(OFERTAS_URL + encodeURIComponent(bim) + '.xlsx', { cache: 'no-cache' });
  if (!r.ok) throw new Error(`não há oferta publicada para ${bim}`);
  return lerPlanilhaOfertas(await r.arrayBuffer());
}

// linhas de uma aba como objetos, usando a 1ª linha como cabeçalho (sem acento e minúsculo)
function linhasDaAba(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  const cab = (rows.shift() || []).map(h => norm(String(h)).trim());
  return rows.filter(r => r.some(v => String(v).trim())).map(r => Object.fromEntries(cab.map((h, i) => [h, String(r[i] ?? '').trim()])));
}
const acharAba = (wb, re) => wb.Sheets[wb.SheetNames.find(n => re.test(norm(n)))];

function lerPlanilhaOfertas(buf) {
  const wb = XLSX.read(buf, { type: 'array' });
  const wsA = acharAba(wb, /^aulas/), wsD = acharAba(wb, /^(atividades )?digita/);
  if (!wsA) throw new Error('a planilha não tem a aba "Aulas"');
  const ch = {};
  const turmaDe = r => r.turma ? `${r.turma} ${r.curso}`.trim() : '';
  // uma oferta = mesma disciplina, dia, horário, sala, professor e Classroom: cada turma (ou turmas que dividem o mesmo Classroom) é uma opção
  const grupos = new Map();
  for (const r of linhasDaAba(wsA)) {
    const c = r['codigo'], d = DIAS.indexOf(r['dia']), h = HORAS.indexOf(r['horario']);
    if (!c || d < 0 || h < 0) continue;
    if (+r['c.h.']) ch[c] = +r['c.h.'];
    const id = [d, h, c, r.sala, r.professor, ...(r.classroom ? [r.classroom] : [])].join('|');
    if (!grupos.has(id)) grupos.set(id, { id, c, n: r.disciplina, d, h, s: r.sala, p: r.professor, tp: r.tipo, k: r.classroom || '', t: [] });
    const t = turmaDe(r); if (t && !grupos.get(id).t.includes(t)) grupos.get(id).t.push(t);
  }
  const dig = new Map();
  for (const r of wsD ? linhasDaAba(wsD) : []) {
    const c = r['codigo']; if (!c) continue;
    if (+r['c.h.']) ch[c] = +r['c.h.'];
    const id = `${c}|${r.professor}`;
    if (!dig.has(id)) dig.set(id, { id, c, n: r.disciplina, p: r.professor, t: [] });
    const t = turmaDe(r); if (t && !dig.get(id).t.includes(t)) dig.get(id).t.push(t);
  }
  const aulas = [...grupos.values()].map(a => ({ ...a, t: a.t.sort() }));
  if (!aulas.length) throw new Error('nenhuma aula encontrada na aba "Aulas"');
  return { aulas, digitais: [...dig.values()], ch };
}
