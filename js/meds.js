/* Medicamentos: kit essencial, avaliação de validade e dicas.
   Conteúdo informativo, sem doses. Não substitui orientação de médico ou farmacêutico.
   venc = como tratar o item vencido: 'ok' (sólido seco íntegro: risco menor), 'cuidado' (evitar; só com orientação), 'nao' (não usar). */
(function (root) {
  var GRUPOS = {
    dor: 'Dor e febre', alergia: 'Alergias', gastro: 'Estômago e intestino', respiratorio: 'Respiração',
    pele: 'Feridas e pele', materiais: 'Materiais e instrumentos', continuo: 'Uso contínuo e condições especiais'
  };

  var CATEGORIAS = [
    { id: 'paracetamol', nome: 'Paracetamol', grupo: 'dor', prio: 'essencial', forma: 'solido', venc: 'ok',
      para: 'Dor e febre.', nota: 'Respeite a dose máxima diária da bula: excesso agride o fígado. Em suspeita de dengue, é um dos indicados para febre e dor.' },
    { id: 'dipirona', nome: 'Dipirona', grupo: 'dor', prio: 'essencial', forma: 'solido', venc: 'ok',
      para: 'Dor e febre.', nota: 'Evite se já teve alergia a ela. Em suspeita de dengue, é um dos indicados para febre e dor.' },
    { id: 'ibuprofeno', nome: 'Ibuprofeno (anti-inflamatório)', grupo: 'dor', prio: 'recomendado', forma: 'solido', venc: 'ok',
      para: 'Dor, inflamação e febre.', nota: 'Evite em suspeita de dengue, úlcera, problemas renais e gestação, sem orientação. Tome com alimento.' },
    { id: 'anti_histaminico', nome: 'Anti-histamínico (ex.: loratadina)', grupo: 'alergia', prio: 'recomendado', forma: 'solido', venc: 'ok',
      para: 'Alergias, coceira, picadas.', nota: 'Alguns dão sono. Crianças e gestantes: peça orientação.' },
    { id: 'sro', nome: 'Sais de reidratação oral (sachês)', grupo: 'gastro', prio: 'essencial', forma: 'solido', venc: 'ok',
      para: 'Diarreia, vômitos e desidratação.', nota: 'Dissolva só em água limpa, na quantidade indicada na embalagem, e use a mistura pronta em até 24 horas. Procure atendimento se houver sangue nas fezes, febre alta ou sinais de desidratação.' },
    { id: 'antiacido', nome: 'Antiácido', grupo: 'gastro', prio: 'recomendado', forma: 'solido', venc: 'ok',
      para: 'Azia e má digestão.', nota: 'Uso ocasional. Dor persistente exige avaliação.' },
    { id: 'soro_fisiologico', nome: 'Soro fisiológico', grupo: 'respiratorio', prio: 'recomendado', forma: 'liquido', venc: 'cuidado',
      para: 'Lavar nariz, olhos e feridas.', nota: 'Depois de aberto, o frasco perde a esterilidade: descarte conforme a bula.' },
    { id: 'broncodilatador', nome: 'Broncodilatador (bombinha)', grupo: 'respiratorio', prio: 'condicional', forma: 'spray', venc: 'cuidado',
      para: 'Asma e bronquite, para quem já usa.', nota: 'Só para quem tem prescrição. Falta de ar intensa é emergência.' },
    { id: 'antisseptico', nome: 'Antisséptico (clorexidina ou povidine)', grupo: 'pele', prio: 'essencial', forma: 'liquido', venc: 'cuidado',
      para: 'Limpar feridas e mãos.', nota: 'Lave a ferida com água limpa e sabão antes.' },
    { id: 'curativos', nome: 'Curativos, gaze, atadura e esparadrapo', grupo: 'pele', prio: 'essencial', forma: 'material', venc: 'ok',
      para: 'Cobrir e proteger feridas.', nota: 'Itens estéreis só valem enquanto a embalagem estiver íntegra.' },
    { id: 'pomada', nome: 'Pomada cicatrizante ou antibiótica tópica', grupo: 'pele', prio: 'recomendado', forma: 'pomada', venc: 'cuidado',
      para: 'Pequenos cortes e assaduras.', nota: 'Para feridas pequenas e limpas. Infecção, pus ou febre exigem avaliação.' },
    { id: 'repelente', nome: 'Repelente de insetos', grupo: 'pele', prio: 'recomendado', forma: 'liquido', venc: 'ok',
      para: 'Prevenir dengue e outras doenças de mosquitos.', nota: 'Vale mais que remédio: evita adoecer.' },
    { id: 'termometro', nome: 'Termômetro', grupo: 'materiais', prio: 'essencial', forma: 'material', venc: 'ok',
      para: 'Medir febre.', nota: 'Os digitais precisam de pilha: guarde reservas.' },
    { id: 'alcool70', nome: 'Álcool 70%', grupo: 'materiais', prio: 'essencial', forma: 'liquido', venc: 'ok',
      para: 'Higiene das mãos e de instrumentos.', nota: 'Mantenha o frasco bem fechado, pois evapora e perde força. Inflamável.' },
    { id: 'luvas_mascaras', nome: 'Luvas e máscaras descartáveis', grupo: 'materiais', prio: 'recomendado', forma: 'material', venc: 'ok',
      para: 'Cuidar de doentes e feridas.', nota: '' },
    { id: 'tesoura_pinca', nome: 'Tesoura, pinça e fita adesiva', grupo: 'materiais', prio: 'recomendado', forma: 'material', venc: 'ok',
      para: 'Cortar curativos e retirar farpas.', nota: '' },

    { id: 'anti_hipertensivo', nome: 'Anti-hipertensivo (pressão alta)', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'cuidado',
      para: 'Controle da pressão, para quem já usa.', nota: 'Não interrompa nem troque a dose sem orientação.' },
    { id: 'insulina', nome: 'Insulina', grupo: 'continuo', prio: 'condicional', forma: 'injetavel', venc: 'nao',
      para: 'Diabetes, para quem já usa.', nota: 'Veja as dicas de insulina sem geladeira na seção de validade e armazenamento.' },
    { id: 'antidiabetico', nome: 'Antidiabético oral', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'cuidado',
      para: 'Diabetes, para quem já usa.', nota: 'Peça ao médico orientação sobre dieta e doses em situação de racionamento.' },
    { id: 'anticoagulante', nome: 'Anticoagulante', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'nao',
      para: 'Prevenção de coágulos, para quem já usa.', nota: 'A faixa de segurança é estreita: não use vencido nem mude a dose sem orientação.' },
    { id: 'tireoide', nome: 'Hormônio da tireoide', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'cuidado',
      para: 'Hipotireoidismo, para quem já usa.', nota: '' },
    { id: 'anticonvulsivante', nome: 'Anticonvulsivante', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'nao',
      para: 'Epilepsia, para quem já usa.', nota: 'Falta ou troca pode causar crises: mantenha reserva e fale com o médico.' },
    { id: 'psiquiatrico', nome: 'Antidepressivo ou ansiolítico', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'cuidado',
      para: 'Saúde mental, para quem já usa.', nota: 'A interrupção brusca pode causar problemas: tenha reserva.' },
    { id: 'contraceptivo', nome: 'Anticoncepcional', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'cuidado',
      para: 'Contracepção, para quem já usa.', nota: 'Vencido pode falhar. Use também outro método se tiver dúvida.' },
    { id: 'adrenalina', nome: 'Adrenalina (autoinjetor)', grupo: 'continuo', prio: 'condicional', forma: 'injetavel', venc: 'nao',
      para: 'Reações alérgicas graves, para quem tem prescrição.', nota: 'Substitua antes de vencer e saiba usar. Ligue 192 após aplicar.' },
    { id: 'nitroglicerina', nome: 'Nitroglicerina (sublingual)', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'nao',
      para: 'Dor no peito de origem cardíaca, para quem tem prescrição.', nota: 'Perde o efeito com o tempo e aberto. Dor no peito é emergência: ligue 192.' },
    { id: 'pediatrico', nome: 'Medicamentos pediátricos (gotas e xaropes)', grupo: 'continuo', prio: 'condicional', forma: 'liquido', venc: 'nao',
      para: 'Febre e dor em crianças.', nota: 'A dose depende do peso: siga a bula ou a orientação do pediatra.' },
    { id: 'antibiotico', nome: 'Antibióticos (somente com prescrição)', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'nao',
      para: 'Infecções bacterianas, com receita.', nota: 'Não estoque para automedicação: uso incorreto causa resistência. Pergunte ao médico se há algum motivo para manter reserva.' },
    { id: 'outro_continuo', nome: 'Outro medicamento de uso contínuo', grupo: 'continuo', prio: 'condicional', forma: 'solido', venc: 'cuidado',
      para: 'Qualquer tratamento prescrito.', nota: 'Peça ao médico a receita para 90 dias, quando possível.' }
  ];

  var FORMAS = { solido: 'Comprimido ou cápsula', liquido: 'Líquido, gotas ou xarope', injetavel: 'Injetável (caneta, ampola)', pomada: 'Pomada ou creme', spray: 'Spray ou inalador', colirio: 'Colírio ou pomada oftálmica', material: 'Material ou instrumento' };
  var UNIDADES = { comp: 'comprimidos', ml: 'ml', un: 'unidades', fr: 'frascos', cx: 'caixas' };
  var ORDEM = { ok: 0, cuidado: 1, nao: 2 };

  var CONSELHO = {
    ok: 'Em caso extremo, sem alternativa: formas sólidas secas, íntegras e bem guardadas costumam perder potência aos poucos. Pode ser usado com cautela se o aspecto estiver normal. Não há garantia.',
    cuidado: 'Evite vencido. Só em caso extremo e, se possível, após falar com um farmacêutico ou médico, e se o aspecto estiver normal.',
    nao: 'Não use vencido: risco de não funcionar ou de fazer mal. Reponha antes de vencer.'
  };

  var DICAS = [
    { t: 'O que a validade significa', d: 'É a data até a qual o fabricante garante potência e segurança, com o produto fechado e bem guardado. Estudos do FDA com estoques militares lacrados mostraram que muitos medicamentos sólidos continuaram estáveis além da data. Mas em casa o armazenamento é pior e não há garantia.' },
    { t: 'Em caso extremo: o que é menos arriscado', d: 'Comprimidos e cápsulas secos, na embalagem original, guardados em local fresco e seco, perdem potência aos poucos. Use só se não houver alternativa, e tome a dose de bula, nunca mais para compensar. Vencido é último recurso, nunca primeira escolha.' },
    { t: 'Descarte se estiver alterado', d: 'Comprimido úmido, manchado, quebradiço, esfarelando ou grudado; cápsula mole, pegajosa ou deformada; líquido turvo, com cor, cheiro ou depósito diferente; pomada separada ou ressecada; embalagem aberta, danificada ou sem identificação.' },
    { t: 'Nunca use vencido', d: 'Insulina e outros injetáveis, adrenalina, nitroglicerina, antibióticos (principalmente em suspensão), colírios e soluções oftálmicas, gotas e xaropes, vacinas, medicamentos de faixa de segurança estreita (anticoagulantes, anticonvulsivantes, digitálicos, lítio) e os que ficaram expostos a calor ou umidade. Repor é a regra.' },
    { t: 'Guarde direito', d: 'A Anvisa orienta não guardar remédio no banheiro, na cozinha nem dentro do carro: calor e umidade estragam. Prefira um armário seco e fresco, longe de janelas e de crianças, na embalagem original com bula. Só use a geladeira se a bula pedir. Revise a caixa a cada 6 meses.' },
    { t: 'Sem energia: insulina e remédios de geladeira', d: 'Insulina em uso costuma poder ficar fora da geladeira por cerca de 28 dias (alguns tipos, mais). Confira a bula do seu produto e mantenha longe do calor e do sol, sem congelar. A que ainda está lacrada deve continuar refrigerada: se ficou fora por horas, consulte um farmacêutico ou médico. Uma caixa térmica com gelo protege por algumas horas.' },
    { t: 'Febre e suspeita de dengue', d: 'O Ministério da Saúde orienta evitar AAS (aspirina) e anti-inflamatórios, como ibuprofeno, nimesulida e diclofenaco, e usar dipirona ou paracetamol para dor e febre, sempre com orientação de profissional. Procure atendimento nos primeiros sintomas e mantenha hidratação.' },
    { t: 'Doenças crônicas: prepare-se com antecedência', d: 'Peça ao médico, quando possível, receitas para 90 dias do que você usa de forma contínua. Anote nome, dose e horários de cada pessoa e guarde uma lista impressa. Nunca interrompa nem divida doses por conta própria sem orientação.' },
    { t: 'Em caso de emergência', d: 'Ligue 192 (SAMU) ou 193 (Bombeiros). Em caso de intoxicação ou ingestão errada de remédio, procure o centro de informação toxicológica da sua região ou o pronto atendimento, levando a embalagem.' }
  ];

  function diasAte(validade, hoje) {
    if (!validade) return null;
    var v = new Date(validade + 'T00:00:00'), h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return Math.round((v - h) / 86400000);
  }
  function catPorId(id) { for (var i = 0; i < CATEGORIAS.length; i++) if (CATEGORIAS[i].id === id) return CATEGORIAS[i]; return null; }

  /* nível de cuidado com o item vencido, combinando categoria e forma farmacêutica */
  function nivel(m) {
    var cat = catPorId(m.cat), n = cat ? cat.venc : (m.forma === 'solido' || m.forma === 'material' ? 'cuidado' : 'nao');
    var min = { injetavel: 'nao', colirio: 'nao', liquido: 'cuidado', pomada: 'cuidado', spray: 'cuidado' }[m.forma];
    if (min && ORDEM[min] > ORDEM[n]) n = min;
    return n;
  }

  /* situação de um item: ok | atencao (vence em 90 dias) | vencido | sem_data */
  function avaliar(m, hoje) {
    hoje = hoje || new Date();
    var d = diasAte(m.validade, hoje), lv = nivel(m);
    var st = d === null ? 'sem_data' : d < 0 ? 'vencido' : d <= 90 ? 'atencao' : 'ok';
    return { dias: d, situacao: st, nivel: lv, conselho: st === 'vencido' ? CONSELHO[lv] : '' };
  }

  /* dias de duração de um item de uso contínuo (quantidade / dose por dia) */
  function duracao(m) {
    var q = Number(m.qtd) || 0, dose = Number(m.dose) || 0;
    return m.continuo && dose > 0 ? q / dose : null;
  }

  /* kit essencial: para cada categoria, se há ao menos um item não vencido */
  function kit(meds, hoje) {
    hoje = hoje || new Date();
    return CATEGORIAS.map(function (c) {
      var itens = (meds || []).filter(function (m) { return m.cat === c.id; });
      var bons = itens.filter(function (m) { return avaliar(m, hoje).situacao !== 'vencido' && (Number(m.qtd) || 0) > 0; });
      return { cat: c, tem: bons.length > 0, soVencido: !bons.length && itens.length > 0 };
    });
  }

  function resumo(meds, hoje) {
    hoje = hoje || new Date();
    var r = { total: (meds || []).length, vencidos: 0, atencao: 0, continuoMin: null, continuoNome: '' };
    (meds || []).forEach(function (m) {
      var a = avaliar(m, hoje);
      if (a.situacao === 'vencido') r.vencidos++; else if (a.situacao === 'atencao') r.atencao++;
      var d = duracao(m);
      if (d !== null && (r.continuoMin === null || d < r.continuoMin)) { r.continuoMin = d; r.continuoNome = m.nome; }
    });
    var k = kit(meds, hoje).filter(function (x) { return x.cat.prio === 'essencial'; });
    r.essenciais = k.length; r.essenciaisOk = k.filter(function (x) { return x.tem; }).length;
    return r;
  }

  var api = { GRUPOS: GRUPOS, CATEGORIAS: CATEGORIAS, FORMAS: FORMAS, UNIDADES: UNIDADES, CONSELHO: CONSELHO, DICAS: DICAS,
              catPorId: catPorId, nivel: nivel, avaliar: avaliar, duracao: duracao, kit: kit, resumo: resumo, diasAte: diasAte };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MEDS = api;
})(typeof window !== 'undefined' ? window : this);
