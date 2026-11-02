(function () {
  'use strict';
  var D = window.DATA, E = window.Engine, M = window.MEDS, PRONT = window.PRONT;
  var KEY = 'estoque-inteligente-v1';

  var DEFAULT = {
    versao: 1, modo: 'normal', metaDias: 90, pessoas: [], estoque: [], meds: [], custom: [], porcoes: {},
    aguaL: 0, aguaHigiene: 1, gasKg: 0, fogaoKgH: 0.2, atualizado: null
  };
  var state = load();
  var tab = 'painel';
  var prefillNome = '';

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return Object.assign({}, DEFAULT, JSON.parse(raw));
    } catch (e) { /* storage indisponível */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() {
    state.atualizado = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
  }
  function norm(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function uid() { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n1(x) { return (Math.round(x * 10) / 10).toLocaleString('pt-BR'); }
  function n0(x) { return Math.round(x).toLocaleString('pt-BR'); }
  function dias(d) { return E.fmtDias(d); }
  function cls(d, meta) { return !isFinite(d) ? 'ok' : d >= meta ? 'ok' : d >= meta / 3 ? 'warn' : 'bad'; }

  var EMOJI = { arroz: '🍚', macarrao: '🍝', aveia: '🥣', fuba: '🌽', farinha_mandioca: '🥔', farinha_trigo: '🌾', biscoito: '🍪',
    feijao: '🫘', lentilha: '🫘', grao_bico: '🫘', soja_texturizada: '🌱', atum: '🐟', sardinha: '🐟', ovo: '🥚', leite_po: '🥛',
    oleo: '🫒', amendoim: '🥜', pasta_amendoim: '🥜', acucar: '🧂', sal: '🧂', milho_lata: '🌽', molho_tomate: '🍅', uva_passa: '🍇',
    batata: '🥔', vitamina: '💊' };
  var GEMOJI = { cereal: '🌾', leguminosa: '🫘', proteina: '🐟', laticinio: '🥛', gordura: '🫒', acucar: '🍬', vegetal: '🥕', micro: '💊', essencial: '🧂', fruta: '🍎', carne: '🥩', pescado: '🐟', bebida: '🥤', preparado: '🍲', outros: '🍽️' };
  function em(f) { return EMOJI[f.id] || GEMOJI[f.grupo] || '🍽️'; }
  function fname(f, sub) { return '<div class="fname"><span class="em" aria-hidden="true">' + em(f) + '</span><div>' + esc(f.nome) + (sub ? '<div class="muted">' + sub + '</div>' : '') + '</div></div>'; }

  var TABS = [
    ['painel', '📊 Painel'], ['pessoas', '👨‍👩‍👧 Pessoas'], ['estoque', '📦 Estoque'], ['meds', '💊 Medicamentos'], ['pront', '🧟 Prontidão'], ['compras', '🛒 Compras'],
    ['cardapio', '🍽️ Cardápio'], ['estrategias', '💡 Estratégias'], ['catalogo', '📖 Catálogo'], ['relatorio', '🖨️ Relatório'], ['config', '⚙️ Config e backup']
  ];

  function renderChrome() {
    document.getElementById('modo').innerHTML = Object.keys(D.MODOS).map(function (k) {
      return '<button type="button" data-modo="' + k + '" aria-pressed="' + (state.modo === k) + '">' + D.MODOS[k].nome + '</button>';
    }).join('');
    document.getElementById('tabs').innerHTML = TABS.map(function (t) {
      return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + '</button>';
    }).join('');
  }

  function render() {
    renderChrome();
    var v = document.getElementById('view');
    var fn = { painel: vPainel, pessoas: vPessoas, estoque: vEstoque, meds: vMeds, pront: vPront, compras: vCompras, cardapio: vCardapio, relatorio: vRelatorio,
      estrategias: vEstrategias, catalogo: vCatalogo, config: vConfig }[tab];
    v.innerHTML = fn();
  }

  /* ---------------- PAINEL ---------------- */
  function vPainel() {
    var an = E.analyze(state), meta = state.metaDias, d = an.dias;
    var modoDesc = D.MODOS[state.modo].desc;
    var h = '<h2>Visão geral</h2>';
    if (!an.h.n) {
      return h + '<div class="card">Comece em <b>Pessoas</b> para informar quantas pessoas moram na casa. Depois cadastre o <b>Estoque</b>.</div>';
    }
    var pct = isFinite(d.energia) ? Math.min(100, d.energia / meta * 100) : 100;
    var c = cls(d.energia, meta), R = 70, C = 2 * Math.PI * R;
    var veredito = d.energia >= meta ? 'Meta atingida em calorias 🎉' : d.energia >= meta / 3 ? 'Já tem uma boa base. Ainda falta chegar à meta.' : 'Estoque curto para a meta. Veja a aba Compras.';
    h += '<div class="card hero"><div class="ring ' + c + '" role="img" aria-label="' + n0(pct) + '% da meta">' +
      '<svg viewBox="0 0 168 168"><circle class="trk" cx="84" cy="84" r="' + R + '" fill="none" stroke-width="14"/>' +
      '<circle class="val" cx="84" cy="84" r="' + R + '" fill="none" stroke-width="14" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct / 100)).toFixed(1) + '"/></svg>' +
      '<div class="mid"><b>' + (isFinite(d.energia) ? n0(d.energia) : '∞') + '</b><span>dias de ' + meta + '</span></div></div>' +
      '<div><h2>' + veredito + '</h2><p class="muted">' + esc(modoDesc) + '</p>' +
      '<div class="chips"><span class="chip">👥 ' + an.h.n + ' pessoa(s)</span><span class="chip">🔥 ' + n0(an.h.kcal) + ' kcal/dia</span><span class="chip">🎯 meta ' + meta + ' dias</span></div></div></div>';
    h += '<div class="grid">' +
      kpi('Energia', dias(d.energia), cls(d.energia, meta), 'Meta: ' + meta + ' dias', '🔥') +
      kpi('Proteína', dias(d.proteina), cls(d.proteina, meta), n0(an.h.prot) + ' g/dia necessários', '💪') +
      (state.aguaL > 0 ? kpi('Água', dias(d.agua), cls(d.agua, Math.min(meta, 14)), n1(an.aguaDia) + ' L/dia (inclui cozimento)', '💧')
        : kpi('Água', 'Informe', 'warn', 'Preencha em Config. Precisa de ' + n1(an.aguaDia) + ' L/dia', '💧')) +
      (state.gasKg > 0 ? kpi('Gás de cozinha', dias(d.gas), cls(d.gas, meta), (Math.round(an.gasDia * 100) / 100).toLocaleString('pt-BR') + ' kg/dia estimados', '🧯')
        : kpi('Gás de cozinha', 'Informe', 'warn', 'Preencha em Config. Uso: ' + (Math.round(an.gasDia * 100) / 100).toLocaleString('pt-BR') + ' kg/dia', '🧯')) +
      '</div>';

    // comparação de modos
    h += '<div class="card"><h3>Quanto dura em cada modo</h3><table><thead><tr><th>Modo</th><th class="num">Energia</th><th class="num">Proteína</th><th class="num">Ganho vs normal</th></tr></thead><tbody>';
    var base = E.analyze(state, 'normal').dias.energia;
    Object.keys(D.MODOS).forEach(function (m) {
      var a = E.analyze(state, m);
      var ganho = isFinite(a.dias.energia) && isFinite(base) ? '+' + n0(a.dias.energia - base) + ' dias' : '—';
      h += '<tr><td>' + D.MODOS[m].nome + (m === state.modo ? ' <span class="tag">atual</span>' : '') + '</td><td class="num">' + dias(a.dias.energia) +
        '</td><td class="num">' + dias(a.dias.proteina) + '</td><td class="num">' + (m === 'normal' ? '—' : ganho) + '</td></tr>';
    });
    h += '</tbody></table></div>';

    // alertas e sugestões
    var sug = E.sugestoes(state, an, meta);
    h += '<div class="card"><h3>Alertas e sugestões</h3>' + sug.map(function (s) {
      var ic = { alto: '⚠️', medio: '⚡', ok: '✅', baixo: 'ℹ️', info: '💡' }[s.nivel] || '💡';
      return '<div class="sug ' + s.nivel + '"><span class="ic" aria-hidden="true">' + ic + '</span><div><b>' + esc(s.t) + '</b>' + esc(s.d) + '</div></div>';
    }).join('') + '</div>';

    // macronutrientes
    h += macroCard(an, meta);
    var tot = an.tot.kcal || 1;
    h += '<div class="card"><h3>Calorias por grupo</h3>' + Object.keys(D.GRUPOS).map(function (g) {
      var v = (an.grupos[g] || 0); if (!v) return '';
      var dd = v / an.h.kcal;
      return '<div class="meal"><div class="flex between"><span>' + GEMOJI[g] + ' ' + D.GRUPOS[g] + '</span><span class="muted">' + dias(dd) + ' (' + n0(v / tot * 100) + '%)</span></div>' +
        '<div class="bar"><i style="width:' + Math.min(100, v / tot * 100) + '%"></i></div></div>';
    }).join('') + '</div>';

    // por alimento
    if (an.items.length) {
      h += '<div class="card"><h3>Duração por alimento</h3><div class="scroll"><table><thead><tr><th>Alimento</th><th class="num">Estoque</th><th class="num">Pronto</th><th class="num">Duração</th></tr></thead><tbody>' +
        an.items.map(function (i) {
          var f = i.food;
          return '<tr><td>' + fname(f) + '</td><td class="num">' + n1(i.kg) + ' kg</td><td class="num">' + n1(i.cozidoKg) + ' kg</td><td class="num">' + (i.porDiaKg > 0 ? dias(i.dias) : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="muted">Duração de cada item sozinho, seguindo as porções da aba Catálogo.</p></div>';
    }

    // prontidão
    var psc = PRONT.pontuacao(state, prAuto(an));
    h += '<div class="card"><div class="flex between"><h3>' + psc.nivel.ic + ' Prontidão para emergências</h3><button class="btn sec" type="button" data-tab="pront">Abrir</button></div>' +
      '<div class="flex between"><span><b style="font-size:1.6rem">' + psc.score + '</b>/100 · ' + psc.nivel.nome + '</span><span class="muted">' + esc(psc.passos[0] ? 'Próximo: ' + psc.passos[0].txt : '') + '</span></div>' +
      '<div class="bar ' + (psc.score >= 70 ? '' : psc.score >= 35 ? 'warn' : 'bad') + '" style="margin-top:8px"><i style="width:' + psc.score + '%"></i></div></div>';

    // medicamentos
    var mr = M.resumo(state.meds || []);
    h += '<div class="card"><div class="flex between"><h3>💊 Medicamentos</h3><button class="btn sec" type="button" data-tab="meds">Abrir</button></div>' +
      (mr.total ? '<p>' + mr.total + ' item(ns) · <b' + (mr.vencidos ? ' style="color:var(--bad)"' : '') + '>' + mr.vencidos + ' vencido(s)</b> · ' + mr.atencao + ' vencem em 90 dias · kit essencial ' + mr.essenciaisOk + ' de ' + mr.essenciais + (mr.continuoMin !== null ? ' · uso contínuo dura <b>' + dias(mr.continuoMin) + '</b>' : '') + '.</p>'
        : '<p class="muted">Cadastre seus medicamentos e veja o kit essencial, a validade e dicas para situação extrema.</p>') + '</div>';

    // validade
    if (an.alertas.length) {
      h += '<div class="card"><h3>Validade</h3><table><thead><tr><th>Item</th><th>Situação</th></tr></thead><tbody>' +
        an.alertas.map(function (a) {
          var txt = a.tipo === 'vencido' ? 'Vencido há ' + Math.abs(a.dias) + ' dia(s)' :
            a.tipo === 'vence_antes' ? 'Vence em ' + a.dias + ' dia(s), antes de ser consumido (dura ' + dias(a.consumo) + ')' : 'Vence em ' + a.dias + ' dia(s)';
          return '<tr><td>' + esc(a.food.nome) + '</td><td>' + txt + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    return h;
  }
  function kpi(l, v, c, sub, ic) { return '<div class="kpi ' + c + '"><div class="l"><span class="ic" aria-hidden="true">' + (ic || '') + '</span> ' + l + '</div><div class="v">' + v + '</div><div class="l">' + sub + '</div></div>'; }
  function donut(parts) {
    var R = 54, C = 2 * Math.PI * R, off = 0, out = '';
    parts.forEach(function (p) {
      var len = C * p.pct / 100;
      out += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + p.cor + '" stroke-width="18" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>';
      off += len;
    });
    return '<svg viewBox="0 0 140 140" style="transform:rotate(-90deg)" aria-hidden="true"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="var(--bar)" stroke-width="18"/>' + out + '</svg>';
  }
  function macroCard(an, meta) {
    var m = an.macro, mc = an.macros;
    var def = [
      { k: 'carb', nome: 'Carboidratos', ic: '🍚', cor: 'var(--accent)', faixa: '45–65%', ok: mc.carb >= 45 && mc.carb <= 70, pct: mc.carb },
      { k: 'prot', nome: 'Proteínas', ic: '🥩', cor: 'var(--bad)', faixa: '10–20%', ok: mc.prot >= 10 && mc.prot <= 25, pct: mc.prot },
      { k: 'gord', nome: 'Gorduras', ic: '🫒', cor: 'var(--info)', faixa: '20–35%', ok: mc.gord >= 18 && mc.gord <= 38, pct: mc.gord }
    ];
    var kg = function (g) { return g >= 1000 ? n1(g / 1000) + ' kg' : n0(g) + ' g'; };
    var h = '<div class="card"><h3>🥗 Carboidratos, proteínas e gorduras do estoque</h3>' +
      '<p class="muted">Quanto de cada nutriente existe nos alimentos que você tem, comparado ao que a casa precisa por dia (proteína pelo perfil de cada pessoa; gordura cerca de 28% das calorias; carboidrato o restante).</p>' +
      '<div class="macro-wrap"><div class="donut">' + donut(def.map(function (d) { return { pct: d.pct, cor: d.cor }; })) +
      '<div class="mid"><b>' + n0(an.tot.kcal) + '</b><span>kcal no estoque</span></div></div><div class="macro-list">';
    def.forEach(function (d) {
      var x = m[d.k], c = cls(x.dias, meta), pctMeta = isFinite(x.dias) ? Math.min(100, x.dias / meta * 100) : 100;
      h += '<div class="macro"><div class="flex between"><b><span class="dot" style="background:' + d.cor + '"></span>' + d.ic + ' ' + d.nome + '</b>' +
        '<span class="tag ' + (d.ok ? '' : 'est') + '" title="Faixa recomendada: ' + d.faixa + ' das calorias">' + n0(d.pct) + '% das kcal</span></div>' +
        '<div class="flex between muted"><span>Estoque: <b>' + kg(x.tem) + '</b></span><span>Precisa: <b>' + n0(x.precisa) + ' g/dia</b></span><span>Dura: <b>' + dias(x.dias) + '</b></span></div>' +
        '<div class="bar ' + (c === 'ok' ? '' : c) + '" title="' + n0(pctMeta) + '% da meta de ' + meta + ' dias"><i style="width:' + pctMeta.toFixed(0) + '%"></i></div>' +
        (x.fontes.length ? '<div class="muted src">Principais fontes: ' + x.fontes.map(function (f) { return em(f.food) + ' ' + esc(f.food.nome.replace(/ \(.*\)/, '')) + ' ' + n0(f.pct) + '%'; }).join(' · ') + '</div>' : '') + '</div>';
    });
    h += '</div></div>';
    var menor = def.slice().sort(function (a, b) { return m[a.k].dias - m[b.k].dias; })[0];
    if (isFinite(m[menor.k].dias) && m[menor.k].dias < meta)
      h += '<p class="muted" style="margin-top:10px">⚠️ O nutriente que acaba primeiro é <b>' + menor.nome.toLowerCase() + '</b> (' + dias(m[menor.k].dias) + '). Reforce essa categoria nas compras.</p>';
    return h + '</div>';
  }
  function macroBar(nome, v, faixa, ok) {
    return '<div class="meal"><div class="flex" style="justify-content:space-between"><span>' + nome + '</span><span class="muted">' + n0(v) + '% · ideal ' + faixa + '</span></div>' +
      '<div class="bar ' + (ok ? '' : 'warn') + '"><i style="width:' + Math.min(100, v) + '%"></i></div></div>';
  }

  /* ---------------- PESSOAS ---------------- */
  function vPessoas() {
    var h = '<h2>Pessoas da casa</h2><div class="card"><form class="form" data-form="pessoa">' +
      '<div><label>Nome</label><input name="nome" placeholder="Opcional" maxlength="40"></div>' +
      '<div><label>Perfil</label><select name="perfil">' + Object.keys(D.PERFIS).map(function (k) { return '<option value="' + k + '">' + D.PERFIS[k].nome + '</option>'; }).join('') + '</select></div>' +
      '<div><label>kcal/dia (opcional)</label><input name="kcal" type="number" min="500" max="5000" step="50" placeholder="Padrão do perfil"></div>' +
      '<div><button class="btn" type="submit">Adicionar</button></div></form></div>';
    if (!state.pessoas.length) return h + '<div class="empty"><big>👨‍👩‍👧</big>Nenhuma pessoa cadastrada. Adicione acima quem mora na casa.</div>';
    var hh = E.household(state);
    h += '<div class="card"><div class="scroll"><table><thead><tr><th>Nome</th><th>Perfil</th><th class="num">kcal/dia</th><th class="num">No modo atual</th><th></th></tr></thead><tbody>' +
      state.pessoas.map(function (p, i) {
        var prof = D.PERFIS[p.perfil], base = E.personKcal(p);
        var mf = (prof.vuln ? D.MODOS[state.modo].vuln : D.MODOS[state.modo].adulto);
        return '<tr><td>' + esc(p.nome || 'Pessoa ' + (i + 1)) + '</td><td>' + prof.nome + '</td><td class="num">' + n0(base) + '</td><td class="num">' + n0(base * mf) + '</td>' +
          '<td><button class="btn del" data-act="del-pessoa" data-id="' + p.id + '">Remover</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted">Total: ' + hh.n + ' pessoa(s), ' + n0(hh.kcal) + ' kcal/dia, ' + n0(hh.prot) + ' g de proteína/dia no modo ' + D.MODOS[state.modo].nome + '.</p>' +
      '<div class="disclaimer">Os valores são médias de referência. Crianças, gestantes, lactantes e pessoas com doenças crônicas devem ser acompanhadas por profissional de saúde. O sistema reduz pouco o consumo desses perfis nos modos de racionamento.</div></div>';
    return h;
  }

  /* ---------------- ESTOQUE ---------------- */
  function unitLabel(f) { return f.un === 'kg' ? 'kg' : f.un === 'l' ? 'litro(s)' : 'unidade(s)'; }

  function vEstoque() {
    var foods = E.allFoods(state), fm = E.foodMap(foods);
    var h = '<h2>Estoque</h2><div class="card"><form class="form" data-form="estoque">' +
      '<div class="combo"><label for="foodQ">Alimento</label>' +
      '<input id="foodQ" type="text" role="combobox" aria-expanded="false" aria-controls="foodList" aria-autocomplete="list" autocomplete="off" placeholder="Digite para buscar: arroz, quinoa, lentilha…">' +
      '<input type="hidden" name="foodId" id="foodId"><ul id="foodList" role="listbox" hidden></ul></div>' +
      '<div><label for="qtdIn">Quantidade <span id="unitLbl">(kg)</span></label><input id="qtdIn" name="qtd" type="number" min="0" step="any" required></div>' +
      '<div id="pesoWrap" hidden><label for="pesoIn">Peso drenado por unidade (g)</label><input id="pesoIn" name="pesoUn" type="number" min="1" step="any" placeholder="ex.: 179"></div>' +
      '<div><label>Validade (opcional)</label><input name="validade" type="date"></div>' +
      '<div><button class="btn" type="submit">Adicionar</button></div></form>' +
      '<p class="muted" id="foodHint">' + foods.length + ' alimentos no catálogo. Comece a digitar o nome.</p></div>';
    if (!state.estoque.length) return h + '<div class="empty"><big>📦</big>Estoque vazio. Adicione o primeiro alimento acima.</div>';
    var an = E.analyze(state);
    var byFood = {}; an.items.forEach(function (i) { byFood[i.food.id] = i; });
    h += '<div class="card"><div class="scroll"><table><thead><tr><th>Alimento</th><th class="num">Qtd.</th><th class="num">Pronto (kg)</th><th class="num">kcal</th><th>Validade</th><th class="num">Dura</th><th></th></tr></thead><tbody>' +
      state.estoque.map(function (s) {
        var f = fm[s.foodId]; if (!f) return '';
        var kg = E.lineKg(f, s), it = byFood[f.id];
        return '<tr><td>' + fname(f) + '</td>' +
          '<td class="num"><input type="number" min="0" step="any" value="' + s.qtd + '" data-act="qtd" data-id="' + s.id + '" style="width:85px" aria-label="Quantidade"> ' + unitLabel(f).replace('(s)', '') +
            (f.un === 'un' ? ' × <input type="number" min="1" step="any" value="' + (Number(s.pesoUn) > 0 ? s.pesoUn : f.gpu) + '" data-act="pesoUn" data-id="' + s.id + '" style="width:72px" aria-label="Peso por unidade em gramas"> g' : '') + '</td>' +
          '<td class="num">' + n1(kg * f.rend) + '</td><td class="num">' + n0(kg * 10 * f.kcal) + '</td>' +
          '<td><input type="date" value="' + esc(s.validade || '') + '" data-act="validade" data-id="' + s.id + '"></td>' +
          '<td class="num">' + (it && it.porDiaKg > 0 ? dias(it.dias) : '—') + '</td>' +
          '<td><button class="btn del" data-act="del-estoque" data-id="' + s.id + '">×</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    return h;
  }

  /* ---------------- MEDICAMENTOS ---------------- */
  var medPre = '';
  var NIVEL_TXT = { ok: 'Em caso extremo: risco menor', cuidado: 'Evitar; só com orientação', nao: 'Não usar vencido' };
  function pessoaNome(id) {
    var i = -1; state.pessoas.forEach(function (p, k) { if (p.id === id) i = k; });
    return i < 0 ? 'Todos' : (state.pessoas[i].nome || 'Pessoa ' + (i + 1));
  }
  function vMeds() {
    var hoje = new Date(), meds = state.meds || [], r = M.resumo(meds, hoje), meta = state.metaDias;
    var pre = M.catPorId(medPre);
    var h = '<h2>Medicamentos</h2><div class="disclaimer">⚕️ Conteúdo <b>informativo</b>, sem doses. Não substitui a orientação de médico ou farmacêutico. Use sempre a bula e a prescrição de cada pessoa.</div>';
    h += '<div class="grid" style="margin-top:12px">' +
      kpi('Itens cadastrados', n0(r.total), 'ok', 'medicamentos e materiais', '💊') +
      kpi('Vencidos', n0(r.vencidos), r.vencidos ? 'bad' : 'ok', r.vencidos ? 'veja o que fazer abaixo' : 'nenhum vencido', '⛔') +
      kpi('Vencem em 90 dias', n0(r.atencao), r.atencao ? 'warn' : 'ok', 'planeje a reposição', '⏳') +
      kpi('Kit essencial', r.essenciaisOk + ' de ' + r.essenciais, r.essenciaisOk >= r.essenciais ? 'ok' : r.essenciaisOk >= r.essenciais / 2 ? 'warn' : 'bad', 'itens essenciais com estoque válido', '🧰') +
      (r.continuoMin !== null ? kpi('Uso contínuo dura', dias(r.continuoMin), cls(r.continuoMin, meta), 'menor reserva: ' + esc(r.continuoNome), '🔁') : '') + '</div>';

    h += '<div class="card"><h3>➕ Cadastrar medicamento</h3><form class="form" data-form="med">' +
      '<div><label for="medNome">Nome</label><input id="medNome" name="nome" list="medNomes" maxlength="60" placeholder="ex.: Paracetamol 500 mg" value="' + (pre ? esc(pre.nome.replace(/ \(.*\)/, '')) : '') + '">' +
      '<datalist id="medNomes">' + M.CATEGORIAS.map(function (c) { return '<option value="' + esc(c.nome) + '">'; }).join('') + '</datalist></div>' +
      '<div><label for="medCat">Tipo (define a orientação de validade)</label><select id="medCat" name="cat" data-act="med-cat"><option value="">Outro / não listado</option>' +
      Object.keys(M.GRUPOS).map(function (g) {
        return '<optgroup label="' + M.GRUPOS[g] + '">' + M.CATEGORIAS.filter(function (c) { return c.grupo === g; }).map(function (c) { return '<option value="' + c.id + '"' + (medPre === c.id ? ' selected' : '') + '>' + esc(c.nome) + '</option>'; }).join('') + '</optgroup>';
      }).join('') + '</select></div>' +
      '<div><label for="medForma">Forma</label><select id="medForma" name="forma">' + Object.keys(M.FORMAS).map(function (k) { return '<option value="' + k + '"' + (pre && pre.forma === k ? ' selected' : '') + '>' + M.FORMAS[k] + '</option>'; }).join('') + '</select></div>' +
      '<div><label for="medQtd">Quantidade</label><input id="medQtd" name="qtd" type="number" min="0" step="any" required></div>' +
      '<div><label for="medUn">Unidade</label><select id="medUn" name="un">' + Object.keys(M.UNIDADES).map(function (k) { return '<option value="' + k + '">' + M.UNIDADES[k] + '</option>'; }).join('') + '</select></div>' +
      '<div><label for="medVal">Validade</label><input id="medVal" name="validade" type="date"></div>' +
      '<div><label for="medPess">Para quem</label><select id="medPess" name="pessoa"><option value="">Todos / uso geral</option>' + state.pessoas.map(function (p, i) { return '<option value="' + p.id + '">' + esc(p.nome || 'Pessoa ' + (i + 1)) + '</option>'; }).join('') + '</select></div>' +
      '<div><label><input type="checkbox" id="medCont" name="continuo" data-act="med-cont" style="width:auto"> Uso contínuo</label>' +
      '<input id="medDose" name="dose" type="number" min="0" step="any" placeholder="Dose por dia (unidades)" disabled></div>' +
      '<div style="grid-column: span 2"><label for="medObs">Observações (dose prescrita, horário…)</label><input id="medObs" name="obs" maxlength="120"></div>' +
      '<div><button class="btn" type="submit">Adicionar</button></div></form></div>';

    if (!meds.length) h += '<div class="empty"><big>💊</big>Nenhum medicamento cadastrado. Use o kit essencial abaixo como guia do que reunir.</div>';
    else {
      h += '<div class="card"><div class="scroll"><table><thead><tr><th>Medicamento</th><th>Para quem</th><th class="num">Qtd.</th><th>Validade</th><th class="num">Dura</th><th></th></tr></thead><tbody>' +
        meds.map(function (m) {
          var a = M.avaliar(m, hoje), cat = M.catPorId(m.cat), du = M.duracao(m);
          var tag = a.situacao === 'vencido' ? '<span class="tag bad">Vencido há ' + Math.abs(a.dias) + ' d</span>' :
            a.situacao === 'atencao' ? '<span class="tag warn">Vence em ' + a.dias + ' d</span>' :
            a.situacao === 'ok' ? '<span class="tag">Válido</span>' : '<span class="tag est">sem data</span>';
          var aviso = a.situacao === 'vencido' ? '<div class="muted" title="' + esc(a.conselho) + '">' + NIVEL_TXT[a.nivel] + '</div>' : '';
          return '<tr><td><b>' + esc(m.nome) + '</b><div class="muted">' + esc(cat ? cat.nome : 'Outro') + ' · ' + M.FORMAS[m.forma] + (m.obs ? ' · ' + esc(m.obs) : '') + '</div></td>' +
            '<td>' + esc(pessoaNome(m.pessoa)) + '</td>' +
            '<td class="num"><input type="number" min="0" step="any" value="' + m.qtd + '" data-act="med-qtd" data-id="' + m.id + '" style="width:80px" aria-label="Quantidade"> <span class="muted">' + M.UNIDADES[m.un] + '</span></td>' +
            '<td>' + (m.validade ? new Date(m.validade + 'T00:00:00').toLocaleDateString('pt-BR') : '—') + '<div>' + tag + '</div>' + aviso + '</td>' +
            '<td class="num">' + (du !== null ? '<b class="' + cls(du, meta) + '">' + dias(du) + '</b>' : '—') + '</td>' +
            '<td><button class="btn del" data-act="del-med" data-id="' + m.id + '">×</button></td></tr>';
        }).join('') + '</tbody></table></div></div>';
      if (r.vencidos) h += '<div class="sug alto"><span class="ic" aria-hidden="true">⚠️</span><div><b>' + r.vencidos + ' item(ns) vencido(s)</b>' + esc(M.CONSELHO.nao) + ' Para sólidos secos íntegros, veja "Em caso extremo" nas dicas abaixo.</div></div>';
    }

    // kit essencial
    var kit = M.kit(meds, hoje);
    h += '<div class="card"><h3>🧰 Kit essencial: o que reunir</h3><p class="muted">✅ você tem, válido · ⚠️ só há item vencido · ⬜ falta. Os itens "se você usa" valem só para quem já tem prescrição.</p>';
    Object.keys(M.GRUPOS).forEach(function (g) {
      var list = kit.filter(function (k) { return k.cat.grupo === g; });
      h += '<h3 style="margin-top:12px">' + M.GRUPOS[g] + '</h3><div class="scroll"><table><tbody>' + list.map(function (k) {
        var c = k.cat, ic = k.tem ? '✅' : k.soVencido ? '⚠️' : '⬜';
        var prio = c.prio === 'essencial' ? '<span class="tag">essencial</span>' : c.prio === 'condicional' ? '<span class="tag est">se você usa</span>' : '<span class="tag src">recomendado</span>';
        return '<tr><td style="width:30px">' + ic + '</td><td><b>' + esc(c.nome) + '</b> ' + prio + '<div class="muted">' + esc(c.para) + (c.nota ? ' ' + esc(c.nota) : '') + '</div></td>' +
          '<td class="num">' + (k.tem ? '' : '<button class="btn sec" type="button" data-act="med-add-cat" data-id="' + c.id + '">Cadastrar</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    });
    h += '</div>';

    // dicas
    h += '<div class="card"><h3>📌 Validade e armazenamento em situação extrema</h3>' + M.DICAS.map(function (d, i) {
      return '<details class="dica"' + (i < 2 ? ' open' : '') + '><summary>' + esc(d.t) + '</summary><p>' + esc(d.d) + '</p></details>';
    }).join('') + '<div class="disclaimer">Em dúvida sobre um medicamento, fale com um farmacêutico ou médico. Emergência: <b>SAMU 192</b> · <b>Bombeiros 193</b>.</div></div>';
    return h;
  }

  /* ---------------- PRONTIDÃO ---------------- */
  var prOpen = { mochila: true };
  function pr() {
    var p = state.pront || (state.pront = {});
    if (!p.moradia) p.moradia = 'apto'; if (!p.local) p.local = 'cidade';
    p.marcados = p.marcados || {}; p.plano = p.plano || {}; p.papeis = p.papeis || {}; p.revisao = p.revisao || ''; p.pets = Number(p.pets) || 0; p.carro = !!p.carro;
    return p;
  }
  function prAuto(an) {
    var meta = state.metaDias || 90, d = an.dias, mr = M.resumo(state.meds || []);
    var pct = function (v, alvo) { return !isFinite(v) ? 100 : Math.max(0, Math.min(100, v / alvo * 100)); };
    var rem = mr.essenciais ? mr.essenciaisOk / mr.essenciais * 70 + (mr.total && !mr.vencidos ? 30 : 0) : 0;
    return {
      comida: an.tot.kcal > 0 ? pct(d.energia, meta) : 0,
      agua: state.aguaL > 0 ? pct(d.agua, 14) : 0,
      gas: state.gasKg > 0 ? pct(d.gas, meta) : 0,
      remedios: rem
    };
  }
  function prScoreHtml(sc) {
    var h = '<div class="pr-hero"><div class="pr-num"><b>' + sc.score + '</b><span>de 100</span></div><div><h2>' + sc.nivel.ic + ' ' + sc.nivel.nome + '</h2><p class="muted">' + sc.nivel.txt + '</p></div></div>' +
      '<div class="pr-parts">' + sc.partes.map(function (p) {
        return '<div class="meal"><div class="flex between"><span>' + p.ic + ' ' + esc(p.nome) + '</span><span class="muted">' + Math.round(p.pct) + '%</span></div><div class="bar ' + (p.pct >= 70 ? '' : p.pct >= 35 ? 'warn' : 'bad') + '"><i style="width:' + p.pct.toFixed(0) + '%"></i></div></div>';
      }).join('') + '</div>';
    return h;
  }
  function pesoTxt(g) { return g < 1000 ? n0(g) + ' g' : n1(g / 1000) + ' kg'; }
  function prItem(it, ctx) {
    var ok = PRONT.feito(state, it), auto = it.campo && String(pr().plano[it.campo] || '').trim() || (it.id === 'pl_papeis' && ok && !pr().marcados[it.id]);
    var q = PRONT.qtdTxt(it, ctx);
    return '<label class="chk" id="it_' + it.id + '"><input type="checkbox" data-act="pr-chk" data-id="' + it.id + '"' + (ok ? ' checked' : '') + (auto ? ' disabled' : '') + '>' +
      '<span><b>' + esc(it.nome) + '</b> ' + (it.prio === 3 ? '<span class="tag bad">crítico</span> ' : '') + (q ? '<small>' + q + '</small> ' : '') + (it.peso ? '<small>~' + pesoTxt(it.peso) + '</small> ' : '') +
      (auto ? '<small>(preenchido no plano)</small>' : '') + (it.dica ? '<div class="muted">' + esc(it.dica) + '</div>' : '') + '</span></label>';
  }
  function vPront() {
    var an = E.analyze(state), P0 = pr(), ctx = PRONT.ctxDe(state), sc = PRONT.pontuacao(state, prAuto(an)), hoje = new Date();
    var h = '<h2>Prontidão para emergências</h2><p class="muted">Apagão, falta de água, enchente, pandemia, desabastecimento, evacuação… e, de brincadeira, até apocalipse zumbi 🧟. A preparação é a mesma: foco em proteção e logística.</p>';

    h += '<div class="card"><h3>🏠 Sobre a sua casa</h3><p class="muted">As listas se ajustam a estas respostas e às pessoas cadastradas.</p><div class="form">' +
      '<div><label>Moradia</label><select data-act="pr-ctx" data-k="moradia"><option value="apto"' + (P0.moradia === 'apto' ? ' selected' : '') + '>Apartamento</option><option value="casa"' + (P0.moradia === 'casa' ? ' selected' : '') + '>Casa</option></select></div>' +
      '<div><label>Região</label><select data-act="pr-ctx" data-k="local"><option value="cidade"' + (P0.local === 'cidade' ? ' selected' : '') + '>Cidade</option><option value="interior"' + (P0.local === 'interior' ? ' selected' : '') + '>Interior / zona rural</option></select></div>' +
      '<div><label>Pets</label><input type="number" min="0" max="20" value="' + P0.pets + '" data-act="pr-ctx" data-k="pets"></div>' +
      '<div><label><input type="checkbox" data-act="pr-ctx" data-k="carro"' + (P0.carro ? ' checked' : '') + ' style="width:auto"> Tem carro</label></div></div></div>';

    h += '<div class="card" id="prScore">' + prScoreHtml(sc) + '</div>';

    if (sc.passos.length) {
      h += '<div class="card"><h3>👣 Próximos passos</h3>' + sc.passos.map(function (p) {
        return '<div class="sug ' + (p.id ? 'medio' : 'alto') + '"><div style="flex:1">' + esc(p.txt) + '</div>' +
          (p.tab ? '<button class="btn sec" type="button" data-tab="' + p.tab + '">Abrir</button>' : '<button class="btn sec" type="button" data-act="pr-goto" data-id="' + p.id + '">Ir</button>') + '</div>';
      }).join('') + '</div>';
    }

    var dr = PRONT.diasDesdeRevisao(state, hoje);
    h += '<div class="card"><div class="flex between"><div><h3>🔁 Revisão a cada 6 meses</h3><p class="muted">' +
      (dr === null ? 'Nenhuma revisão registrada. Confira validades, pilhas, água armazenada e a mochila.' : 'Última revisão há ' + dr + ' dia(s)' + (dr > 180 ? ' <b style="color:var(--bad)">· está na hora de revisar</b>' : '') + '.') + '</p></div>' +
      '<button class="btn" type="button" data-act="pr-revisao">Revisei hoje</button></div></div>';

    // áreas com checklist
    var its = PRONT.itensVisiveis(state);
    Object.keys(PRONT.AREAS).forEach(function (k) {
      var a = PRONT.AREAS[k], list = its.filter(function (i) { return i.area === k; }); if (!list.length) return;
      var r = PRONT.areaPct(state, k);
      h += '<details class="card area" data-area="' + k + '"' + (prOpen[k] ? ' open' : '') + '><summary><span>' + a.ic + ' <b>' + esc(a.nome) + '</b></span><span class="muted">' + r.feitos + '/' + r.total + '</span></summary>' +
        '<div class="bar" style="margin:8px 0"><i style="width:' + r.pct.toFixed(0) + '%"></i></div>';
      if (k === 'mochila') {
        var mo = PRONT.mochila(state);
        h += '<p class="muted">Uma mochila por pessoa, pronta perto da porta. Peso do kit completo: <b>' + n1(mo.total / 1000) + ' kg</b>; já separado: <b>' + n1(mo.marcado / 1000) + ' kg</b>. Referência: adultos em torno de 8 a 12 kg; crianças, bem menos.</p>';
      }
      h += list.map(function (i) { return prItem(i, ctx); }).join('');
      if (k === 'mochila') h += prComida72();
      h += '</details>';
    });

    // plano da família
    var pl = P0.plano;
    var f = function (k, lbl, ph) { return '<div><label>' + lbl + '</label><input data-act="pr-plano" data-k="' + k + '" value="' + esc(pl[k] || '') + '" placeholder="' + esc(ph || '') + '" maxlength="200"></div>'; };
    h += '<details class="card area" data-area="plano_form"' + (prOpen.plano_form ? ' open' : '') + '><summary><span>📝 <b>Preencher o plano da família</b></span><span class="muted">sai impresso na aba Relatório</span></summary><div class="form" style="margin-top:10px">' +
      f('encontro1', 'Ponto de encontro perto de casa', 'ex.: praça da esquina') + f('encontro2', 'Ponto de encontro fora do bairro', 'ex.: casa da tia, no bairro X') +
      f('contatoFora', 'Contato de fora da cidade (nome e telefone)', '') + f('rotas', 'Rotas de saída combinadas', '') + f('abrigos', 'Abrigos, UBS e hospital mais próximos', '') +
      f('agua', 'Onde conseguir água se faltar', '') + f('senha', 'Senha da família', 'só vocês sabem') + '</div>' +
      (state.pessoas.length ? '<h3 style="margin-top:14px">Papel de cada pessoa</h3><div class="form">' + state.pessoas.map(function (p, i) {
        return '<div><label>' + esc(p.nome || 'Pessoa ' + (i + 1)) + '</label><input data-act="pr-papel" data-id="' + p.id + '" value="' + esc(P0.papeis[p.id] || '') + '" placeholder="ex.: pega a mochila e cuida da Ana" maxlength="120"></div>';
      }).join('') + '</div>' : '<p class="muted">Cadastre as pessoas na aba Pessoas para definir os papéis.</p>') + '</details>';

    // cenários
    h += '<div class="card"><h3>🎯 Cenários e o que fazer</h3>' + PRONT.CENARIOS.map(function (c, i) {
      return '<details class="dica"' + (i === 0 ? ' open' : '') + '><summary>' + c.ic + ' ' + esc(c.t) + '</summary><p>' + esc(c.d) + '</p></details>';
    }).join('') + '</div>';
    h += '<div class="card"><h3>📞 Telefones úteis</h3><div class="grid">' + PRONT.TELEFONES.map(function (t) { return '<div class="kpi"><div class="v">' + t[0] + '</div><div class="l">' + t[1] + '</div></div>'; }).join('') + '</div>' +
      '<div class="disclaimer">Conteúdo informativo, baseado em orientações gerais de proteção civil e Cruz Vermelha. Siga sempre os alertas oficiais da Defesa Civil e das autoridades locais.</div></div>';
    return h;
  }
  function prComida72() {
    var fm = E.foodMap(E.allFoods(state)), mix = [['amendoim', 300], ['castanha_para', 100], ['biscoito', 400], ['uva_passa', 200], ['rapadura', 200], ['sardinha', 250]];
    var kcal = 0, g = 0, linhas = mix.map(function (m) { var f = fm[m[0]]; if (!f) return ''; kcal += m[1] * f.kcal / 100; g += m[1]; return esc(f.nome.replace(/ \(.*\)/, '')) + ' ' + m[1] + ' g'; }).filter(Boolean);
    return '<div class="disclaimer" style="background:var(--info-soft)"><b>🍫 Comida para 72 h por adulto (≈ 6.000 kcal)</b><br>Sugestão que não precisa de fogo nem cozimento: ' + linhas.join(' · ') + '. Total ≈ <b>' + n0(kcal) + ' kcal</b> e <b>' + n1(g / 1000) + ' kg</b>. Evite excesso de salgados: dão sede.</div>';
  }
  function prUpdateScore() {
    var el = document.getElementById('prScore'); if (!el) return;
    el.innerHTML = prScoreHtml(PRONT.pontuacao(state, prAuto(E.analyze(state))));
    // itens do plano que dependem de campos preenchidos
    PRONT.ITENS.forEach(function (it) {
      if (!it.campo && it.id !== 'pl_papeis') return;
      var box = document.querySelector('#it_' + it.id + ' input'); if (!box) return;
      var ok = PRONT.feito(state, it), auto = ok && !pr().marcados[it.id];
      box.checked = ok; box.disabled = auto;
    });
  }

  /* ---------------- COMPRAS ---------------- */
  function vCompras() {
    var meta = state.metaDias;
    var h = '<h2>Compras para ' + meta + ' dias</h2>';
    if (!state.pessoas.length) return h + '<div class="empty"><big>👥</big>Cadastre as pessoas primeiro.</div>';
    var dp = E.despensa(state, state.modo, meta);
    h += '<p class="muted">Lista para ' + dp.h.n + ' pessoa(s) em modo <b>' + D.MODOS[state.modo].nome + '</b>, considerando o que você já tem. ' +
      'Cada linha usa a mesma porção diária do Catálogo e do Painel.</p>';
    var falta = dp.rows.filter(function (r) { return r.faltaKg > 0.001; });
    h += '<div class="card"><div class="scroll"><table><thead><tr><th>Alimento</th><th class="num">Meta</th><th class="num">Tem</th><th class="num">Falta</th><th style="width:20%">Atingido</th></tr></thead><tbody>' +
      dp.rows.map(function (r) {
        var u = r.food.un === 'kg' ? 'kg' : r.food.un === 'l' ? 'L' : 'un';
        var dec = r.food.un === 'un' ? n0 : n1;
        return '<tr><td>' + fname(r.food, r.refG ? 'unidades de ' + n0(r.refG) + ' g' : '') + '</td><td class="num">' + dec(r.necessarioQtd) + ' ' + u + '</td><td class="num">' + dec(r.temQtd) + ' ' + u +
          '</td><td class="num"><b>' + (r.faltaKg > 0.001 ? dec(r.faltaQtd) + ' ' + u : '✓') + '</b></td>' +
          '<td><div class="bar ' + (r.pct >= 100 ? '' : r.pct >= 50 ? 'warn' : 'bad') + '"><i style="width:' + r.pct.toFixed(0) + '%"></i></div></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    if (!falta.length) h += '<div class="sug ok"><b>Despensa completa para a meta.</b></div>';
    var cp = dp.complemento;
    if (cp.kcalDia > 1) {
      h += '<div class="card"><h3>⚡ Complemento calórico</h3>' +
        '<p>As porções do catálogo cobrem <b>' + n0(cp.cobertura) + '%</b> das calorias da casa. Faltam <b>' + n0(cp.kcalDia) + ' kcal por dia</b> (' + n0(cp.kcalTotal / 1000) + ' mil kcal em ' + meta + ' dias).</p>' +
        '<p>Para fechar, aumente as porções no Catálogo ou some alimentos baratos e duradouros. Em arroz, seriam cerca de <b>' + n0(cp.arrozKg) + ' kg</b> a mais, ou o equivalente em macarrão, farinha, feijão, óleo e açúcar. O ideal é dividir entre vários alimentos, não só arroz.</p>' +
        '<p class="muted">Este valor não está incluído nas linhas acima.</p></div>';
    }
    // água e gás
    var an = E.analyze(state);
    var aguaMeta = an.aguaDia * meta, gasMeta = an.gasDia * meta;
    h += '<div class="card"><h3>Água e gás</h3>' +
      '<p>Água para ' + meta + ' dias: <b>' + n0(aguaMeta) + ' L</b> · você tem ' + n0(state.aguaL) + ' L · falta <b>' + n0(Math.max(0, aguaMeta - state.aguaL)) + ' L</b>.</p>' +
      '<p>Gás para ' + meta + ' dias: <b>' + n1(gasMeta) + ' kg</b> (' + n1(gasMeta / 13) + ' botijões de 13 kg) · você tem ' + n1(state.gasKg) + ' kg.</p>' +
      '<p class="muted">Ajuste água e gás na aba Config. A água estoque é a prioridade número um.</p></div>';
    return h;
  }

  /* ---------------- CARDÁPIO ---------------- */
  function vCardapio() {
    var an = E.analyze(state);
    var h = '<h2>Cardápio sugerido</h2>';
    if (!an.h.n || !an.items.length) return h + '<div class="empty"><big>🍽️</big>Cadastre pessoas e estoque para gerar o cardápio.</div>';
    h += '<p class="muted">Quantidades <b>prontas para comer</b> (g) para a casa toda, no modo ' + D.MODOS[state.modo].nome + ', usando só o que existe no estoque. Alterna leguminosas e proteínas ao longo dos dias.</p>';
    E.cardapio(state, an, 7).forEach(function (d) {
      h += '<div class="card menu-day"><div class="dnum"><small>DIA</small>' + d.dia + '</div><div>' + d.refeicoes.map(function (r) {
        if (!r.itens.length) return '';
        return '<div class="meal"><b>' + r.nome + ':</b> ' + r.itens.map(function (i) {
          var nome = i.food.nome.replace(/ \(.*\)/, '');
          var unidade = i.food.id === 'vitamina' ? ' comp.' : i.food.id === 'leite_po' ? ' ml' : ' g';
          return em(i.food) + ' ' + esc(nome) + ' <b>' + n0(i.g) + unidade + '</b>';
        }).join(' · ') + '</div>';
      }).join('') + '</div></div>';
    });
    return h;
  }

  /* ---------------- ESTRATÉGIAS ---------------- */
  function vEstrategias() {
    var an = E.analyze(state);
    var h = '<h2>Estratégias para economizar</h2>';
    if (an.h.n && an.tot.kcal > 0) {
      var base = an.dias.energia, rac = E.analyze(state, 'racionamento').dias.energia, em = E.analyze(state, 'emergencia').dias.energia;
      h += '<div class="card"><h3>Seu caso</h3><p>No modo normal o estoque dura <b>' + dias(base) + '</b>. Em racionamento dura <b>' + dias(rac) + '</b> e em emergência <b>' + dias(em) + '</b>.</p></div>';
    }
    h += E.ESTRATEGIAS.map(function (s) { return '<div class="card"><h3>' + esc(s.t) + '</h3><p>' + esc(s.d) + '</p></div>'; }).join('');
    return h;
  }

  /* ---------------- CATÁLOGO ---------------- */
  var cat = { q: '', n: 80 };
  function catList() {
    var foods = E.allFoods(state), order = Object.keys(D.GRUPOS), toks = norm(cat.q).split(/\s+/).filter(Boolean);
    foods = foods.filter(function (f) {
      if (!toks.length) return true;
      var hay = norm(f.nome + ' ' + (f.alias || '') + ' ' + D.GRUPOS[f.grupo]);
      return toks.every(function (t) { return hay.indexOf(t) >= 0; });
    });
    foods.sort(function (a, b) { return (a.taco ? 1 : 0) - (b.taco ? 1 : 0) || order.indexOf(a.grupo) - order.indexOf(b.grupo); });
    return foods;
  }
  function catRows() {
    var foods = catList(), vis = foods.slice(0, cat.n);
    var rows = vis.map(function (f) {
      var ov = state.porcoes[f.id];
      var src = f.fonte ? '<span class="tag src" title="' + (f.fonte === 'TACO' ? 'Valor da Tabela TACO (UNICAMP)' : f.fonte === 'Rótulo' ? 'Valor tirado do rótulo do fabricante' : 'Valor conferido na USDA FoodData Central') + '">' + f.fonte + '</span>' : '<span class="tag est" title="Estimativa de referência, ainda não conferida em tabela">estimado</span>';
      return '<tr title="' + esc(f.dica || '') + '"><td>' + fname(f, D.GRUPOS[f.grupo] + ' · ' + src) + '</td>' +
        '<td class="num">×' + n1(f.rend) + (f.rend > 1 ? '<div class="muted">1 kg → ' + n1(f.rend) + ' kg</div>' : '') + '</td>' +
        '<td class="num">' + n0(f.kcal / (f.rend || 1)) + '</td>' +
        '<td class="num"><input type="number" min="0" step="1" value="' + f.porcao + '" data-act="porcao" data-id="' + f.id + '" style="width:80px" aria-label="Porção de ' + esc(f.nome) + '">' +
        (ov !== undefined ? ' <button class="btn del" data-act="reset-porcao" data-id="' + f.id + '" title="Restaurar padrão">↺</button>' : '') + '</td>' +
        '<td class="num">' + f.val + ' m</td></tr>';
    }).join('');
    if (!foods.length) rows = '<tr><td colspan="5" class="muted">Nenhum alimento encontrado.</td></tr>';
    if (foods.length > vis.length) rows += '<tr><td colspan="5" style="text-align:center"><button type="button" class="btn sec" data-act="cat-mais">Mostrar mais ' + Math.min(80, foods.length - vis.length) + ' (restam ' + (foods.length - vis.length) + ')</button></td></tr>';
    return { html: rows, total: foods.length, shown: vis.length };
  }
  function catRefresh() {
    var r = catRows(), tb = document.querySelector('#catTable tbody'), c = document.getElementById('catCount');
    if (tb) tb.innerHTML = r.html;
    if (c) c.textContent = r.shown < r.total ? r.shown + ' de ' + r.total + ' alimentos' : r.total + ' alimento(s)';
  }
  function vCatalogo() {
    var r = catRows();
    var h = '<h2>Catálogo de alimentos</h2><p class="muted">Rendimento e porção são editáveis. <b>Porção</b> = gramas prontas por dia, por pessoa de referência (2.000 kcal) no modo normal. Os modos reduzem automaticamente. Itens com porção 0 contam calorias no estoque, mas não entram na lista de compras. Os itens da Tabela TACO vêm com porção 0: defina uma porção para incluí-los nos cálculos de duração.</p>' +
      '<div class="card"><div class="flex between" style="margin-bottom:10px"><input id="catQ" type="search" placeholder="Buscar no catálogo…" value="' + esc(cat.q) + '" style="max-width:340px" aria-label="Buscar no catálogo"><span class="muted" id="catCount">' + (r.shown < r.total ? r.shown + ' de ' + r.total + ' alimentos' : r.total + ' alimento(s)') + '</span></div>' +
      '<div class="scroll"><table id="catTable"><thead><tr><th>Alimento</th><th class="num">Rendimento</th><th class="num">kcal/100g pronto</th><th class="num">Porção (g)</th><th class="num">Validade</th></tr></thead><tbody>' + r.html + '</tbody></table></div></div>';
    h += '<p class="muted">Fontes: <b>TACO</b> = Tabela Brasileira de Composição de Alimentos (UNICAMP); <b>USDA</b> = USDA FoodData Central; <b>estimado</b> = valor de referência ainda não conferido. Rendimento, porção, tempo de cozimento e validade são sempre estimativas médias.</p>' +
      '<div class="card"><h3>Adicionar alimento</h3><form class="form" data-form="custom">' +
      '<div><label for="novoNome">Nome</label><input id="novoNome" name="nome" required maxlength="50" value="' + esc(prefillNome) + '"></div>' +
      '<div><label>Grupo</label><select name="grupo">' + Object.keys(D.GRUPOS).map(function (g) { return '<option value="' + g + '">' + D.GRUPOS[g] + '</option>'; }).join('') + '</select></div>' +
      '<div><label>Unidade</label><select name="un"><option value="kg">kg</option><option value="l">litro</option><option value="un">unidade</option></select></div>' +
      '<div><label>g por unidade/litro</label><input name="gpu" type="number" min="1" placeholder="se unid. ou litro"></div>' +
      '<div><label>kcal/100g (armazenado)</label><input name="kcal" type="number" min="0" required></div>' +
      '<div><label>Proteína g/100g</label><input name="prot" type="number" min="0" step="any" value="0"></div>' +
      '<div><label>Gordura g/100g</label><input name="gord" type="number" min="0" step="any" value="0"></div>' +
      '<div><label>Carboidrato g/100g</label><input name="carb" type="number" min="0" step="any" value="0"></div>' +
      '<div><label>Rendimento (×)</label><input name="rend" type="number" min="0.1" step="any" value="1"></div>' +
      '<div><label>Porção diária (g pronto)</label><input name="porcao" type="number" min="0" value="0"></div>' +
      '<div><label>Validade (meses)</label><input name="val" type="number" min="0" step="any" value="12"></div>' +
      '<div><button class="btn" type="submit">Adicionar ao catálogo</button></div></form></div>';
    prefillNome = '';
    return h;
  }

  /* ---------------- RELATÓRIO PARA IMPRIMIR ---------------- */
  var rel = { caixas: 14, cardapio: true, calendario: true, meds: true, plano: true, mochila: true };
  function p2(n) { return ('0' + n).slice(-2); }
  function fmtData(d) { return p2(d.getDate()) + '/' + p2(d.getMonth() + 1); }
  function fmtDataL(d) { return fmtData(d) + '/' + d.getFullYear(); }
  function addDias(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function relQty(f, g) { return f.id === 'vitamina' || f.id === 'vitamina_c' ? n0(g) + ' comp.' : f.id === 'leite_po' ? n0(g) + ' ml' : n0(g) + ' g'; }

  function vRelatorio() {
    var an = E.analyze(state), meta = state.metaDias, hoje = new Date(), d = an.dias;
    var h = '<div class="no-print"><h2>Relatório para imprimir</h2>' +
      '<p class="muted">Folhas em A4 <b>paisagem</b> para fixar na geladeira e acompanhar o uso sem energia nem internet: controle da despensa, cardápio da semana e calendário de dias. No diálogo de impressão escolha <b>Orientação: Paisagem</b> e desmarque "Cabeçalhos e rodapés". Para guardar em arquivo, escolha "Salvar como PDF".</p>' +
      '<div class="card"><div class="form">' +
      '<div><label for="relCx">Caixinhas de uso por alimento</label><select id="relCx" data-act="rel-opt" data-k="caixas">' +
      [7, 14, 21, 30].map(function (n) { return '<option value="' + n + '"' + (rel.caixas === n ? ' selected' : '') + '>' + n + ' dias</option>'; }).join('') + '</select></div>' +
      '<div><label><input type="checkbox" data-act="rel-opt" data-k="cardapio"' + (rel.cardapio ? ' checked' : '') + ' style="width:auto"> Incluir cardápio de 7 dias</label>' +
      '<label><input type="checkbox" data-act="rel-opt" data-k="plano"' + (rel.plano ? ' checked' : '') + ' style="width:auto"> Incluir plano da família</label>' +
      '<label><input type="checkbox" data-act="rel-opt" data-k="mochila"' + (rel.mochila ? ' checked' : '') + ' style="width:auto"> Incluir mochila de fuga</label>' +
      '<label><input type="checkbox" data-act="rel-opt" data-k="meds"' + (rel.meds ? ' checked' : '') + ' style="width:auto"> Incluir medicamentos</label>' +
      '<label><input type="checkbox" data-act="rel-opt" data-k="calendario"' + (rel.calendario ? ' checked' : '') + ' style="width:auto"> Incluir calendário de ' + meta + ' dias</label></div>' +
      '<div><button class="btn" type="button" data-act="imprimir">🖨️ Imprimir / salvar PDF</button></div></div></div></div>';
    if (!an.h.n || !an.items.length) return h + '<div class="empty no-print"><big>🖨️</big>Cadastre pessoas e estoque para gerar o relatório.</div>';

    // agrega o estoque por alimento: unidades, validade mais próxima
    var agg = {};
    state.estoque.forEach(function (s) {
      var a = agg[s.foodId] || (agg[s.foodId] = { un: 0, venc: '' });
      a.un += Number(s.qtd) || 0;
      if (s.validade && (!a.venc || s.validade < a.venc)) a.venc = s.validade;
    });
    var order = Object.keys(D.GRUPOS);
    var items = an.items.slice().sort(function (a, b) {
      return order.indexOf(a.food.grupo) - order.indexOf(b.food.grupo) || a.food.nome.localeCompare(b.food.nome, 'pt-BR');
    });
    function ate(dd) { return isFinite(dd) ? 'até ' + fmtData(addDias(hoje, Math.floor(dd))) : ''; }
    var kpi4 = function (ic, l, v, sub) { return '<div class="rk"><div class="rl">' + ic + ' ' + l + '</div><div class="rv">' + v + '</div><div class="rs">' + sub + '</div></div>'; };

    var caixas = ''; for (var i = 1; i <= rel.caixas; i++) caixas += '<i class="box">' + i + '</i>';
    var lastG = '', rows = '';
    items.forEach(function (it) {
      var f = it.food, a = agg[f.id] || { un: 0, venc: '' };
      if (f.grupo !== lastG) { if (lastG) rows += '</tbody>'; lastG = f.grupo; rows += '<tbody class="g"><tr class="grp"><td colspan="7">' + (GEMOJI[f.grupo] || '') + ' ' + D.GRUPOS[f.grupo] + '</td></tr>'; }
      var est = f.un === 'un' ? n0(a.un) + ' un × ' + n0(it.kg * 1000 / (a.un || 1)) + ' g' : f.un === 'l' ? n1(a.un) + ' L' : n1(it.kg) + ' kg';
      var cozido = it.porDiaKg * 1000 * (f.rend || 1);
      var racao = it.porDiaKg > 0 ? '<b>' + relQty(f, cozido) + '</b>' + (f.rend > 1 ? '<small> pronto<br>(cru ' + n0(it.porDiaKg * 1000) + ' g)</small>' : '') : '<span class="muted">sem porção</span>';
      var dura = it.porDiaKg > 0 ? '<b>' + (it.dias >= 100 ? n0(it.dias) : n1(it.dias)) + ' dias</b><br><small>' + ate(it.dias) + '</small>' : '—';
      var venc = a.venc ? fmtDataL(new Date(a.venc + 'T00:00:00')) : '—';
      rows += '<tr><td>' + esc(f.nome) + '</td><td class="c">' + est + '</td><td class="c">' + racao + '</td><td class="c">' + dura + '</td><td class="c">' + venc + '</td><td class="bx">' + caixas + '</td><td class="rest"></td></tr>';
    });

    h += '<section class="rel-sheet"><div class="rel-head"><div><h1>🥫 Controle da despensa</h1><div class="rs">Gerado em ' + fmtDataL(hoje) + ' · ' + an.h.n + ' pessoa(s) · modo <b>' + D.MODOS[state.modo].nome + '</b> · meta ' + meta + ' dias · ' + n0(an.h.kcal) + ' kcal/dia</div></div>' +
      '<div class="rel-kpis">' + kpi4('🔥', 'Energia', dias(d.energia), ate(d.energia)) + kpi4('💪', 'Proteína', dias(d.proteina), ate(d.proteina)) +
      kpi4('💧', 'Água', state.aguaL > 0 ? dias(d.agua) : 'informar', state.aguaL > 0 ? n0(state.aguaL) + ' L · ' + n1(an.aguaDia) + ' L/dia' : 'precisa ' + n1(an.aguaDia) + ' L/dia') +
      kpi4('🧯', 'Gás', state.gasKg > 0 ? dias(d.gas) : 'informar', state.gasKg > 0 ? n1(state.gasKg) + ' kg' : '') + '</div></div>' +
      '<table class="rel-t"><thead><tr><th style="width:19%">Alimento</th><th style="width:10%">Estoque inicial</th><th style="width:11%">Ração por dia (casa)</th><th style="width:9%">Dura</th><th style="width:8%">Vence</th><th>Uso diário (marque ✓ a cada dia)</th><th style="width:9%">Restante</th></tr></thead>' + rows + '</tbody></table>' +
      '<div class="rel-foot">💧 Água restante: ______ L &nbsp;&nbsp; 🧯 Gás restante: ______ kg &nbsp;&nbsp; Atualize o app quando houver energia e internet. Ração = quanto da comida pronta a casa toda deve comer por dia neste modo.</div></section>';

    if (rel.cardapio) {
      var cd = E.cardapio(state, an, 7), nomes = ['Café', 'Almoço', 'Jantar', 'Lanche'];
      h += '<section class="rel-sheet"><div class="rel-head"><div><h1>🍽️ Cardápio da semana</h1><div class="rs">Quantidades <b>prontas para comer</b>, para a casa toda, no modo ' + D.MODOS[state.modo].nome + '. Usa só o que está no estoque.</div></div></div>' +
        '<table class="rel-t menu"><thead><tr><th style="width:8%"></th>' + cd.map(function (x) { return '<th>Dia ' + x.dia + '</th>'; }).join('') + '</tr></thead><tbody>' +
        nomes.map(function (nm, mi) {
          return '<tr><th>' + nm + '</th>' + cd.map(function (x) {
            var r = x.refeicoes[mi];
            return '<td>' + (r && r.itens.length ? r.itens.map(function (i) { return esc(i.food.nome.replace(/ \(.*\)/, '')) + ' <b>' + relQty(i.food, i.g) + '</b>'; }).join('<br>') : '—') + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>' +
        '<div class="rel-foot">Troque alimentos do mesmo grupo à vontade (feijão por lentilha, atum por sardinha). Gaste primeiro o que tem validade mais curta.</div></section>';
    }

    if (rel.meds && (state.meds || []).length) {
      var mrows = state.meds.slice().sort(function (a, b) { return String(a.validade || '9999').localeCompare(String(b.validade || '9999')); }).map(function (m) {
        var a = M.avaliar(m, hoje), du = M.duracao(m), cat = M.catPorId(m.cat);
        var sit = a.situacao === 'vencido' ? '<b>VENCIDO</b> há ' + Math.abs(a.dias) + ' d<br><small>' + NIVEL_TXT[a.nivel] + '</small>' : a.situacao === 'atencao' ? 'vence em ' + a.dias + ' d' : a.situacao === 'ok' ? 'válido' : '—';
        return '<tr><td><b>' + esc(m.nome) + '</b><br><small>' + esc(cat ? cat.nome : 'Outro') + (m.obs ? ' · ' + esc(m.obs) : '') + '</small></td><td class="c">' + esc(pessoaNome(m.pessoa)) + '</td>' +
          '<td class="c">' + n1(m.qtd) + ' ' + M.UNIDADES[m.un] + '</td><td class="c">' + (m.validade ? fmtDataL(new Date(m.validade + 'T00:00:00')) : '—') + '</td><td class="c">' + sit + '</td>' +
          '<td class="c">' + (du !== null ? '<b>' + dias(du) + '</b>' : '—') + '</td><td class="rest"></td></tr>';
      }).join('');
      h += '<section class="rel-sheet"><div class="rel-head"><div><h1>💊 Medicamentos</h1><div class="rs">Gerado em ' + fmtDataL(hoje) + '. Ordenado por validade. Informativo: use sempre a bula e a prescrição. Emergência: SAMU 192 · Bombeiros 193.</div></div></div>' +
        '<table class="rel-t"><thead><tr><th style="width:26%">Medicamento</th><th style="width:11%">Para quem</th><th style="width:12%">Quantidade</th><th style="width:10%">Validade</th><th style="width:17%">Situação</th><th style="width:10%">Dura (contínuo)</th><th>Restante</th></tr></thead><tbody>' + mrows + '</tbody></table></section>';
    }

    if (rel.plano) {
      var P1 = pr(), pl1 = P1.plano, blank = function (v) { return v ? esc(v) : ''; };
      var campos = [['Ponto de encontro perto de casa', 'encontro1'], ['Ponto de encontro fora do bairro', 'encontro2'], ['Contato de fora da cidade (nome e telefone)', 'contatoFora'], ['Rotas de saída combinadas', 'rotas'], ['Abrigos, UBS e hospital mais próximos', 'abrigos'], ['Onde conseguir água', 'agua'], ['Senha da família', 'senha']];
      var pessoas = state.pessoas.length ? state.pessoas : [{ id: '', nome: '' }, { id: '', nome: '' }, { id: '', nome: '' }, { id: '', nome: '' }];
      h += '<section class="rel-sheet"><div class="rel-head"><div><h1>👨‍👩‍👧 Plano da família</h1><div class="rs">Gerado em ' + fmtDataL(hoje) + ' · revisar a cada 6 meses · ' + (P1.moradia === 'casa' ? 'casa' : 'apartamento') + ', ' + (P1.local === 'interior' ? 'interior' : 'cidade') + '</div></div></div>' +
        '<div class="rel-2col"><div><table class="rel-t plan"><tbody>' + campos.map(function (c) { return '<tr><th style="width:34%;text-align:left">' + c[0] + '</th><td>' + blank(pl1[c[1]]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<div class="rel-foot"><b>Se a família se separar:</b> 1) vá ao ponto de encontro perto; 2) se não puder, ao distante; 3) avise o contato de fora da cidade que está bem; 4) não volte para casa sem aviso oficial de que é seguro.</div></div>' +
        '<div><table class="rel-t plan"><thead><tr><th style="width:20%">Pessoa</th><th>Papel</th><th style="width:30%">Alergias, doenças, remédios</th></tr></thead><tbody>' + pessoas.map(function (p, i) {
          return '<tr><td><b>' + esc(p.nome || (p.id ? 'Pessoa ' + (i + 1) : '')) + '</b></td><td>' + blank(P1.papeis[p.id]) + '</td><td></td></tr>';
        }).join('') + '</tbody></table>' +
        '<table class="rel-t plan" style="margin-top:8px"><thead><tr><th colspan="2">Telefones úteis</th></tr></thead><tbody>' + PRONT.TELEFONES.map(function (t) { return '<tr><td style="width:18%"><b>' + t[0] + '</b></td><td>' + t[1] + '</td></tr>'; }).join('') +
        '<tr><td colspan="2">Família / amigo: ________________ Tel: ________________</td></tr><tr><td colspan="2">Médico / farmácia: ________________ Tel: ________________</td></tr></tbody></table></div></div></section>';
    }

    if (rel.mochila) {
      var mo2 = PRONT.mochila(state), ps2 = (state.pessoas.length ? state.pessoas : [{ nome: '' }, { nome: '' }]).slice(0, 6);
      h += '<section class="rel-sheet"><div class="rel-head"><div><h1>🎒 Mochila de fuga (72 horas)</h1><div class="rs">Uma por pessoa, perto da porta. Marque ✓ ao separar cada item. Peso do kit completo ≈ ' + n1(mo2.total / 1000) + ' kg (adultos: 8 a 12 kg; crianças, menos). Revise a cada 6 meses.</div></div></div>' +
        '<table class="rel-t"><thead><tr><th style="width:44%">Item</th><th style="width:8%">Peso</th>' + ps2.map(function (p, i) { return '<th>' + esc(p.nome || 'Pessoa ' + (i + 1)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        mo2.itens.map(function (i) { return '<tr><td>' + esc(i.nome) + (i.prio === 3 ? ' <b>*</b>' : '') + '</td><td class="c">' + pesoTxt(i.peso) + '</td>' + ps2.map(function () { return '<td class="c"><i class="box"></i></td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table><div class="rel-foot">* item crítico. Comida para 72 h por adulto (≈ 6.000 kcal) sem cozimento: amendoim, castanhas, biscoito, uva-passa, rapadura e sardinha em lata.</div></section>';
    }

    if (rel.calendario) {
      var dE = Math.floor(d.energia), dP = Math.floor(d.proteina), dA = state.aguaL > 0 ? Math.floor(d.agua) : Infinity, dG = state.gasKg > 0 ? Math.floor(d.gas) : Infinity;
      var cells = '';
      for (var k = 1; k <= meta; k++) {
        var tags = [];
        if (k === dE) tags.push('🔥 acaba energia'); if (k === dP) tags.push('💪 acaba proteína');
        if (k === dA) tags.push('💧 acaba água'); if (k === dG) tags.push('🧯 acaba gás');
        cells += '<div class="cal' + (k > dE ? ' sem' : '') + (tags.length ? ' marca' : '') + '"><b>' + k + '</b><span>' + fmtData(addDias(hoje, k - 1)) + '</span><i class="box big"></i>' + (tags.length ? '<em>' + tags.join('<br>') + '</em>' : '') + '</div>';
      }
      h += '<section class="rel-sheet"><div class="rel-head"><div><h1>📅 Calendário de ' + meta + ' dias</h1><div class="rs">Risque um dia ao terminar. Dias em cinza (hachurados) não têm calorias previstas no estoque atual' + (isFinite(d.energia) ? ': a energia dura cerca de <b>' + dias(d.energia) + '</b>.' : '.') + '</div></div></div><div class="cal-grid">' + cells + '</div></section>';
    }
    return h;
  }

  /* ---------------- CONFIG ---------------- */
  function vConfig() {
    var h = '<h2>Configurações</h2><div class="card"><div class="form">' +
      '<div><label>Meta (dias)</label><input type="number" min="1" max="730" value="' + state.metaDias + '" data-act="cfg" data-k="metaDias"></div>' +
      '<div><label>Água armazenada (litros)</label><input type="number" min="0" step="any" value="' + state.aguaL + '" data-act="cfg" data-k="aguaL"></div>' +
      '<div><label>Água de higiene (L/pessoa/dia)</label><input type="number" min="0" step="any" value="' + state.aguaHigiene + '" data-act="cfg" data-k="aguaHigiene"></div>' +
      '<div><label>Gás armazenado (kg)</label><input type="number" min="0" step="any" value="' + state.gasKg + '" data-act="cfg" data-k="gasKg"></div>' +
      '<div><label>Consumo do fogão (kg/h)</label><input type="number" min="0.05" step="0.05" value="' + state.fogaoKgH + '" data-act="cfg" data-k="fogaoKgH"></div></div>' +
      '<p class="muted">Botijão de 13 kg equivale a 13 kg de gás. Um queimador comum consome cerca de 0,2 kg/h. A estimativa de gás considera apenas o tempo de fogo dos alimentos que exigem cozimento.</p></div>';
    h += '<div class="card"><h3>Backup dos dados</h3><p class="muted">Os dados ficam só neste navegador. Exporte um arquivo para guardar ou levar para outro aparelho.' +
      (state.atualizado ? ' Última alteração: ' + new Date(state.atualizado).toLocaleString('pt-BR') + '.' : '') + '</p>' +
      '<div class="flex"><button class="btn" data-act="export">Exportar JSON</button>' +
      '<label class="btn sec" style="display:inline-block;cursor:pointer;color:var(--ink)">Importar JSON<input type="file" accept="application/json" data-act="import" hidden></label>' +
      '<button class="btn del" data-act="reset">Apagar tudo</button></div></div>';
    return h;
  }

  /* ---------------- EVENTOS ---------------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-act],[data-modo]'); if (!t) return;
    if (t.dataset.modo) { state.modo = t.dataset.modo; save(); render(); return; }
    if (t.dataset.tab) { tab = t.dataset.tab; render(); window.scrollTo(0, 0); return; }
    var act = t.dataset.act, id = t.dataset.id;
    if (act === 'del-pessoa') { state.pessoas = state.pessoas.filter(function (p) { return p.id !== id; }); save(); render(); }
    else if (act === 'del-estoque') { state.estoque = state.estoque.filter(function (s) { return s.id !== id; }); save(); render(); }
    else if (act === 'reset-porcao') { delete state.porcoes[id]; save(); render(); }
    else if (act === 'cat-mais') { cat.n += 80; catRefresh(); }
    else if (act === 'novo-alimento') { prefillNome = t.dataset.nome || ''; tab = 'catalogo'; render(); var f = document.getElementById('novoNome'); if (f) { f.scrollIntoView({ block: 'center' }); f.focus(); } }
    else if (act === 'imprimir') window.print();
    else if (act === 'pr-revisao') { var d0 = new Date(); pr().revisao = d0.getFullYear() + '-' + ('0' + (d0.getMonth() + 1)).slice(-2) + '-' + ('0' + d0.getDate()).slice(-2); save(); render(); }
    else if (act === 'pr-goto') { var it0 = PRONT.ITENS.filter(function (x) { return x.id === id; })[0]; if (it0) { prOpen[it0.area] = true; render(); var el0 = document.getElementById('it_' + id); if (el0) el0.scrollIntoView({ block: 'center' }); } }
    else if (act === 'del-med') { state.meds = state.meds.filter(function (m) { return m.id !== id; }); save(); render(); }
    else if (act === 'med-add-cat') { medPre = id; render(); var mn = document.getElementById('medNome'); if (mn) { mn.scrollIntoView({ block: 'center' }); document.getElementById('medQtd').focus(); } }
    else if (act === 'export') exportar();
    else if (act === 'reset') {
      if (confirm('Apagar TODOS os dados deste navegador? Esta ação não pode ser desfeita.')) {
        state = JSON.parse(JSON.stringify(DEFAULT)); save(); render();
      }
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    var act = t.dataset && t.dataset.act; if (!act) return;
    if (act === 'pr-chk') { pr().marcados[t.dataset.id] = t.checked; save(); render(); return; }
    if (act === 'pr-ctx') { var kx = t.dataset.k; pr()[kx] = kx === 'carro' ? t.checked : kx === 'pets' ? Math.max(0, Number(t.value) || 0) : t.value; save(); render(); return; }
    if (act === 'pr-plano') { pr().plano[t.dataset.k] = t.value; save(); prUpdateScore(); return; }
    if (act === 'pr-papel') { pr().papeis[t.dataset.id] = t.value; save(); prUpdateScore(); return; }
    if (act === 'med-cat') { var mc = M.catPorId(t.value); if (mc) { document.getElementById('medForma').value = mc.forma; var nn = document.getElementById('medNome'); if (!nn.value) nn.value = mc.nome.replace(/ \(.*\)/, ''); } return; }
    if (act === 'med-cont') { var dz = document.getElementById('medDose'); dz.disabled = !t.checked; if (!t.checked) dz.value = ''; return; }
    if (act === 'med-qtd') { var mq = find(state.meds, t.dataset.id); if (mq) { mq.qtd = Math.max(0, Number(t.value) || 0); save(); render(); } return; }
    if (act === 'rel-opt') { var k = t.dataset.k; rel[k] = k === 'caixas' ? Number(t.value) : t.checked; render(); return; }
    if (act === 'pesoUn') { var sp = find(state.estoque, t.dataset.id); if (sp) { sp.pesoUn = Math.max(0, Number(t.value) || 0); save(); render(); } }
    else if (act === 'qtd') { var s = find(state.estoque, t.dataset.id); if (s) { s.qtd = Math.max(0, Number(t.value) || 0); save(); render(); } }
    else if (act === 'validade') { var s2 = find(state.estoque, t.dataset.id); if (s2) { s2.validade = t.value; save(); render(); } }
    else if (act === 'porcao') { state.porcoes[t.dataset.id] = Math.max(0, Number(t.value) || 0); save(); render(); }
    else if (act === 'cfg') { var v = Number(t.value); state[t.dataset.k] = isFinite(v) && v >= 0 ? v : 0; if (t.dataset.k === 'metaDias' && !state.metaDias) state.metaDias = 90; save(); render(); }
    else if (act === 'import') importar(t.files[0]);
  });

  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    var fd = new FormData(f), kind = f.dataset.form;
    if (kind === 'pessoa') {
      state.pessoas.push({ id: uid(), nome: String(fd.get('nome') || '').trim(), perfil: fd.get('perfil'), kcal: Number(fd.get('kcal')) || 0 });
    } else if (kind === 'estoque') {
      var qtd = Number(fd.get('qtd')), fid = fd.get('foodId');
      if (!fid) {
        var exact = E.allFoods(state).filter(function (f) { return norm(f.nome) === norm(document.getElementById('foodQ').value); })[0];
        if (exact) fid = exact.id;
      }
      if (!fid) { document.getElementById('foodHint').textContent = '⚠️ Escolha um alimento da lista (ou cadastre um novo).'; document.getElementById('foodQ').focus(); return; }
      if (!(qtd > 0)) return;
      focusSearch = true;
      var ff = E.foodMap(E.allFoods(state))[fid], peso = Number(fd.get('pesoUn'));
      state.estoque.push({ id: uid(), foodId: fid, qtd: qtd, pesoUn: ff && ff.un === 'un' && peso > 0 ? peso : 0, validade: fd.get('validade') || '' });
    } else if (kind === 'med') {
      var cat = M.catPorId(fd.get('cat')), nm = String(fd.get('nome') || '').trim() || (cat ? cat.nome : '');
      if (!nm) return;
      state.meds.push({ id: uid(), nome: nm, cat: fd.get('cat') || '', forma: fd.get('forma'), qtd: Math.max(0, Number(fd.get('qtd')) || 0), un: fd.get('un'),
        validade: fd.get('validade') || '', pessoa: fd.get('pessoa') || '', continuo: !!fd.get('continuo'), dose: Number(fd.get('dose')) || 0, obs: String(fd.get('obs') || '').trim() });
      medPre = '';
    } else if (kind === 'custom') {
      var un = fd.get('un'), gpu = Number(fd.get('gpu')) || (un === 'l' ? 1000 : 1);
      state.custom.push({ id: 'c_' + uid(), nome: String(fd.get('nome')).trim(), grupo: fd.get('grupo'), un: un, gpu: gpu,
        kcal: Number(fd.get('kcal')) || 0, prot: Number(fd.get('prot')) || 0, gord: Number(fd.get('gord')) || 0, carb: Number(fd.get('carb')) || 0,
        rend: Number(fd.get('rend')) || 1, porcao: Number(fd.get('porcao')) || 0, val: Number(fd.get('val')) || 12, coc: 0, agua: 0, core: Number(fd.get('porcao')) > 0 });
    }
    save(); render();
  });

  function find(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }

  /* ---------- seletor com busca ---------- */
  var comboIdx = -1, comboItems = [];
  function matchFoods(q) {
    var foods = E.allFoods(state), toks = norm(q).split(/\s+/).filter(Boolean);
    var res = foods.filter(function (f) {
      var hay = norm(f.nome + ' ' + (f.alias || '') + ' ' + D.GRUPOS[f.grupo]);
      return toks.every(function (t) { return hay.indexOf(t) >= 0; });
    });
    if (toks.length) {
      var t0 = toks[0];
      res.sort(function (a, b) {
        var sa = norm(a.nome).indexOf(t0) === 0 ? 0 : norm(a.nome).indexOf(t0) > 0 ? 1 : 2;
        var sb = norm(b.nome).indexOf(t0) === 0 ? 0 : norm(b.nome).indexOf(t0) > 0 ? 1 : 2;
        return sa - sb || (a.taco ? 1 : 0) - (b.taco ? 1 : 0) || a.nome.localeCompare(b.nome, 'pt-BR');
      });
    } else {
      var order = Object.keys(D.GRUPOS);
      res.sort(function (a, b) { return (a.taco ? 1 : 0) - (b.taco ? 1 : 0) || order.indexOf(a.grupo) - order.indexOf(b.grupo) || a.nome.localeCompare(b.nome, 'pt-BR'); });
    }
    return res;
  }
  function openCombo() {
    var q = document.getElementById('foodQ'), ul = document.getElementById('foodList'); if (!q || !ul) return;
    var txt = document.getElementById('foodId').value ? '' : q.value;
    var todos = matchFoods(txt); comboItems = todos.slice(0, 60); comboIdx = comboItems.length ? 0 : -1;
    var h = comboItems.map(function (f, i) {
      return '<li role="option" id="opt' + i + '" data-pick="' + f.id + '" aria-selected="' + (i === comboIdx) + '">' +
        '<span class="em" aria-hidden="true">' + em(f) + '</span><span>' + esc(f.nome) + '<small>' + D.GRUPOS[f.grupo] + '</small></span></li>';
    }).join('');
    if (!comboItems.length) {
      h = '<li class="none">Nenhum alimento encontrado para <b>' + esc(q.value) + '</b>.' +
        '<button type="button" class="btn" data-act="novo-alimento" data-nome="' + esc(q.value) + '">➕ Cadastrar no catálogo</button></li>';
    } else if (norm(q.value)) {
      h += '<li class="more"><button type="button" class="btn sec" data-act="novo-alimento" data-nome="' + esc(q.value) + '">➕ Não achou? Cadastrar “' + esc(q.value) + '”</button></li>';
    }
    if (todos.length > comboItems.length) h += '<li class="more muted">Mostrando ' + comboItems.length + ' de ' + todos.length + '. Continue digitando para refinar.</li>';
    ul.innerHTML = h; ul.hidden = false; q.setAttribute('aria-expanded', 'true');
  }
  function closeCombo() {
    var q = document.getElementById('foodQ'), ul = document.getElementById('foodList');
    if (ul) ul.hidden = true; if (q) q.setAttribute('aria-expanded', 'false');
  }
  function pickFood(id) {
    var f = E.foodMap(E.allFoods(state))[id]; if (!f) return;
    document.getElementById('foodId').value = id;
    document.getElementById('foodQ').value = f.nome;
    closeCombo(); updateFoodHint();
    var qt = document.getElementById('qtdIn'); if (qt) qt.focus();
  }
  function moveCombo(d) {
    if (!comboItems.length) return;
    comboIdx = (comboIdx + d + comboItems.length) % comboItems.length;
    comboItems.forEach(function (f, i) {
      var el = document.getElementById('opt' + i); if (!el) return;
      el.setAttribute('aria-selected', String(i === comboIdx));
      if (i === comboIdx) { el.scrollIntoView({ block: 'nearest' }); document.getElementById('foodQ').setAttribute('aria-activedescendant', 'opt' + i); }
    });
  }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'foodQ') { document.getElementById('foodId').value = ''; document.getElementById('unitLbl').textContent = '(kg)'; document.getElementById('foodHint').textContent = ''; document.getElementById('pesoWrap').hidden = true; document.getElementById('pesoIn').value = ''; openCombo(); }
    else if (t.id === 'catQ') { cat.q = t.value; cat.n = 80; catRefresh(); }
  });
  document.addEventListener('toggle', function (e) { var d = e.target; if (d && d.dataset && d.dataset.area) prOpen[d.dataset.area] = d.open; }, true);
  document.addEventListener('focusin', function (e) { if (e.target.id === 'foodQ') openCombo(); });
  document.addEventListener('keydown', function (e) {
    if (e.target.id !== 'foodQ') return;
    var ul = document.getElementById('foodList');
    if (e.key === 'ArrowDown') { e.preventDefault(); if (ul.hidden) openCombo(); else moveCombo(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveCombo(-1); }
    else if (e.key === 'Enter') { if (!ul.hidden && comboItems[comboIdx]) { e.preventDefault(); pickFood(comboItems[comboIdx].id); } }
    else if (e.key === 'Escape') closeCombo();
  });
  document.addEventListener('mousedown', function (e) {
    var li = e.target.closest('[data-pick]');
    if (li) { e.preventDefault(); pickFood(li.dataset.pick); return; }
    if (!e.target.closest('.combo')) closeCombo();
  });

  function updateFoodHint() {
    var sel = document.getElementById('foodId'); if (!sel || !sel.value) return;
    var f = E.foodMap(E.allFoods(state))[sel.value]; if (!f) return;
    document.getElementById('unitLbl').textContent = '(' + (f.un === 'kg' ? 'kg' : f.un === 'l' ? 'litros' : 'unidades') + ')';
    var pw = document.getElementById('pesoWrap'), pi = document.getElementById('pesoIn');
    if (pw && pi) { pw.hidden = f.un !== 'un'; if (f.un === 'un' && !pi.value) pi.value = f.gpu; if (f.un !== 'un') pi.value = ''; }
    document.getElementById('foodHint').textContent = (f.dica || '') + (f.rend > 1 ? ' Rendimento: 1 kg → ' + n1(f.rend) + ' kg pronto.' : '');
  }
  var origRender = render;
  var focusSearch = false;
  render = function () { origRender(); if (tab === 'estoque') { updateFoodHint(); if (focusSearch) { focusSearch = false; var q = document.getElementById('foodQ'); if (q) q.focus(); } } };

  function exportar() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'estoque-inteligente-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importar(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (!d || typeof d !== 'object' || !Array.isArray(d.pessoas) || !Array.isArray(d.estoque)) throw new Error('formato');
        if (!confirm('Substituir os dados atuais pelo arquivo importado?')) return;
        state = Object.assign({}, DEFAULT, d); save(); render();
      } catch (err) { alert('Arquivo inválido.'); }
    };
    r.readAsText(file);
  }

  render();
})();
