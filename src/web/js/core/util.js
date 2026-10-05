// core/util.js — utilitários de DOM e texto (sem regra de negócio)
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slotKey = (d, h) => d + '|' + h;
const cursoOf = t => /CC\/ES$/.test(t) ? 'CC/ES' : t.slice(-2);
const chip = t => { const c = cursoOf(t); return `<span class="chip ${c === 'CC' ? 'cc' : c === 'ES' ? 'es' : ''}">${esc(t)}</span>`; };
