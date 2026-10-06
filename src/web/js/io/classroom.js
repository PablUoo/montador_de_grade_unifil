// io/classroom.js — códigos do Google Classroom de cada aula (vêm da coluna "Classroom" da planilha de ofertas)
let CLASSROOM = {};   // id da oferta -> [{ t: 'E1/2023 ES', code: 'abc123' }]

// códigos de uma oferta; com mais de um (um por turma), cada um vem com as turmas dele
function classroomDe(a) {
  const l = CLASSROOM[a?.id] || [];
  const codigos = [...new Set(l.map(x => x.code))];
  if (codigos.length <= 1) return codigos.map(code => ({ code, t: '' }));
  return codigos.map(code => ({ code, t: l.filter(x => x.code === code).map(x => x.t).join(', ') }));
}
const classroomTexto = a => classroomDe(a).map(x => x.t ? `${x.code} (${x.t})` : x.code).join(' · ');
