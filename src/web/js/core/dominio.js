// core/dominio.js — regras do domínio: ofertas, pendências, turmas e carga horária
// Os dados chegam em tempo de execução: definirOfertas() (planilha do bimestre) e definirPendencias() (planilha importada)
const DIAS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const DIAS_CURTO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HORAS = ['19:00 - 20:30', '20:45 - 22:15'];
let OFERTAS = [], BY_ID = {}, DIGITAIS = [], CH_MAP = {}, NOMES = {};
function definirOfertas(aulas, digitais, ch) {
  OFERTAS = aulas.filter(a => a.c !== 'FLEX');
  BY_ID = Object.fromEntries(OFERTAS.map(a => [a.id, a]));
  DIGITAIS = digitais; CH_MAP = ch; NOMES = {};
  for (const a of [...OFERTAS, ...DIGITAIS]) NOMES[a.c] ||= a.n;
}
let PENDENTES = [], PEND = new Map();
function definirPendencias(lista) { PENDENTES = lista; PEND = new Map(lista.map(p => [p.c, p])); }
const nomeDe = c => PEND.get(c)?.n || NOMES[c] || '';
const isPrio = c => PEND.has(c);
const PRIO = '<span class="chip prio">PRIORIDADE · pendente</span>';

function matches(a) {
  if (filt.codes.length && !filt.codes.includes(a.c)) return false;
  if (filt.onlyPend && !isPrio(a.c)) return false;
  if (filt.curso && !a.t.some(t => cursoOf(t).includes(filt.curso))) return false;
  if (filt.turmas.length && !a.t.some(t => filt.turmas.includes(t))) return false;
  if (filt.q) {
    const q = norm(filt.q);
    if (!norm(a.n + ' ' + a.c + ' ' + a.p).includes(q)) return false;
  }
  return true;
}
const offersAt = (d, h) => OFERTAS.filter(a => a.d === d && a.h === h);
// outros encontros da mesma turma: mesmo código de disciplina e mesmo Classroom; sem Classroom, turma em comum (ou mesmo professor)
function siblings(a) {
  return OFERTAS.filter(b => b !== a && b.c === a.c && (a.k || b.k
    ? a.k === b.k
    : (a.t.length ? b.t.some(t => a.t.includes(t)) : b.p === a.p)));
}
const whenTxt = a => `${DIAS_CURTO[a.d]} ${HORAS[a.h].slice(0, 5)}`;

// carga horária: cada horário da grade (1º ou 2º) vale 15h -> 15h = 1 horário, 30h = 2 horários
const SLOT_H = 15;
function chInfo(c) {
  const known = CH_MAP[c] || PEND.get(c)?.ch;
  if (known) return { h: known, est: false };
  // sem C.H. na oferta nem na planilha de pendências: estima pelo nº de encontros semanais da turma
  const a = OFERTAS.find(o => o.c === c);
  const n = a ? 1 + new Set(siblings(a).map(b => slotKey(b.d, b.h))).size : 1;
  return { h: n * SLOT_H, est: true };
}
const slotsNeeded = c => Math.max(1, Math.round(chInfo(c).h / SLOT_H));
const slotsUsed = c => Object.values(state.sel).filter(id => BY_ID[id]?.c === c).length;
// C.H. completa: a disciplina já tem todos os horários de que precisa
const chCompleta = c => slotsUsed(c) >= slotsNeeded(c);
// pode aparecer como opção no horário k? some quando a C.H. já foi completada em outros horários
const disponivelEm = (a, k) => !chCompleta(a.c) || BY_ID[state.sel[k]]?.c === a.c;
const chLabel = c => { const i = chInfo(c); return `${i.h}h${i.est ? ' (estimada)' : ''}`; };
