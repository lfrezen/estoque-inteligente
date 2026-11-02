/* Prontidão para emergências: checklists, pontuação, mochila de fuga e plano da família.
   Foco em proteção e logística (apagão, falta de água, enchente, pandemia, desabastecimento, evacuação).
   Baseado em orientações gerais de proteção civil e Cruz Vermelha: kit para 72 h, rádio, lanterna, documentos,
   plano familiar com pontos de encontro e revisão a cada 6 meses. */
(function (root) {
  var AREAS = {
    luz: { nome: 'Luz e energia', ic: '🔦', w: 7 },
    comunicacao: { nome: 'Comunicação e informação', ic: '📻', w: 6 },
    higiene: { nome: 'Higiene e saneamento', ic: '🧼', w: 7 },
    seguranca: { nome: 'Segurança da casa', ic: '🏠', w: 7 },
    mochila: { nome: 'Mochila de fuga (72 h)', ic: '🎒', w: 10 },
    plano: { nome: 'Plano da família', ic: '👨‍👩‍👧', w: 9 },
    cuidado: { nome: 'Cuidar de todos (crianças, idosos, pets, moral)', ic: '💛', w: 5 },
    carro: { nome: 'Carro', ic: '🚗', w: 3 }
  };
  var AUTO = {
    comida: { nome: 'Comida (dias de estoque)', ic: '🍚', w: 22 },
    agua: { nome: 'Água (ideal: 14 dias)', ic: '💧', w: 18 },
    gas: { nome: 'Gás para cozinhar', ic: '🧯', w: 4 },
    remedios: { nome: 'Medicamentos', ic: '💊', w: 10 }
  };

  // prio: 3 = crítico, 2 = importante, 1 = bom ter. peso em gramas (mochila). cond: condição para aparecer. campo: preenchido no plano = pronto.
  var ITENS = [
    // Luz e energia
    { id: 'luz_lanterna', area: 'luz', nome: 'Lanterna, uma por pessoa', prio: 3, qtd: 'pessoa', dica: 'LED é o mais econômico. Guarde em lugar conhecido de todos: no escuro, você precisa achá-la.' },
    { id: 'luz_pilhas', area: 'luz', nome: 'Pilhas e baterias reserva (lanternas e rádio)', prio: 3, dica: 'Compre dos tipos usados nos seus aparelhos e confira a validade.' },
    { id: 'luz_cabeca', area: 'luz', nome: 'Lanterna de cabeça (mãos livres)', prio: 2, qtd: 'adulto' },
    { id: 'luz_powerbank', area: 'luz', nome: 'Power bank carregado, um por adulto', prio: 3, qtd: 'adulto', dica: 'Recarregue uma vez por mês e antes de tempestades ou avisos.' },
    { id: 'luz_solar', area: 'luz', nome: 'Carregador solar ou de manivela', prio: 1 },
    { id: 'luz_velas', area: 'luz', nome: 'Velas e fósforos/isqueiro em pote à prova d’água', prio: 2, dica: 'Risco de incêndio: nunca deixe vela acesa sozinha nem perto de cortinas e crianças. Prefira lanternas.' },
    // Comunicação
    { id: 'com_radio', area: 'comunicacao', nome: 'Rádio de pilha ou de manivela', prio: 3, dica: 'Alertas da Defesa Civil e comunicados oficiais chegam pelo rádio quando celular e internet falham.' },
    { id: 'com_contatos', area: 'comunicacao', nome: 'Lista impressa de telefones (família, saúde, 199 Defesa Civil, 193 Bombeiros)', prio: 3, dica: 'Sem bateria o contato do celular não abre. Imprima na aba Relatório.' },
    { id: 'com_apito', area: 'comunicacao', nome: 'Apito, um por pessoa', prio: 2, qtd: 'pessoa', dica: 'Chama ajuda gastando bem menos energia que gritar.' },
    { id: 'com_mapas', area: 'comunicacao', nome: 'Mapa da região impresso ou salvo offline', prio: 2 },
    { id: 'com_canais', area: 'comunicacao', nome: 'Sei quais canais oficiais seguir (Defesa Civil, prefeitura, rádio local)', prio: 2 },
    { id: 'com_bateria', area: 'comunicacao', nome: 'Hábito: celular com mais de 50% de carga em dias de alerta', prio: 1 },
    // Higiene e saneamento
    { id: 'hig_papel', area: 'higiene', nome: 'Papel higiênico para pelo menos 4 semanas', prio: 3 },
    { id: 'hig_sabao', area: 'higiene', nome: 'Sabão, sabonete e detergente', prio: 3, dica: 'Lavar as mãos evita a maior parte das doenças em emergências.' },
    { id: 'hig_sacos', area: 'higiene', nome: 'Sacos de lixo grandes e resistentes', prio: 3, dica: 'Servem para lixo, banheiro de emergência e capa de chuva.' },
    { id: 'hig_cloro', area: 'higiene', nome: 'Água sanitária sem perfume (desinfecção e tratamento de água, conforme o rótulo)', prio: 3 },
    { id: 'hig_balde', area: 'higiene', nome: 'Balde com tampa para banheiro de emergência', prio: 2, dica: 'Forre com saco, use e feche. Sem água, o vaso sanitário vira foco de doença.' },
    { id: 'hig_alcool', area: 'higiene', nome: 'Álcool em gel', prio: 2 },
    { id: 'hig_dental', area: 'higiene', nome: 'Escova e pasta de dente de reserva', prio: 2 },
    { id: 'hig_luvas', area: 'higiene', nome: 'Luvas descartáveis e máscaras', prio: 2 },
    { id: 'hig_lencos', area: 'higiene', nome: 'Lenços umedecidos', prio: 1 },
    { id: 'hig_absorventes', area: 'higiene', nome: 'Absorventes ou coletor menstrual', prio: 3, cond: 'mulher' },
    { id: 'hig_fraldas', area: 'higiene', nome: 'Fraldas e lenços para bebês', prio: 3, cond: 'bebe' },
    // Segurança da casa
    { id: 'seg_registros', area: 'seguranca', nome: 'Sei fechar os registros de gás, água e energia', prio: 3, dica: 'Em enchentes, abalos e incêndios, é a primeira coisa a fazer.' },
    { id: 'seg_extintor', area: 'seguranca', nome: 'Extintor ou manta contra fogo na cozinha', prio: 3 },
    { id: 'seg_fuga', area: 'seguranca', nome: 'Duas rotas de saída da casa conhecidas e desobstruídas', prio: 3 },
    { id: 'seg_co', area: 'seguranca', nome: 'Regra da casa: nunca usar fogareiro, carvão ou gerador em ambiente fechado', prio: 3, dica: 'O monóxido de carbono não tem cheiro e mata. Marque quando todos souberem.' },
    { id: 'seg_fumaca', area: 'seguranca', nome: 'Detector de fumaça (e de monóxido de carbono, se usar fogareiro)', prio: 2 },
    { id: 'seg_abrigo', area: 'seguranca', nome: 'Cômodo mais seguro definido, longe de janelas', prio: 2 },
    { id: 'seg_trancas', area: 'seguranca', nome: 'Portas e janelas com trancas funcionando', prio: 2 },
    { id: 'seg_ferramentas', area: 'seguranca', nome: 'Chave inglesa, alicate, fita e canivete', prio: 2 },
    { id: 'seg_chaves', area: 'seguranca', nome: 'Cópia das chaves de casa e do carro com alguém de confiança', prio: 1 },
    { id: 'seg_apto', area: 'seguranca', nome: 'Combinado com o condomínio: escadas, água da caixa e contato do síndico', prio: 2, cond: 'apto' },
    { id: 'seg_casa', area: 'seguranca', nome: 'Sei de onde vem a água da casa (caixa, poço ou cisterna) e como mantê-la', prio: 2, cond: 'casa' },
    { id: 'seg_cidade', area: 'seguranca', nome: 'Rotas de saída da cidade e alternativas, caso haja bloqueios', prio: 2, cond: 'cidade' },
    { id: 'seg_interior', area: 'seguranca', nome: 'Fonte alternativa de água (poço, nascente, cisterna) e de combustível', prio: 2, cond: 'interior' },
    // Mochila de fuga (por pessoa)
    { id: 'moc_agua', area: 'mochila', nome: 'Água (1,5 a 2 L) e pastilhas de purificação', prio: 3, peso: 2000, dica: 'O ideal seria 3 L por dia, mas pesa demais: leve pouca água e o meio de purificar a que encontrar.' },
    { id: 'moc_comida', area: 'mochila', nome: 'Comida pronta e leve para 72 h (cerca de 6.000 kcal)', prio: 3, peso: 1500, dica: 'Escolha o que não precisa cozinhar e não dá sede (evite muito salgado). Veja as opções abaixo.' },
    { id: 'moc_primeiros', area: 'mochila', nome: 'Kit pequeno de primeiros socorros', prio: 3, peso: 400 },
    { id: 'moc_remedios', area: 'mochila', nome: 'Medicamentos pessoais para 3 a 7 dias, com cópia da receita', prio: 3, peso: 200 },
    { id: 'moc_docs', area: 'mochila', nome: 'Cópias de documentos (RG, CPF, certidões, vacinação, convênio) em saco plástico', prio: 3, peso: 100 },
    { id: 'moc_lanterna', area: 'mochila', nome: 'Lanterna de cabeça e pilhas', prio: 3, peso: 200 },
    { id: 'moc_power', area: 'mochila', nome: 'Power bank e cabos', prio: 3, peso: 300 },
    { id: 'moc_dinheiro', area: 'mochila', nome: 'Dinheiro em notas pequenas', prio: 2, peso: 20, dica: 'Se faltar energia, cartão e Pix podem não funcionar.' },
    { id: 'moc_apito', area: 'mochila', nome: 'Apito', prio: 2, peso: 20 },
    { id: 'moc_roupa', area: 'mochila', nome: 'Muda de roupa, meias e agasalho', prio: 2, peso: 1000 },
    { id: 'moc_capa', area: 'mochila', nome: 'Capa de chuva ou poncho', prio: 2, peso: 200 },
    { id: 'moc_manta', area: 'mochila', nome: 'Manta térmica', prio: 2, peso: 100 },
    { id: 'moc_canivete', area: 'mochila', nome: 'Canivete ou ferramenta multiuso', prio: 2, peso: 150 },
    { id: 'moc_isqueiro', area: 'mochila', nome: 'Isqueiro e fósforos à prova d’água', prio: 2, peso: 50 },
    { id: 'moc_higiene', area: 'mochila', nome: 'Higiene: sabonete, escova, papel e lenços', prio: 2, peso: 300 },
    { id: 'moc_mapa', area: 'mochila', nome: 'Mapa impresso e lista de telefones', prio: 2, peso: 50 },
    { id: 'moc_sacos', area: 'mochila', nome: 'Sacos plásticos resistentes', prio: 1, peso: 100 },
    { id: 'moc_luvas', area: 'mochila', nome: 'Luvas de trabalho e máscara', prio: 1, peso: 150 },
    { id: 'moc_oculos', area: 'mochila', nome: 'Óculos reserva, se usa', prio: 1, peso: 50 },
    { id: 'moc_repelente', area: 'mochila', nome: 'Repelente e protetor solar', prio: 1, peso: 200 },
    { id: 'moc_foto', area: 'mochila', nome: 'Foto recente de cada pessoa, para reencontros', prio: 1, peso: 10 },
    { id: 'moc_bebe', area: 'mochila', nome: 'Itens do bebê: fraldas, fórmula, mamadeira e lenços', prio: 3, peso: 1500, cond: 'bebe' },
    // Plano da família
    { id: 'pl_perto', area: 'plano', nome: 'Ponto de encontro perto de casa definido', prio: 3, campo: 'encontro1' },
    { id: 'pl_longe', area: 'plano', nome: 'Ponto de encontro fora do bairro definido', prio: 3, campo: 'encontro2' },
    { id: 'pl_fora', area: 'plano', nome: 'Contato de fora da cidade para todos avisarem que estão bem', prio: 3, campo: 'contatoFora', dica: 'Em emergências, ligações locais congestionam; um parente distante costuma ser mais fácil de alcançar.' },
    { id: 'pl_rotas', area: 'plano', nome: 'Rotas de saída combinadas, com alternativas', prio: 2, campo: 'rotas' },
    { id: 'pl_papeis', area: 'plano', nome: 'Papel de cada pessoa definido (quem pega a mochila, quem cuida de quem)', prio: 2 },
    { id: 'pl_senha', area: 'plano', nome: 'Senha da família para confirmar quem é de confiança', prio: 1, campo: 'senha' },
    { id: 'pl_saude', area: 'plano', nome: 'Lista de alergias, doenças e remédios de cada pessoa', prio: 3 },
    { id: 'pl_digitais', area: 'plano', nome: 'Documentos digitalizados em pen drive e na nuvem', prio: 2 },
    { id: 'pl_abrigos', area: 'plano', nome: 'Sei onde ficam abrigos, UBS e hospitais da região', prio: 2, campo: 'abrigos' },
    { id: 'pl_simulado', area: 'plano', nome: 'Simulado de saída feito nos últimos 6 meses', prio: 2 },
    { id: 'pl_criancas', area: 'plano', nome: 'Crianças sabem nome completo e telefone dos responsáveis', prio: 3, cond: 'crianca' },
    // Cuidar de todos
    { id: 'cu_rotina', area: 'cuidado', nome: 'Rotina diária combinada (tarefas, horários e descanso) para manter a calma', prio: 2, dica: 'Em períodos longos, rotina e tarefas dividem o peso e cuidam da saúde mental.' },
    { id: 'cu_jogos', area: 'cuidado', nome: 'Jogos, livros e atividades sem energia elétrica', prio: 1, cond: 'crianca' },
    { id: 'cu_bebes', area: 'cuidado', nome: 'Fraldas, leite ou fórmula e lenços para 2 semanas', prio: 3, cond: 'bebe' },
    { id: 'cu_idosos', area: 'cuidado', nome: 'Medicamentos extras, óculos e pilhas de aparelho auditivo, bengala ou cadeira', prio: 3, cond: 'idoso' },
    { id: 'cu_pet_comida', area: 'cuidado', nome: 'Ração e água para o pet por 2 semanas', prio: 3, cond: 'pet' },
    { id: 'cu_pet_kit', area: 'cuidado', nome: 'Pet com identificação, vacinas em dia, guia e transportadora', prio: 2, cond: 'pet' },
    // Carro
    { id: 'ca_tanque', area: 'carro', nome: 'Tanque sempre acima de meia carga', prio: 3, cond: 'carro' },
    { id: 'ca_kit', area: 'carro', nome: 'Estepe, macaco, triângulo e chave de roda em ordem', prio: 2, cond: 'carro' },
    { id: 'ca_cabos', area: 'carro', nome: 'Cabos de bateria e carregador veicular', prio: 1, cond: 'carro' },
    { id: 'ca_kit2', area: 'carro', nome: 'Água, comida de emergência e cobertor no carro', prio: 2, cond: 'carro' },
    { id: 'ca_rota', area: 'carro', nome: 'Rota alternativa de saída e mapa impresso', prio: 2, cond: 'carro' }
  ];

  var CENARIOS = [
    { ic: '⚡', t: 'Apagão longo', d: 'Priorize luz (lanternas, pilhas), rádio, água e comida que não precise de geladeira. Consuma primeiro o que está na geladeira, depois o congelado. Evite abrir a geladeira. Nunca use fogareiro ou gerador em ambiente fechado.' },
    { ic: '🚰', t: 'Falta de água', d: 'Reserve água para beber e cozinhar antes de higiene. Use a aba Estoque e o painel de dias de água, ferva ou trate a água de fontes duvidosas e economize na cozinha: a água de cozimento pode ser reaproveitada.' },
    { ic: '🌊', t: 'Enchente ou deslizamento', d: 'Siga os alertas da Defesa Civil (199) e saia cedo para local alto e seguro. Feche gás, água e energia antes. Leve a mochila de fuga. Nunca atravesse água em movimento.' },
    { ic: '🦠', t: 'Pandemia ou isolamento', d: 'Estoque para semanas: comida, remédios, higiene e máscaras. Combine rotina e cuidado com saúde mental. Veja a aba Medicamentos.' },
    { ic: '🛒', t: 'Desabastecimento', d: 'Use o modo racionamento, priorize alimentos de longa duração e a lista de Compras do app. Evite estocar além do necessário, para não faltar aos outros.' },
    { ic: '🚨', t: 'Evacuação (sair de casa)', d: 'Pegue a mochila, documentos e remédios, avise o contato de fora da cidade, siga as rotas combinadas e vá ao ponto de encontro. Informe-se pelos canais oficiais e leve só o essencial.' },
    { ic: '🧟', t: 'Apocalipse zumbi (só de brincadeira)', d: 'O que salva num apocalipse é o mesmo de qualquer crise: água limpa, comida, higiene, remédios, informação e comunidade. Se der zumbi, você já terá água, rádio, mochila e plano. Boa sorte, e fique longe de cemitérios.' }
  ];

  var TELEFONES = [['190', 'Polícia Militar'], ['192', 'SAMU (ambulância)'], ['193', 'Corpo de Bombeiros'], ['199', 'Defesa Civil']];

  var NIVEIS = [
    { min: 90, nome: 'Imortal', ic: '🏆', txt: 'Até os zumbis te respeitam.' },
    { min: 75, nome: 'Lenda do apocalipse', ic: '🧟', txt: 'Muito bem preparado. Agora é manter e revisar.' },
    { min: 50, nome: 'Veterano', ic: '🛡️', txt: 'Boa base. Falta fechar os pontos críticos.' },
    { min: 25, nome: 'Sobrevivente', ic: '🎒', txt: 'Começou bem. Foque nos itens críticos.' },
    { min: 0, nome: 'Civil desprevenido', ic: '🙂', txt: 'Hora de começar: um passo de cada vez.' }
  ];

  function perfilDe(p) { return p && p.perfil; }
  function ctxDe(state) {
    var pr = state.pront || {}, ps = state.pessoas || [];
    var n = function (f) { return ps.filter(function (p) { return f(perfilDe(p)); }).length; };
    return {
      moradia: pr.moradia || 'apto', local: pr.local || 'cidade', carro: !!pr.carro, pets: Number(pr.pets) || 0,
      pessoas: ps.length, adultos: n(function (x) { return ['adulto_h', 'adulto_m', 'idoso', 'gestante', 'lactante'].indexOf(x) >= 0; }),
      criancas: n(function (x) { return ['crianca_1', 'crianca_4', 'crianca_9', 'adolescente'].indexOf(x) >= 0; }),
      bebes: n(function (x) { return x === 'crianca_1'; }),
      idosos: n(function (x) { return x === 'idoso'; }),
      mulheres: n(function (x) { return ['adulto_m', 'gestante', 'lactante'].indexOf(x) >= 0; })
    };
  }
  function aparece(it, c) {
    switch (it.cond) {
      case 'apto': return c.moradia === 'apto'; case 'casa': return c.moradia === 'casa';
      case 'cidade': return c.local === 'cidade'; case 'interior': return c.local === 'interior';
      case 'carro': return c.carro; case 'pet': return c.pets > 0;
      case 'crianca': return c.criancas > 0; case 'bebe': return c.bebes > 0;
      case 'idoso': return c.idosos > 0; case 'mulher': return c.mulheres > 0;
      default: return true;
    }
  }
  function itensVisiveis(state) { var c = ctxDe(state); return ITENS.filter(function (i) { return aparece(i, c); }); }
  function feito(state, it) {
    var pr = state.pront || {};
    if (it.campo && pr.plano && String(pr.plano[it.campo] || '').trim()) return true;
    if (it.id === 'pl_papeis' && pr.papeis) { var ps = state.pessoas || []; if (ps.length && ps.every(function (p) { return String(pr.papeis[p.id] || '').trim(); })) return true; }
    return !!(pr.marcados && pr.marcados[it.id]);
  }
  function qtdTxt(it, c) {
    if (it.qtd === 'pessoa') return c.pessoas ? c.pessoas + ' un.' : '';
    if (it.qtd === 'adulto') return c.adultos ? c.adultos + ' un.' : '';
    return '';
  }

  var PESO = { 3: 3, 2: 2, 1: 1 };
  function areaPct(state, area) {
    var its = itensVisiveis(state).filter(function (i) { return i.area === area; }), tot = 0, ok = 0;
    its.forEach(function (i) { tot += PESO[i.prio]; if (feito(state, i)) ok += PESO[i.prio]; });
    return { pct: tot ? ok / tot * 100 : 100, feitos: its.filter(function (i) { return feito(state, i); }).length, total: its.length };
  }

  function nivelDe(score) { for (var i = 0; i < NIVEIS.length; i++) if (score >= NIVEIS[i].min) return NIVEIS[i]; return NIVEIS[NIVEIS.length - 1]; }

  /* auto = percentuais (0-100) de comida, água, gás e remédios calculados pelo app */
  function pontuacao(state, auto) {
    var partes = [], soma = 0, wTot = 0;
    Object.keys(AUTO).forEach(function (k) {
      var a = AUTO[k], pct = Math.max(0, Math.min(100, (auto && auto[k]) || 0));
      partes.push({ id: k, nome: a.nome, ic: a.ic, w: a.w, pct: pct, auto: true }); soma += a.w * pct; wTot += a.w;
    });
    Object.keys(AREAS).forEach(function (k) {
      var a = AREAS[k], r = areaPct(state, k);
      if (!r.total) return;
      partes.push({ id: k, nome: a.nome, ic: a.ic, w: a.w, pct: r.pct, feitos: r.feitos, total: r.total }); soma += a.w * r.pct; wTot += a.w;
    });
    var score = wTot ? Math.round(soma / wTot) : 0;
    // próximos passos: maior perda de pontos primeiro; itens críticos não feitos
    var passos = [];
    partes.filter(function (p) { return p.auto && p.pct < 100; }).forEach(function (p) {
      passos.push({ peso: p.w * (100 - p.pct) / 100 * 1.5, txt: p.ic + ' ' + p.nome + ': ' + Math.round(p.pct) + '% da meta', tab: p.id === 'remedios' ? 'meds' : p.id === 'gas' ? 'config' : p.id === 'agua' ? 'config' : 'compras' });
    });
    itensVisiveis(state).filter(function (i) { return i.prio === 3 && !feito(state, i); }).forEach(function (i) {
      passos.push({ peso: AREAS[i.area].w / 10, txt: AREAS[i.area].ic + ' ' + i.nome, id: i.id });
    });
    passos.sort(function (a, b) { return b.peso - a.peso; });
    return { score: score, nivel: nivelDe(score), partes: partes, passos: passos.slice(0, 6) };
  }

  /* peso da mochila de uma pessoa (itens marcados) e do kit completo */
  function mochila(state) {
    var its = itensVisiveis(state).filter(function (i) { return i.area === 'mochila' && i.peso; });
    var marc = 0, total = 0;
    its.forEach(function (i) { total += i.peso; if (feito(state, i)) marc += i.peso; });
    return { itens: its, marcado: marc, total: total };
  }

  /* quantos dias passaram desde a última revisão (null se nunca) */
  function diasDesdeRevisao(state, hoje) {
    var r = state.pront && state.pront.revisao; if (!r) return null;
    return Math.floor(((hoje || new Date()) - new Date(r + 'T00:00:00')) / 86400000);
  }

  var api = { AREAS: AREAS, AUTO: AUTO, ITENS: ITENS, CENARIOS: CENARIOS, TELEFONES: TELEFONES, NIVEIS: NIVEIS,
              ctxDe: ctxDe, itensVisiveis: itensVisiveis, feito: feito, qtdTxt: qtdTxt, areaPct: areaPct, pontuacao: pontuacao,
              nivelDe: nivelDe, mochila: mochila, diasDesdeRevisao: diasDesdeRevisao };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PRONT = api;
})(typeof window !== 'undefined' ? window : this);
