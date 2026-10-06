// io/classroom.js — códigos do Google Classroom importados de um arquivo LOCAL (assets/classroom-<bimestre>.xlsx)
// O site público não tem esses códigos (quem tem o código entra na turma); eles ficam só no navegador de quem importou.
// Formato: Código | Dia | Horário | Sala | Professor | Turma | Curso | Classroom
const CHAVE_CLASSROOM = b => `montador-grade:classroom:${b}`;
let CLASSROOM = {};   // id da oferta -> [{ t: 'E1/2023 ES', code: 'abc123' }]

function carregarClassroomSalvo() { const s = BIM && lerJSON(CHAVE_CLASSROOM(BIM)); CLASSROOM = s && typeof s === 'object' ? s : {}; }
function salvarClassroom(mapa) { CLASSROOM = mapa; if (BIM) gravarJSON(CHAVE_CLASSROOM(BIM), mapa); }
const temClassroom = () => Object.keys(CLASSROOM).length > 0;

// códigos de uma oferta; com mais de um, cada um vem com a turma
function classroomDe(a) {
  const l = CLASSROOM[a?.id] || [];
  const codigos = [...new Set(l.map(x => x.code))];
  if (codigos.length <= 1) return codigos.map(code => ({ code, t: '' }));
  return codigos.map(code => ({ code, t: l.filter(x => x.code === code).map(x => x.t).join(', ') }));
}
const classroomTexto = a => classroomDe(a).map(x => x.t ? `${x.code} (${x.t})` : x.code).join(' · ');

function lerPlanilhaClassroom(buf) {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames.find(n => /classroom/i.test(n)) || wb.SheetNames[0]];
  const mapa = {}; let n = 0;
  for (const r of linhasDaAba(ws)) {
    const d = DIAS.indexOf(r.dia), h = HORAS.indexOf(r.horario), code = r.classroom;
    if (!r.codigo || d < 0 || h < 0 || !code) continue;
    const id = [d, h, r.codigo, r.sala, r.professor].join('|');
    if (!BY_ID[id]) continue;   // aula que não existe na oferta aberta
    (mapa[id] ||= []).push({ t: r.turma ? `${r.turma} ${r.curso}`.trim() : '', code }); n++;
  }
  if (!n) throw new Error('nenhum código de Classroom bate com as aulas deste bimestre (o arquivo é de outro bimestre?)');
  return mapa;
}
