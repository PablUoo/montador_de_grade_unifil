// ui/classroom.js — importar/remover os códigos do Classroom (arquivo local) do bimestre aberto
function renderClassroomBotoes() {
  $('btnClsLimpar').hidden = !temClassroom();
  $('btnClsImport').textContent = temClassroom() ? 'Trocar códigos do Classroom' : 'Importar códigos do Classroom';
  // dica enquanto não há códigos: eles não vêm do site, só do arquivo local
  $('clsDica').hidden = temClassroom() || !BIM;
  $('clsDica').innerHTML = `Os códigos do Classroom não ficam no site público. Para vê-los nos quadros, clique em <b>Importar códigos do Classroom</b> e escolha o arquivo <code>assets/classroom-${esc(BIM)}.xlsx</code> do projeto.`;
}
$('btnClsImport').onclick = () => {
  if (!BIM) { toast('Escolha o bimestre primeiro.'); return; }
  $('clsIn').click();
};
$('clsIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const mapa = lerPlanilhaClassroom(await f.arrayBuffer());
    salvarClassroom(mapa); renderAll();
    toast(`Códigos do Classroom importados para ${Object.keys(mapa).length} aulas de ${gradeNome()}`);
  } catch (err) { toast('Não consegui importar: ' + err.message); }
});
let clsArmed = null;
$('btnClsLimpar').onclick = () => {
  const b = $('btnClsLimpar');
  if (!clsArmed) { b.textContent = 'Clique de novo para remover'; clsArmed = setTimeout(() => { b.textContent = 'Remover códigos'; clsArmed = null; }, 3000); return; }
  clearTimeout(clsArmed); clsArmed = null; b.textContent = 'Remover códigos';
  salvarClassroom({}); renderAll(); toast('Códigos do Classroom removidos deste navegador');
};
