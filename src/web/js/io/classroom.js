// io/classroom.js — código do Google Classroom de cada oferta (coluna "Classroom" da planilha de ofertas)
// Cada oferta é uma turma (ou turmas que dividem a mesma sala virtual), então tem no máximo um código: a.k
const classroomDe = a => (a && a.k ? [{ code: a.k, t: '' }] : []);
const classroomTexto = a => (a && a.k) || '';
