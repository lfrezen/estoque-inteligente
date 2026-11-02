/* Motor de cálculo (puro, sem DOM). Testável em Node. */
(function (root) {
  var D = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.DATA;
  var REF_KCAL = 2000;

  function allFoods(state) {
    var base = D.ALIMENTOS.map(function (f) {
      var o = Object.assign({}, f);
      var ov = state.porcoes && state.porcoes[f.id];
      if (ov !== undefined && ov !== null && ov !== '') o.porcao = Number(ov);
      return o;
    });
    (state.custom || []).forEach(function (c) {
      var o = Object.assign({ gpu: 1, coc: 0, agua: 0, rend: 1, core: true }, c);
      var ov = state.porcoes && state.porcoes[c.id];
      if (ov !== undefined && ov !== null && ov !== '') o.porcao = Number(ov);
      base.push(o);
    });
    return base;
  }
  function foodMap(foods) { var m = {}; foods.forEach(function (f) { m[f.id] = f; }); return m; }

  /* quantidade na unidade de estoque -> kg armazenado */
  function toKg(food, qty) {
    qty = Number(qty) || 0;
    if (food.un === 'kg') return qty;
    if (food.un === 'l') return qty * (food.gpu || 1000) / 1000;
    return qty * (food.gpu || 0) / 1000;
  }
  /* kg de uma linha de estoque: para itens em unidades, usa o peso informado na linha (ex.: lata de 179 g) */
  function lineKg(food, s) {
    var q = Number(s.qtd) || 0;
    if (food.un === 'un' && Number(s.pesoUn) > 0) return q * Number(s.pesoUn) / 1000;
    return toKg(food, q);
  }
  /* kg armazenado -> quantidade na unidade de estoque */
  function fromKg(food, kg) {
    if (food.un === 'kg') return kg;
    if (food.un === 'l') return kg * 1000 / (food.gpu || 1000);
    return kg * 1000 / (food.gpu || 1);
  }

  function modeFactor(person, mode) {
    var prof = D.PERFIS[person.perfil] || D.PERFIS.adulto_m;
    var m = D.MODOS[mode] || D.MODOS.normal;
    return prof.vuln ? m.vuln : m.adulto;
  }
  function personKcal(person) {
    var prof = D.PERFIS[person.perfil] || D.PERFIS.adulto_m;
    var o = Number(person.kcal);
    return o > 0 ? o : prof.kcal;
  }

  function household(state, mode) {
    mode = mode || state.modo || 'normal';
    var h = { n: 0, kcal: 0, prot: 0, agua: 0, f: 0 };
    (state.pessoas || []).forEach(function (p) {
      var prof = D.PERFIS[p.perfil] || D.PERFIS.adulto_m;
      var mf = modeFactor(p, mode);
      var kc = personKcal(p);
      h.n += 1;
      h.kcal += kc * mf;
      h.prot += prof.prot * Math.max(mf, 0.9);
      h.agua += prof.agua + (Number(state.aguaHigiene) || 0);
      h.f += (kc / REF_KCAL) * mf;
    });
    return h;
  }

  /* consumo diário, em kg ARMAZENADO, de cada alimento para a família */
  function dailyRawKg(food, h) {
    var cookedG = food.fixed ? food.porcao * h.n : food.porcao * h.f;
    return cookedG / (food.rend || 1) / 1000;
  }

  var HUGE = Infinity;

  function analyze(state, mode, today) {
    mode = mode || state.modo || 'normal';
    today = today || new Date();
    var foods = allFoods(state), fm = foodMap(foods);
    var h = household(state, mode);
    var agg = {}; // por alimento
    var lines = [];
    (state.estoque || []).forEach(function (s) {
      var f = fm[s.foodId]; if (!f) return;
      var kg = lineKg(f, s);
      var a = agg[f.id] || (agg[f.id] = { food: f, kg: 0 });
      a.kg += kg;
      lines.push({ s: s, food: f, kg: kg });
    });

    var tot = { kcal: 0, prot: 0, gord: 0, carb: 0 };
    var grupos = {};
    var cookMin = 0, cookWater = 0;
    var items = Object.keys(agg).map(function (id) {
      var a = agg[id], f = a.food;
      var kcal = a.kg * 10 * f.kcal, prot = a.kg * 10 * f.prot, gord = a.kg * 10 * f.gord, carb = a.kg * 10 * f.carb;
      tot.kcal += kcal; tot.prot += prot; tot.gord += gord; tot.carb += carb;
      grupos[f.grupo] = (grupos[f.grupo] || 0) + kcal;
      var perDay = h.n ? dailyRawKg(f, h) : 0;
      var days = perDay > 0 ? a.kg / perDay : HUGE;
      if (f.porcao > 0 && perDay > 0) { cookMin += perDay * f.coc; cookWater += perDay * f.agua; }
      return { food: f, kg: a.kg, cozidoKg: a.kg * (f.rend || 1), kcal: kcal, prot: prot, gord: gord, carb: carb,
               porDiaKg: perDay, dias: days };
    });
    items.sort(function (x, y) { return x.dias - y.dias; });

    // validade: cada linha com data, comparar com a data em que seria consumida
    var alertas = [], hoje0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()), janela = Math.max(90, Number(state.validadeJanela) || 30);
    lines.forEach(function (l) {
      if (!l.s.validade) return;
      var exp = new Date(l.s.validade + 'T00:00:00');
      var diasAteVencer = Math.round((exp - hoje0) / 86400000);
      var it = items.filter(function (i) { return i.food.id === l.food.id; })[0];
      var consumoDia = it ? it.dias : HUGE;
      if (diasAteVencer < 0) alertas.push({ tipo: 'vencido', food: l.food, dias: diasAteVencer, linha: l.s });
      else if (diasAteVencer < janela || diasAteVencer < consumoDia)
        alertas.push({ tipo: diasAteVencer < consumoDia ? 'vence_antes' : 'proximo', food: l.food, dias: diasAteVencer, linha: l.s, consumo: consumoDia });
    });
    alertas.sort(function (a, b) { return a.dias - b.dias; });

    var gasKg = Number(state.gasKg) || 0, burner = Number(state.fogaoKgH) || 0.2;
    var gasDay = cookMin / 60 * burner;
    var aguaDia = h.agua + cookWater;
    var dias = {
      energia: h.kcal > 0 ? tot.kcal / h.kcal : HUGE,
      proteina: h.prot > 0 ? tot.prot / h.prot : HUGE,
      agua: aguaDia > 0 ? (Number(state.aguaL) || 0) / aguaDia : HUGE,
      gas: gasDay > 0 ? gasKg / gasDay : HUGE
    };
    var kcalMacro = tot.carb * 4 + tot.prot * 4 + tot.gord * 9;
    var macros = kcalMacro > 0 ? {
      carb: tot.carb * 4 / kcalMacro * 100, prot: tot.prot * 4 / kcalMacro * 100, gord: tot.gord * 9 / kcalMacro * 100
    } : { carb: 0, prot: 0, gord: 0 };

    // necessidade diária por macronutriente: proteína pelo perfil; gordura ~28% e carboidrato o restante das calorias
    var needProt = h.prot, needGord = h.kcal * 0.28 / 9;
    var needCarb = Math.max(0, (h.kcal - needProt * 4 - needGord * 9) / 4);
    function fontes(campo) {
      var total = tot[campo] || 0;
      return items.filter(function (i) { return i[campo] > 0; })
        .sort(function (x, y) { return y[campo] - x[campo]; }).slice(0, 3)
        .map(function (i) { return { food: i.food, g: i[campo], pct: total ? i[campo] / total * 100 : 0 }; });
    }
    var macro = {
      carb: { tem: tot.carb, precisa: needCarb, dias: needCarb > 0 ? tot.carb / needCarb : HUGE, fontes: fontes('carb') },
      prot: { tem: tot.prot, precisa: needProt, dias: needProt > 0 ? tot.prot / needProt : HUGE, fontes: fontes('prot') },
      gord: { tem: tot.gord, precisa: needGord, dias: needGord > 0 ? tot.gord / needGord : HUGE, fontes: fontes('gord') }
    };
    return { modo: mode, h: h, macro: macro, items: items, tot: tot, grupos: grupos, dias: dias, macros: macros,
             alertas: alertas, gasDia: gasDay, aguaDia: aguaDia, cookMin: cookMin, foods: foods, fm: fm };
  }

  /* Despensa ideal para N dias no modo atual */
  function despensa(state, mode, targetDays) {
    mode = mode || state.modo || 'normal';
    var foods = allFoods(state), h = household(state, mode);
    var have = {}, unidades = {};
    (state.estoque || []).forEach(function (s) {
      var f = foodMap(foods)[s.foodId]; if (!f) return;
      have[f.id] = (have[f.id] || 0) + lineKg(f, s);
      unidades[f.id] = (unidades[f.id] || 0) + (Number(s.qtd) || 0);
    });
    var rows = [], kcalDia = 0;
    foods.filter(function (f) { return f.core && f.porcao > 0; }).forEach(function (f) {
      var perDay = dailyRawKg(f, h);
      kcalDia += perDay * 10 * f.kcal;
      rows.push({ food: f, necessarioKg: perDay * targetDays, temKg: have[f.id] || 0 });
    });
    // As porções do catálogo podem não cobrir 100% das calorias. O que falta é mostrado À PARTE
    // (complemento), para não misturar com a porção de cada alimento.
    var deficit = Math.max(0, h.kcal - kcalDia);
    var arrozDef = foods.filter(function (f) { return f.id === 'arroz'; })[0];
    var complemento = {
      cobertura: h.kcal > 0 ? Math.min(100, kcalDia / h.kcal * 100) : 100,
      kcalDia: deficit, kcalTotal: deficit * targetDays,
      arrozKg: arrozDef && deficit > 0 ? deficit / (10 * arrozDef.kcal) * targetDays : 0
    };
    rows.forEach(function (r) {
      r.faltaKg = Math.max(0, r.necessarioKg - r.temKg);
      // itens em unidades: referência = peso médio das unidades que você cadastrou (ou o padrão do catálogo)
      r.refG = r.food.un === 'un' ? (unidades[r.food.id] > 0 ? r.temKg * 1000 / unidades[r.food.id] : r.food.gpu) : null;
      var conv = function (kg) { return r.refG ? kg * 1000 / r.refG : fromKg(r.food, kg); };
      r.faltaQtd = conv(r.faltaKg);
      r.necessarioQtd = conv(r.necessarioKg);
      r.temQtd = conv(r.temKg);
      r.pct = r.necessarioKg > 0 ? Math.min(100, r.temKg / r.necessarioKg * 100) : 100;
    });
    rows.sort(function (a, b) { return a.pct - b.pct; });
    return { rows: rows, complemento: complemento, kcalPlano: kcalDia, h: h };
  }

  /* Estratégias e sugestões com base na análise */
  function sugestoes(state, an, targetDays) {
    var out = [];
    var d = an.dias, g = an.grupos, m = an.macros, h = an.h;
    var totKcal = an.tot.kcal || 1;
    function pctG(k) { return (g[k] || 0) / totKcal * 100; }
    var temAlgo = an.tot.kcal > 0;

    if (!h.n) { out.push({ nivel: 'info', t: 'Cadastre as pessoas da casa', d: 'Sem pessoas não dá para calcular a necessidade diária.' }); return out; }
    if (!temAlgo) { out.push({ nivel: 'info', t: 'Cadastre o estoque', d: 'Adicione os alimentos que você tem para ver a autonomia.' }); return out; }

    if (d.energia < targetDays) {
      var falta = Math.ceil(targetDays - d.energia);
      out.push({ nivel: 'alto', t: 'Faltam ' + falta + ' dias para a meta de ' + targetDays,
        d: 'Veja a aba "Compras" para a lista do que falta, item por item.' });
    } else {
      out.push({ nivel: 'ok', t: 'Meta de ' + targetDays + ' dias atingida em calorias', d: 'Agora confira proteína, água, gás e validade.' });
    }

    if (m.prot < 11) out.push({ nivel: 'alto', t: 'Pouca proteína (' + m.prot.toFixed(0) + '% das calorias)',
      d: 'Aumente leguminosas (feijão, lentilha, grão-de-bico), soja texturizada, leite em pó, atum e sardinha em lata, amendoim. Arroz com feijão forma proteína completa.' });
    if (d.proteina < d.energia * 0.7 && d.proteina < targetDays) out.push({ nivel: 'medio', t: 'Proteína acaba antes das calorias',
      d: 'A proteína dura ' + fmtDias(d.proteina) + ' contra ' + fmtDias(d.energia) + ' de energia. Reforce as fontes de proteína de longa duração.' });
    if (m.gord < 18) out.push({ nivel: 'medio', t: 'Pouca gordura (' + m.gord.toFixed(0) + '%)',
      d: 'Óleo e oleaginosas são a energia mais compacta. Falta de gordura causa fraqueza e perda de vitaminas A, D, E e K.' });
    if (m.carb > 70) out.push({ nivel: 'medio', t: 'Dieta muito concentrada em carboidrato',
      d: 'Equilibre com feijão, lentilha, soja texturizada, atum/sardinha, leite em pó e oleaginosas.' });
    if (pctG('leguminosa') + pctG('proteina') < 12) out.push({ nivel: 'medio', t: 'Poucas leguminosas e conservas',
      d: 'Leguminosas e conservas de peixe costumam ser a base de proteína numa dieta de estoque.' });
    if ((g.vegetal || 0) === 0 && (g.micro || 0) === 0) out.push({ nivel: 'medio', t: 'Sem fonte de vitaminas',
      d: 'Inclua multivitamínico (vitamina C e complexo B), milho e molho de tomate em lata, frutas secas. Germinar lentilha e feijão rende vitamina C fresca.' });
    else if (!(an.items.some(function (i) { return i.food.id === 'vitamina'; })))
      out.push({ nivel: 'baixo', t: 'Considere multivitamínicos', d: 'Dietas de estoque costumam faltar em vitamina C, A e complexo B. Um comprimido por pessoa por dia resolve.' });
    if (!(g.laticinio > 0) && h.n && an.h.n && Object.keys(D.PERFIS).length) {
      var crianca = (state.pessoas || []).some(function (p) { return ['crianca_1', 'crianca_4', 'crianca_9', 'gestante', 'lactante'].indexOf(p.perfil) >= 0; });
      if (crianca) out.push({ nivel: 'alto', t: 'Há crianças/gestantes e não há leite em pó', d: 'Cálcio e proteína são críticos nessas fases. Inclua leite em pó.' });
    }

    if (!(Number(state.aguaL) > 0)) out.push({ nivel: 'alto', t: 'Informe a água armazenada', d: 'Você precisa de cerca de ' + (Math.round(an.aguaDia * 10) / 10) + ' L por dia. Água vem antes da comida. Preencha em Config.' });
    else if (d.agua < Math.min(targetDays, 14)) out.push({ nivel: 'alto', t: 'Água para só ' + fmtDias(d.agua),
      d: 'Água é mais crítica que comida: o mínimo é 2 L por pessoa por dia só para beber, mais cozinha e higiene. Estoque garrafas/galões e tenha filtro ou pastilhas de cloro.' });
    if (Number(state.gasKg) > 0 && d.gas < d.energia && d.gas < targetDays) out.push({ nivel: 'medio', t: 'Gás acaba antes da comida (' + fmtDias(d.gas) + ')',
      d: 'Opções: panela de pressão, cozimento com calor residual (caixa térmica), preferir lentilha/macarrão/aveia, ter fogareiro a álcool, gás de camping ou lenha onde for seguro.' });

    var venc = an.alertas.filter(function (a) { return a.tipo === 'vencido'; }).length;
    if (venc) out.push({ nivel: 'alto', t: venc + ' item(ns) vencido(s)', d: 'Verifique antes de consumir. Veja a lista de alertas no painel.' });
    var vant = an.alertas.filter(function (a) { return a.tipo === 'vence_antes'; }).length;
    if (vant) out.push({ nivel: 'medio', t: vant + ' item(ns) vencem antes de serem consumidos', d: 'Consuma primeiro (FIFO) ou reduza a compra deles.' });

    return out;
  }

  var ESTRATEGIAS = [
    { t: 'Troque de modo quando necessário', d: 'Em racionamento a mesma comida dura cerca de 25% mais. Veja a comparação no painel e use o modo certo para cada fase.' },
    { t: 'Arroz + feijão', d: 'A combinação forma proteína de qualidade e rende muito. Acrescente algo com vitamina C (molho de tomate, brotos) para absorver melhor o ferro.' },
    { t: 'Economize gás', d: 'Deixe leguminosas de molho de 8 a 12 h, use panela de pressão, tampe as panelas, reaproveite a água do cozimento em sopas e use cozimento passivo em caixa térmica.' },
    { t: 'Consuma primeiro o que perece', d: 'Ovos, batata e itens perto da validade vão primeiro. Os de longa duração (arroz, açúcar, sal, feijão seco) ficam para depois.' },
    { t: 'Germine para ter vitamina C', d: 'Lentilha, feijão mungo e grão-de-bico germinados em 2 a 3 dias fornecem vitamina C e quase não gastam gás.' },
    { t: 'Concentre calorias', d: 'Óleo, açúcar, amendoim e aveia têm muita energia por kg e ocupam pouco espaço.' },
    { t: 'Reponha o que consome', d: 'Mantenha um sistema de rotação: compre um pouco a mais a cada ida ao mercado e consuma o mais antigo primeiro.' },
    { t: 'Cuide da água antes de tudo', d: 'Pessoas aguentam semanas sem comida e dias sem água. Garanta pelo menos 3 litros por pessoa por dia e um jeito de purificar.' },
    { t: 'Armazene bem', d: 'Potes herméticos, local seco e fresco, longe do chão e da luz. Para grãos secos, sachê absorvedor de oxigênio ajuda a durar anos.' },
    { t: 'Atenção a quem é vulnerável', d: 'Crianças, gestantes, lactantes, idosos e doentes crônicos não devem ser racionados como adultos saudáveis. Guarde medicamentos essenciais.' }
  ];

  /* ---------- Cardápio: usa qualquer alimento do estoque ----------
     Cada alimento recebe um papel na refeição (base, leguminosa, proteína, legume, fruta, gordura...).
     As quantidades saem das calorias da casa (já no modo escolhido), respeitando limites por papel e o estoque. */
  var RX_TEMPERO = /(^|\W)(alho|cebola|cebolinha|salsa|coentro|pimenta|tempero|sal|vinagre|caldo)(\W|$)/i;
  var RX_ESPESSANTE = /(amido|maisena|maizena|polvilho|fermento|gelatina)/i;
  var RX_BASE = /(arroz|macarr|massa|quinoa|bulgur|trigo para|lasanha|nhoque|polenta)/i;
  var RX_TUBERCULO = /(batata|mandioca|aipim|macaxeira|inhame|cará|purê|pure)/i;
  var RX_FRUTA_SECA = /(passa|t[aâ]mara|damasco|ameixa|frutas secas|banana)/i;
  var RX_OLEO = /(óleo|oleo|azeite|ghee|manteiga|margarina|banha)/i;

  function papel(f) {
    if (!(f.kcal > 0) && !(f.fixed && f.porcao > 0)) return null;
    var nome = f.nome || '';
    if (f.grupo === 'micro') return f.fixed && f.porcao > 0 ? 'suplemento' : null;
    if (RX_TEMPERO.test(nome) || RX_ESPESSANTE.test(nome)) return null;
    switch (f.grupo) {
      case 'leguminosa': return 'leguminosa';
      case 'proteina': case 'carne': case 'pescado': return 'proteina';
      case 'laticinio': return /condensad/i.test(nome) ? 'doce' : 'laticinio';
      case 'acucar': return 'doce';
      case 'gordura': return RX_OLEO.test(nome) || f.un === 'l' ? 'oleo' : 'oleaginosa';
      case 'fruta': return 'fruta';
      case 'vegetal': return RX_TUBERCULO.test(nome) ? 'base' : RX_FRUTA_SECA.test(nome) ? 'fruta' : 'vegetal';
      case 'cereal': return /pipoca/i.test(nome) ? 'oleaginosa' : RX_BASE.test(nome) ? 'base' : 'cafe';
      default: return null;
    }
  }

  var REFEICOES = [
    { nome: 'Café', frac: 0.25, slots: [['cafe', 45], ['laticinio', 30], ['doce', 10], ['fruta', 15]], alt: { cafe: ['base'] } },
    { nome: 'Almoço', frac: 0.35, slots: [['base', 45], ['leguminosa', 22], ['proteina', 18], ['vegetal', 5], ['oleo', 10]], alt: { base: ['cafe'] } },
    { nome: 'Jantar', frac: 0.25, slots: [['base', 45], ['proteina', 25], ['leguminosa', 15], ['vegetal', 5], ['oleo', 10]], alt: { base: ['cafe'], proteina: ['leguminosa'] } },
    { nome: 'Lanche', frac: 0.15, slots: [['oleaginosa', 50], ['fruta', 50]], alt: { oleaginosa: ['doce', 'cafe'], fruta: ['doce', 'oleaginosa'] } }
  ];
  // limite em gramas prontas por refeição para uma pessoa de referência (2.000 kcal)
  var CAP = { cafe: 150, base: 450, leguminosa: 220, proteina: 130, vegetal: 150, fruta: 160, laticinio: 250, doce: 25, oleo: 25, oleaginosa: 50 };

  function kcalPronto(f, g) { return g * f.kcal / (f.rend || 1) / 100; }

  function cardapio(state, an, dias, hoje) {
    hoje = hoje || new Date();
    var h = an.h, out = [];
    out.esgota = [];
    if (!h.n || !h.kcal || !an.items.length) return out;

    var rest = {}, cand = {}, esgotado = {}, emUso = {};
    // validade mais próxima de cada alimento
    var venc = {};
    (state.estoque || []).forEach(function (s) {
      if (!s.validade) return;
      var d = Math.floor((new Date(s.validade + 'T00:00:00') - hoje) / 86400000);
      if (venc[s.foodId] === undefined || d < venc[s.foodId]) venc[s.foodId] = d;
    });
    an.items.forEach(function (it) {
      var f = it.food, r = papel(f); if (!r || it.kg <= 0) return;
      rest[f.id] = it.kg;
      var urg = (venc[f.id] !== undefined && venc[f.id] <= 45) || f.val <= 2;
      var chave = urg ? (venc[f.id] !== undefined ? venc[f.id] : f.val * 30) : 100000;
      (cand[r] = cand[r] || []).push({ f: f, chave: chave });
    });
    Object.keys(cand).forEach(function (r) {
      cand[r].sort(function (a, b) { return a.chave - b.chave || a.f.id.localeCompare(b.f.id); });
      cand[r] = cand[r].map(function (x) { return x.f; });
    });

    function disponivel(role, exclui) {
      return (cand[role] || []).filter(function (f) { return rest[f.id] > 0.0005 && f.id !== exclui && !emUso[f.id]; });
    }
    function escolher(role, d, off, exclui, alt) {
      var l = disponivel(role, exclui);
      if (!l.length && exclui) l = disponivel(role, null);
      if (l.length) return { f: l[(d + off) % l.length], role: role };
      var tent = (alt && alt[role]) || [];
      for (var i = 0; i < tent.length; i++) { var l2 = disponivel(tent[i], exclui); if (l2.length) return { f: l2[(d + off) % l2.length], role: role, de: tent[i] }; }
      return null;
    }
    function prontoMax(f) { return rest[f.id] * 1000 * (f.rend || 1); }
    function consumir(f, g, dia) {
      rest[f.id] -= g / (f.rend || 1) / 1000;
      if (rest[f.id] <= 0.0005 && !esgotado[f.id]) { esgotado[f.id] = true; out.esgota.push({ food: f, dia: dia }); }
    }

    for (var d = 0; d < dias; d++) {
      var dia = { dia: d + 1, refeicoes: [], kcal: 0 }, carry = 0;
      var hojeEsc = {};
      REFEICOES.forEach(function (rf, ri) {
        var esc = [], kcalRef = h.kcal * rf.frac + carry; emUso = {};
        rf.slots.forEach(function (sl, si) {
          var role = sl[0];
          var exclui = (rf.nome === 'Jantar' && (role === 'base' || role === 'proteina')) ? (hojeEsc['Almoço' + role] || null) : null;
          var e = escolher(role, d, (role === 'base' || role === 'proteina') ? ri : si, exclui, rf.alt);
          if (e) { e.peso = sl[1]; esc.push(e); emUso[e.f.id] = true; hojeEsc[rf.nome + role] = e.f.id; }
        });
        var itens = [];
        if (esc.length) {
          var totalPeso = esc.reduce(function (a, e) { return a + e.peso; }, 0), sobra = 0, gs = [];
          esc.forEach(function (e) {
            var kc = kcalRef * e.peso / totalPeso, f = e.f;
            var gDes = kc * 100 * (f.rend || 1) / f.kcal;
            var cap = CAP[e.role] * h.f;
            var g = Math.min(gDes, cap, prontoMax(f));
            sobra += kcalPronto(f, gDes - g);
            gs.push({ e: e, g: g, cap: cap });
          });
          // o que sobrou vai para o item principal da refeição (primeiro da lista), até seu limite
          var prin = gs[0];
          if (prin && sobra > 0) {
            var f0 = prin.e.f, extra = sobra * 100 * (f0.rend || 1) / f0.kcal;
            var capExtra = Math.max(0, ((rf.nome === 'Almoço' || rf.nome === 'Jantar') ? CAP.base * h.f : prin.cap) - prin.g);
            prin.g += Math.min(extra, capExtra, Math.max(0, prontoMax(f0) - prin.g));
          }
          gs.forEach(function (x) {
            var g = x.g >= 20 ? Math.round(x.g / 5) * 5 : Math.round(x.g);
            if (g < 5) return;
            consumir(x.e.f, g, d + 1);
            var kc = kcalPronto(x.e.f, g); dia.kcal += kc;
            itens.push({ food: x.e.f, g: g, kcal: kc });
          });
        }
        if (rf.nome === 'Café') {
          Object.keys(rest).forEach(function (id) {
            var f = an.fm[id]; if (!f || papel(f) !== 'suplemento' || rest[id] <= 0.0005) return;
            var g = Math.min(f.porcao * h.n, prontoMax(f)); if (g < 1) return;
            consumir(f, g, d + 1); itens.push({ food: f, g: Math.round(g), kcal: 0 });
          });
        }
        var kcalMeal = itens.reduce(function (a, i) { return a + i.kcal; }, 0);
        carry = Math.max(0, kcalRef - kcalMeal);
        dia.refeicoes.push({ nome: rf.nome, itens: itens });
      });
      dia.cobertura = dia.kcal / h.kcal * 100;
      out.push(dia);
    }
    return out;
  }

  /* texto da quantidade de um alimento pronto: g, ml ou comprimidos */
  function qtyTexto(f, g) {
    if (f.grupo === 'micro' && f.fixed) return Math.round(g) + ' comp.';
    if (f.grupo === 'laticinio' && /leite/i.test(f.nome) && !/condensad/i.test(f.nome)) return Math.round(g) + ' ml';
    return Math.round(g) + ' g';
  }

  function fmtDias(d) {
    if (!isFinite(d)) return '—';
    if (d < 1) return 'menos de 1 dia';
    if (d < 100) return (Math.round(d * 10) / 10).toString().replace('.', ',') + ' dias';
    return Math.round(d) + ' dias';
  }

  var api = { allFoods: allFoods, foodMap: foodMap, toKg: toKg, lineKg: lineKg, fromKg: fromKg, household: household,
              analyze: analyze, despensa: despensa, sugestoes: sugestoes, ESTRATEGIAS: ESTRATEGIAS,
              cardapio: cardapio, qtyTexto: qtyTexto, papel: papel, fmtDias: fmtDias, personKcal: personKcal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : this);
